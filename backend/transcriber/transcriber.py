import argparse
import glob
import json
import math
import os
import re
import shutil
import sys
import tempfile

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor"))

MAX_DURATION_SEC = 1800
STOP_CHARS = set("的了是在有和就我们你我他这那也很到说会着与及等被让从上下中不没要可以什么怎么这样那样一个些自己所以对于以及但因此因为如果已经还只更".encode("utf-8").decode("utf-8"))


def emit(obj):
    sys.stderr.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stderr.flush()


class TranscribeError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code


def progress(pct, stage):
    emit({"type": "progress", "progress": round(max(0.0, min(100.0, pct)), 1), "stage": stage})


def emit_error(message):
    payload = json.dumps({"ok": False, "error": message}, ensure_ascii=False)
    sys.stdout.write(payload + "\n")
    sys.stdout.flush()


def clean_text(t):
    return re.sub(r"\s+", " ", t or "").strip()


def split_sentences(text):
    parts = re.split(r"(?<=[。！？!?；;\n])", text)
    return [p.strip() for p in parts if p and len(p.strip()) >= 4]


def han_ngrams(text, sizes=(2, 3)):
    freq = {}
    runs = re.findall(r"[\u4e00-\u9fff]+", text)
    for run in runs:
        for n in sizes:
            for i in range(len(run) - n + 1):
                g = run[i : i + n]
                if g[0] in STOP_CHARS or g[-1] in STOP_CHARS:
                    continue
                freq[g] = freq.get(g, 0) + 1
    return freq


def score_sentence(sentence, freq):
    grams = []
    for run in re.findall(r"[\u4e00-\u9fff]+", sentence):
        for n in (2, 3):
            for i in range(len(run) - n + 1):
                grams.append(run[i : i + n])
    if not grams:
        return 0.0
    total = sum(freq.get(g, 0) for g in grams)
    return total / math.sqrt(len(grams) + 1)


def truncate(s, limit):
    s = clean_text(s)
    return s if len(s) <= limit else s[: limit - 1] + "…"


def build_insights(segments, full_text, fallback_title):
    sentences = split_sentences(full_text)
    if not sentences:
        return {
            "title": truncate(fallback_title, 60),
            "overview": "语音内容较短，未生成摘要。",
            "keypoints": [truncate(seg["text"], 50) for seg in segments[:3]],
            "tags": [],
        }
    freq = han_ngrams(full_text)
    scored = sorted(
        [(score_sentence(s, freq), i, s) for i, s in enumerate(sentences)],
        key=lambda x: (-x[0], x[1]),
    )
    top_idx = sorted([i for _, i, _ in scored[: max(3, len(sentences) // 10 + 2)]])
    overview = "".join(sentences[i] for i in top_idx[:3])
    overview = truncate(overview, 150)

    used = set(top_idx[:3])
    kp_idx = []
    for _, i, _ in scored:
        if i not in used and len(kp_idx) < 5:
            overlap = any(
                freq_similar(sentences[i], sentences[j]) for j in kp_idx
            )
            if not overlap:
                kp_idx.append(i)
    kp_idx.sort()
    keypoints = [truncate(sentences[i], 52) for i in kp_idx]

    cands = [(c, n) for c, n in freq.items() if n >= 2 and 2 <= len(c) <= 4]
    cands.sort(key=lambda x: (-x[1] * len(x[0]), x[0]))
    tags = []
    for c, _ in cands:
        if c not in tags and not any(c in t or t in c for t in tags):
            tags.append(c)
        if len(tags) >= 4:
            break

    return {
        "title": truncate(fallback_title, 60),
        "overview": overview,
        "keypoints": keypoints,
        "tags": tags,
    }


def freq_similar(a, b):
    ga = set()
    for run in re.findall(r"[\u4e00-\u9fff]+", a):
        for n in (2, 3):
            for i in range(len(run) - n + 1):
                ga.add(run[i : i + n])
    gb = set()
    for run in re.findall(r"[\u4e00-\u9fff]+", b):
        for n in (2, 3):
            for i in range(len(run) - n + 1):
                gb.add(run[i : i + n])
    if not ga or not gb:
        return False
    return len(ga & gb) / min(len(ga), len(gb)) > 0.6


def probe_duration(path):
    import av

    with av.open(path) as container:
        if container.duration is None:
            raise TranscribeError("media_unreadable", "无法读取音频时长，文件可能损坏或格式不受支持")
        return container.duration / 1_000_000


UA_DESKTOP = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s or "")


def extract_wechat_article(url):
    import requests

    tmpdir = tempfile.mkdtemp(prefix="echoscribe_wx_")
    headers = {"User-Agent": UA_DESKTOP, "Referer": "https://mp.weixin.qq.com/"}

    progress(4, "读取公众号文章")
    resp = requests.get(url, headers=headers, timeout=25)
    resp.raise_for_status()
    html = resp.text

    m_title = re.search(r'<meta\s+property="og:title"\s+content="([^"]*)"', html) or re.search(
        r"<h1[^>]*>(.*?)</h1>", html, re.S
    )
    title = clean_text(strip_tags(m_title.group(1))) if m_title else ""

    progress(8, "定位视频资源")
    real_url = None

    def unescape_js(u):
        u = u.replace("\\x26amp;", "&").replace("\\x26", "&").replace("\\u0026", "&")
        u = u.replace("&amp;", "&").replace("\\/", "/")
        return u

    # A) 文章页 videoData.mp_video_trans_info[0].url（2023+ 主流格式）
    m = re.search(r"url\s*[:=]\s*['\"](https?://[^'\"]*mpvideo[^'\"]*)['\"]", html)
    if m:
        real_url = unescape_js(m.group(1))
    # B) 文章页直接内嵌的裸 mpvideo 地址
    if not real_url:
        m = re.search(r"(https?://mpvideo\.qpic\.cn/[^\s'\"<>\\]+)", html)
        if m:
            real_url = unescape_js(m.group(1))
    # C) wxv_ 视频 ID -> 播放器模板页
    if not real_url:
        vid = next(iter(dict.fromkeys(re.findall(r"wxv_[0-9a-zA-Z]{8,}", html))), None)
        if vid:
            player_url = f"https://mp.weixin.qq.com/mp/readtemplate?t=pages/video_player_tmpl&auto=0&vid={vid}"
            try:
                rp = requests.get(player_url, headers=headers, timeout=25)
                m_url = re.search(r"url\s*[:=]\s*['\"]([^'\"]+)['\"]", rp.text)
                if m_url:
                    real_url = unescape_js(m_url.group(1))
                if not real_url:
                    m2 = re.search(r"(https?://[^'\"\s\\]*mpvideo[^'\"\s\\]+)", rp.text)
                    if m2:
                        real_url = unescape_js(m2.group(1))
            except requests.RequestException:
                pass

    if not real_url:
        raise TranscribeError(
            "embed_unsupported",
            "未能从该公众号文章中提取到视频：文章可能不含视频，或视频为视频号/腾讯视频资源（仅能在微信客户端内播放）",
        )

    progress(15, "下载视频流")
    path = os.path.join(tmpdir, "wechat_video.mp4")
    try:
        with requests.get(real_url, headers={**headers, "Referer": "https://mp.weixin.qq.com/"}, stream=True, timeout=30) as vr:
            vr.raise_for_status()
            total = int(vr.headers.get("content-length") or 0)
            done = 0
            with open(path, "wb") as f:
                for chunk in vr.iter_content(1 << 16):
                    f.write(chunk)
                    done += len(chunk)
                    if total:
                        progress(15 + done / total * 25, "下载视频流")
    except requests.RequestException as e:
        raise TranscribeError("download_failed", f"视频流下载失败（资源可能已过期），可稍后重试：{e}") from e

    progress(40, "视频下载完成")
    duration = probe_duration(path)
    if duration > MAX_DURATION_SEC:
        raise TranscribeError("duration_limit", f"视频时长 {int(duration)} 秒，超出当前支持上限（30 分钟）")
    title = title or "公众号视频"
    emit({"type": "meta", "title": title, "duration": duration})
    return path, title, duration


def extract_url(url):
    if "mp.weixin.qq.com" in url:
        return extract_wechat_article(url)

    import yt_dlp

    tmpdir = tempfile.mkdtemp(prefix="echoscribe_")
    cookie_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cookies.txt")

    def dl_hook(d):
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            done = d.get("downloaded_bytes") or 0
            frac = done / total if total else 0
            progress(15 + frac * 25, "下载音频流")
        elif d.get("status") == "finished":
            progress(40, "音频下载完成")

    try:
        progress(2, "解析视频链接")
        opts = {
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "noplaylist": True,
            "format": "bestaudio/best",
            "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
            "retries": 3,
            "socket_timeout": 20,
            "progress_hooks": [dl_hook],
        }
        if os.path.isfile(cookie_file):
            opts["cookiefile"] = cookie_file
        with yt_dlp.YoutubeDL(opts) as ydl:
            try:
                info = ydl.extract_info(url, download=True)
            except yt_dlp.utils.DownloadError as e:
                msg = str(e)
                if "Fresh cookies" in msg or "cookies" in msg.lower():
                    raise TranscribeError(
                        "cookies_required",
                        "该平台（如抖音）要求登录态 Cookies 才能取流，需要一次性的 cookies 配置",
                    ) from e
                if "Sign in" in msg or "login" in msg.lower():
                    raise TranscribeError("login_required", "该视频需要登录才能访问，请更换公开可见的视频链接") from e
                raise TranscribeError("video_unavailable", f"链接解析失败：视频可能已删除、设为私密或不支持的平台") from e
            if info is None:
                raise TranscribeError("video_unavailable", "链接解析失败：请确认视频公开可访问")
            duration = info.get("duration") or 0
            if duration > MAX_DURATION_SEC:
                raise TranscribeError(
                    "duration_limit",
                    f"视频时长 {int(duration)} 秒，超出当前支持上限（30 分钟）",
                )
            title = clean_text(info.get("title") or "") or "未命名视频"
            emit({"type": "meta", "title": title, "duration": duration})

            candidates = []
            for f in glob.glob(os.path.join(tmpdir, "*")):
                candidates.append(f)
            if not candidates:
                raise TranscribeError("download_failed", "音频下载失败，请稍后重试")
            biggest = max(candidates, key=os.path.getsize)
            return biggest, title, duration
    finally:
        pass


def extract_file(path):
    progress(2, "读取音频文件")
    duration = probe_duration(path)
    if duration > MAX_DURATION_SEC:
        raise TranscribeError("duration_limit", f"音频时长 {int(duration)} 秒，超出当前支持上限（30 分钟）")
    title = os.path.splitext(os.path.basename(path))[0]
    emit({"type": "meta", "title": title, "duration": duration})
    progress(10, "音频已就绪")
    return path, title, duration


def transcribe_audio(path, title, duration, model_name, device, compute_type, want_ai):
    from faster_whisper import WhisperModel

    base_dir = os.path.dirname(os.path.abspath(__file__))
    local_model_dir = os.path.join(base_dir, "models", model_name)
    if os.path.isdir(local_model_dir) and os.path.isfile(os.path.join(local_model_dir, "model.bin")):
        model_path = local_model_dir
        progress(42, "加载本地语音识别模型")
    else:
        model_path = model_name
        progress(42, "加载语音识别模型（首次使用需下载，已缓存则秒开）")
    model = WhisperModel(
        model_path,
        device=device,
        compute_type=compute_type,
        download_root=os.path.join(base_dir, "models"),
    )

    progress(50, "语音识别中")
    transcribe_kwargs = dict(
        beam_size=5,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )
    segments_iter, info = model.transcribe(path, **transcribe_kwargs)
    if duration <= 0:
        duration = info.duration or 1

    out, collected = [], []
    for seg in segments_iter:
        text = clean_text(seg.text)
        if not text:
            continue
        out.append({"start": round(float(seg.start), 2), "end": round(float(seg.end), 2), "text": text})
        collected.append(text)
        done = min(seg.end / duration, 1.0)
        progress(50 + done * 45, "语音识别中")

    if not out:
        progress(52, "调整识别参数，再试一次")
        segments_iter, info2 = model.transcribe(path, beam_size=5, vad_filter=False)
        for seg in segments_iter:
            text = clean_text(seg.text)
            if not text:
                continue
            out.append({"start": round(float(seg.start), 2), "end": round(float(seg.end), 2), "text": text})
            collected.append(text)
            done = min(seg.end / duration, 1.0)
            progress(52 + done * 43, "语音识别中")

    if not out:
        raise TranscribeError("no_speech", "未识别到语音内容：视频可能无人声、纯音乐或人声过轻")

    progress(96, "整理文案与摘要")
    full_text = "".join(collected)
    insights = build_insights(out, full_text, title) if want_ai else None

    word_count = sum(len(re.sub(r"\s", "", t)) for t in collected)
    result = {
        "ok": True,
        "title": title,
        "duration": round(duration, 1),
        "language": info.language,
        "segments": out,
        "wordCount": word_count,
    }
    if insights:
        result["insights"] = insights
    return result


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url")
    group.add_argument("--file")
    parser.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "small"))
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--compute-type", default="int8")
    parser.add_argument("--no-ai", action="store_true")
    args = parser.parse_args()

    tmpdir_to_clean = None
    real_stdout = sys.stdout
    sys.stdout = sys.stderr
    try:
        if args.url:
            audio_path, title, duration = extract_url(args.url)
            tmpdir_to_clean = os.path.dirname(audio_path)
            progress(15, "获取音频流")
        else:
            if not os.path.isfile(args.file):
                raise TranscribeError("media_unreadable", "上传的音频文件不存在或无法访问")
            audio_path, title, duration = extract_file(args.file)

        result = transcribe_audio(
            audio_path,
            title,
            duration,
            args.model,
            args.device,
            args.compute_type,
            not args.no_ai,
        )
        real_stdout.write(json.dumps(result, ensure_ascii=False) + "\n")
        real_stdout.flush()
    except TranscribeError as e:
        emit({"type": "error", "error": str(e), "code": e.code})
        real_stdout.write(json.dumps({"ok": False, "error": str(e), "code": e.code}, ensure_ascii=False) + "\n")
        real_stdout.flush()
    except Exception as e:
        msg = str(e) or e.__class__.__name__
        emit({"type": "error", "error": msg, "code": "engine_failed"})
        real_stdout.write(json.dumps({"ok": False, "error": msg, "code": "engine_failed"}, ensure_ascii=False) + "\n")
        real_stdout.flush()
    finally:
        if tmpdir_to_clean and os.path.isdir(tmpdir_to_clean):
            shutil.rmtree(tmpdir_to_clean, ignore_errors=True)


if __name__ == "__main__":
    main()

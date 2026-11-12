"""Local-model helpers (prototype, ADR-0014).

Everything here talks to a model running on this machine (text: Ollama, or an OpenAI-compatible
server such as llama.cpp's llama-server when LLM_URL is set; speech: a whisper.cpp server). No student data leaves the host. Each school must switch a feature on,
and every output is a draft a person reviews."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
LLM_URL = os.environ.get("LLM_URL", "")              # optional OpenAI-compatible server, e.g. http://127.0.0.1:8080 (llama.cpp llama-server); wins over Ollama
AI_MODEL = os.environ.get("AI_MODEL", "")            # empty = first model the runtime lists
WHISPER_URL = os.environ.get("WHISPER_URL", "")      # e.g. http://127.0.0.1:8178 (whisper.cpp server)


def _local(url: str) -> bool:
    host = urllib.request.urlparse(url).hostname or ""
    return host in ("127.0.0.1", "localhost", "::1")


def _json(url: str, body: dict | None = None, timeout: float = 1.5) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def text_runtime() -> tuple[str, str, str] | None:
    """(kind, base_url, model) for the local text model, or None when nothing local is reachable.
    LLM_URL (OpenAI-compatible, e.g. llama-server) is tried first, then Ollama. A URL that is not this
    machine is refused, never called."""
    for kind, url in (("openai", LLM_URL.rstrip("/")), ("ollama", OLLAMA_URL.rstrip("/"))):
        if not url or not _local(url):
            continue
        try:
            if kind == "openai":
                names = [m["id"] for m in _json(f"{url}/v1/models").get("data", [])]
            else:
                names = [m["name"] for m in _json(f"{url}/api/tags").get("models", [])]
        except (urllib.error.URLError, TimeoutError, ValueError, OSError, KeyError):
            continue
        if AI_MODEL and AI_MODEL in names:
            return kind, url, AI_MODEL
        if names and not AI_MODEL:
            return kind, url, names[0]
    return None


def text_model() -> str | None:
    """Name of the local text model, or None when no local runtime is reachable."""
    rt = text_runtime()
    return rt[2] if rt else None


def speech_available() -> bool:
    return bool(WHISPER_URL) and _local(WHISPER_URL)


def generate(system: str, prompt: str, max_tokens: int = 500) -> tuple[str, str]:
    """Return (text, model). Raises RuntimeError with a plain message when the model is unavailable."""
    rt = text_runtime()
    if not rt:
        raise RuntimeError("No local model is running on this machine")
    kind, url, model = rt
    try:
        if kind == "openai":
            out = _json(f"{url}/v1/chat/completions", {
                "model": model, "stream": False, "temperature": 0.2, "max_tokens": max_tokens,
                "chat_template_kwargs": {"enable_thinking": False},   # llama-server: answer directly, or a thinking model spends the budget on reasoning
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}, timeout=120)
            text = (out["choices"][0]["message"].get("content") or "").strip()
        else:
            text = _json(f"{url}/api/generate", {
                "model": model, "stream": False, "system": system, "prompt": prompt,
                "options": {"temperature": 0.2, "num_predict": max_tokens}}, timeout=120).get("response", "").strip()
    except (urllib.error.URLError, TimeoutError, ValueError, OSError, KeyError, IndexError) as e:
        raise RuntimeError("The local model did not answer in time") from e
    if not text:
        raise RuntimeError("The local model returned nothing")
    return text, model


def transcribe(audio: bytes, mime: str) -> str:
    """Speech to text through a local Whisper server (OpenAI-compatible /v1/audio/transcriptions)."""
    if not speech_available():
        raise RuntimeError("No local speech model is configured")
    boundary = "abaform7f3c"
    ext = {"audio/webm": "webm", "audio/mp4": "m4a", "audio/wav": "wav", "audio/ogg": "ogg"}.get(mime.split(";")[0], "webm")
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="note.{ext}"\r\nContent-Type: {mime}\r\n\r\n').encode() \
        + audio + f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request(f"{WHISPER_URL.rstrip('/')}/v1/audio/transcriptions", data=body,
                                 headers={"content-type": f"multipart/form-data; boundary={boundary}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return " ".join(json.load(r).get("text", "").split())
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as e:
        raise RuntimeError("The local speech model did not answer") from e


SUMMARY_SYSTEM = (
    "You write short progress summaries for parents of a child receiving ABA services at school. "
    "Use warm, plain language a parent understands; no jargon, no percentages unless helpful, no diagnosis, "
    "no advice beyond what the facts support. Refer to the child by first name only. "
    "Use only the facts given, and use the goal names exactly as written. Each value describes ONE session: say 'from X to Y', "
    "never claim totals or 'none this month'. Do not use clinical terms such as manding, tacting, elopement, reinforcer, prompt or trial. "
    "Each fact says what the number counts, whether higher or lower is better, and which way it moved. When lower is better, "
    "a falling number is good news: say so. Judge progress from 'change_this_period', not from the goal's name. "
    "Mention at most four goals. If a goal is moving away from its target, say so kindly; do not promise or describe any action by the team. "
    "Write 120-180 words in 2-3 short paragraphs. Do not add a greeting, a sign-off or a title.")

ASK_SYSTEM = (
    "You answer a behaviour analyst's question about their caseload using only the JSON facts provided. "
    "Be brief and specific: name the students (first name) and programs you rely on. "
    "If the facts do not contain the answer, say so. Do not give clinical recommendations; point to what the data shows.")

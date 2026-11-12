# 0014 — AI drafts and voice notes use models on the school's own machine (prototype)

**Status:** Accepted as a prototype · 2026-11-11 · owner's direction: "prototype using local models to start"

## Context
Drafted family summaries, plain-language questions over a caseload and dictated notes are useful, but each would send student data to a model. No privacy ruling exists yet (ASSUMPTIONS D1).

## Decision
- **Text**: the API calls a model server on localhost. If `LLM_URL` is set it tries that first, as an OpenAI-compatible server (llama.cpp's `llama-server`: `/v1/models`, `/v1/chat/completions`); otherwise, or if that server is not running, it uses **Ollama** (`OLLAMA_URL`, default `http://127.0.0.1:11434`). `AI_MODEL` picks a model by name; unset means the first one the runtime lists. `aba/ai.py` **refuses any URL that is not this machine**.
- **Speech**: an OpenAI-compatible Whisper server on localhost (`WHISPER_URL`). Audio is transcribed and discarded, never stored.
- **Off by default, per school.** A school admin switches each on (Overview → Optional features); the page shows whether a local model is actually available. Demo data has it on for Bridgeway and off for Lakeshore.
- **Two uses only**, both BCBA-only and both audited:
  1. *Draft a family summary* — input is the same structured facts as the progress report, with family-friendly program names and first name only. The draft lands in an editable box labelled with the model's name; **nothing is shared until the BCBA publishes**.
  2. *Ask about your caseload* — answers from the status facts already on the caseload page; labelled as possibly wrong.
- No clinical recommendations: the prompts forbid them, and the UI calls every output a draft.

## Runtimes and models chosen (build machine, 2026-11-11)
| Purpose | Runtime (process, port) | Model | Size | Why this one |
|---|---|---|---|---|
| Text, first choice here (added 2026-11-11 at the owner's request) | **llama.cpp `llama-server`**, `127.0.0.1:8080`, `POST /v1/chat/completions`, set by `LLM_URL` | **Gemma 4 26B** (`unsloth/gemma-4-26B-A4B-it-GGUF:Q5_K_M`) | not measured | The owner already runs it. A summary draft took about 7 s, against about 50 s for the first Ollama response. The request turns the model's thinking step off (`chat_template_kwargs.enable_thinking=false`); with it on, the token budget was spent on reasoning and the answer came back empty. |
| Text, fallback | **Ollama 0.11.7**, `127.0.0.1:11434`, `POST /api/generate` | **`mistral-nemo:12b`** | 7.1 GB | Already installed; first in Ollama's list, which is the default when `AI_MODEL` is unset. `gemma3:27b` (17 GB) is also installed and can be selected with `AI_MODEL`; it was not evaluated. |
| Speech: dictated session note | **whisper.cpp server 1.9.5** (`whisper-server`, Homebrew `whisper-cpp`), `127.0.0.1:8178`, `POST /v1/audio/transcriptions`, `--convert` (ffmpeg) | **Whisper `small.en`** (`ggml-small.en.bin`) | 488 MB | Owner's choice over Nemotron ASR 0.6b: a one-command runtime, about 1 s for a 7 s note. English only. |

- **The `llama-server` on port 8080 is the owner's own process**, started outside this repository (`llama-server -hf unsloth/gemma-4-26B-A4B-it-GGUF:Q5_K_M --port 8080 …`). The app does not start or stop it; when it is not running, text falls back to Ollama. Its model, context size and parallelism are whatever the owner started it with.
- **Not used:** the Nemotron ASR package on disk needs Foundry Local, which is not installed.
- **Not decided:** which text model is good enough. Both were used because they were already on the machine, not because models were compared. In the walkthrough Gemma 4 wrote cleaner prose than mistral-nemo, but misread a falling count of a behaviour as a problem. Two causes were ours, not the model's, and are fixed: the family-facing name described the opposite of what was counted, and the prompt told the model to say the team was adjusting its approach. The facts now state what is counted, which way is better and which way it moved; the prompt forbids describing team actions. The review step stays essential.
- **Model files are not in the repository.** Ollama keeps its own store; the Whisper file is in `data/models/whisper/` (git-ignored; SHA-256 `c6138d6d…c41e5d`, from `ggerganov/whisper.cpp` on Hugging Face).
- **Hardware here:** Apple M1 Max, 64 GB. Timings on a school server will differ.
- Picture: [architecture view 7](../architecture/README.md#7--local-models--optional-helpers).

## Consequences
- No student data leaves the host, so the feature can be evaluated before any provider agreement exists.
- Quality and speed depend on the local model (first response ≈ 50 s here with a 12 B model; later ones faster). Small models still slip in jargon or overstate — the review step is essential.
- **Voice notes work in a first version** (2026-11-11): Whisper small.en through whisper.cpp on port 8178 (`make speech`); the owner chose Whisper over the Nemotron ASR package already on disk because its runtime is simpler. The session-end note has a Dictate button; the walkthrough dictates a note in about a second. Tested only with synthetic speech fed to Chrome as a fake microphone — not a real voice, a noisy classroom or a real phone. Audio is transcribed and discarded. The button appears only when the school switch is on *and* the server has a local speech model.

## Revisit when
Counsel rules on external processors (then a hosted model behind the same interface is a configuration change), or usage shows the drafts are not worth the review time.

import { useEffect, useRef, useState } from "react";
import { Button, useToast } from "@aba/design-system";
import { useAuth } from "../../lib/auth";
import { upload } from "../../lib/api";

const MAX_MS = 60_000;

/** Dictate a note: records up to a minute, sends it to the school's own speech model, and hands back text.
 *  The recording is never stored. Shown only when the school has switched voice notes on (ADR-0014). */
export function Dictate({ onText, disabled, testid = "dictate" }: { onText: (text: string) => void; disabled?: boolean; testid?: string }) {
  const { me } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const rec = useRef<MediaRecorder | null>(null), timer = useRef<number | undefined>(undefined);
  useEffect(() => () => { window.clearTimeout(timer.current); if (rec.current?.state === "recording") rec.current.stop(); }, []);
  if (!me?.features?.voice || typeof MediaRecorder === "undefined" || !navigator.mediaDevices) return null;

  async function start() {
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { toast({ text: "Microphone access was not allowed", tone: "bad" }); return; }
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const r = new MediaRecorder(stream, { mimeType: mime }), chunks: Blob[] = [];
    r.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    r.onstop = async () => {
      window.clearTimeout(timer.current);
      stream.getTracks().forEach(t => t.stop());
      setState("busy");
      try {
        const { text } = await upload<{ text: string }>("/clinic/transcribe", new Blob(chunks, { type: mime }));
        if (text) onText(text); else toast({ text: "Nothing was heard — try again closer to the microphone" });
      } catch (e: any) { toast({ text: e?.message ?? "Dictation failed", tone: "bad" }); }
      finally { setState("idle"); }
    };
    rec.current = r; r.start(); setState("rec");
    timer.current = window.setTimeout(() => r.state === "recording" && r.stop(), MAX_MS);
  }

  return (
    <Button size="sm" icon={state === "rec" ? "stop" : "mic"} variant={state === "rec" ? "danger" : "default"} disabled={disabled || state === "busy"}
      onClick={() => (state === "rec" ? rec.current?.stop() : start())} aria-pressed={state === "rec"} data-tour="dictate" testid={testid}>
      {state === "rec" ? "Stop" : state === "busy" ? "Transcribing…" : "Dictate"}
    </Button>
  );
}

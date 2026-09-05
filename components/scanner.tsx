"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Ban,
  CameraOff,
  Check,
  Keyboard,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import jsQR from "jsqr";
import { scanAction, undoScanAction, type ScanResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessCheck } from "@/components/success-check";
import { cn, clockTime } from "@/lib/utils";

/** How long a result stays up before the camera starts looking again. */
const HOLD_MS = 2600;

const TONE: Record<
  ScanResult["result"],
  { color: string; icon: React.ReactNode; label: string }
> = {
  valid: { color: "var(--success)", icon: null, label: "Valid" },
  used: { color: "var(--warning)", icon: <RotateCcw className="size-7" />, label: "Already in" },
  void: { color: "var(--destructive)", icon: <Ban className="size-7" />, label: "Cancelled" },
  unknown: { color: "var(--destructive)", icon: <X className="size-7" />, label: "Unknown" },
  forged: { color: "var(--destructive)", icon: <ShieldAlert className="size-7" />, label: "Forged" },
};

export function Scanner() {
  const params = useSearchParams();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const busyRef = React.useRef(false);
  const lastRef = React.useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manual, setManual] = React.useState("");
  const [nonce, setNonce] = React.useState(0);

  /* -------------------------------------------------------- submit a scan */
  const submit = React.useCallback(async (payload: string) => {
    if (busyRef.current) return;
    const now = Date.now();
    if (payload === lastRef.current.text && now - lastRef.current.at < HOLD_MS) return;
    lastRef.current = { text: payload, at: now };
    busyRef.current = true;

    try {
      const res = await scanAction(payload);
      if (!res.ok) throw new Error(res.error);
      setResult(res.scan);
      setNonce((n) => n + 1);
      if (navigator.vibrate) {
        navigator.vibrate(res.scan.result === "valid" ? 60 : [50, 60, 50]);
      }
    } catch {
      setResult({
        result: "unknown",
        title: "Network hiccup",
        detail: "Couldn't reach the server. Try that scan again.",
      });
      setNonce((n) => n + 1);
    } finally {
      setTimeout(() => { busyRef.current = false; }, HOLD_MS);
    }
  }, []);

  /* ------------------------------- a code handed over from a camera app */
  React.useEffect(() => {
    const p = params.get("p");
    if (p) void submit(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------- camera loop */
  React.useEffect(() => {
    let cancelled = false;
    let raf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any = null;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        // Native detector where it exists (Android Chrome), jsQR everywhere else.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const BD = (window as any).BarcodeDetector;
        if (BD) {
          try {
            detector = new BD({ formats: ["qr_code"] });
          } catch {
            detector = null;
          }
        }
        tick();
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error && err.name === "NotAllowedError"
              ? "Camera access was blocked. Allow it in your browser settings, or type codes in by hand."
              : "No camera available on this device. Type codes in by hand instead."
          );
        }
      }
    }

    async function tick() {
      if (cancelled) return;
      const video = videoRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !busyRef.current) {
        try {
          if (detector) {
            const found = await detector.detect(video);
            if (found[0]?.rawValue) void submit(found[0].rawValue);
          } else {
            const canvas = (canvasRef.current ??= document.createElement("canvas"));
            const w = 480;
            const h = Math.round((video.videoHeight / video.videoWidth) * w) || 480;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, w, h);
              const img = ctx.getImageData(0, 0, w, h);
              const found = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
              if (found?.data) void submit(found.data);
            }
          }
        } catch {
          /* a dropped frame is not worth reporting */
        }
      }
      raf = requestAnimationFrame(() => void tick());
    }

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [submit]);

  async function undo() {
    if (!result?.code) return;
    await undoScanAction(result.code);
    lastRef.current = { text: "", at: 0 };
    setResult(null);
  }

  const tone = result ? TONE[result.result] : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      {/* ------------------------------------------------------ viewfinder */}
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--border)] bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full object-cover"
        />

        {!cameraError && !result && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative size-56">
              {["left-0 top-0 border-l-2 border-t-2 rounded-tl-xl",
                "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl",
                "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-xl",
                "right-0 bottom-0 border-r-2 border-b-2 rounded-br-xl"].map((c) => (
                <span key={c} className={cn("absolute size-8 border-white/70", c)} />
              ))}
              <span className="t-scanline absolute inset-x-2 top-2 h-px bg-[var(--accent)] shadow-[0_0_12px_2px_var(--accent)]" />
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 grid place-items-center bg-black p-8 text-center">
            <div>
              <CameraOff className="mx-auto size-7 text-[var(--muted-foreground)]" />
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {cameraError}
              </p>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- result card */}
        {result && tone && (
          <div
            key={nonce}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl",
              result.result === "valid" ? "t-pop-in" : "t-shake"
            )}
            style={{ background: `color-mix(in srgb, ${tone.color} 22%, rgba(0,0,0,0.88))` }}
          >
            {result.result === "valid" ? (
              <SuccessCheck />
            ) : (
              <span
                className="t-check-pop grid size-16 place-items-center rounded-full"
                style={{
                  background: `color-mix(in srgb, ${tone.color} 18%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${tone.color} 45%, transparent)`,
                  color: tone.color,
                }}
              >
                {tone.icon}
              </span>
            )}

            <h2 className="mt-5 text-3xl" style={{ color: tone.color }}>
              {result.title}
            </h2>

            {result.name && (
              <p className="mt-2 text-lg font-medium text-white">{result.name}</p>
            )}
            <p className="mt-1 text-sm text-white/70">{result.detail}</p>

            {result.usedAt && result.result === "used" && (
              <p className="mt-2 text-sm" style={{ color: tone.color }}>
                Scanned at {clockTime(result.usedAt)}
              </p>
            )}

            {result.code && (
              <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-white/50">
                {result.code}
              </p>
            )}

            {result.note && (
              <p className="mt-3 max-w-xs rounded-xl bg-black/40 px-3 py-2 text-xs text-white/70">
                {result.note}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button variant="subtle" size="sm" onClick={() => setResult(null)}>
                Next scan
              </Button>
              {result.result === "valid" && (
                <Button variant="ghost" size="sm" onClick={undo}>
                  <RotateCcw /> Undo
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        {result
          ? "Tap “Next scan” when you're ready."
          : "Point the camera at the guest's QR code."}
      </p>

      {/* ------------------------------------------------------ manual entry */}
      <div className="mt-6">
        <button
          onClick={() => setManualOpen((v) => !v)}
          className="mx-auto flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:text-white"
        >
          <Keyboard className="size-4" />
          Type a code instead
        </button>

        <div className="t-collapse" data-open={manualOpen}>
          <div>
            <form
              className="flex gap-2 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const text = manual.trim();
                if (!text) return;
                lastRef.current = { text: "", at: 0 };
                void submit(text);
                setManual("");
              }}
            >
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="DP-XXXX-XXXX.signature"
                className="font-[family-name:var(--font-mono)] text-sm"
              />
              <Button type="submit" variant="accent" size="icon" className="size-12 shrink-0">
                <Check />
              </Button>
            </form>
            <p className="pt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
              A bare code without its signature will be rejected — paste the whole
              string from under the guest&apos;s QR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

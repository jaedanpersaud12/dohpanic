"use client";

import * as React from "react";
import { Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Saving the QR as an image matters more than it looks: phone signal at a door
 * is never guaranteed, and a picture in the camera roll works when the page
 * won't load. Where the browser supports sharing files we hand it straight to
 * the share sheet; otherwise we fall back to a download.
 */
export function SaveTicketImage({
  src,
  filename,
  label = "Save ticket image",
}: {
  src: string;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    // Feature-detect with a real File — Android and iOS disagree on support.
    try {
      const probe = new File([new Blob(["x"])], "probe.png", { type: "image/png" });
      setCanShare(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShare(false);
    }
  }, []);

  async function save() {
    setBusy(true);
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (canShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      // A cancelled share sheet is a normal outcome, not a failure.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={save} disabled={busy} variant="outline" className="w-full">
      <span className="t-icon-swap size-4">
        {canShare ? (
          <Share2 className="size-4" data-state={done ? "hidden" : "shown"} />
        ) : (
          <Download className="size-4" data-state={done ? "hidden" : "shown"} />
        )}
        <Check className="size-4" data-state={done ? "shown" : "hidden"} />
      </span>
      {done ? "Saved" : label}
    </Button>
  );
}

"use client";

import * as React from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Props = {
  currency: string;
  bank: { bank: string; accountName: string; accountNumber: string; branchCode: string };
};

const W = 720;
const H = 1180;

/**
 * Draws a plausible banking-app "payment successful" screen onto a canvas so
 * you can test the upload → OCR → approval path without moving real money.
 * Development only — it is not linked from anywhere in the live site.
 */
export function ReceiptMaker({ currency, bank }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [amount, setAmount] = React.useState("200");
  const [name, setName] = React.useState("Anisa Mohammed");
  const [ref, setRef] = React.useState("ANISA 8681234567");
  const [balance, setBalance] = React.useState("12,480.63");

  const pretty = React.useMemo(() => {
    const n = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
    return n.toLocaleString("en-TT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [amount]);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sans = (size: number, weight = 400) =>
      `${weight} ${size}px "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // status bar
    ctx.fillStyle = "#5f6368";
    ctx.font = sans(22);
    ctx.textAlign = "left";
    ctx.fillText("09:41", 44, 62);
    ctx.textAlign = "right";
    ctx.fillText(bank.bank, W - 44, 62);

    // success disc
    ctx.beginPath();
    ctx.arc(W / 2, 190, 48, 0, Math.PI * 2);
    ctx.fillStyle = "#e6f4ea";
    ctx.fill();
    ctx.strokeStyle = "#137333";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(W / 2 - 20, 190);
    ctx.lineTo(W / 2 - 5, 205);
    ctx.lineTo(W / 2 + 22, 175);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#202124";
    ctx.font = sans(34, 700);
    ctx.fillText("Payment successful", W / 2, 290);

    ctx.fillStyle = "#70757a";
    ctx.font = sans(24);
    ctx.fillText(`Reference ${ref}`, W / 2, 330);

    ctx.fillStyle = "#202124";
    ctx.font = sans(66, 700);
    ctx.fillText(`${currency}${pretty}`, W / 2, 418);

    // detail rows
    const rows: [string, string][] = [
      ["Amount", `${currency}${pretty}`],
      ["Paid to", bank.accountName],
      ["Account", bank.accountNumber],
      ["Branch / transit", bank.branchCode],
      ["From", name],
      ["Date", "20 Sep 2026, 09:41"],
      ["Fee", `${currency}0.00`],
      ["Available balance", `${currency}${balance}`],
    ];

    let y = 500;
    for (const [label, value] of rows) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#70757a";
      ctx.font = sans(24);
      ctx.fillText(label, 44, y + 34);

      ctx.textAlign = "right";
      ctx.fillStyle = "#202124";
      ctx.font = sans(24, 600);
      ctx.fillText(value, W - 44, y + 34);

      ctx.strokeStyle = "#e8eaed";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(44, y + 62);
      ctx.lineTo(W - 44, y + 62);
      ctx.stroke();

      y += 78;
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#9aa0a6";
    ctx.font = sans(20);
    ctx.fillText("This is a test image. Not a real transaction.", W / 2, H - 46);
  }, [amount, name, ref, balance, pretty, currency, bank]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `transfer-${amount.replace(/[^\d]/g, "") || "0"}.png`;
    a.click();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg">Fake transfer</h2>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          Generate a screenshot to test the upload and OCR flow.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <Label htmlFor="r-amount">Amount</Label>
            <Input id="r-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="r-name">Sender</Label>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="r-ref">Reference</Label>
            <Input id="r-ref" value={ref} onChange={(e) => setRef(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="r-bal">Available balance</Label>
            <Input id="r-bal" value={balance} onChange={(e) => setBalance(e.target.value)} />
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Deliberately larger than the amount — the OCR parser has to not
              mistake a balance for the payment.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Button variant="accent" onClick={download}>
            <Download /> Download PNG
          </Button>
          <Button variant="outline" onClick={draw}>
            <RefreshCw /> Redraw
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black p-4">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="mx-auto h-auto w-full max-w-sm rounded-xl"
        />
      </div>
    </div>
  );
}

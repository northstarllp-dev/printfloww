"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, Check, Download, ExternalLink } from "lucide-react";

export function ShopShare({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const consumerUrl = origin ? `${origin}/upload?shopId=${shopId}` : "";
  const qrUrl = consumerUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(consumerUrl)}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(consumerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleDownload = async () => {
    if (!qrUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shopName.replace(/\s+/g, "_")}_PrintFloww_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download QR:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (!origin) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-center h-48">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003262] border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-[#003262] rounded-t-xl px-5 py-3.5 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-white" />
        <h2 className="font-bold text-white text-sm">Customer Access &amp; QR Code</h2>
      </div>
      <CardContent className="p-5 grid gap-6 md:grid-cols-[1fr_160px] items-center">
        {/* URL and Copy Section */}
        <div className="grid gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Customer Link</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Share this link with your customers or paste it on your social media to bypass shop selection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={consumerUrl}
              className="flex-1 h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-600 text-sm outline-none font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-10 px-3 shrink-0 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-4 items-center">
            <a
              href={consumerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#003262] hover:text-[#002244] font-semibold flex items-center gap-1 transition-colors"
            >
              Test Customer Link <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 pt-5 md:pt-0 md:pl-5">
          <div className="h-32 w-32 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center shrink-0">
            {qrUrl ? (
              <img src={qrUrl} alt="Shop QR Code" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full bg-slate-100 rounded animate-pulse" />
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1"
          >
            {downloading ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-slate-600 border-t-transparent" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Download QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

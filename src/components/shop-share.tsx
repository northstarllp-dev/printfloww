"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, Check, Download, ExternalLink } from "lucide-react";

export function ShopShare({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);

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

  const handleDownloadPoster = async () => {
    if (!qrUrl) return;
    setDownloadingPoster(true);
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      
      await Promise.all([
        new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = "/logo.png";
        }),
        new Promise((resolve, reject) => {
          qrImg.onload = resolve;
          qrImg.onerror = reject;
          qrImg.src = qrUrl;
        })
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1200, 1600);

      // Borders
      ctx.strokeStyle = "#003262";
      ctx.lineWidth = 32;
      ctx.strokeRect(16, 16, 1168, 1568);

      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 8;
      ctx.strokeRect(48, 48, 1104, 1504);

      // Header Logo
      const logoAspect = logoImg.width / logoImg.height;
      const logoHeight = 100;
      const logoWidth = logoHeight * logoAspect;
      ctx.drawImage(logoImg, 600 - logoWidth / 2, 100, logoWidth, logoHeight);

      // Shop Name
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(shopName.toUpperCase(), 600, 270);

      // Scan Instructions
      ctx.fillStyle = "#14b8a6";
      ctx.font = "bold 52px sans-serif";
      ctx.fillText("SCAN THIS QR TO PRINT", 600, 390);

      // QR Code Container with Shadow
      ctx.shadowColor = "rgba(0, 50, 98, 0.15)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(260, 500, 680, 680, 40);
      } else {
        ctx.rect(260, 500, 680, 680);
      }
      ctx.fill();

      // Reset shadow for QR image
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw QR Image
      ctx.drawImage(qrImg, 310, 550, 580, 580);

      // Footer Instructions
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("Upload Documents from Your Phone", 600, 1290);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 32px sans-serif";
      ctx.fillText("No login or app install required • Instant & Secure", 600, 1370);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 28px sans-serif";
      ctx.fillText("Supported formats: PDF, DOCX, PNG, JPG & more", 600, 1450);

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${shopName.replace(/\s+/g, "_")}_PrintFloww_Poster.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to generate QR Poster:", err);
    } finally {
      setDownloadingPoster(false);
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
      <CardContent className="p-5 grid gap-6 md:grid-cols-[1fr_220px] items-center">
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
        <div className="flex flex-col items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-5 md:pt-0 md:pl-5">
          <div className="h-32 w-32 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center shrink-0">
            {qrUrl ? (
              <img src={qrUrl} alt="Shop QR Code" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full bg-slate-100 rounded animate-pulse" />
            )}
          </div>
          <div className="w-full flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full h-auto min-h-9 py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 leading-normal"
            >
              {downloading ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-slate-600 border-t-transparent" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Download QR Only
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadPoster}
              disabled={downloadingPoster}
              className="w-full h-auto min-h-9 py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1 bg-[#003262] hover:bg-[#002a52] text-white leading-normal"
            >
              {downloadingPoster ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Download QR Poster
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

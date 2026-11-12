import * as THREE from "three";
import type { CarouselBook, CoverMotif } from "@/lib/catalog";

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  return lines;
}

function paintMotif(
  ctx: CanvasRenderingContext2D,
  motif: CoverMotif,
  width: number,
  height: number,
  accent: string,
  secondary: string,
) {
  switch (motif) {
    case "crow": {
      ctx.fillStyle = shade(accent, 18);
      ctx.beginPath();
      ctx.ellipse(width * 0.55, height * 0.62, 120, 70, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.moveTo(width * 0.42, height * 0.55);
      ctx.quadraticCurveTo(width * 0.55, height * 0.35, width * 0.72, height * 0.5);
      ctx.quadraticCurveTo(width * 0.62, height * 0.62, width * 0.48, height * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(width * 0.72, height * 0.5);
      ctx.lineTo(width * 0.84, height * 0.46);
      ctx.lineTo(width * 0.74, height * 0.54);
      ctx.fill();
      break;
    }
    case "yellow": {
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height);
      ctx.quadraticCurveTo(width * 0.35, height * 0.55, width * 0.55, height * 0.7);
      ctx.quadraticCurveTo(width * 0.75, height * 0.85, width * 0.9, height);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.52, height * 0.58, 34, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "forest": {
      const sky = ctx.createLinearGradient(0, height * 0.35, 0, height);
      sky.addColorStop(0, "#1b3344");
      sky.addColorStop(1, "#071016");
      ctx.fillStyle = sky;
      ctx.fillRect(0, height * 0.35, width, height * 0.65);
      ctx.fillStyle = "rgba(230,240,250,0.85)";
      for (let i = 0; i < 40; i += 1) {
        const x = ((i * 97) % width) + (i % 7);
        const y = height * 0.4 + ((i * 53) % (height * 0.45));
        ctx.fillRect(x, y, 2, 6);
      }
      ctx.fillStyle = "#0a1218";
      for (let i = 0; i < 9; i += 1) {
        const x = 30 + i * 54;
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x + 18, height * 0.48);
        ctx.lineTo(x + 36, height);
        ctx.fill();
      }
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.arc(width * 0.72, height * 0.42, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "glass": {
      const beach = ctx.createLinearGradient(0, height * 0.45, 0, height);
      beach.addColorStop(0, "#7ec8d9");
      beach.addColorStop(0.45, "#f0d9a8");
      beach.addColorStop(1, "#d9b57a");
      ctx.fillStyle = beach;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i += 1) {
        ctx.beginPath();
        ctx.moveTo((i * 70) % width, height * 0.4);
        ctx.lineTo(((i * 110) % width) + 40, height);
        ctx.stroke();
      }
      break;
    }
    case "silhouette": {
      const fog = ctx.createLinearGradient(0, height * 0.3, 0, height);
      fog.addColorStop(0, shade(accent, 20));
      fog.addColorStop(1, "#12090b");
      ctx.fillStyle = fog;
      ctx.fillRect(0, height * 0.3, width, height * 0.7);
      ctx.fillStyle = "#050303";
      ctx.beginPath();
      ctx.moveTo(width * 0.42, height * 0.92);
      ctx.lineTo(width * 0.46, height * 0.55);
      ctx.lineTo(width * 0.5, height * 0.48);
      ctx.lineTo(width * 0.54, height * 0.55);
      ctx.lineTo(width * 0.62, height * 0.92);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.44, 16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = secondary;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.22, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.15, height * 0.78, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

export function createCoverTexture(book: CarouselBook): THREE.CanvasTexture {
  const width = 512;
  const height = 768;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, shade(book.accent, 16));
  gradient.addColorStop(1, shade(book.accent, -24));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  paintMotif(
    ctx,
    book.motif ?? "abstract",
    width,
    height,
    book.accent,
    book.secondary,
  );

  ctx.fillStyle = book.secondary;
  ctx.font = "700 44px Georgia, 'Times New Roman', serif";
  const titleLines = wrapLines(ctx, book.title.toUpperCase(), width - 72, 3);
  let y = 110;
  for (const line of titleLines) {
    ctx.fillText(line, 36, y);
    y += 52;
  }

  ctx.font = "600 24px Georgia, serif";
  ctx.globalAlpha = 0.9;
  ctx.fillText(book.author, 36, y + 18);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function createSpineTexture(book: CarouselBook): THREE.CanvasTexture {
  const width = 128;
  const height = 768;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = shade(book.accent, -18);
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = book.secondary;
  ctx.font = "600 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label =
    book.title.length > 28 ? `${book.title.slice(0, 26)}…` : book.title;
  ctx.fillText(label, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function shade(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const num = Number.parseInt(value, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

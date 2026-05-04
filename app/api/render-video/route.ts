import { NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resolvedFfmpegPath =
  process.platform === "win32"
    ? path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe")
    : path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");

ffmpeg.setFfmpegPath(resolvedFfmpegPath);
async function downloadFile(url: string, outputPath: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
}

function getMusicPath(style: string, duration: number) {
  const baseDir = path.join(process.cwd(), "public", "audio");

  if (!fs.existsSync(baseDir)) {
    throw new Error(`Missing audio folder: ${baseDir}`);
  }

  const mp3Files: string[] = [];

  const scanDir = (dir: string) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        scanDir(fullPath);
        continue;
      }

      if (item.isFile() && item.name.toLowerCase().endsWith(".mp3")) {
        mp3Files.push(fullPath);
      }
    }
  };

  scanDir(baseDir);

  if (!mp3Files.length) {
    throw new Error(`No mp3 files found in: ${baseDir}`);
  }

  const randomFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];
  return randomFile;
}
function renderVideoWithMusic({
  inputPath,
  outputPath,
  musicPath,
  headline,
  brandName,
  scenes,
  totalDurationSec,
  textColor,
  cta,
  website,
  phone,
  address,
}: {
    inputPath: string;
  outputPath: string;
  musicPath: string;
  headline: string;
  brandName: string;
  scenes: any[];
  totalDurationSec: number;
  textColor: string;
  cta: string;
  website: string;
     phone: string;
  address: string;
}) {   
const safe = (value: string) =>
    (value || "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\\/g, "\\\\")
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'")
      .replace(/%/g, "\\%")
      .replace(/\n/g, " ");
const ffmpegPathSafe = (value: string) =>
  value
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/ /g, "\\ ");

const localFontFile = ffmpegPathSafe(
  path.join(process.cwd(), "public/fonts/PlayfairDisplay-BoldItalic.ttf")
);

const visibleScenes = scenes;
     const totalSceneDuration = visibleScenes.reduce(
  (sum: number, scene: any) => sum + Math.max(scene?.duration_sec || 3, 1),
  0
);

let cursor = 0;
const drawTexts = visibleScenes.map((scene: any) => {
  const rawDuration = Math.max(scene?.duration_sec || 3, 1);
  const scaledDuration =
    totalSceneDuration > 0
      ? (rawDuration / totalSceneDuration) * Math.max(totalDurationSec - 2.4, 1)
      : 3;

  const start = cursor;
  const end = cursor + scaledDuration;
  cursor = end;

    const rawText = (scene?.overlay_text || scene?.title || "")
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
  .replace(/[•●▪◆►▶★☆]/g, "")
  .replace(/\s+/g, " ")
  .trim();

const offerMatch = rawText.match(/\d{1,3}\s?%|\d+\s?(лв|лева|eur|€)/i);

const offerText = offerMatch ? offerMatch[0] : "";
const cleanText = offerText
  ? rawText.replace(offerText, "").trim()
  : rawText;
  const fade = 0.35;

   const words = cleanText.split(" ").filter(Boolean); const lines: string[] = [];

  if (rawText.length <= 30 || words.length <= 3) {
    lines.push(rawText);
  } else {
     const maxCharsPerLine = rawText.length > 80 ? 18 : 22;   
     let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
  }

    const finalLines = lines.filter(Boolean);

  const safeLine1 = safe(finalLines[0] || "");
  const safeLine2 = safe(finalLines[1] || "");
  const safeLine3 = safe(finalLines[2] || "");
  const safeLine4 = safe(finalLines[3] || "");
  const safeLine5 = safe(finalLines[4] || "");
  const safeLine6 = safe(finalLines[5] || "");
  const safeLine7 = safe(finalLines[6] || "");
  const safeLine8 = safe(finalLines[7] || "");

  const alphaExpr = `if(lt(t,${start}),0,if(lt(t,${start + fade}),(t-${start})/${fade},if(lt(t,${Math.max(
    end - fade,
    start + fade
  )}),1,if(lt(t,${end}),(${end}-t)/${fade},0))))`;

  const offerSafe = safe(offerText);

if (offerSafe) {
  return [
    `drawtext=text='${offerSafe}':
    fontfile=${localFontFile}:     
 fontcolor=#FFD700:
     fontsize=72:
     borderw=4:
     bordercolor=black@0.85:
     shadowcolor=black@0.9:
     shadowx=3:
     shadowy=3:
     x=(w-text_w)/2:
     y=h*0.32:
     alpha='${alphaExpr}'`,

    safeLine1
      ? `drawtext=text='${safeLine1}':
         fontfile=${localFontFile}:
         fontcolor=${textColor}:
         fontsize=42:
         borderw=3:
         bordercolor=black@0.6:
         shadowcolor=black@0.8:
         shadowx=2:
         shadowy=2:
         x=(w-text_w)/2:
         y=h*0.44:
         alpha='${alphaExpr}'`
      : "",
    safeLine2
      ? `drawtext=text='${safeLine2}':
         fontfile=${localFontFile}:   
         fontcolor=${textColor}:
         fontsize=36:
         borderw=3:
         bordercolor=black@0.58:
         shadowcolor=black@0.78:
         shadowx=2:
         shadowy=2:
         x=(w-text_w)/2:
         y=h*0.50:
         alpha='${alphaExpr}'`
      : "",
    safeLine3
      ? `drawtext=text='${safeLine3}':
         fontfile=${localFontFile}:
         fontcolor=${textColor}:
         fontsize=36:
         borderw=3:
         bordercolor=black@0.58:
         shadowcolor=black@0.78:
         shadowx=2:
         shadowy=2:
         x=(w-text_w)/2:
         y=h*0.56:
         alpha='${alphaExpr}'`
      : "",
  ]
    .filter(Boolean)
    .join(",");
}
const stackedLines = [
  safeLine1,
  safeLine2,
  safeLine3,
  safeLine4,
  safeLine5,
  safeLine6,
  safeLine7,
  safeLine8,
].filter(Boolean);

if (stackedLines.length) {
  const isMainPartScene =
    (scene?.title || "").includes("MainPart");

  const lineHeight =
    stackedLines.length >= 6
      ? 0.043
      : stackedLines.length >= 4
      ? 0.047
      : 0.052;

  const startY =
    stackedLines.length >= 6
      ? 0.30
      : stackedLines.length >= 4
      ? 0.33
      : 0.36 - ((stackedLines.length - 1) * lineHeight) / 2;

  return stackedLines
    .map((line, index) => {
      const isFirst = index === 0;
      const fontFile = isFirst
        ? "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
        : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

       const fontSize = isMainPartScene
  ? stackedLines.length >= 6
    ? isFirst
      ? 30
      : 28
    : stackedLines.length >= 4
    ? isFirst
      ? 38
      : 34
    : isFirst
    ? 48
    : 40
  : stackedLines.length >= 6
  ? isFirst
    ? 30
    : 28
  : stackedLines.length >= 4
  ? isFirst
    ? 40
    : 36
  : isFirst
  ? 52
  : 42;   
  const y = startY + index * lineHeight;

      return `drawtext=text='${line}':fontfile=${fontFile}:fontcolor=${textColor}:fontsize=${fontSize}:borderw=3:bordercolor=black@0.60:shadowcolor=black@0.80:shadowx=3:shadowy=3:x=(w-text_w)/2:y=h*${y.toFixed(3)}:alpha='${alphaExpr}'`;
    })
    .join(",");
}

return "";
});


  const safeBrandName = safe(brandName || headline || "Brand");
const safeBrandPhone = safe(phone || "");
const safeBrandAddress = safe(address || "");
const brandStart = Math.max(totalDurationSec - 2.4, 0);

const outroAlphaExpr = `if(lt(t,${brandStart}),0,if(lt(t,${brandStart + 0.3}),(t-${brandStart})/0.3,1))`;
  const brandWords = safeBrandName.split(" ").filter(Boolean);

const splitBrandName = (value: string) => {
  const words = value.split(" ").filter(Boolean);

  if (words.length <= 1) {
    return { line1: value, line2: "" };
  }

  if (value.length <= 16) {
    return { line1: value, line2: "" };
  }

  let bestIndex = 1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(" ");
    const right = words.slice(i).join(" ");
    const diff = Math.abs(left.length - right.length);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return {
    line1: words.slice(0, bestIndex).join(" ").trim(),
    line2: words.slice(bestIndex).join(" ").trim(),
  };
};

const { line1: brandLine1, line2: brandLine2 } = splitBrandName(safeBrandName);

const longestBrandLine = Math.max(brandLine1.length, brandLine2.length);

const brandFontSize = brandLine2
  ? longestBrandLine >= 18
    ? 54
    : longestBrandLine >= 14
    ? 60
    : 68
  : safeBrandName.length >= 18
  ? 68
  : 84;
const brandFontFile = localFontFile;
const safeAddress = safe(address || "");

const outroTexts = [
  brandLine1
    ? `drawtext=text='${brandLine1}':
       fontfile=${brandFontFile}:      
       fontcolor=white:
       fontsize=${brandFontSize}:
       borderw=4:
       bordercolor=black@0.68:
       shadowcolor=black@0.88:
       shadowx=3:
       shadowy=3:
       x=(w-text_w)/2:
       y=${brandLine2 ? "h*0.28" : "h*0.32"}:
       alpha='${outroAlphaExpr}'`
    : "",

  brandLine2
    ? `drawtext=text='${brandLine2}':
       fontfile=${brandFontFile}:
       fontcolor=white:
       fontsize=${brandFontSize}:
       borderw=4:
       bordercolor=black@0.68:
       shadowcolor=black@0.88:
       shadowx=3:
       shadowy=3:
       x=(w-text_w)/2:
       y=h*0.38:
       alpha='${outroAlphaExpr}'`
    : "",

  safeBrandPhone
    ? `drawtext=text='ТЕЛ: ${safeBrandPhone}':
       fontfile=${localFontFile}:    
       fontcolor=#FFE7A8:
       fontsize=56:
       borderw=4:
       bordercolor=black@0.82:
       shadowcolor=black@0.95:
       shadowx=4:
       shadowy=4:
       box=1:
       boxcolor=black@0.42:
       boxborderw=22:
       x=(w-text_w)/2:
       y=h*0.52:
       alpha='${outroAlphaExpr}'`
    : "",

  safeAddress
    ? `drawtext=text='АДРЕС: ${safeAddress}':
       fontfile=${localFontFile}:     
       fontcolor=white:
       fontsize=38:
       borderw=3:
       bordercolor=black@0.75:
       shadowcolor=black@0.9:
       shadowx=3:
       shadowy=3:
       box=1:
       boxcolor=black@0.36:
       boxborderw=18:
       x=(w-text_w)/2:
       y=h*0.64:
       alpha='${outroAlphaExpr}'`
    : "",
].filter(Boolean);
const videoFilters = [
  "scale=720:1280:force_original_aspect_ratio=increase",
  "crop=720:1280",
  "setsar=1",
  "format=yuv420p",
  ...drawTexts,
  ...outroTexts,
]
  .filter(Boolean)
  .join(",");
const filter = `[0:v]${videoFilters}[v]`;

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .input(musicPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .format("mp4")
      .outputOptions([
        "-filter_complex",
        filter,
        "-map",
        "[v]",
        "-map",
        "1:a:0",
        "-shortest",
        "-movflags +faststart",
        "-y",
      ])
      .on("end", () => resolve())
      .on("error", (error, stdout, stderr) => {
        reject(
          new Error(
            `FFmpeg failed: ${error.message}\nSTDERR:\n${stderr || "no stderr"}`
          )
        );
      })
      .save(outputPath);
  });
}

export async function POST(req: Request) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-smm-video-"));
  const inputPath = path.join(tempDir, "input.mp4");
  const outputPath = path.join(tempDir, "output.mp4");
  const musicPath = path.join(tempDir, "music.mp3");

  try {
    const body = await req.json();

    const videoUrl = body?.videoUrl as string;
    const headline = (body?.headline as string) || "Видео реклама";
    const brandName = (body?.brandName as string) || "";
    const cta = (body?.cta as string) || "";
    const website = (body?.website as string) || "";
    const phone = (body?.phone as string) || "";
    const address = (body?.address as string) || "";
    const scenes = Array.isArray(body?.scenes) ? body.scenes : [];
    const totalDurationSec = Number(body?.totalDurationSec) || 10;
    console.log("VIDEO DURATION:", totalDurationSec);
    const musicStyle = (body?.musicStyle as string) || "";
const selectedMusicPath = getMusicPath(musicStyle, totalDurationSec);
    const textColor = "#FFFFFF";

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Missing videoUrl" },
        { status: 400 }
      );
    }

    console.log("RAW VIDEO URL FOR RENDER:", videoUrl);

await downloadFile(videoUrl, inputPath);
const effectiveDurationSec = totalDurationSec;

console.log("EFFECTIVE VIDEO DURATION:", effectiveDurationSec);
if (!fs.existsSync(selectedMusicPath)) {
  throw new Error(`Missing local music file: ${selectedMusicPath}`);
}

fs.copyFileSync(selectedMusicPath, musicPath);

if (!fs.existsSync(musicPath)) {
     throw new Error(`Music file was not downloaded: ${musicPath}`);
}

    const musicStats = fs.statSync(musicPath);

    if (!musicStats.size) {
      throw new Error(`Downloaded music file is empty: ${musicPath}`);
    }

    await renderVideoWithMusic({
      inputPath,
      outputPath,
      musicPath,
      headline,
      brandName,
      scenes,
      totalDurationSec: effectiveDurationSec,    
      textColor,
      cta,
      website,
      phone,
      address,  
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Rendered video file was not created: ${outputPath}`);
    }

    const outputBuffer = fs.readFileSync(outputPath);

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'inline; filename="rendered-video.mp4"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown render error",
      },
      { status: 500 }
    );
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(musicPath)) fs.unlinkSync(musicPath);
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
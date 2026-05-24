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
console.log("FFMPEG PATH:", resolvedFfmpegPath);
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
  locale,
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
  locale: string;
}) {
    const subtitlePath = path.join(path.dirname(outputPath), "captions.ass");

  const cleanText = (value: string) =>
    (value || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/[•●▪◆►▶★☆]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const assSafe = (value: string) =>
    cleanText(value)
      .replace(/\\/g, "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}");

  const assTime = (seconds: number) => {
    const safeSeconds = Math.max(seconds, 0);
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = Math.floor(safeSeconds % 60);
    const cs = Math.floor((safeSeconds % 1) * 100);

    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(
      2,
      "0"
    )}.${String(cs).padStart(2, "0")}`;
  };

  const splitLines = (value: string, maxCharsPerLine = 22) => {
    const words = cleanText(value).split(" ").filter(Boolean);
    const lines: string[] = [];
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

    return lines.slice(0, 12);
  };
  const dialogues: string[] = [];
const visibleScenes = Array.isArray(scenes) ? scenes : [];
const isEnglishVideo = locale === "en";

const cleanOverlayCandidate = (value: string) => {
  let result = cleanText(value);

  result = result
    .replace(/тел[:\s]*[+\d\s\-()]+/giu, "")
    .replace(/адрес[:\s]*/giu, "")
    .replace(/гр\.\s*[а-яa-z\s,.0-9-]+/giu, "")
    .replace(new RegExp(cleanText(brandName), "giu"), "")
    .replace(/\s+/g, " ")
    .trim();

  if (result.length < 8) return "";

  const sentences = result
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences[0]) {
    result = sentences[0];
  }
const words = result.split(" ").filter(Boolean);
const shortWords: string[] = [];
let currentLength = 0;

for (const word of words) {
  const nextLength = currentLength + word.length + (shortWords.length ? 1 : 0);

  if (nextLength > 58) break;

  shortWords.push(word);
  currentLength = nextLength;
}

result = shortWords.join(" ").trim();

return result;
  };
const makeSmartAdLine = (value: string) => {
  const text = cleanText(value).toLowerCase();

  if (/пиц|pizza|mozzarella|моцарела|тесто|итал/i.test(text)) {
    return "Истинска италианска пица";
  }

  if (/торт|cake|десерт|сладкар/i.test(text)) {
    return "Бутикови торти за специални поводи";
  }

  if (/красот|салон|маникюр|коса|подстриг/i.test(text)) {
    return "Професионална грижа за красотата";
  }

  if (/вода|кладенец|сондаж|геофиз/i.test(text)) {
    return "Точна локация за вода";
  }

  return "";
};
const allVideoText = [
  headline,
  brandName,
  ...visibleScenes.map((scene: any) => scene?.overlay_text || scene?.title || ""),
].join(" ");

const smartMainTexts = (() => {
  const text = cleanText(allVideoText).toLowerCase();

  if (isEnglishVideo) {
  const englishTexts = [
    ...visibleScenes.map((scene: any) => scene?.overlay_text || scene?.title || ""),
    headline,
  ]
    .map((item) => cleanOverlayCandidate(item))
    .filter(Boolean)
    .slice(0, 2);

  return englishTexts.length
    ? englishTexts
    : ["A premium video ad", "Made for your business"];
}
  if (/пиц|pizza|моцарела|mozzarella|итал|тесто/i.test(text)) {
    return [
      "Истинска италианска пица",
      "Прясно тесто и богат вкус",
    ];
  }

  if (/торт|cake|десерт|сладкар/i.test(text)) {
    return [
      "Бутикови торти по поръчка",
      "За специални поводи и празници",
    ];
  }

  if (/маникюр|нокти|красот|салон|коса|подстриг/i.test(text)) {
    return [
      "Професионална грижа за красотата",
      "Запази час още днес",
    ];
  }

  if (/вода|кладенец|сондаж|геофиз/i.test(text)) {
    return [
      "Точна локация за вода",
      "Геофизични замервания за сондаж",
    ];
  }

  return [];
})();

const fallbackTexts = visibleScenes
  .map((scene: any) =>
    cleanOverlayCandidate(scene?.overlay_text || scene?.title || "")
  )
  .filter(Boolean);

const uniqueMainTexts = [...smartMainTexts, ...fallbackTexts].filter(
  (text, index, arr) =>
    arr.findIndex((item) => item.toLowerCase() === text.toLowerCase()) === index
);

const firstText = uniqueMainTexts[0] || cleanOverlayCandidate(headline);
const secondText = uniqueMainTexts[1] || "";
const mainTexts =
  totalDurationSec <= 5
    ? [firstText].filter(Boolean)
    : [firstText, secondText].filter(Boolean).slice(0, 2);

const mainEnd = Math.max(totalDurationSec - 3, 0);
const slotDuration = mainTexts.length > 1 ? mainEnd / mainTexts.length : mainEnd;

mainTexts.forEach((text, textIndex) => {
  const start = textIndex * slotDuration;
  const end = Math.min(start + slotDuration, mainEnd);
  const lines = splitLines(text, 20).slice(0, 3);
  const startY = 610;
  const lineGap = 64;

  lines.forEach((line, lineIndex) => {
    dialogues.push(
      `Dialogue: 0,${assTime(start)},${assTime(end)},Main,,0,0,0,,{\\an5\\fs42\\pos(360,${
        startY + lineIndex * lineGap
      })}${assSafe(line)}`
    );
  });
});

const brandStart = Math.max(totalDurationSec - 3, 0);

const finalBrandText = cleanText(brandName || headline || "Brand");

const brandParts = isEnglishVideo
  ? splitLines(finalBrandText, 18).slice(0, 3)
  : splitLines(finalBrandText, 24).slice(0, 2);

const brandStyle = isEnglishVideo ? "BrandEn" : "Brand";
const contactStyle = isEnglishVideo ? "ContactEn" : "Contact";
const addressStyle = isEnglishVideo ? "AddressEn" : "Address";

const brandFontSize = isEnglishVideo
  ? brandParts.length >= 3
    ? 76
    : 88
  : 72;

const brandY = isEnglishVideo
  ? brandParts.length >= 3
    ? 410
    : 445
  : 470;

const contactY = isEnglishVideo
  ? brandParts.length >= 3
    ? 700
    : 670
  : 660;

const addressY = isEnglishVideo ? 790 : 780;

if (brandParts.length) {
  dialogues.push(
    `Dialogue: 9,${assTime(brandStart)},${assTime(
      totalDurationSec
    )  },${brandStyle},,0,0,0,,{\\an5\\fnRoboto\\i1\\b1\\fs${brandFontSize}\\pos(360,${brandY})}${brandParts    .map(assSafe)
      .join("\\N")}`
  );
}

if (phone) {
  const formattedPhone = isEnglishVideo ? phone : `ТЕЛ: ${phone}`;

  dialogues.push(
    `Dialogue: 9,${assTime(brandStart)},${assTime(
      totalDurationSec
    )},${contactStyle},,0,0,0,,{\\an5\\fs${
      isEnglishVideo ? 46 : 52
    }\\pos(360,${contactY})}${assSafe(formattedPhone)}`
  );
}

if (address) {
  const formattedAddress = isEnglishVideo
    ? address.replace(/,\s*/g, " ")
    : address.length > 30
    ? `АДРЕС: ${address.replace(/,\s*/g, " ")}`
    : `АДРЕС: ${address}`;

  dialogues.push(
    `Dialogue: 9,${assTime(brandStart)},${assTime(
      totalDurationSec
    )},${addressStyle},,0,0,0,,{\\an5\\fs${
      isEnglishVideo ? 34 : 34
    }\\pos(360,${addressY})}${assSafe(formattedAddress)}`
  );
}
    const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Roboto,42,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,5,2,5,56,56,0,1
Style: Brand,Roboto,72,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,6,3,8,36,36,230,1
Style: Contact,Roboto,50,&H00A8E7FF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,165,1
Style: Address,Roboto,30,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,4,2,2,40,40,110,1
Style: BrandEn,Roboto,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,-1,0,0,100,100,0.5,0,1,6,3,8,36,36,230,1
Style: ContactEn,Roboto,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,-1,0,0,100,100,0.3,0,1,5,2,2,40,40,165,1
Style: AddressEn,Roboto,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,-1,0,0,100,100,0.2,0,1,4,2,2,40,40,110,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogues.join("\n")}
`;

  fs.writeFileSync(subtitlePath, assContent, "utf8");
  console.log("ASS SUBTITLE CONTENT:", assContent);
  

  

  const ffmpegPathSafe = (value: string) =>
  value.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");

const subtitlePathSafe = ffmpegPathSafe(subtitlePath);
const fontsDirSafe = ffmpegPathSafe(path.join(process.cwd(), "public", "fonts"));

const filter = `[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,subtitles='${subtitlePathSafe}':fontsdir='${fontsDirSafe}',format=yuv420p[v]`;

console.log("FFMPEG FILTER:", filter);
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
            .on("start", (commandLine) => {
        console.log("FFMPEG COMMAND:", commandLine);
      })
      .on("stderr", (stderrLine) => {
        console.log("FFMPEG STDERR:", stderrLine);
      })
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
const locale = (body?.locale as string) || "bg";
const isEnglishRequest = locale === "en";

const headline =
  (body?.headline as string) || (isEnglishRequest ? "Video ad" : "Видео реклама");

const subtext = (body?.subtext as string) || "";
const brandName = (body?.brandName as string) || "";
const cta = (body?.cta as string) || "";
const website = (body?.website as string) || "";
const phone = (body?.phone as string) || "";
const address = (body?.address as string) || "";
              const totalDurationSec = Number(body?.totalDurationSec) || 10;

    let scenes = Array.isArray(body?.scenes) ? body.scenes : [];

    if (!scenes.length) {
      scenes = [
        {
          title: "Main",
          overlay_text:
  headline || subtext || brandName || (isEnglishRequest ? "Video ad" : "Видео реклама"),
          duration_sec: Math.max(totalDurationSec - 2.4, 1),
        },
      ];
    }
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
      locale,  
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
    console.error("RENDER VIDEO API ERROR:", error);

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
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_IMAGES = 12;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_SIZE = 45 * 1024 * 1024;

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function extractJson(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY липсва във Vercel.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const title = getText(formData, "title");
    const locality = getText(formData, "locality");
    const municipality = getText(formData, "municipality");
    const district = getText(formData, "district");
    const equipment = getText(formData, "equipment");
    const surveyType = getText(formData, "surveyType");
    const waterType = getText(formData, "waterType");
    const targetDepth = getText(formData, "targetDepth");
    const dowsingNotes = getText(formData, "dowsingNotes");
    const notes = getText(formData, "notes");
    const mapContext = getText(formData, "mapContext");

    if (!title || !locality) {
      return NextResponse.json(
        {
          success: false,
          error: "Името на проучването и населеното място са задължителни.",
        },
        { status: 400 }
      );
    }

    const files = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Качи поне една снимка от замерването.",
        },
        { status: 400 }
      );
    }

    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          error: `Може да качиш най-много ${MAX_IMAGES} снимки наведнъж.`,
        },
        { status: 400 }
      );
    }

    let totalSize = 0;

    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Неподдържан формат: ${file.name}. Използвай JPG, PNG или WEBP.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `Снимката ${file.name} е по-голяма от 8 MB.`,
          },
          { status: 400 }
        );
      }

      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Общият размер на снимките е прекалено голям.",
        },
        { status: 400 }
      );
    }

    const imageInputs = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");

        return {
          type: "input_image" as const,
          image_url: `data:${file.type};base64,${base64}`,
          detail: "high" as const,
        };
      })
    );

    const surveyDescription = `
Име на проучването: ${title}
Населено място: ${locality}
Община: ${municipality || "не е посочена"}
Област: ${district || "не е посочена"}
Апарат: ${equipment || "не е посочен"}
Тип проучване: ${surveyType || "не е посочен"}
Търсен тип вода: ${waterType || "не е посочен"}
Търсен диапазон на дълбочина: ${targetDepth || "не е посочен"}

Данни от радиестезията:
${dowsingNotes || "няма въведени данни"}

Допълнителни теренни бележки:
${notes || "няма въведени бележки"}

Информация от геоложката карта:
${mapContext || "Няма точни координати. Използвай населеното място само като общ район и изрично отбележи ограничението."}
`.trim();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: process.env.GEOLOGY_AI_MODEL || "gpt-5",
      instructions: `
Ти си помощник за предварителен анализ на геофизични измервания за подземни води.

Работиш с:
1. снимки и графики от AIDU или ADMT;
2. теренни бележки;
3. данни от радиестезия;
4. информация от геоложка и хидрогеоложка карта.

ЗАДЪЛЖИТЕЛНИ ПРАВИЛА:
- Не представяй предположенията като доказани факти.
- Не измисляй координати, геоложки структури, дебит, температура или точна дълбочина.
- Разграничавай ясно: наблюдение от апарата, информация от радиестезията, информация от картата и AI интерпретация.
- При липса на координати картографската оценка е само районна и ориентировъчна.
- Не приемай автоматично всяка нискоомна или цветна зона за вода.
- Отчитай възможни глини, насипи, минерализация, влажни почви, технически смущения и други неводни причини.
- Посочвай коя информация не може да се разчете надеждно от снимките.
- Анализирай целия наличен дълбочинен обхват на изображенията, без да се ограничаваш от предварително зададена желана дълбочина.
- Разграничи плитък, основен и по-дълбок перспективен хоризонт, когато изображенията позволяват това.
- Анализът е предварителен и не гарантира наличие, дебит или качество на водата.
- Отговорът трябва да е на български.
- Върни само валиден JSON, без markdown и без текст извън JSON.

Формат:
{
  "summary": "кратко общо заключение",
  "deviceObservations": [
    "наблюдения, видими в снимките от апарата"
  ],
  "dowsingComparison": {
    "agreement": "съвпада / частично съвпада / не може да се потвърди / не съвпада",
    "details": "обяснение"
  },
  "mapComparison": {
    "confidence": "висока / средна / ниска / невъзможна без координати",
    "details": "съпоставка с предоставения картографски контекст"
  },
  "candidateZones": [
    {
      "point": "наименование или позиция",
      "perspective": "висока / средна / ниска",
      "possibleDepthFromM": null,
      "possibleDepthToM": null,
      "reasoning": "аргументация",
      "alternativeExplanation": "възможна неводна причина"
    }
  ],
  "recommendedPoint": "предпочитана точка или недостатъчно данни",
  "recommendedDepth": {
    "fromM": null,
    "toM": null,
    "confidence": "висока / средна / ниска"
  },
  "deeperHorizon": {
    "present": false,
    "fromM": null,
    "toM": null,
    "details": ""
  },
  "limitations": [
    "ограничения на анализа"
  ],
  "clientText": "кратък професионален текст за представяне пред клиента"
}
      `.trim(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: surveyDescription,
            },
            ...imageInputs,
          ],
        },
      ],
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      throw new Error("AI не върна анализ.");
    }

    let analysis;

    try {
      analysis = extractJson(raw);
    } catch {
      console.error("Invalid geology AI JSON:", raw);

      return NextResponse.json(
        {
          success: false,
          error: "AI върна невалиден формат. Опитай отново.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Geology analysis failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Неуспешен AI анализ.",
      },
      { status: 500 }
    );
  }
}

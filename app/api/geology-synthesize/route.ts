import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
          error: "OPENAI_API_KEY липсва.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const locality =
      typeof body.locality === "string" ? body.locality.trim() : "";

    const dowsingNotes =
      typeof body.dowsingNotes === "string"
        ? body.dowsingNotes.trim()
        : "";

    const notes =
      typeof body.notes === "string" ? body.notes.trim() : "";

    const mapContext =
      typeof body.mapContext === "string"
        ? body.mapContext.trim()
        : "";

    const partialAnalyses = Array.isArray(body.partialAnalyses)
      ? body.partialAnalyses
      : [];

    if (!title || !locality || partialAnalyses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Липсват данни за общия анализ.",
        },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const inputText = `
Име на проучването: ${title}
Населено място: ${locality}

Данни от радиестезията:
${dowsingNotes || "няма въведени данни"}

Теренни бележки:
${notes || "няма въведени бележки"}

Картографски контекст:
${mapContext || "няма точни координати"}

Брой автоматично анализирани групи изображения:
${partialAnalyses.length}

Междинни анализи:
${JSON.stringify(partialAnalyses, null, 2)}
`.trim();

    const response = await openai.responses.create({
      model: process.env.GEOLOGY_AI_MODEL || "gpt-5",
      instructions: `
Ти изготвяш окончателен общ анализ на геофизично проучване
за подземни води.

Получаваш няколко междинни анализа на различни групи снимки.
Снимките не са подредени и не трябва да приемаш, че редът им
съответства на реда на точките от терена.

ЗАДАЧА:
- Обедини повтарящите се наблюдения.
- Отдели устойчивите изводи от единичните и несигурните.
- Не измисляй връзка между изображенията.
- Не измисляй номера на точки.
- Използвай номера на точки само когато са видими в снимките
  или са изрично посочени в радиестезията.
- Не приемай автоматично нискоомна зона за вода.
- Отчитай глина, насип, влажни почви, минерализация,
  технически смущения и други възможни обяснения.
- Анализирай целия видим дълбочинен обхват.
- Разграничи плитък, основен и по-дълбок перспективен хоризонт,
  когато данните го позволяват.
- Съпостави резултатите с радиестезията.
- При липса на координати картографската оценка е районна.
- Не обещавай дебит, качество или сигурно наличие на вода.
- Върни само валиден JSON на български.

Формат:
{
  "summary": "общо заключение",
  "deviceObservations": [
    "устойчиви наблюдения от всички групи снимки"
  ],
  "dowsingComparison": {
    "agreement": "съвпада / частично съвпада / не може да се потвърди / не съвпада",
    "details": "подробна съпоставка"
  },
  "mapComparison": {
    "confidence": "висока / средна / ниска / невъзможна без координати",
    "details": "картографска оценка"
  },
  "candidateZones": [
    {
      "point": "точка или описателна зона",
      "perspective": "висока / средна / ниска",
      "possibleDepthFromM": null,
      "possibleDepthToM": null,
      "reasoning": "аргументация",
      "alternativeExplanation": "възможна неводна причина"
    }
  ],
  "shallowHorizon": {
    "present": false,
    "fromM": null,
    "toM": null,
    "confidence": "висока / средна / ниска",
    "details": ""
  },
  "recommendedPoint": "предпочитана точка или недостатъчно данни",
  "reservePoint": "резервна точка или няма достатъчно данни",
  "recommendedDepth": {
    "fromM": null,
    "toM": null,
    "confidence": "висока / средна / ниска",
    "details": ""
  },
  "deeperHorizon": {
    "present": false,
    "fromM": null,
    "toM": null,
    "confidence": "висока / средна / ниска",
    "details": ""
  },
  "limitations": [
    "ограничения"
  ],
  "clientText": "кратък професионален текст за клиента"
}
      `.trim(),
      input: inputText,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      throw new Error("AI не върна общ анализ.");
    }

    let analysis;

    try {
      analysis = extractJson(raw);
    } catch {
      console.error("Invalid synthesis JSON:", raw);

      return NextResponse.json(
        {
          success: false,
          error: "Общият AI анализ е с невалиден формат.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Geology synthesis failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Неуспешно обединяване на анализите.",
      },
      { status: 500 }
    );
  }
}

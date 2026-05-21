import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { businessInput } = await req.json();

    if (!businessInput || typeof businessInput !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing businessInput" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a Facebook Ads strategist for small businesses in Bulgaria.

Analyze the user's business and advertising goal.
Return ONLY valid JSON.

Choose the most suitable Facebook Ads guide from this list:
- messages
- calls
- traffic
- sales
- followers
- local_awareness

Return:
{
  "recommendedGuide": "messages",
  "reason": "short explanation in Bulgarian",
  "businessType": "short business type in Bulgarian",
  "goal": "short advertising goal in Bulgarian"
}

Rules:
- If the user wants bookings, appointments, consultations, inquiries or DM contact, choose "messages".
- If the user wants phone calls, choose "calls".
- If the user wants website visits, choose "traffic".
- If the user sells products online, choose "sales".
- If the user wants more followers, choose "followers".
- If the user wants local visibility but no direct action, choose "local_awareness".
`,
        },
        {
          role: "user",
          content: businessInput,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content || "{}";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { success: false, error: "AI returned invalid JSON" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: parsed,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}
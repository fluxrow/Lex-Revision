import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key is not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: `You are an expert legal translator. Translate the following legal text into ${targetLanguage || 'English'}, maintaining the precise legal meaning and terminology.`,
      messages: [
        { role: "user", content: text || "Translate this text." }
      ],
    });

    const content = msg.content[0].type === 'text' ? msg.content[0].text : "";
    return NextResponse.json({ content, status: 'translated' });
  } catch (error: any) {
    console.error("AI Translate Error:", error);
    return NextResponse.json({ error: error.message || "Failed to translate text" }, { status: 500 });
  }
}

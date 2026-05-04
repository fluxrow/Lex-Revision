import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key is not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: "You are an expert legal assistant. Generate a legal document draft based on the user's prompt.",
      messages: [
        { role: "user", content: prompt || "Generate a generic service agreement." }
      ],
    });

    const content = msg.content[0].type === 'text' ? msg.content[0].text : "";
    return NextResponse.json({ content, status: 'generated' });
  } catch (error: any) {
    console.error("AI Generate Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate text" }, { status: 500 });
  }
}

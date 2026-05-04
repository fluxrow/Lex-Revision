import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentContent } = await request.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key is not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: "You are an expert legal assistant. Extract all key clauses from the provided document and summarize their intent.",
      messages: [
        { role: "user", content: documentContent || "Analyze clauses in this document." }
      ],
    });

    const content = msg.content[0].type === 'text' ? msg.content[0].text : "";
    return NextResponse.json({ content, status: 'claused' });
  } catch (error: any) {
    console.error("AI Clauses Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze clauses" }, { status: 500 });
  }
}

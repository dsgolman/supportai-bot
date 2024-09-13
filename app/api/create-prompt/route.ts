import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, text } = await req.json();
    const apiKey = process.env.HUME_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Hume API key is not set' }, { status: 500 });
    }

    const response = await fetch('https://api.hume.ai/v0/evi/prompts', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        text: text
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create prompt: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
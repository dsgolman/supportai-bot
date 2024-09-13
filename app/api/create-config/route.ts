import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, promptId } = await req.json();
    const apiKey = process.env.HUME_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Hume API key is not set' }, { status: 500 });
    }

    const response = await fetch('https://api.hume.ai/v0/evi/configs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evi_version: "2",
        name: name,
        prompt: {
          id: promptId,
          version: 0
        },
        voice: {
          provider: "HUME_AI",
          name: "KORA"
        },
        language_model: {
          model_provider: "ANTHROPIC",
          model_resource: "claude-3-5-sonnet-20240620",
          temperature: 1
        },
        event_messages: {
          on_new_chat: {
            enabled: false,
            text: ""
          },
          on_inactivity_timeout: {
            enabled: false,
            text: ""
          },
          on_max_duration_timeout: {
            enabled: false,
            text: ""
          }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create config: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
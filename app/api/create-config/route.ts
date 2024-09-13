import { NextRequest, NextResponse } from 'next/server';
import { HumeClient, Hume } from 'hume';
import { getHumeAccessToken } from '@/utils/getHumeAccessToken';

export async function POST(req: NextRequest) {
  try {
    const { name, promptId } = await req.json();
    const accessToken = await getHumeAccessToken();

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get Hume access token' }, { status: 401 });
    }

    const client = new HumeClient({ accessToken });
    const response = await client.empathicVoice.configs.createConfig({
      name,
      prompt: {
        id: promptId,
        version: 0
      },
      eviVersion: "2",
      voice: {
        provider: "HUME_AI",
        name: "SAMPLE VOICE"
      },
      languageModel: {
        modelProvider: Hume.PostedLanguageModelModelProvider.Anthropic,
        modelResource: "claude-3-5-sonnet-20240620",
        temperature: 1
      },
      eventMessages: {
        onNewChat: {
          enabled: false,
          text: ""
        },
        onInactivityTimeout: {
          enabled: false,
          text: ""
        },
        onMaxDurationTimeout: {
          enabled: false,
          text: ""
        }
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
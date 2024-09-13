import { NextRequest, NextResponse } from 'next/server';
import { HumeClient } from 'hume';
import { getHumeAccessToken } from '@/utils/getHumeAccessToken';

export async function POST(req: NextRequest) {
  try {
    const { name, text } = await req.json();
    const accessToken = await getHumeAccessToken();

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get Hume access token' }, { status: 401 });
    }
    console.log(accessToken)
    const client = new HumeClient({ accessToken });
    const response = await client.empathicVoice.prompts.createPrompt({
      name,
      text
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
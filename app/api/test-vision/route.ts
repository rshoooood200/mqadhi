import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const zai = await ZAI.create();
    
    // Read key frames
    const framesDir = '/home/z/my-project/upload/video_frames';
    
    // Read first few frames as base64
    const frames = [];
    for (let i = 1; i <= 36; i += 5) {
      const framePath = `${framesDir}/frame_${String(i).padStart(4, '0')}.png`;
      if (fs.existsSync(framePath)) {
        const buffer = fs.readFileSync(framePath);
        frames.push(`data:image/png;base64,${buffer.toString('base64')}`);
      }
    }
    
    const prompt = `Analyze these screenshots from a mobile app video recording step by step.

The app appears to be a budget/shopping list app in Arabic. Please analyze:

1) What actions is the user performing?
2) Are there any errors or problems visible?
3) What happens to the data when adding or editing?
4) Is there any indication of data not being saved?
5) Look for any alert messages or notifications

Provide a detailed analysis in Arabic of what's happening in each screenshot and the overall flow.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...frames.map(url => ({
              type: 'image_url',
              image_url: { url }
            }))
          ]
        }
      ],
      thinking: { type: 'enabled' }
    });

    return NextResponse.json({
      success: true,
      analysis: response.choices[0]?.message?.content
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

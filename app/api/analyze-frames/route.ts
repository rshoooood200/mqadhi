import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const zai = await ZAI.create();
    
    // Read all frames
    const framesDir = '/home/z/my-project/upload/video_frames';
    const frames = fs.readdirSync(framesDir)
      .filter(f => f.endsWith('.png'))
      .sort()
      .slice(0, 36); // Take all frames
    
    // Select key frames: start, early, middle, late, end
    const keyFrameIndices = [0, 5, 10, 15, 20, 25, 30, 35];
    const selectedFrames = keyFrameIndices
      .filter(i => i < frames.length)
      .map(i => frames[i]);
    
    // Convert frames to base64
    const imageContents = selectedFrames.map(frame => {
      const imagePath = `${framesDir}/${frame}`;
      const buffer = fs.readFileSync(imagePath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    });
    
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
            ...imageContents.map(url => ({
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
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

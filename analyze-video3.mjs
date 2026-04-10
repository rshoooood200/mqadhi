import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeVideo() {
  try {
    const zai = await ZAI.create();
    
    const videoPath = '/home/z/my-project/upload/ScreenRecording_٠٤-١٠-٢٠٢٦ ١٧-٢٠-٤٠_1.mp4';
    const videoBuffer = fs.readFileSync(videoPath);
    const base64Video = videoBuffer.toString('base64');
    
    const prompt = `Analyze this video in detail step by step. Focus on:
1) What the user is doing in the app
2) Any errors or problems that appear
3) How data behaves when adding or editing
4) What happens when closing and reopening the app
5) Any messages or alerts that appear

Provide a comprehensive analysis.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'video_url', video_url: { url: `data:video/mp4;base64,${base64Video}` } }
          ]
        }
      ]
    });

    console.log(response.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

analyzeVideo();

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  try {
    const zai = await ZAI.create();
    
    // Read key frames
    const framesDir = '/home/z/my-project/upload/video_frames';
    
    // Read frames at specific intervals
    const frames = [];
    for (let i = 1; i <= 36; i += 5) {
      const framePath = framesDir + '/frame_' + String(i).padStart(4, '0') + '.png';
      if (fs.existsSync(framePath)) {
        const buffer = fs.readFileSync(framePath);
        frames.push('data:image/png;base64,' + buffer.toString('base64'));
      }
    }
    
    if (frames.length === 0) {
      console.log('No frames found');
      return;
    }
    
    console.log('Found', frames.length, 'frames');
    
    const prompt = `Analyze these screenshots from a mobile app video recording step by step.

The app appears to be a budget/shopping list app in Arabic. Please analyze:

1) What actions is the user performing?
2) Are there any errors or problems visible?
3) What happens to the data when adding or editing?
4) Is there any indication of data not being saved?
5) Look for any alert messages or notifications

Provide a detailed analysis in Arabic of what's happening in each screenshot and the overall flow.`;

    const content = [{ type: 'text', text: prompt }];
    frames.forEach(url => {
      content.push({ type: 'image_url', image_url: { url } });
    });

    const response = await zai.chat.completions.createVision({
      messages: [{ role: 'user', content }],
      thinking: { type: 'enabled' }
    });

    console.log('Analysis:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage() {
  const zai = await ZAI.create();
  
  const imagePath = '/home/z/my-project/upload/IMG_3879.png';
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'صف ما تراه في هذه الصورة بالتفصيل. ما هي الرسالة أو الإشعار الذي يظهر؟ هل هناك زر تحديث؟'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });
  
  console.log(response.choices[0]?.message?.content);
}

analyzeImage().catch(console.error);

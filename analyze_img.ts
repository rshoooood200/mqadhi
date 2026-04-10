import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage() {
  const zai = await ZAI.create();
  
  const imagePath = '/home/z/my-project/upload/IMG_3880.jpeg';
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'هذه صورة لإعدادات Vercel. هل كلمة المرور مكتوبة بشكل صحيح؟ هل هناك أي خطأ في الرابط؟'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
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

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeVideo() {
  try {
    // Use the same initialization method that works elsewhere
    const zai = new ZAI({
      apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY
    });
    
    const videoPath = '/home/z/my-project/upload/ScreenRecording_٠٤-١٠-٢٠٢٦ ١٧-٢٠-٤٠_1.mp4';
    const videoBuffer = fs.readFileSync(videoPath);
    const base64Video = videoBuffer.toString('base64');
    
    const prompt = `قم بتحليل هذا الفيديو بالتفصيل واشرح ما يحدث فيه خطوة بخطوة. 
ركز على:
1) ما يفعله المستخدم في التطبيق
2) أي أخطاء أو مشاكل تظهر
3) كيف تتصرف البيانات عند الإضافة أو التعديل
4) ما يحدث عند إغلاق وإعادة فتح التطبيق
5) أي رسائل أو تنبيهات تظهر

قدم تحليلاً شاملاً باللغة العربية.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'video_url', video_url: { url: `data:video/mp4;base64,${base64Video}` } }
          ]
        }
      ],
      thinking: { type: 'enabled' }
    });

    console.log(response.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

analyzeVideo();

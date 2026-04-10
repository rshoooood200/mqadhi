import fs from 'fs';

const imageBuffer = fs.readFileSync('/home/z/my-project/upload/IMG_3880.jpeg');
const base64Image = imageBuffer.toString('base64');

console.log('Image loaded, size:', imageBuffer.length);
console.log('Base64 length:', base64Image.length);

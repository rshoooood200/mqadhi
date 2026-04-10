// اختبار API الحفظ
async function testSave() {
  // أولاً: تسجيل الدخول
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'family7ome@gmail.com', password: '123456' })
  })
  
  const cookies = loginRes.headers.get('set-cookie')
  console.log('Login status:', loginRes.status)
  
  // ثانياً: حفظ بيانات اختبارية
  const saveRes = await fetch('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies || ''
    },
    body: JSON.stringify({
      items: [
        { id: 'test1', name: 'منتج اختبار 1', category: 'dairy', quantity: 1, notes: '', isPurchased: false, prices: [] },
        { id: 'test2', name: 'منتج اختبار 2', category: 'dairy', quantity: 1, notes: '', isPurchased: false, prices: [] }
      ],
      familyMembers: [{ id: 'f1', name: 'عضو اختبار', avatar: '👤' }]
    })
  })
  
  console.log('Save status:', saveRes.status)
  const saveData = await saveRes.json()
  console.log('Save response:', saveData)
  
  // ثالثاً: تحميل البيانات للتأكد
  const loadRes = await fetch('http://localhost:3000/api/sync', {
    headers: { 'Cookie': cookies || '' }
  })
  
  console.log('Load status:', loadRes.status)
  const loadData = await loadRes.json()
  console.log('Loaded items:', loadData.items?.length)
  console.log('Loaded family:', loadData.familyMembers?.length)
}

testSave().catch(console.error)

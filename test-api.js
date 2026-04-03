const http = require('http');

async function testAPI() {
  // Test if server is running
  console.log('Testing API...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const data = JSON.stringify({
    email: 'resheed1515@gmail.com',
    password: 'test123'
  });

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(data);
  req.end();
}

testAPI();

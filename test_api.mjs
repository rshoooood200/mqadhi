// Test Supabase REST API directly
async function test() {
  const response = await fetch('https://gndcbkzulzeeillptdip.supabase.co/rest/v1/', {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZGNia3p1bHplZWlsbHB0ZGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MjQzODcsImV4cCI6MjA1MzQwMDM4N30.demo',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZGNia3p1bHplZWlsbHB0ZGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MjQzODcsImV4cCI6MjA1MzQwMDM4N30.demo'
    }
  });
  
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
}

test();

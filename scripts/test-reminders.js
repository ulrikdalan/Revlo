// We need to use common.js compatible import for fetch
// Using fetch from node-fetch@2.x which is compatible with CommonJS
const fetch = require('node-fetch');

async function testReminders() {
  console.log('Testing reminder API endpoint with cron header...');
  
  try {
    const response = await fetch('http://localhost:3000/api/send-reminder-emails', {
      headers: {
        'x-vercel-cron': 'true'
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testReminders(); 
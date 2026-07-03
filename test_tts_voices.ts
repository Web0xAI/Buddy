import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.MINIMAX_API_KEY;

async function fetchVoices() {
  try {
    const response = await fetch("https://api.minimaxi.chat/v1/voice/list", {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
        const json = await response.json();
        console.log('Voices:', JSON.stringify(json, null, 2));
    } else {
        console.log('Error!', response.status, await response.text());
    }
  } catch (e) {
    console.log('Exception', e);
  }
}
fetchVoices();

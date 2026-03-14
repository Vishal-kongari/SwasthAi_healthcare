require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We cannot easily fetch listModels using the SDK in standard JS without using the older REST API manually,
    // so we will query it via standard JS fetch to the REST endpoint.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
       console.error('API Error:', data.error.message);
       return;
    }
    
    console.log('Available Models for your API Key:');
    if (data.models && data.models.length > 0) {
      data.models.forEach(m => {
        // filter for generateContent supported methods
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
           console.log(`- ${m.name} (${m.displayName})`);
        }
      });
    } else {
       console.log('No models returned. There may be an issue with your Cloud project permissions.');
    }
    
  } catch (err) {
    console.error('Error fetching models:', err.message);
  }
}

run();

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/nutrition';

async function testEndpoint(item, expectedSource) {
    try {
        console.log(`Testing /nutrition/${item}...`);
        const response = await axios.get(`${BASE_URL}/${item}`);
        const data = response.data;

        if (data.food.source.includes(expectedSource)) {
            console.log(`✅ ${item}: Success (Source: ${data.food.source})`);
        } else {
            console.log(`❌ ${item}: Failed (Expected ${expectedSource}, got ${data.food.source})`);
        }
    } catch (error) {
        console.log(`❌ ${item}: Error - ${error.message}`);
    }
}

async function runTests() {
    console.log('Starting Verification Tests...');

    // Give server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testEndpoint('idli', 'Medical Nutrition Database');
    await testEndpoint('apple', 'USDA'); // Might be USDA Database or Demo Data depending on API key
    await testEndpoint('pizza', 'USDA'); // Demo Data usually

    console.log('Tests Completed.');
}

runTests();

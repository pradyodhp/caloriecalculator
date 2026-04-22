const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001/nutrition';

async function getResponse(item) {
    try {
        console.log(`Fetching ${item}...`);
        const response = await axios.get(`${BASE_URL}/${item}`);
        return { item, data: response.data };
    } catch (error) {
        return { item, error: error.message };
    }
}

async function run() {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pizza = await getResponse('pizza');
    const eggs = await getResponse('boiled eggs');

    fs.writeFileSync('output.json', JSON.stringify([pizza, eggs], null, 2));
    console.log('Written to output.json');
}

run();

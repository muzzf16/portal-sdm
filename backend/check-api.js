const fetch = require('node-fetch');

async function fetchData() {
    try {
        const response = await fetch('http://localhost:2025/api/data');
        const data = await response.json();
        console.log('API Response:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();
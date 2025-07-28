const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3001;

app.use(cors());

const BDL_API_KEY = '7eb6ceb7-a994-4bf0-f27f-08ddcd5a2c67';
const BDL_API_URL = 'https://bdl.stat.gov.pl/api/v1';

app.get('/api/units', async (req, res) => {
    const { level = 0, parentId } = req.query;
    let url = `${BDL_API_URL}/units?level=${level}&format=json`;
    if (parentId) {
        url += `&parent-id=${parentId}`;
    }

    try {
        const response = await axios.get(url, {
            headers: { 'X-ClientId': BDL_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching units' });
    }
});

app.get('/api/data', async (req, res) => {
    const { varId, unitId } = req.query;
    try {
        const response = await axios.get(`${BDL_API_URL}/data/by-variable/${varId}?unit-id=${unitId}&year=2020&year=2021&year=2022&year=2023&year=2024&format=json`, {
            headers: { 'X-ClientId': BDL_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

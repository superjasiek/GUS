const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());

const BDL_API_KEY = '7eb6ceb7-a994-4bf0-f27f-08ddcd5a2c67';
const BDL_API_URL = 'https://bdl.stat.gov.pl/api/v1';
const VARIABLES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/variables.json'), 'utf8')
);

app.get('/api/variables', (req, res) => {
    res.json(VARIABLES);
});

app.get('/api/units', async (req, res) => {
    const { level = 0, parentId } = req.query;
    let url = `${BDL_API_URL}/units?level=${level}&format=json&page-size=100`;
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
    const { category, varId, unitId } = req.query;
    const variableId = varId || VARIABLES[category];
    if (!variableId) {
        return res.status(400).json({ error: 'Unknown variable category' });
    }

    try {
        const response = await axios.get(
            `${BDL_API_URL}/data/by-variable/${variableId}?unit-id=${unitId}&year=2020&year=2021&year=2022&year=2023&year=2024&format=json`,
            { headers: { 'X-ClientId': BDL_API_KEY } }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

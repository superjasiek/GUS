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
    const { varId, unitId, yearFrom, yearTo } = req.query;
    let url = `${BDL_API_URL}/data/by-variable/${varId}?unit-id=${unitId}&format=json`;

    if (yearFrom && yearTo) {
        for (let year = yearFrom; year <= yearTo; year++) {
            url += `&year=${year}`;
        }
    }

    try {
        const response = await axios.get(url, {
            headers: { 'X-ClientId': BDL_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});

const xlsx = require('xlsx');

app.get('/api/variables', (req, res) => {
    try {
        const workbook = xlsx.readFile('DANE_Radomyśl Wielki_04.06.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        const variables = {};
        const headers = data[0];
        const ids = data[1];

        for (let i = 0; i < headers.length; i++) {
            variables[headers[i]] = ids[i];
        }

        res.json(variables);
    } catch (error) {
        res.status(500).json({ error: 'Error reading variables from Excel file' });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

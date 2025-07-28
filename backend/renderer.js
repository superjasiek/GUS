const axios = require('axios');

const unitSelect = document.getElementById('unit-select');
const exportButton = document.getElementById('export-button');

const BDL_API_KEY = '7eb6ceb7-a994-4bf0-f27f-08ddcd5a2c67';
const BDL_API_URL = 'https://bdl.stat.gov.pl/api/v1';

const VARIABLES = {
    'ludnosc': '60618',
    'zgony': '6581',
    'migracje': '80122'
};

async function getUnits() {
    try {
        const response = await axios.get(`${BDL_API_URL}/units?level=2&format=json`, {
            headers: { 'X-ClientId': BDL_API_KEY }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching units:', error);
        return [];
    }
}

async function populateUnits() {
    const units = await getUnits();
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = unit.name;
        unitSelect.appendChild(option);
    });
}

async function getVariableData(variableId, unitId) {
    try {
        const response = await axios.get(`${BDL_API_URL}/data/by-variable/${variableId}?unit-id=${unitId}&year=2020&year=2021&year=2022&year=2023&year=2024&format=json`, {
            headers: { 'X-ClientId': BDL_API_KEY }
        });
        return response.data.results;
    } catch (error) {
        console.error(`Error fetching data for variable ${variableId} and unit ${unitId}:`, error);
        return [];
    }
}

exportButton.addEventListener('click', async () => {
    const selectedUnits = Array.from(unitSelect.selectedOptions).map(option => ({
        id: option.value,
        name: option.textContent
    }));

    if (selectedUnits.length === 0) {
        alert('Wybierz co najmniej jedną jednostkę terytorialną.');
        return;
    }

    const dataToExport = [];

    for (const unit of selectedUnits) {
        const unitData = {
            name: unit.name,
            years: {}
        };

        for (const varName in VARIABLES) {
            const varId = VARIABLES[varName];
            const variableData = await getVariableData(varId, unit.id);
            variableData.forEach(item => {
                item.values.forEach(val => {
                    if (!unitData.years[val.year]) {
                        unitData.years[val.year] = {};
                    }
                    unitData.years[val.year][varName] = val.val;
                });
            });
        }
        dataToExport.push(unitData);
    }

    window.electron.ipcRenderer.send('export-to-excel', dataToExport);
});

populateUnits();

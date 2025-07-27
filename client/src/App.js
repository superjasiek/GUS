import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';

const API_URL = 'http://localhost:3001/api';

const VARIABLES = {
  'ludnosc': '60618',
  'zgony': '6581',
  'migracje': '80122'
};

function App() {
  const [units, setUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/units`)
      .then(response => {
        setUnits(response.data.results);
      })
      .catch(error => {
        console.error('Error fetching units:', error);
      });
  }, []);

  const handleUnitChange = (event) => {
    const { options } = event.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push({ id: options[i].value, name: options[i].text });
      }
    }
    setSelectedUnits(value);
  };

  const handleExport = async () => {
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
        const response = await axios.get(`${API_URL}/data?varId=${varId}&unitId=${unit.id}`);
        const variableData = response.data.results;
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dane');

    worksheet.columns = [
      { header: 'Jednostka terytorialna', key: 'unit', width: 30 },
      { header: 'Rok', key: 'year', width: 10 },
      { header: 'Liczba ludności', key: 'ludnosc', width: 15 },
      { header: 'Zgony', key: 'zgony', width: 15 },
      { header: 'Migracje zagraniczne', key: 'migracje', width: 20 }
    ];

    dataToExport.forEach(unitData => {
      for (const year in unitData.years) {
        worksheet.addRow({
          unit: unitData.name,
          year: year,
          ludnosc: unitData.years[year].ludnosc,
          zgony: unitData.years[year].zgony,
          migracje: unitData.years[year].migracje
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dane_bdl.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>BDL Data Exporter</h1>
      <p>Wybierz jednostki terytorialne:</p>
      <select multiple onChange={handleUnitChange}>
        {units.map(unit => (
          <option key={unit.id} value={unit.id}>{unit.name}</option>
        ))}
      </select>
      <br /><br />
      <button onClick={handleExport}>Eksportuj do Excela</button>
    </div>
  );
}

export default App;

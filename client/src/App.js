import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import UnitPicker from './components/UnitPicker';
import './App.css';

const API_URL = 'http://192.168.1.182:3001/api';

function App() {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [variables, setVariables] = useState({});

  useEffect(() => {
    axios.get(`${API_URL}/variables`).then(response => {
      setVariables(response.data);
    });
  }, []);

  const handleExport = async () => {
    if (selectedUnits.length === 0) {
      alert('Wybierz co najmniej jedną jednostkę terytorialną.');
      return;
    }

    const dataToExport = [];

    for (const unit of selectedUnits) {
      const unitData = {
        name: unit.label,
        years: {}
      };

      for (const varName in variables) {
        const varId = variables[varName];
        const response = await axios.get(`${API_URL}/data?varId=${varId}&unitId=${unit.value}&yearFrom=2018&yearTo=2024`);
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
    <div className="App">
      <h1>BDL Data Exporter</h1>
      <div className="container">
        <UnitPicker selectedUnits={selectedUnits} setSelectedUnits={setSelectedUnits} />
        <button className="export-button" onClick={handleExport}>Eksportuj do Excela</button>
      </div>
    </div>
  );
}

export default App;

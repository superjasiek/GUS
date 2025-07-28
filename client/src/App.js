import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import UnitPicker from './components/UnitPicker';
import './App.css';

const API_URL = 'http://192.168.1.182:3001/api';

function App() {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [variables, setVariables] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/variables`).then(res => {
      setVariables(res.data);
      setSelectedCategories(Object.keys(res.data));
    });
  }, []);

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleExport = async () => {
    if (selectedUnits.length === 0) {
      alert('Wybierz co najmniej jedną jednostkę terytorialną.');
      return;
    }
    if (selectedCategories.length === 0) {
      alert('Wybierz co najmniej jedną kategorię.');
      return;
    }

    const dataToExport = [];

    for (const unit of selectedUnits) {
      const unitData = {
        name: unit.label,
        years: {}
      };

      for (const cat of selectedCategories) {
        const response = await axios.get(`${API_URL}/data?category=${cat}&unitId=${unit.value}`);
        const variableData = response.data.results;
        variableData.forEach(item => {
          item.values.forEach(val => {
            if (!unitData.years[val.year]) {
              unitData.years[val.year] = {};
            }
            unitData.years[val.year][cat] = val.val;
          });
        });
      }
      dataToExport.push(unitData);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dane');

    const columns = [
      { header: 'Jednostka terytorialna', key: 'unit', width: 30 },
      { header: 'Rok', key: 'year', width: 10 },
      ...selectedCategories.map(cat => ({ header: cat, key: cat, width: 15 }))
    ];
    worksheet.columns = columns;

    dataToExport.forEach(unitData => {
      for (const year in unitData.years) {
        worksheet.addRow({
          unit: unitData.name,
          year,
          ...unitData.years[year]
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
        <div className="category-picker">
          <h3>Kategorie</h3>
          {Object.keys(variables).map(cat => (
            <label key={cat} style={{ marginRight: '10px' }}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleCategoryToggle(cat)}
              />{' '}
              {cat}
            </label>
          ))}
        </div>
        <button className="export-button" onClick={handleExport}>Eksportuj do Excela</button>
      </div>
    </div>
  );
}

export default App;

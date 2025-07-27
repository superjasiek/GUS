import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';

const API_URL = 'http://192.168.1.182:3001/api';

const VARIABLES = {
  'ludnosc': '60618',
  'zgony': '6581',
  'migracje': '80122'
};

const LEVELS = [
  { id: 0, name: 'Polska' },
  { id: 1, name: 'Makroregion' },
  { id: 2, name: 'Województwo' },
  { id: 3, name: 'Region' },
  { id: 4, name: 'Podregion' },
  { id: 5, name: 'Powiat' },
  { id: 6, name: 'Gmina' }
];

function App() {
  const [units, setUnits] = useState({});
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [parentUnit, setParentUnit] = useState(null);

  useEffect(() => {
    let url = `${API_URL}/units?level=${selectedLevel}`;
    if (parentUnit) {
      url += `&parentId=${parentUnit}`;
    }
    axios.get(url)
      .then(response => {
        setUnits(prevUnits => ({ ...prevUnits, [selectedLevel]: response.data.results }));
      })
      .catch(error => {
        console.error('Error fetching units:', error);
      });
  }, [selectedLevel, parentUnit]);

  const handleLevelChange = (event) => {
    setSelectedLevel(parseInt(event.target.value));
    setParentUnit(null);
  };

  const handleParentUnitChange = (event) => {
    setParentUnit(event.target.value);
    setSelectedLevel(selectedLevel + 1);
  };

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
      <div>
        <label>Poziom: </label>
        <select onChange={handleLevelChange} value={selectedLevel}>
          {LEVELS.map(level => (
            <option key={level.id} value={level.id}>{level.name}</option>
          ))}
        </select>
      </div>
      {selectedLevel > 0 && (
        <div>
          <label>Jednostka nadrzędna: </label>
          <select onChange={handleParentUnitChange}>
            <option value="">-- Wybierz --</option>
            {units[selectedLevel - 1]?.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label>Jednostki: </label>
        <select multiple onChange={handleUnitChange}>
          {units[selectedLevel]?.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>
      </div>
      <br /><br />
      <button onClick={handleExport}>Eksportuj do Excela</button>
    </div>
  );
}

export default App;

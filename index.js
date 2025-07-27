const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ExcelJS = require('exceljs');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

ipcMain.on('export-to-excel', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Zapisz plik Excel',
    defaultPath: path.join(app.getPath('documents'), 'dane_bdl.xlsx'),
    filters: [
      { name: 'Pliki Excel', extensions: ['xlsx'] }
    ]
  });

  if (filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dane');

    worksheet.columns = [
      { header: 'Jednostka terytorialna', key: 'unit', width: 30 },
      { header: 'Rok', key: 'year', width: 10 },
      { header: 'Liczba ludności', key: 'ludnosc', width: 15 },
      { header: 'Zgony', key: 'zgony', width: 15 },
      { header: 'Migracje zagraniczne', key: 'migracje', width: 20 }
    ];

    data.forEach(unitData => {
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

    await workbook.xlsx.writeFile(filePath);
    dialog.showMessageBox({
      title: 'Eksport zakończony',
      message: `Dane zostały pomyślnie wyeksportowane do pliku ${filePath}`
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

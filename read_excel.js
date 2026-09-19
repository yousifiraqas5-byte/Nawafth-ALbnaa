const XLSX = require('xlsx');
const filePath = 'c:/Users/hp/Downloads/Al-Fedhalyia medical  222 Final - 180.000.000.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length > 0) {
        console.log('COLUMNS:', JSON.stringify(data[0]));
        console.log('SAMPLE_ROW:', JSON.stringify(data[1]));
        console.log('DATA_COUNT:', data.length - 1);
        
        // Output all data to a JSON file for later use in script.js
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const fs = require('fs');
        fs.writeFileSync('medical_devices.json', JSON.stringify(jsonData, null, 2));
        console.log('SUCCESS: medical_devices.json created');
    } else {
        console.log('ERROR: Sheet is empty');
    }
} catch (error) {
    console.error('ERROR reading excel:', error.message);
}

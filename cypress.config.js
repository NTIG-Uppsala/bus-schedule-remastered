import { defineConfig } from 'cypress';
import * as XLSX from 'xlsx/xlsx.mjs';
import * as fs from 'fs';
import * as path from 'path';

XLSX.set_fs(fs);

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        convertXlsxToJson( filePath ) {
          const workbook = XLSX.readFile(filePath);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          const fileName = path.basename(filePath, '.xlsx');
          const jsonFilePath = `./cypress/fixtures/${fileName}.json`;
          fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
          return null;
        },
      })
    },
    baseUrl: 'http://localhost:8080/NtiBusScreen/'
  },
  projectId: 'q783gb'
});

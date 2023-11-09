import { google } from 'googleapis';
import fs from 'fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import * as path from 'path';
XLSX.set_fs(fs);

async function downloadFile() {
    return new Promise((resolve, reject) => {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'credentials.json',
            scopes: 'https://www.googleapis.com/auth/drive',
        });

        const drive = google.drive({ version: 'v3', auth: auth });

        const fileId = '1XW0cmrudu_FTS7BwioJpQsrJeMvYy6J3tYoabZkbcKY';
        const dest = fs.createWriteStream('data/busdata.xlsx');

        drive.files.export({ fileId, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, { responseType: 'stream' })
            .then(res => {
                res.data
                    .on('end', () => {
                        console.log('Done downloading file.');
                    })
                    .on('error', err => {
                        console.error('Error downloading file.');
                        reject(err);
                    })
                    .pipe(dest)
                    .on('finish', () => {
                        resolve();
                    });
            });
    });
}
async function main() {
    await downloadFile();

    const workbook = XLSX.readFile("data/busdata.xlsx");
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const fileName = path.basename("busdata", '.xlsx');
    const jsonFilePath = `./cypress/fixtures/${fileName}.json`;
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
}

main().catch(console.error);
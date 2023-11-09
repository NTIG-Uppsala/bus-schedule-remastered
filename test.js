import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import * as creds from 'credentials.json';

const jwt = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ]
});

const drive = google.drive({ version: 'v3', auth: jwt });

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
      })
      .pipe(dest);
  });
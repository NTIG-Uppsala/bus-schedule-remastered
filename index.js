import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import express from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { google } from "googleapis";




const app = express();
const PORT = 8080;
dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const release = process.env.NODE_ENV === 'production';

// FIX: Handle possible missing files when using fs.readFileSync on config
// files
// Config for buses and stops
const config = JSON.parse(fs.readFileSync('./config.json'));

// Config for GTFS import
let gtfsConfig;
if (release == true) {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_rel_config.json'));
    // FIX: Handle missing API key
    gtfsConfig.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
} else {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));
}

const maxStopTimes = 100;
const maxImportTries = 5;

let importSuccess = false;

async function importData() {
    // TODO: Add gtfsConfig as input param
    for (let i = 0; i < maxImportTries; i++) {
        try {
            // Import GTFS data into the database
            if (!fs.existsSync(gtfsConfig.sqlitePath)) {
                await gtfs.importGtfs(gtfsConfig);
            }
            await gtfs.openDb(gtfsConfig);
            importSuccess = true;
            console.log(`Data imported successfully in ${i + 1} tries`);
        } catch (err) {
            console.error(err);
        }
        if (importSuccess) {
            break;
        }
    }
}
// Call importData to open the database connection
importData();
app.get('/test/', async (req, res) => {

    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();

    const googleSheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = "1XW0cmrudu_FTS7BwioJpQsrJeMvYy6J3tYoabZkbcKY";

    const metaData = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    });

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "sheet1!A2:C5",
    });
    const result9 = getRows.data;

    try {
        // 3:an
        const result1 = await getStoptimesWithHeadsign("9022003700021002", "Östra Gottsunda");
        const result2 = await getStoptimesWithHeadsign("9022003700021001", "Nyby");
        // 8:an
        const result3 = await getStoptimesWithHeadsign("9022003700021002", "Sunnersta");
        const result4 = await getStoptimesWithHeadsign("9022003700021001", "Ärna");
        // 11: an
        const result5 = await getStoptimesWithHeadsign("9022003700021002", "Vårdsätra Gottsunda");
        const result6 = await getStoptimesWithHeadsign("9022003700021001", "Fyrislund");
        // 12:an
        const result7 = await getStoptimesWithHeadsign("9022003700021002", "Ulleråker Ultuna");
        const result8 = await getStoptimesWithHeadsign("9022003700021001", "Eriksberg Flogsta Stenhagen");


        res.json({ results: [result1, result2, result3, result4, result5, result6, result7, result8, result9] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


    async function getStoptimesWithHeadsign(stopId, headsign) {
        return new Promise((resolve, reject) => {
            let getBuss = gtfs.getStoptimes({
                stop_id: stopId, stop_headsign: headsign
            });
            let allbusses = [];


            const bussSorting = getBuss
                .map(item => ({ arrivalTime: item.arrival_time }));

            allbusses.push(...bussSorting);


            allbusses.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));

            const currentTime = moment();
            const nextArrival = allbusses.find(item => moment(item.arrivalTime, 'HH:mm:ss').isAfter(currentTime));
            if (nextArrival) {
                resolve({ nextArrivalTime: nextArrival.arrivalTime, stop_headsign: headsign });
            }
        });
    };
});



app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
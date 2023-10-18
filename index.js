import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import express, { response } from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { google } from "googleapis";
const app = express();
const PORT = 8080;
const maxImportTries = 5;
let importSuccess = false;
dotenv.config();

// Does nothing ATM.
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
// 
const release = process.env.NODE_ENV === 'production';

// Config for GTFS import
let gtfsConfig;
if (release == true) {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_rel_config.json'));
    gtfsConfig.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
} else {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));
}


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
app.get('/NTIBusScreen/', async (req, res) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = "1XW0cmrudu_FTS7BwioJpQsrJeMvYy6J3tYoabZkbcKY";
    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "sheet1!B2:D100",
    });
    const sheetInput = getRows.data["values"];

    let stopidList = [];
    let headsignList = [];

    async function getInfoFromSheet() {
        const result = [];

        for (let i = 0; i < sheetInput.length; i++) {
            const sheetStopName = sheetInput[i][0];
            let direction = sheetInput[i][1];
            const headsign = sheetInput[i][2];

            const getAllstops = gtfs.getStops();
            const foundStop = getAllstops.find(item => item.stop_name === sheetStopName && item.platform_code === direction);

            if (foundStop) {
                stopidList.push(foundStop.stop_id);
                headsignList.push(headsign);
                sheetInput.push(sheetStopName);

            }
        }

        for (let i = 0; i < stopidList.length; i++) {
            const stopId = stopidList[i];
            const headsign = headsignList[i];
            const stopName = sheetInput[i][0];
            const respone = await getStoptimesWithHeadsign(stopId, headsign);
            result.push({ stopId, stopName, headsign, ...respone });
        }

        res.json(result);
    }

    getInfoFromSheet();

    async function getStoptimesWithHeadsign(stopId, headsign) {
        const getBuss = gtfs.getStoptimes({
            stop_id: stopId,
            stop_headsign: headsign
        });
        let allBusses = [];

        const bussSorting = getBuss.map(item => ({ arrivalTime: item.arrival_time }));
        allBusses.push(...bussSorting);

        allBusses.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));

        const currentTime = moment();
        const nextArrival = allBusses.find(item => moment(item.arrivalTime, 'HH:mm:ss').isAfter(currentTime));

        if (nextArrival) {
            return { nextArrivalTime: nextArrival.arrivalTime };
        } else {
            return null; // Or some default value when no next arrival is found
        }
    }
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
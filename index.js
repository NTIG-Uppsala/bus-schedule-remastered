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

// Config for GTFS import
let gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));

async function importData() {
    // Tries to import, if it fails it will try again until it succeeds or maxImportTries is reached
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

importData();

app.get('/NTIBusScreen/', async (req, res) => {
    // Accesses the google sheet for admins to add stops and headsigns
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

    let stopIdList = [];
    let headsignList = [];

    async function getInfoFromSheet() {
        const result = [];
        // Loops for each cell in google sheet
        for (let i = 0; i < sheetInput.length; i++) {
            const sheetStopName = sheetInput[i][0];
            let direction = sheetInput[i][1];
            const headsign = sheetInput[i][2];
            const getAllstops = gtfs.getStops(); // Gets all stops from GTFS
            // Searches for the stop name and direction in GTFS
            const foundStop = getAllstops.find(item => item.stop_name === sheetStopName && item.platform_code === direction);
            // If the stop is found, it will add the stop_id to a list
            if (foundStop) {
                stopIdList.push(foundStop.stop_id);
                headsignList.push(headsign);
                sheetInput.push(sheetStopName);

            }
        }
        // Loops for each stop in the list and pushes it to the result array
        for (let i = 0; i < stopIdList.length; i++) {
            const stopId = stopIdList[i];
            const headsign = headsignList[i];
            const stopName = sheetInput[i][0];
            const respone = await getStoptimesWithHeadsign(stopId, headsign);
            result.push({ stopId, stopName, headsign, ...respone });
        }
        //prints the result array to the screen
        res.json(result);
    }
    getInfoFromSheet();

    // Gets the next arrival time for a specific stop and headsign
    async function getStoptimesWithHeadsign(stopId, headsign) {
        const getBuss = gtfs.getStoptimes({
            stop_id: stopId,
            stop_headsign: headsign
        });
        let allBusses = [];
        // Loops for each bus and pushes the arrival time to a list and sorts it to the nearest arrival time
        const bussSorting = getBuss.map(item => ({ arrivalTime: item.arrival_time }));
        allBusses.push(...bussSorting);
        allBusses.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
        // Gets current time and finds the next arrival time
        const currentTime = moment();
        const nextArrival = allBusses.find(item => moment(item.arrivalTime, 'HH:mm:ss').isAfter(currentTime));
        // Returns the next arrival time
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
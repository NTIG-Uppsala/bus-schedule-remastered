import * as fs from 'fs';
import express from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { google } from "googleapis";

const app = express();
const PORT = 8080;
const maxImportTries = 5;
let importSuccess = false;
dotenv.config();
let gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));

// This function attempts to import GTFS data and retries up to 'maxImportTries' times.
async function importData() {
    for (let i = 0; i < maxImportTries; i++) {
        try {
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
    try {
        // Accesses the Google Sheet for admins to add stops and headsigns
        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: client });
        const spreadsheetId = "1XW0cmrudu_FTS7BwioJpQsrJeMvYy6J3tYoabZkbcKY";
        
        // Fetch data from the Google Sheet
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "sheet1!B2:D100",
        });
        const sheetInput = getRows.data["values"];

        // Create a function to get all bus stops and headsigns
        async function getAllBusStopsAndHeadsigns() {
            const result = [];
            for (let i = 0; i < sheetInput.length; i++) {
                const sheetStopName = sheetInput[i][0];
                let direction = sheetInput[i][1];
                const headsign = sheetInput[i][2];
                const getAllstops = gtfs.getStops();
                
                // Search for the stop name and direction in GTFS
                const foundStop = getAllstops.find(item => item.stop_name === sheetStopName && item.platform_code === direction);
                
                // If the stop is found, add the stop_id to the result array
                if (foundStop) {
                    result.push({ stopId: foundStop.stop_id, stopName: sheetStopName, headsign });
                }
            }
            return result;
        }

        // Create a function to get bus times for a specific stop and headsign
        async function getStoptimesWithHeadsign(stopId, headsign) {
            const getBuss = gtfs.getStoptimes({
                stop_id: stopId,
                stop_headsign: headsign
            });
        
            const currentTime = moment();
            const upcomingBusses = [];
            const addedTimes = new Set(); // To store unique times
        
            for (let i = 0; i < getBuss.length; i++) {
                const arrivalTime = moment(getBuss[i].arrival_time, 'HH:mm:ss');
                const timeKey = arrivalTime.format('HH:mm:ss');
        
                if (arrivalTime.isAfter(currentTime) && !addedTimes.has(timeKey)) {
                    addedTimes.add(timeKey);
                }
            }
        
            // Sort unique times and keep the closest 5
            const sortedTimes = Array.from(addedTimes).filter(time => moment(time, 'HH:mm:ss').isAfter(currentTime)).sort();
            const closestTimes = sortedTimes.slice(0, 5);
        
            // Add the closest times to upcomingBusses
            closestTimes.forEach(timeKey => {
                upcomingBusses.push({ arrivalTime: timeKey });
            });
        
            return upcomingBusses;
        }

        const busStopsAndHeadsigns = await getAllBusStopsAndHeadsigns();
        const busTimesPromises = busStopsAndHeadsigns.map(async (stop) => {
            const { stopId, headsign } = stop;
            const response = await getStoptimesWithHeadsign(stopId, headsign);
            return { ...stop, upcomingBusses: response };
        });

        const busTimes = await Promise.all(busTimesPromises);
        res.json(busTimes);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving bus times');
    }
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
s
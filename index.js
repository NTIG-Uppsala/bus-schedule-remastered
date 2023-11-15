import * as fs from 'fs';
import express from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { google } from "googleapis";

const app = express();
const PORT = 8080;
const maxImportTries = 3;
const numberOfUpcomingbuses = 2;
let importSuccess = false;
dotenv.config();

// Checking in .env file if NODE_ENV === 'production'
const release = process.env.NODE_ENV === 'production';

// Config for GTFS import
let gtfsConfig;
if (release == true) {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_rel_config.json'));
    gtfsConfig.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
} else {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));

}

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



app.get('/NTIBusScreen/:date?', async (req, res) => {
    try {
        // Accesses the Google Sheet for admins to add stops and headsigns
        const auth = new google.auth.GoogleAuth({
            keyFile: 'credentials.json',
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: client });
        const spreadsheetId = "1XW0cmrudu_FTS7BwioJpQsrJeMvYy6J3tYoabZkbcKY";

        // Fetch data from the Google Sheet
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            // Fetching the data from the following range, and only uses the cells with values in them.
            range: "sheet1!B2:D100",
        });
        const sheetInput = getRows.data["values"];

        let currentTime;

        if (req.params.date === undefined) {
            currentTime = moment();
        } else {
            currentTime = moment(req.params.date);
        }

        const getDates = gtfs.getTripsDatedVehicleJourneys({
            operating_day_date: currentTime.format('YYYYMMDD'),
        },['trip_id']);
        const allTripsToday = getDates.map(function(item){
            return item.trip_id;
        });
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
            const getBus = gtfs.getStoptimes({
                stop_id: stopId,
                stop_headsign: headsign
            });

            let currentTime;
            const upcomingBusses = [];
            const addedTimes = new Set(); // Set to keep unique times and be able to print them in order
            if (req.params.date === undefined) {
                currentTime = moment();
            } else {
                currentTime = moment(req.params.date);
            }

            for (let i = 0; i < getBus.length; i++) {
                const arrivalTime = moment(currentTime).set('hour', getBus[i].arrival_time.split(":")[0]).set('minute', getBus[i].arrival_time.split(":")[1]);
                // skips buses that are not running today 
                if (!allTripsToday.includes(getBus[i].trip_id) && (!getBus[i].stop_headsign === "Eriksberg Flogsta Stenhagen" || !getBus[i].stop_headsign === "Ultuna")) {
                    continue;
                }
                
                const timeKey = arrivalTime.format('HH:mm:ss');
                // checks if time has already beeb added
                if (arrivalTime.isAfter(currentTime) && !addedTimes.has(timeKey)) {
                    addedTimes.add(timeKey);
                }
            }

            // Sort unique times and keep 'numberOfUpcomingBusses' of the closest times
            const sortedTimes = Array.from(addedTimes).filter(time => moment(currentTime).set('hour', time.split(":")[0]).set('minute', time.split(":")[1]).isAfter(currentTime)).sort();
            const closestTimes = sortedTimes.slice(0, numberOfUpcomingBusses);
            // Sort unique times and keep 'numberOfUpcomingbuses' of the closest times
            const closestTimes = sortedTimes.slice(0, numberOfUpcomingbuses);

            // Add the closest times to upcomingBusses
            closestTimes.forEach(timeKey => {
                upcomingBusses.push({ arrivalTime: timeKey });
                upcomingbuses.push({ arrivalTime: timeKey });
            });

            return upcomingBusses;
            return upcomingbuses;
        }

        const busStopsAndHeadsigns = await getAllBusStopsAndHeadsigns();
        const busTimesPromises = busStopsAndHeadsigns.map(async (stop) => {
            const { stopId, headsign } = stop;
            const response = await getStoptimesWithHeadsign(stopId, headsign);
            return { ...stop, upcomingBusses: response};
            return { ...stop, upcomingbuses: response};
        });

        const busTimes = await Promise.all(busTimesPromises);
        let busTimeList = []
        for (let bus = 0;bus <= busTimes.length-1; bus++) {
            busTimeList.push(JSON.stringify(busTimes[bus]) + "<br>" + "<br>")
        };
        res.send("<html>"+ busTimeList + "</html>");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving bus times');
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Listening on http://127.0.0.1:${PORT}/NTIBusScreen/`);
});
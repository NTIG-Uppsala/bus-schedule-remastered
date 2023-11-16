import * as fs from 'fs';
import express from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { google } from "googleapis";
import GtfsRealtime from './node_modules/gtfs-realtime/lib/gtfs-realtime.js';


const app = express();
const PORT = 8080;
const maxImportTries = 3;
const numberOfUpcomingBuses = 2;
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

async function updateRealTimeData() {
    const config = {
        url: 'https://opendata.samtrafiken.se/gtfs-rt/ul/TripUpdates.pb?key=' + process.env.REALTIME_API_KEY,
        output: './realTimeData.json',
        
    };
    
    GtfsRealtime(config);
}

updateRealTimeData();

app.get('/NTIBusScreen/:date?', async (req, res) => {
    try {
        await updateRealTimeData();
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

        const getDates = gtfs.getCalendarDates({
            date: currentTime.format('YYYYMMDD'),
        },['service_id']);
        const allTripsToday = getDates.map(function(item){
            return item.service_id;
        });
        const trips = gtfs.getTrips({}, ['service_id', 'trip_id']);
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
                    result.push({ stopId: foundStop.stop_id, stopName: sheetStopName, headsign});
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
            const addedTimes = new Set(); // Set to keep unique times and be able to print them in order

            for (let i = 0; i < getBus.length; i++) {
                for (let y = 0; y < trips.length; y++) {
                    if (trips[y].trip_id === getBus[i].trip_id) {
                        getBus[i].service_id = trips[y].service_id;
                    }
                }
                // skips buses that are not running today 
                if (!allTripsToday.includes(getBus[i].service_id)) {
                    continue;
                }
                
                const arrivalTime = moment(currentTime).set('hour', getBus[i].arrival_time.split(":")[0]).set('minute', getBus[i].arrival_time.split(":")[1]).set('second', getBus[i].arrival_time.split(":")[2]);
                const timeKey = arrivalTime.format('HH:mm:ss');
                // checks if time has already beeb added
                if (arrivalTime.isAfter(currentTime) && !addedTimes.has(timeKey)) {
                    addedTimes.add(timeKey);
                }
            }

            // Sort unique times and keep 'numberOfUpcomingBuses' of the closest times
            const sortedTimes = Array.from(addedTimes).filter(time => moment(currentTime).set('hour', time.split(":")[0]).set('minute', time.split(":")[1]).set('second', time.split(":")[2]).isAfter(currentTime)).sort();
            const closestTimes = sortedTimes.slice(0, numberOfUpcomingBuses);

            // Add the closest times to upcomingBuses
            const upcomingBuses = [];
            closestTimes.forEach(timeKey => {
                upcomingBuses.push({ arrivalTime: timeKey });
            });
            return upcomingBuses;
        }

        const busStopsAndHeadsigns = await getAllBusStopsAndHeadsigns();
        const busTimesPromises = busStopsAndHeadsigns.map(async (stop) => {
            const { stopId, headsign } = stop;
            const response = await getStoptimesWithHeadsign(stopId, headsign);
            return { ...stop, upcomingBuses: response};
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
import * as fs from 'fs';
import express from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { google } from "googleapis";
import GtfsRealtime from './node_modules/gtfs-realtime/lib/gtfs-realtime.js';
import cron from 'node-cron';
import ejs from 'ejs';



const app = express();
const PORT = 8080;
const numberOfUpcomingBuses = 2;
dotenv.config();

// Checking in .env file if NODE_ENV === 'production'
const release = process.env.NODE_ENV === 'production';

// Function to get GTFS configuration
function getStaticData() {
    const config = release ? JSON.parse(fs.readFileSync('./gtfs_rel_config.json')) : JSON.parse(fs.readFileSync('./gtfs_test_config.json'));
    if (release) {
        config.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
    }
    return config;
}

// Function to get real-time data file path
function getRealTimeDataFile() {
    return release ? ".realTimeData.json" : "./data/realTimeTestData.json";
}

// Usage
let gtfsConfig = getStaticData();
const realTimeDataFile = getRealTimeDataFile();

async function importGtfsData() {
    try {
        if (!fs.existsSync(gtfsConfig.sqlitePath) && !release) {
            await gtfs.importGtfs(gtfsConfig);
        } else if (release) {
            await gtfs.importGtfs(gtfsConfig);
        }
        await gtfs.openDb(gtfsConfig);
        console.log('Data imported successfully');
    } catch (err) {
        console.error(err);
    }
}

// Usage
await importGtfsData();

// Schedule a cron job to run the getStaticData function every day at 07:00
cron.schedule('0 7 * * *', async () => {
    gtfsConfig = getStaticData();
    await importGtfsData();
});


async function updateRealTimeData() {
    if (release) {
        const config = {
            url: 'https://opendata.samtrafiken.se/gtfs-rt/ul/TripUpdates.pb?key=' + process.env.REALTIME_API_KEY,
            output: './realTimeData.json',
        };

        GtfsRealtime(config);
    }
}

updateRealTimeData();

app.use(express.static('public'));
app.set('view engine', 'ejs');

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
            range: "sheet1!A2:D100",
        });
        const sheetInput = getRows.data["values"];

        let currentTime;

        if (req.params.date === undefined) {
            currentTime = moment();
        } else {
            currentTime = moment(req.params.date);
        }

        //Gets the service_id for of the buses running today
        const getBusScheduleDates = gtfs.getCalendarDates({
            date: currentTime.format('YYYYMMDD'),
        }, ['service_id']);
        const allTripsToday = getBusScheduleDates.map(function (item) {
            return item.service_id;
        });
        // Create a function to get all bus stops and headsigns
        async function getAllBusStopsAndHeadsigns() {
            const result = [];
            for (let i = 0; i < sheetInput.length; i++) {
                const busNumber = sheetInput[i][0];
                const sheetStopName = sheetInput[i][1];
                const direction = sheetInput[i][2];
                const headsign = sheetInput[i][3];
                const getAllstops = gtfs.getStops();

                // Search for the stop name and direction in GTFS
                const foundStop = getAllstops.find(item => item.stop_name === sheetStopName && item.platform_code === direction);
                // If the stop is found, add the stop_id to the result array
                if (foundStop) {
                    result.push({ stopId: foundStop.stop_id, stopName: sheetStopName, headsign, busNumber });
                }
            }
            return result;
        }

        // Function to check if the schedule is canceled for a given tripId
        function isScheduleCanceled(tripId) {
            const realTimeData = JSON.parse(fs.readFileSync(realTimeDataFile));
            const tripUpdate = realTimeData.entity.find(entity => entity.tripUpdate.trip.tripId === tripId);
            return tripUpdate && tripUpdate.tripUpdate.trip.scheduleRelationship === "CANCELED";
        }

        // Create a function to get bus times for a specific stop and headsign
        async function getStoptimesWithHeadsign(stopId, headsign) {
            const getBus = gtfs.getStoptimes({
                stop_id: stopId,
                stop_headsign: headsign
            });
            let changedBuses = [];
            const addedTimes = new Set(); // Set to keep unique times and be able to print them in order
            const trips = gtfs.getTrips({}, ['service_id', 'trip_id']);
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
                // checks if time has already been added or canceled
                if (arrivalTime.isAfter(currentTime) && !addedTimes.has(timeKey) && !isScheduleCanceled(getBus[i].trip_id)) {


                    // Find the corresponding real-time data for the current trip
                    const tripId = getBus[i].trip_id;
                    const realTimeData = JSON.parse(fs.readFileSync(realTimeDataFile));
                    const tripUpdate = realTimeData.entity.find(entity => entity.tripUpdate.trip.tripId === tripId);

                    if (tripUpdate) {
                        // Get the departure delay for the specified stopId
                        const stopUpdate = tripUpdate.tripUpdate.stopTimeUpdate.find(stopUpdate => stopUpdate.stopId === stopId);

                        if (stopUpdate) {
                            const departureDelay = stopUpdate.departure.delay;
                            // Adjust the arrival time based on the departure delay
                            arrivalTime.add(departureDelay, 'seconds');
                            getBus[i].departureTime = arrivalTime.format('HH:mm:ss');
                            addedTimes.add(getBus[i].departureTime)
                            changedBuses.push(getBus[i].trip_id);
                        }
                    } else {
                        addedTimes.add(timeKey);

                    }
                }
            }
            // Sort unique times and keep 'numberOfUpcomingBuses' of the closest times
            const sortedTimes = Array.from(addedTimes).filter(time => moment(currentTime).set('hour', time.split(":")[0]).set('minute', time.split(":")[1]).set('second', time.split(":")[2]).isAfter(currentTime)).sort();
            const closestTimes = sortedTimes.slice(0, numberOfUpcomingBuses);

            const upcomingBuses = closestTimes.map(timeKey => {
                const busInfo = { departureTime: timeKey };
                if (changedBuses > 0) {
                    const businformation = getBus.find(bus => moment(currentTime).set('hour', bus.arrival_time.split(":")[0]).set('minute', bus.arrival_time.split(":")[1]).set('second', bus.arrival_time.split(":")[2]).format('HH:mm:ss') === timeKey && changedBuses.includes(bus.trip_id));
                    if (businformation !== undefined) {
                        if (businformation.departureTime !== undefined) {
                            busInfo.departureTime = businformation.departureTime;
                        }
                    } else {
                        return busInfo
                    }
                }
                return busInfo;
            });
            return upcomingBuses;
        }



        const busStopsAndHeadsigns = await getAllBusStopsAndHeadsigns();
        const busTimesPromises = busStopsAndHeadsigns.map(async (stop) => {
            const { stopId, headsign } = stop;
            const response = await getStoptimesWithHeadsign(stopId, headsign);
            return { ...stop, upcomingBuses: response };
        });

        const busTimes = await Promise.all(busTimesPromises);
        let busTimeList = []
        for (let bus = 0; bus <= busTimes.length - 1; bus++) {
            busTimeList.push(busTimes[bus])
        };
        res.render('index', { busTimeList, currentTime });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving bus times');
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Listening on http://127.0.0.1:${PORT}/NTIBusScreen/`);
});
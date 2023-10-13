import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import express from 'express';
const app = express();
const PORT = 8080;

import * as gtfs from 'gtfs';

import * as dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const release = process.env.NODE_ENV === 'production';

// FIX: Handle possible missing files when using fs.readFileSync on config
// files

// Config for buses and stops
const config = JSON.parse(fs.readFileSync('./config.json'));

// Config for GTFS import
let gtfsConfig;
if (release || true) {  //FIXA FFS!!!!
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
    const test = gtfs.getTrips({ route_id: "9011003001100000", service_id: 11, direction_id: 0 })
    // console.log(test[0].trip_id)

    const stoptimes = gtfs.getStoptimes({
        trip_id: "33010000187647595",
    });
    for (let stoptime in stoptimes) {
        let stopNum = "9022003700021001";
        // console.log(stoptimes)
        if (stoptime["stop_id"] == stopNum) {
            // console.log(stops[0].arrival_time)
            console.log(stoptime["arrival_time"])
        } else { console.log("else") };
    };
    const stops = gtfs.getStops({
        stop_id: '9022003700021001',
    });
    
    try {
    const routes = await gtfs.getRoutes();
    const trips = await gtfs.getTrips(
    { route_id: "9011003013500000", direction_id: 0 });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
    function getStopTimes(stopId, routeId, serviceId) {
        const tripIds = gtfs.getTrips({ route_id: routeId, service_id: serviceId, direction_id: 0 })

        const allStopTimes = [];

        tripIds.forEach((tripId) => {
            const stopTimes = gtfs.getStoptimes({ trip_id: tripId["trip_id"], stop_id: stopId });

            const matchingStopTimes = stopTimes
                .filter(item => item.stop_id === stopId)
                .map(item => item.arrival_time);

            allStopTimes.push(...matchingStopTimes);

        });
        allStopTimes.sort((a, b) => a.localeCompare(b));

        res.json(allStopTimes);
    };
    getStopTimes("9022003700021001", "9011003001100000", "11");
});


app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

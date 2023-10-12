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
    const get_tripId = gtfs.getTrips({ route_id: "9011003001100000", service_id: 11, direction_id: 0 })

    get_tripId.forEach((tripId) => {
        let stopNum = "9022003700021001";
        const get_stopTimes = gtfs.getStoptimes({ trip_id: tripId["trip_id"], stop_id: stopNum });


        const matchingStopTimes = get_stopTimes
            .filter(item => item.stop_id === stopNum)
            .map(item => item.arrival_time);

        matchingStopTimes.forEach(time => {
            console.log(`Arrival Time: ${time}`)
            console.log(matchingStopTimes)
        });
    });
});
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

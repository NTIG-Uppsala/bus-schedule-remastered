import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import express from 'express';
const app = express();
const PORT = 8080;
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';
import moment from 'moment';
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
    try {
        const result1 = await getStoptimesWithHeadsign("9022003700021002", "Sunnersta");

        res.json({ results: [result1] });
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
            console.log(allbusses);

            const currentTime = moment();
            const nextArrival = allbusses.find(item => moment(item.arrivalTime, 'HH:mm:ss').isAfter(currentTime));
            if (nextArrival) {
                resolve({ nextArrivalTime: nextArrival.arrivalTime, stop_headsign: headsign });
            }
        });
    };
});




//     try {
//         const result1 = await getStopTimes("9022003700021001", "Sunnersta", "8");
//         const result2 = await getStopTimes("9022003700021001", "Sunnersta", "8");

//         res.json({ results: [result1, result2] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }


// async function getStopTimes(stopId, headsign, serviceId) {
//     return new Promise((resolve, reject) => {
//         const tripIds = gtfs.getTrips({ trip_headsign: headsign, service_id: serviceId, direction_id: 0 });
//         const allStopTimes = [];

//         tripIds.forEach((tripId) => {
//             const stopTimes = gtfs.getStoptimes({ trip_id: tripId["trip_id"], stop_id: stopId });

//             const matchingStopTimes = stopTimes
//                 .filter(item => item.stop_id === stopId)
//                 .map(item => ({ tripId: tripId["trip_id"], arrivalTime: item.arrival_time }));

//             allStopTimes.push(...matchingStopTimes);
//         });

//         allStopTimes.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));

//         const currentTime = moment();
//         const nextArrival = allStopTimes.find(item => moment(item.arrivalTime, 'HH:mm:ss').isAfter(currentTime));

//         if (nextArrival) {
//             resolve({ service_id: serviceId, nextArrivalTime: nextArrival.arrivalTime, routeId: routeId });
//         } else {
//             resolve({ nextArrivalTime: "No more buses today", nextTripId: null });
//         }
//     });
// }





app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
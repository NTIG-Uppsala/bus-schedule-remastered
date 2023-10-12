import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import express from 'express';
import * as gtfs from 'gtfs';
import * as dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = express();
const PORT = 8080;

const release = process.env.NODE_ENV === 'production';

// Config for buses and stops
let config;
try {
  config = JSON.parse(fs.readFileSync('./config.json'));
} catch (err) {
  console.error('Error reading config file:', err);
  process.exit(1); // Exit the application on config file error
}

// Config for GTFS import
let gtfsConfig;
if (release) {
  gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_rel_config.json'));
  gtfsConfig.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
} else {
  gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));
}

const maxImportTries = 5;

async function importData() {
  for (let i = 0; i < maxImportTries; i++) {
    try {
      if (!fs.existsSync(gtfsConfig.sqlitePath)) {
        await gtfs.import(gtfsConfig);
      }
      await gtfs.openDb(gtfsConfig);
      console.log(`Data imported successfully in ${i + 1} tries`);
      return; // Exit the loop if import is successful
    } catch (err) {
      console.error(err);
    }
  }
  console.error('Failed to import data after multiple attempts');
  process.exit(1); // Exit the application on import failure
}

// Call importData to open the database connection
importData();

app.get('/test/', async (req, res) => {
<<<<<<< Updated upstream
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
=======
  try {
    const routes = await gtfs.getRoutes();
    const trips = await gtfs.getTrips(
    { route_id: "9011003013500000", direction_id: 0 });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
>>>>>>> Stashed changes
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

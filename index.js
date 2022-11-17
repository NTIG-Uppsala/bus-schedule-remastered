import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import express from 'express';
const app = express();
const PORT = 8000;

import * as gtfs from 'gtfs';

import * as dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const release = process.env.NODE_ENV === 'production';

// FIX: Handle possible missing files when using fs.readFileSync on config
//        files

// Config for buses and stops
const config = JSON.parse(fs.readFileSync('./config.json'));

// Config for GTFS import
let gtfsConfig;
if (release) {
  gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_rel_config.json'));
  // FIX: Handle missing API key
  gtfsConfig.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
} else {
  gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));
}

const maxStopTimes = 100;
const maxImportTries = 5;

let importSuccess = false;

/**
 * Converts time as string to Date in sv-SE locale
 * @param {string} timeString time, as string in sv-SE format
 * @return {Date} current date with time set to given time
 */
function timeStringToDate(timeString) {
  const refDate = new Date();
  const date = new Date(`${refDate.toLocaleDateString('sv-SE')}` +
    `T${timeString}`);

  if (isNaN(date)) {
    return null;
  }
  return date;
}

/**
 * Imports data to a SQLite database, located at the given path.
 */
async function importData() {
  // TODO: Add gtfsConfig as input param
  for (let i = 0; i < maxImportTries; i++) {
    try {
      // Import GTFS data into database
      if (!fs.existsSync(gtfsConfig.sqlitePath)) {
        await gtfs.importGtfs(gtfsConfig);
      }
      await gtfs.openDb(gtfsConfig);
      importSuccess = true;
      console.log(`Data imported successfully in ${i+1} tries`);
    } catch (err) {
      console.error(err);
    }
    if (importSuccess) {
      break;
    }
  }

  if (!importSuccess) {
    const interval = setInterval(async () => {
      await importData();
      if (importSuccess) {
        clearInterval(interval);
      }
      importSuccess = false;
    }, 600000);
  }
  importSuccess = false;
}

/**
 * Schedules the next import at the specified time of day
 * @param {Number} timeString time of day to schedule at,
 *                            as string in sv-SE format
 */
async function scheduleImport(timeString) {
  // FIX: Check/handle if timeout is longer than maxTimeout
  // const maxTimeout = Math.pow(2, 31) - 1;
  const now = new Date();
  const importTime = timeStringToDate(timeString);

  let timeUntilImport; // in ms
  const timeDiff = now.getTime() - importTime.getTime();
  if (timeDiff <= 0) {
    timeUntilImport = Math.abs(timeDiff);
  } else {
    importTime.setDate(importTime.getDate() + 1);
    timeUntilImport = Math.abs(now.getTime() - importTime.getTime());
  }
  setTimeout(async () => {
    await importData();
    scheduleImport(timeString);
  }, timeUntilImport);
}

if (release) {
  await importData();
  await scheduleImport(config.static_data_import_time);
} else {
  await importData();
}

app.use(express.static(path.join(__dirname, 'public')));

// Static data retrieval
app.get('/static_data/:hh-:mm-:ss', async (req, res) => {
  // Check if time param input is valid
  const timeString = `${req.params.hh}:${req.params.mm}:${req.params.ss}`;
  if (!timeStringToDate(timeString)) {
    res.sendStatus(400);
    return;
  }

  // Get stop_ids from config
  const stopIdsList = [];
  for (const stop in config.stops) {
    if (config.stops.hasOwnProperty(stop)) {
      const stopIds = config.stops[stop].stop_ids;
      for (const stopId in stopIds) {
        if (stopIds.hasOwnProperty(stopId)) {
          stopIdsList.push(stopIds[stopId]);
        }
      }
    }
  }

  // Get route_ids from config
  const routeIdsList = [];
  for (const bus in config.buses) {
    if (config.buses.hasOwnProperty(bus)) {
      routeIdsList.push(config.buses[bus].route_id);
    }
  }

  // Get trip_ids using route_ids
  const tripIds = [];
  const trips = await gtfs.getTrips({'route_id': routeIdsList},
      ['route_id', 'trip_id']);
  for (const trip in trips) {
    if (trips.hasOwnProperty(trip)) {
      tripIds.push(trips[trip].trip_id);
    }
  }

  // Get stop times for trips in tripsIds at the stop_ids specified in
  // stopIdsList, where the departure_time is later or equal to the time
  // specified in date (the time given by the client)
  const stopTimes = await gtfs.runRawQuery(`SELECT stop_id, trip_id, ` +
    `departure_time FROM stop_times WHERE trip_id IN ` +
    `("${tripIds.join('", "')}") AND stop_id IN ` +
    `("${stopIdsList.join('", "')}") AND departure_time >= ` +
    `"${timeString}" ` +
    `ORDER BY departure_time ASC LIMIT ${maxStopTimes}`);

  // Create and send JSON response
  const response = [];
  for (const stopTime in stopTimes) {
    if (stopTimes.hasOwnProperty(stopTime)) {
      for (const trip in trips) {
        if (trips.hasOwnProperty(trip)) {
          if (trips[trip].trip_id = stopTimes[stopTime].trip_id) {
            response.push({
              'stop_id': stopTimes[stopTime].stop_id,
              'route_id': trips[trip].route_id,
              'departure_time': stopTimes[stopTime].departure_time,
            });
            break;
          }
        }
      }
    }
  }
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

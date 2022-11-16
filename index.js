import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import express from 'express';
const app = express();
const PORT = 8000;

import * as gtfs from 'gtfs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Reference date to use as a constant when creating timestamps
const referenceDate = new Date();

// Config for buses and stops
const config = JSON.parse(fs.readFileSync('./bus_config.json'));
// Config for GTFS import
const gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_config.json'));

const maxStopTimes = 100;

// Import GTFS data into database
if (!fs.existsSync('./data/gtfs.sqlite')) {
  await gtfs.importGtfs(gtfsConfig);
}
await gtfs.openDb(gtfsConfig);

app.use(express.static(path.join(__dirname, 'public')));

// Static data retrieval
app.get('/static_data/:hh-:mm-:ss', async (req, res) => {
  // Check if time param input is valid
  const time = `${req.params.hh}:${req.params.mm}:${req.params.ss}`;
  const date = new Date(`${referenceDate.getFullYear()}-` +
    `${referenceDate.getMonth()}-` +
    `${referenceDate.getDate()}` +
    `T${time}`);
  if (isNaN(date)) {
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
    `"${date.toLocaleTimeString('se-SV')}" ` +
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

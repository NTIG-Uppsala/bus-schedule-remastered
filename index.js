import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import express from 'express';
const app = express();
const PORT = 8000;

import * as gtfs from 'gtfs';

const refDate = new Date();

const config = JSON.parse(fs.readFileSync('./bus_config.json'));
const gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_config.json'));

const maxStopTimeFetchCount = 100;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

if (!fs.existsSync('./data/gtfs.sqlite')) {
  await gtfs.importGtfs(gtfsConfig);
}
await gtfs.openDb(gtfsConfig);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/static_data/:hh-:mm-:ss', async (req, res) => {
  // Check if time param input is valid
  const time = `${req.params.hh}:${req.params.mm}:${req.params.ss}`;
  const date = new Date(`${refDate.getFullYear()}-` +
    `${refDate.getMonth()}-` +
    `${refDate.getDate()}` +
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

  const routeIdsList = [];
  for (const bus in config.buses) {
    if (config.buses.hasOwnProperty(bus)) {
      routeIdsList.push(config.buses[bus].route_id);
    }
  }
  const tripIds = [];
  const trips = await gtfs.getTrips({'route_id': routeIdsList},
      ['route_id', 'trip_id']);
  for (const trip in trips) {
    if (trips.hasOwnProperty(trip)) {
      tripIds.push(trips[trip].trip_id);
    }
  }

  // Get stop times at the stop_ids specified in stopIdsList where the
  // departure_time is later or equal to the time specified in date,
  const stopTimes = await gtfs.runRawQuery(`SELECT stop_id, trip_id, ` +
    `departure_time FROM stop_times WHERE trip_id IN ` +
    `("${tripIds.join('", "')}") AND stop_id IN ` +
    `("${stopIdsList.join('", "')}") AND departure_time >= ` +
    `"${date.toLocaleTimeString('se-SV')}" ` +
    `ORDER BY departure_time ASC LIMIT ${maxStopTimeFetchCount}`);

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

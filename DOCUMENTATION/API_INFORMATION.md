# API Information

We use [Trafiklab](https://www.trafiklab.se/)'s API, more specifically [GTFS Regional](https://www.trafiklab.se/api/trafiklab-apis/gtfs-regional/) for UL. To get an API key, ask a teacher for access to a project or create one at [Trafiklab](https://developer.trafiklab.se/) with the [GTFS Regional Static API](https://www.trafiklab.se/api/trafiklab-apis/gtfs-regional/static/) enabled. Once you have access to a project with the API you can find the API key following [this](https://www.trafiklab.se/docs/using-trafiklab/getting-api-keys/) guide. Once you have the key, follow the steps in [SETUP.md](SETUP.md).

[GTFS](https://developers.google.com/transit) is Google's system for both static and realtime transit data.

## Internal API:

To access data on client-side, go to: `localhost:8000/static_data/hh-mm-ss` and replace `hh-mm-ss` with the current time, where `hh` is hours, `mm` is minutes, and `ss` is seconds.

We use the npm package [gtfs](https://www.npmjs.com/package/gtfs) to put the data received from the GTFS Regional Static API into a [SQLite](https://www.sqlite.org/index.html) database, which we can then query using SQL queries.

### Not implemented:

- The data sent to the client-side is not filtered.
    - If a bus stops at multiple of the stops specified in the `stops` object in `config.json`, it will show up multiple times in the data instead of only showing up when the bus stops at the stop specified in the corresponding bus in the `buses` object.
    - The amount of stop times queried from the GTFS database is limited to the variable `maxStopTimes`, which by default is 100. Buses are not filtered out based on the amount of times they have appeared, meaning the data might contain the same bus more than twice and some buses might only show up once or not at all.
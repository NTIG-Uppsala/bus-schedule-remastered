# API Information

We use [Trafiklab](https://www.trafiklab.se/)'s API, more specifically [GTFS Regional](https://www.trafiklab.se/api/trafiklab-apis/gtfs-regional/) for UL
We will use the stop_times.txt file to get the next departures from a stop. To link it to bus numbers we can either dynamically cross-reference with the trips.txt and routes.txt files or we can manually tell the program to associate specific `trip_id`s with specific bus numbers. We will use the latter method to begin with. We will also use the stops.txt file to get the name of the stop.
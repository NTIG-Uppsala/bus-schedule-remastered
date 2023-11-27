# Known Bugs:
- The average reload time for the Pi to update the page is about 2 minutes and 20 seconds.
- The page is programmed to update once every minute so to stay true to the realtime data. But this does not work due to the slow reload on the Pi.
- Since both the Realtime and Static API key only has a certain amount of uses per 30 days, there needs to be a set time for when it should start updating the page and using the key. Otherwise it will run out of uses before the month is over.
- The design is in the early stage of development (about 2 hours in).

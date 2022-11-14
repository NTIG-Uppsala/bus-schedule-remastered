import assert from 'assert';
import * as gtfs from 'gtfs';

// Config pointing to our gtfs database for testing
const config = {
  'agencies': [
    {
      'path': './data/testdata.zip',
      // All the files we want to KEEP are commented out;
      // All the files we want to REMOVE are uncommented.
      // This is a complete list of files our gtfs library looks for.
      'exclude': [
        'agency',
        'areas',
        'attributions',
        'calendar_dates',
        'calendar',
        'fare_attributes',
        'fare_leg_rules',
        'fare_products',
        'fare_rules',
        'fare_transfer_rules',
        'feed_info',
        'frequencies',
        'levels',
        'pathways',
        // 'routes',
        'shapes',
        'stop_areas',
        // 'stop_times',
        // 'stops',
        'transfers',
        // 'trips',
      ],
    },
  ],
};

describe('GTFS Test', () => {
  before(async () => {
    await gtfs.importGtfs(config);
    await gtfs.openDb(config);
  });

  it('should read a value from the gtfs database', async () => {
    // This stop_id refers to Lundellska Skolan (A)
    const stopTimes = await getSortedStopTimesByStopId('9022003700218001');
    assert(stopTimes);
  });
  it('should return null when input is invalid', async () => {
    const stopTimes = await getSortedStopTimesByStopId('');
    assert(stopTimes === null);
  });
});

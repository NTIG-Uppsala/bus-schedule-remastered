import * as gtfs from 'gtfs';
import assert from 'assert';

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
  describe('#importGtfs()', () => {
    it('should should save the gtfs zip as a database', async () => {
      await gtfs.importGtfs(config);
    });
    it('should read a value from the gtfs database', async () => {
      await gtfs.openDb(config);
      // This stop_id refers to lundellska skolan
      const stop = await gtfs.getStops({stop_id: '9021003700218000'});
      assert(stop.length);
    });
  });
});

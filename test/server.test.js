import * as gtfs from 'gtfs';

// Config pointing to our gtfs database for testing
const config = {
  'agencies': [
    {
      'path': './data/testdata.zip',
      'exclude': ['shapes'],
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
      await gtfs.getStops({stop_id: '9021003700218000'});
    });
  });
});

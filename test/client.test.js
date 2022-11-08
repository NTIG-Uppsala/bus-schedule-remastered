import {Builder} from 'selenium-webdriver';
import assert from 'assert';
import 'chromedriver';

describe('First script', function() {
  let driver;

  before(async function() {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => await driver.quit());

  it('Search on Google', async function() {
    await driver.get('https://google.com');
    const title = await driver.getTitle();
    assert.equal(title, 'Google');
  });
});

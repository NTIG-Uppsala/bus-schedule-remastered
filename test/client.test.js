import {Builder} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';
import 'chromedriver';

describe('First script', function() {
  let driver;

  const chromeOptions = new chrome.Options;
  chromeOptions.addArguments('--headless');
  // chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');

  before(async function() {
    driver = await new Builder().forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
  });

  after(async () => await driver.quit());

  it('Search on Google', async function() {
    await driver.get('https://google.com');
    const title = await driver.getTitle();
    assert.equal(title, 'Google');
  });
});

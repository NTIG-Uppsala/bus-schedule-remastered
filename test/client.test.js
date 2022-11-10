import {Builder} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

describe('Example script', function() {
  let driver;

  // These options ensure the browser opens properly
  const chromeOptions = new chrome.Options;
  chromeOptions.addArguments('--headless');
  chromeOptions.addArguments('--disable-dev-shm-usage');

  // Open the browser
  before(async () => {
    driver = await new Builder().forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
  });

  // Close the browser when done
  after(async () => await driver.quit());

  // Example test as we do not have any html page yet
  it('Visit Google', async function() {
    await driver.get('https://google.com');
    const title = await driver.getTitle();
    assert.equal(title, 'Google');
  });
});

import {By, Builder} from 'selenium-webdriver';
import {suite} from 'selenium-webdriver/testing/index.js';
import {equal} from 'assert';
import 'chromedriver';

suite(function(env) {
  describe('First script', function() {
    let driver;

    before(async function() {
      driver = await new Builder().forBrowser('chrome').build();
    });

    after(async () => await driver.quit());

    it('First Selenium script', async function() {
      await driver.get('https://www.selenium.dev/selenium/web/web-form.html');

      const title = await driver.getTitle();
      equal('Web form', title);

      await driver.manage().setTimeouts({implicit: 500});

      const textBox = await driver.findElement(By.name('my-text'));
      const submitButton = await driver.findElement(By.css('button'));

      await textBox.sendKeys('Selenium');
      await submitButton.click();

      const message = await driver.findElement(By.id('message'));
      const value = await message.getText();
      equal('Received!', value);
    });
  });
});

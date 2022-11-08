# Dependencies

## Build dependencies:
- Express ^4.18.2
- core-js ^3.26.0

## Development dependencies:

Development dependencies are not necessary to run the program, but help with developing. If they stop working they can be removed, and possibly replaced with other packages.

- ESLint ^8.26.0
  - ESLint helps with following the [Coding Standard](./CODING_STANDARD.md). If it stops working, feel free to remove ESLint and any corresponding Github Actions. A possible replacement is [Prettier](https://prettier.io/).
- ESLint-Config-Google ^0.14.0
  - ESLint-Config-Google is a set of rules for ESLint and contains the rules for the [Coding Standard](./CODING_STANDARD.md).
- Mocha ^10.1.0
  - Mocha is used for testing. If it stops working, please replace Mocha and any corresponding Github Actions with another testing framework. A possible replacement is [Jest](https://jestjs.io/).
- Selenium-webdriver ^4.6.0
  - Selenium-webdriver is used for testing the client page.
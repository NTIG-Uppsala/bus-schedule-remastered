# Setup
To set up the project for development:
- Clone this repository
- Make sure you have Node.js and npm installed
- Run `npm install` in your project folder
- \[Optional\] Install the ESLint extension if you're using VSCode
- For testing you need a gtfs zip file at ./data/testdata.zip. If the tests stop working you can update it by running ./download_test_data.bat.
  - To run the file you need a .env file with the following content:
    - `STATIC_API_KEY="Your API key"`
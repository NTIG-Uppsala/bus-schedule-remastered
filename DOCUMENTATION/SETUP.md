# Setup
To set up the project for development:
- Clone this repository
- Make sure you have Node.js and npm installed
- Run `npm install` in your project folder
- \[Optional\] Install the ESLint extension if you're using VSCode
- To run the project you need a `.env` file placed in the project root, with the following content:
    - `STATIC_API_KEY="{API_KEY}"`, where `{API_KEY}` is your Trafiklab project's API key (see [API_INFORMATION.md](API_INFORMATION.md) for more info)
      - For example `STATIC_API_KEY="1234567890"`
- For testing you need a gtfs zip file at `./data/testdata.zip`. If the tests stop working you can update it by running `download_test_dat.bat`.

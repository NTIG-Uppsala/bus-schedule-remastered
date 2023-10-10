import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import express from 'express';
const app = express();
const PORT = 8000;

import * as gtfs from 'gtfs';

import * as dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const release = process.env.NODE_ENV === 'production';

// FIX: Handle possible missing files when using fs.readFileSync on config
//        files

// Config for buses and stops
const config = JSON.parse(fs.readFileSync('./config.json'));

// Config for GTFS import
let gtfsConfig;
if (release) {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_rel_config.json'));
    // FIX: Handle missing API key
    gtfsConfig.agencies[0].url += '?key=' + process.env.STATIC_API_KEY;
} else {
    gtfsConfig = JSON.parse(fs.readFileSync('./gtfs_test_config.json'));
}

const maxStopTimes = 100;
const maxImportTries = 5;

let importSuccess = false;

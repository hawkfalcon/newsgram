const fs = require('node:fs');
const path = require('node:path');
const BASE_URL = (process.env.NEWSGRAM_TEST_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const ARTIFACT_DIR = path.resolve(process.env.NEWSGRAM_ARTIFACT_DIR || path.join(__dirname, '../validation'));
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
const artifact = name => path.join(ARTIFACT_DIR, name);
module.exports = { BASE_URL, ARTIFACT_DIR, artifact };

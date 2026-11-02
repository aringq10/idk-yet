import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import cron from 'node-cron';
import { Data } from './lib/data.js';

const token = process.env.API_TOKEN;
if (!token) throw new Error("API_TOKEN is not set");

const database = new DatabaseSync("main.db");
database.exec(readFileSync("sql/schema.sql").toString());

const data = new Data(database);

cron.schedule('*/30 * * * *', () => data.updateDb(token));

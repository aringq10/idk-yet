import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { Data, toView, groupTimeEntries } from './lib/data.js';
import express from "express";

const token = process.env.API_TOKEN;
if (!token) throw new Error("API_TOKEN is not set");

const database = new DatabaseSync("main.db");
database.exec(readFileSync("sql/schema.sql").toString());

const data = new Data(database);

/* express server */

const app = express();

app.set("views", "src/views");
app.set("view engine", "pug");

app.use(express.static("public"));

app.get('/', (_, res) => {
  res.render('index', {
    days: groupTimeEntries(data.getTimeEntries()).
      map(({ date, total, items }) => ({ date, total, items: items.map(toView) }))
  });
});

app.listen(4321, "0.0.0.0", () => console.log("started on 4321"));

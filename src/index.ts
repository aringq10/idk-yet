import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { Data, toView, groupTimeEntries } from './lib/data.js';
import express from "express";
import { getDate, toDate, WEEK } from './lib/util.js';
import path from 'node:path';

const dir = import.meta.dirname;

const token = process.env.API_TOKEN;
if (!token) throw new Error("API_TOKEN is not set");

const database = new DatabaseSync(path.join(dir, "../main.db"));
const schema = readFileSync(path.join(dir, "sql/schema.sql")).toString();
database.exec(schema);

const data = new Data(database);

/* express server */

const app = express();

app.locals.basedir = path.join(dir, "views");

app.set("views", path.join(dir, "views"));
app.set("view engine", "pug");

app.use(express.static(path.join(dir, "public")));

app.get('/', (req, res) => {
  const s = req.query.startDate;
  const e = req.query.endDate;
  const startDate = typeof s === "string"
    ? toDate(s)
    : null;
  const endDate = typeof e === "string"
    ? toDate(e)
    : null;
  const bothUndefined = s === undefined && e === undefined;
  const badRequest =
    (startDate === null || endDate === null) &&
    !bothUndefined;

  if (badRequest) {
    res.status(400).render("error", { code: 400, message: "Bad Request"});
  } else {
    const now = new Date();
    const filter = bothUndefined
      ? { from: new Date(now.getTime() - WEEK), to: now}
      : { from: startDate!, to: endDate! };
    res.render('index', {
      days: groupTimeEntries(data.getTimeEntries(filter)).
        map(({ date, total, items }) => ({ date, total, items: items.map(toView) })),
      startDate: getDate(filter.from),
      endDate: getDate(filter.to)
    });
  }
});

app.listen(4321, "0.0.0.0", () => console.log("started on 4321"));

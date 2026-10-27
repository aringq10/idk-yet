import Api from "./lib/toggl.js";

const token = process.env.API_TOKEN;
if (!token) throw new Error("API_TOKEN is not set");

let api = new Api({ api_token: token });

console.table(await api.fetchTimeEntries());

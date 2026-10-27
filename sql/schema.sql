CREATE TABLE IF NOT EXISTS thing (
    id INTEGER PRIMARY KEY,
    external_id INT NOT NULL,
    name TEXT NOT NULL
)

CREATE TABLE IF NOT EXISTS time_entry (
    id INTEGER PRIMARY KEY,
    external_id INT NOT NULL,
    thing_id INTEGER NOT NULL,
    start DATETIME NOT NULL,
    stop DATETIME NOT NULL,
    description TEXT,
    FOREIGN KEY(thing_id) REFERENCES thing(id)
)

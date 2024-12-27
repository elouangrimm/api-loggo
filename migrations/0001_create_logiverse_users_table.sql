-- Migration number: 0001 	 2024-12-27T10:50:13.455Z
CREATE TABLE `logiverse_users` (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'hello i am new',
    last_updated INTEGER DEFAULT CURRENT_TIMESTAMP,
    banned INTEGER DEFAULT 0,
    gif TEXT
);

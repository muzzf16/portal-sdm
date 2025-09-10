const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_SOURCE = "database.sqlite";

// Connect to the database
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
    
    // Check what tables exist
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) {
            console.error("Error getting table list:", err.message);
            db.close();
            return;
        }
        
        console.log('Existing tables:', rows);
        db.close();
    });
});
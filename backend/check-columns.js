const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the correct path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
    
    // Check if the employees table exists and what columns it has
    db.all("PRAGMA table_info(employees)", [], (err, rows) => {
        if (err) {
            console.error("Error getting table info:", err.message);
            db.close();
            return;
        }
        
        console.log('Updated employees table columns:');
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });
        
        db.close();
    });
});
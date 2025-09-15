const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error("Error getting tables:", err.message);
            return;
        }
        console.log("\nTables in database:");
        tables.forEach(table => {
            console.log(`- ${table.name}`);
        });
        
        // Check structure of each table
        tables.forEach(table => {
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (err) {
                    console.error(`Error getting info for table ${table.name}:`, err.message);
                    return;
                }
                console.log(`\nStructure of ${table.name}:`);
                columns.forEach(col => {
                    console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                });
            });
        });
    });
});

// Close the database connection after a delay to allow queries to complete
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error("Error closing database:", err.message);
        } else {
            console.log("Database connection closed.");
        }
    });
}, 1000);
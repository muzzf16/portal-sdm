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
    // Check row counts for all tables
    const tables = ['users', 'employees', 'leaveRequests', 'payrolls', 'performanceReviews', 'attendance', 'dataChangeRequests', 'announcements'];
    
    tables.forEach(table => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
            if (err) {
                console.error(`Error counting rows in ${table}:`, err.message);
                return;
            }
            console.log(`${table}: ${row.count} rows`);
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
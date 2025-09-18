const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log(`Checking database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
    process.exit(1);
  }
  
  console.log("Connected to database successfully");
  
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      console.error("Error querying tables:", err.message);
      db.close();
      process.exit(1);
    }
    
    console.log("Tables in database:");
    rows.forEach(row => {
      console.log(`- ${row.name}`);
    });
    
    // Check if settings table exists
    const settingsTable = rows.find(row => row.name === 'settings');
    if (settingsTable) {
      console.log("\nSettings table exists. Checking its structure:");
      db.all("PRAGMA table_info(settings)", [], (err, columns) => {
        if (err) {
          console.error("Error getting settings table info:", err.message);
        } else {
          console.log("Settings table columns:");
          columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})`);
          });
        }
        db.close();
      });
    } else {
      console.log("\nSettings table does not exist.");
      db.close();
    }
  });
});
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
  
  // Check settings table data
  db.all("SELECT * FROM settings", [], (err, rows) => {
    if (err) {
      console.error("Error querying settings:", err.message);
      db.close();
      process.exit(1);
    }
    
    console.log("Settings table data:");
    if (rows.length === 0) {
      console.log("No rows found in settings table");
    } else {
      rows.forEach(row => {
        console.log(`- ${row.key}: ${row.value}`);
      });
    }
    
    db.close();
  });
});
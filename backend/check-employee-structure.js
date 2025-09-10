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
    
    // Get employee table info
    db.all("PRAGMA table_info(employees)", [], (err, columns) => {
        if (err) {
            console.error("Error getting table info:", err.message);
            db.close();
            return;
        }
        
        console.log('Employees table columns:');
        columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})`);
        });
        
        // Get all employees with all fields
        db.all("SELECT * FROM employees", [], (err, employees) => {
            if (err) {
                console.error("Error getting employees:", err.message);
                db.close();
                return;
            }
            
            console.log('\nEmployees data:');
            employees.forEach(emp => {
                console.log(`\nEmployee ID: ${emp.id}`);
                Object.keys(emp).forEach(key => {
                    console.log(`  ${key}: ${emp[key]}`);
                });
            });
            
            db.close();
        });
    });
});
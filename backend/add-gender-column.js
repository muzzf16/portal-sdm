const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the correct path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

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
        
        console.log('Current employees table columns:');
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });
        
        // Check if gender column exists
        const hasGenderColumn = rows.some(row => row.name === 'gender');
        
        if (!hasGenderColumn) {
            console.log('\nAdding missing gender column to employees table...');
            
            // Add the gender column
            db.run("ALTER TABLE employees ADD COLUMN gender TEXT", (err) => {
                if (err) {
                    console.error("Error adding gender column:", err.message);
                    db.close();
                    return;
                }
                console.log('Successfully added gender column to employees table.');
                db.close();
            });
        } else {
            console.log('\nGender column already exists in employees table.');
            db.close();
        }
    });
});
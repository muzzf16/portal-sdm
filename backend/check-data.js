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
    
    // Get all employees
    db.all("SELECT * FROM employees", [], (err, employees) => {
        if (err) {
            console.error("Error getting employees:", err.message);
            db.close();
            return;
        }
        
        console.log('Employees:');
        employees.forEach(emp => {
            console.log(`- ID: ${emp.id}, NIP: ${emp.nip}, Position: ${emp.position}`);
        });
        
        // Get all users
        db.all("SELECT * FROM users", [], (err, users) => {
            if (err) {
                console.error("Error getting users:", err.message);
                db.close();
                return;
            }
            
            console.log('Users:');
            users.forEach(user => {
                console.log(`- ID: ${user.id}, Name: ${user.name}, Employee ID: ${user.employeeId || 'N/A'}`);
            });
            
            db.close();
        });
    });
});
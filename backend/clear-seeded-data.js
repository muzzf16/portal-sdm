const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

// Function to delete records with seeded ID patterns
const clearSeededData = () => {
    db.serialize(() => {
        console.log('Starting to clear seeded data...');
        
        // Delete from all tables where IDs match the pattern
        const deleteQueries = [
            "DELETE FROM users WHERE id LIKE '%-%'",
            "DELETE FROM employees WHERE id LIKE '%-%'",
            "DELETE FROM leaveRequests WHERE id LIKE '%-%' OR employeeId LIKE '%-%'",
            "DELETE FROM payrolls WHERE id LIKE '%-%' OR employeeId LIKE '%-%'",
            "DELETE FROM performanceReviews WHERE id LIKE '%-%' OR employeeId LIKE '%-%'",
            "DELETE FROM attendance WHERE id LIKE '%-%' OR employeeId LIKE '%-%'",
            "DELETE FROM dataChangeRequests WHERE id LIKE '%-%' OR employeeId LIKE '%-%'"
        ];
        
        let totalChanges = 0;
        
        deleteQueries.forEach((query, index) => {
            db.run(query, function(err) {
                if (err) {
                    console.error(`Error executing query ${index + 1}:`, err.message);
                } else {
                    console.log(`Query ${index + 1} completed. Rows affected: ${this.changes}`);
                    totalChanges += this.changes;
                }
                
                // After the last query, close the database
                if (index === deleteQueries.length - 1) {
                    console.log(`\nTotal rows deleted: ${totalChanges}`);
                    console.log('Finished clearing seeded data.');
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err.message);
                        } else {
                            console.log('Database connection closed.');
                        }
                        process.exit(0);
                    });
                }
            });
        });
    });
};

// Run the function
clearSeededData();
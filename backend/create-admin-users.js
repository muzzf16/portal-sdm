const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
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

// Function to create admin users
const createAdminUsers = async () => {
    try {
        // Generate salt and hash passwords
        const saltRounds = 10;
        
        // Admin user 1
        const admin1Id = `admin-${Date.now()}-001`;
        const admin1Password = await bcrypt.hash('admin123', saltRounds);
        
        // Admin user 2
        const admin2Id = `admin-${Date.now()}-002`;
        const admin2Password = await bcrypt.hash('admin123', saltRounds);
        
        // Insert admin users
        const adminUsers = [
            {
                id: admin1Id,
                name: 'Admin Satu',
                email: 'admin1@company.com',
                password: admin1Password,
                role: 'ADMIN',
                employeeId: null // Admins typically don't have employee records
            },
            {
                id: admin2Id,
                name: 'Admin Dua',
                email: 'admin2@company.com',
                password: admin2Password,
                role: 'ADMIN',
                employeeId: null
            }
        ];
        
        db.serialize(() => {
            const stmt = db.prepare('INSERT INTO users (id, name, email, password, role, employeeId) VALUES (?, ?, ?, ?, ?, ?)');
            
            adminUsers.forEach(user => {
                stmt.run([user.id, user.name, user.email, user.password, user.role, user.employeeId], function(err) {
                    if (err) {
                        console.error(`Error inserting user ${user.email}:`, err.message);
                    } else {
                        console.log(`Successfully created admin user: ${user.name} (${user.email}) with ID: ${user.id}`);
                    }
                });
            });
            
            stmt.finalize();
        });
        
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Error creating admin users:', error);
        db.close(() => process.exit(1));
    }
};

// Run the function
createAdminUsers();
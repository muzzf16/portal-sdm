const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_SOURCE = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        throw err;
    }
    console.log('Connected to the SQLite database. Starting migration...');
    
    // Run migration after connection is established
    migrate()
        .catch(err => {
            console.error("Migration failed:", err.message);
            process.exit(1);
        })
        .finally(() => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                }
                console.log('Database connection closed.');
            });
        });
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error running sql: ' + sql);
            console.error(err);
            return reject(err);
        }
        resolve(this);
    });
});

async function migrate() {
    console.log('Executing migration steps...');

    // 1. Add promotionNotificationDays to settings table
    try {
        await dbRun("INSERT OR IGNORE INTO settings (key, value) VALUES ('promotionNotificationDays', '30')");
        console.log('[SUCCESS] Default setting "promotionNotificationDays" inserted or already exists.');
    } catch (e) {
        console.error('[FAILED] Could not insert default promotion setting.');
        throw e;
    }

    // 2. Add nextPromotionDate to employees table
    try {
        await dbRun("ALTER TABLE employees ADD COLUMN nextPromotionDate TEXT");
        console.log('[SUCCESS] Column "nextPromotionDate" added to "employees" table.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('[INFO] Column "nextPromotionDate" already exists in "employees" table.');
        } else {
            console.error('[FAILED] Could not add column "nextPromotionDate" to "employees" table.');
            throw e;
        }
    }

    // 3. Create notifications table
    try {
        await dbRun(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                employeeId TEXT,
                employeeName TEXT,
                message TEXT NOT NULL,
                type TEXT NOT NULL,
                isRead INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);
        console.log('[SUCCESS] Table "notifications" created or already exists.');
    } catch (e) {
        console.error('[FAILED] Could not create "notifications" table.');
        throw e;
    }

    console.log('Migration finished successfully.');
}
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_SOURCE = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        throw err;
    }
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) return reject(new Error(err.message));
        resolve(this);
    });
});

const CUTI_BERSAMA_2024 = [
    { date: '2024-02-09', description: 'Cuti Bersama Tahun Baru Imlek 2575 Kongzili' },
    { date: '2024-03-12', description: 'Cuti Bersama Hari Suci Nyepi Tahun Baru Saka 1946' },
    { date: '2024-04-08', description: 'Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah' },
    { date: '2024-04-09', description: 'Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah' },
    { date: '2024-04-12', description: 'Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah' },
    { date: '2024-04-15', description: 'Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah' },
    { date: '2024-05-10', description: 'Cuti Bersama Kenaikan Isa Al Masih' },
    { date: '2024-05-24', description: 'Cuti Bersama Hari Raya Waisak' },
    { date: '2024-06-18', description: 'Cuti Bersama Hari Raya Idul Adha 1445 Hijriah' },
    { date: '2024-12-26', description: 'Cuti Bersama Hari Raya Natal' },
];

async function migrate() {
    console.log('Starting database migration...');

    await dbRun(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    console.log('Table "settings" created or already exists.');

    await dbRun("INSERT OR IGNORE INTO settings (key, value) VALUES ('defaultClockIn', '08:30')");
    await dbRun("INSERT OR IGNORE INTO settings (key, value) VALUES ('defaultClockOut', '17:00')");
    console.log('Default settings inserted or already exist.');

    await dbRun(`CREATE TABLE IF NOT EXISTS collective_holidays (date TEXT PRIMARY KEY, description TEXT)`);
    console.log('Table "collective_holidays" created or already exists.');

    console.log('Migrating collective holidays...');
    await dbRun('BEGIN TRANSACTION');
    try {
        for (const holiday of CUTI_BERSAMA_2024) {
            await dbRun("INSERT OR IGNORE INTO collective_holidays (date, description) VALUES (?, ?)", [holiday.date, holiday.description]);
        }
        await dbRun('COMMIT');
        console.log('Collective holidays migrated successfully.');
    } catch (e) {
        await dbRun('ROLLBACK');
        console.error('Failed to migrate collective holidays. Rolled back transaction.');
        throw e;
    }
    
    console.log('Database migration finished successfully.');
}

migrate()
    .catch(err => console.error("Migration failed:", err.message))
    .finally(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            console.log('Database connection closed.');
        });
    });
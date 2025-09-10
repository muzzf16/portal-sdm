const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.all(`SELECT name, sql FROM sqlite_master WHERE type='table'`, (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      rows.forEach(row => {
        console.log(`Table: ${row.name}`);
        console.log(`Schema: ${row.sql}\n`);
      });
    }
  });
});

setTimeout(() => {
  db.close();
}, 1000);
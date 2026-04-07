const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Tables } = require('../Constants/Tables');
const { SharedService } = require('../Services/Common.Services/SharedService');
const settings = require('../settings.json').settings;

class DBInitializer {
  static #db = null;

  static async init() {
    if (!fs.existsSync(settings.dbPath)) {
      this.#db = new sqlite3.Database(settings.dbPath);
      await this.#runQuery('PRAGMA foreign_keys = ON');

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.ContractVersion} (
        Id INTEGER,
        Version FLOAT NOT NULL,
        Description TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.SqlScriptMigrations} (
        Id INTEGER,
        Sprint TEXT NOT NULL,
        ScriptName TEXT NOT NULL,
        ExecutedTimestamp TEXT,
        ConcurrencyKey TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.ActivityLog} (
        Id INTEGER,
        ActivityType TEXT,
        User TEXT,
        Service TEXT,
        Action TEXT,
        Message TEXT,
        ExceptionMessage TEXT,
        TimeStamp TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.Patients} (
        Id INTEGER,
        Name TEXT NOT NULL,
        DOB TEXT,
        Gender TEXT,
        Contact TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        ConcurrencyKey TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.Doctors} (
        Id INTEGER,
        Name TEXT NOT NULL,
        Specialty TEXT,
        Contact TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        ConcurrencyKey TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.Appointments} (
        Id INTEGER,
        PatientId INTEGER NOT NULL,
        DoctorId INTEGER NOT NULL,
        DateTime TEXT NOT NULL,
        Reason TEXT,
        Status TEXT DEFAULT 'Scheduled',
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        ConcurrencyKey TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      this.#db.close();
    }

    if (fs.existsSync(settings.dbPath)) {
      this.#db = new sqlite3.Database(settings.dbPath);
      const getLastExecutedSprintQuery = 'SELECT Sprint FROM SqlScriptMigrations ORDER BY Sprint DESC LIMIT 1';
      let rc = await this.#getRecord(getLastExecutedSprintQuery);
      const lastExecutedSprint = rc ? rc.Sprint : 'Sprint_00';
      const dbScriptsPath = settings.dbScriptsFolderPath;

      if (fs.existsSync(dbScriptsPath)) {
        const scriptFolders = fs.readdirSync(dbScriptsPath)
          .filter(folder => folder.startsWith('Sprint_') && folder >= lastExecutedSprint)
          .sort();

        for (const sprintFolder of scriptFolders) {
          const sprintFolderPath = path.join(dbScriptsPath, sprintFolder);
          const sqlFiles = fs.readdirSync(sprintFolderPath)
            .filter(file => file.match(/^\d+_.+\.sql$/))
            .sort();

          for (const sqlFile of sqlFiles) {
            const scriptPath = path.join(sprintFolderPath, sqlFile);
            const query = 'SELECT * FROM SqlScriptMigrations WHERE Sprint = ? AND ScriptName = ?';
            const rc2 = await this.#getRecord(query, [sprintFolder, sqlFile]);
            if (!rc2) {
              console.log(`[MIGRATION] Executing script: ${scriptPath}`);
              const sqlScript = fs.readFileSync(scriptPath, 'utf8');
              const sqlStatements = sqlScript
                .split(';')
                .map(s => s.split('\
').map(line => line.trim().startsWith('--') ? '' : line).join('\
'))
                .filter(s => s.trim() !== '');
              for (const statement of sqlStatements) {
                try { await this.#runQuery(statement); } catch (err) { console.error('[MIGRATION] Error:', err); }
              }
              const insertQuery = 'INSERT INTO SqlScriptMigrations (Sprint, ScriptName, ExecutedTimestamp, ConcurrencyKey) VALUES (?, ?, ?, ?)';
              await this.#runQuery(insertQuery, [sprintFolder, sqlFile, SharedService.getCurrentTimestamp(), SharedService.generateConcurrencyKey()]);
            }
          }
        }
      }

      this.#db.close();
    }
  }

  static #runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.#db.run(query, params ? params : [], function (err) {
        if (err) return reject(err);
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }

  static #getRecord(query, filters = []) {
    return new Promise((resolve, reject) => {
      const handler = (err, row) => {
        if (err) return reject(err.message);
        resolve(row);
      };
      if (filters.length > 0) this.#db.get(query, filters, handler);
      else this.#db.get(query, handler);
    });
  }
}

module.exports = { DBInitializer };

const DataBase = require('better-sqlite3');
const db = new DataBase('disaid.db');
db.pragma('journal_mode = WAL');   // Enable Write-Ahead Logging
db.pragma('synchronous = NORMAL'); // Set synchronous mode to NORMAL for better performance

const TABLE_NAME = 'beneficiary'



const createTable = function () {
  try {

    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        Serial INTEGER DEFAULT 0,
        HOF_ID TEXT NOT NULL,
        HOF_FullName TEXT NOT NULL,
        Mobile TEXT,
        Center_Name TEXT,

        Member_FullName TEXT,
        Member_ID TEXT,
        Quantity INTEGER DEFAULT 1,
        
        IsReceived INTEGER DEFAULT 0 ,
        DeliveryTime DATETIME NULL,
        RecieverName TEXT NULL,
        DeviceName TEXT NULL,

        date TEXT DEFAULT (datetime('now')),


        
        Member_DateBirth TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_idp_hofid ON ${TABLE_NAME} (HOF_ID);
      CREATE INDEX IF NOT EXISTS idx_idp_memberid ON ${TABLE_NAME} (Member_ID);
    `);

    return {
      type: 1,
      message: "success"
    };
  }
  catch (err) {
    return {
      type: -1,
      message: err.message,
      code: err.code || null,
    };
  }
}



const insertData = function (rows) {

  try {
    const insert = db.prepare(`INSERT INTO ` + TABLE_NAME + ` (
                        HOF_ID, HOF_FullName, Member_FullName, Member_ID,
                        Member_DateBirth, Center_Name, Mobile, Quantity, Serial, date 
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, datetime('now'))`);

    const deleteAll = db.prepare(`DELETE FROM ` + TABLE_NAME);

    const transaction = db.transaction((rows) => {
      deleteAll.run();
      rows.forEach(row => {
        const hof_id = row['HOF ID'];
        const hof_fullname = row['HOF FullName'];
        const member_fullName = row['Member FullName'];
        const member_id = row['Member ID'];
        const memeber_datebirth = row['Member Date Birth'];
        const center_name = row['Center Name'];
        const mobile = row['Jawwal#'];
        const quantity = row['Quantity'];
        const serial = row['Serial'];

        insert.run(hof_id,
          hof_fullname,
          member_fullName,
          member_id,
          memeber_datebirth,
          center_name,
          mobile,
          quantity,
          serial
        );
      });
    });

    transaction(rows);
    const result = {
      type: 1,
      message: "success"
    };
    return result;
  }
  catch (err) {
    const result = {
      type: -1,
      message: err.message,
      code: err.code || null,
    };
    return result;
  }
}

const dropTable = function () {
  try {
    db.exec('DROP TABLE ' + TABLE_NAME + ';');
    const result = {
      type: 1,
      message: "success"
    };
    return result;
  } catch (err) {
    const result = {
      type: -1,
      message: err.message,
      code: err.code || null,
    };
    return result;
  }
}

const deleteAllRows = function () {
  try {
    db.exec('DELETE FROM ' + TABLE_NAME + ';');
    const result = {
      type: 1,
      message: "success"
    };
    return result;
  } catch (err) {
    const result = {
      type: -1,
      message: err.message,
      code: err.code || null,
    };
    return result;
  }
}

const fetchAll = function () {


  // const select = db.prepare('SELECT HOF_ID,HOF_FullName,Member_FullName,Member_ID,Center_Name,Mobile FROM ' + TABLE_NAME + ';');

  try {
    const select = db.prepare('SELECT * FROM ' + TABLE_NAME + ';');
    const data = select.all();
    const result = {
      type: 1,
      message: "success",
      data: data
    };
    return result;
  } catch (err) {
    const result = {
      type: -1,
      message: err.message,
      code: err.code || null,
      data: null
    };
    return result;
  }
}


const fetchByHOF_ID = function (hof_id) {

  // const select = db.prepare('SELECT HOF_ID,HOF_FullName,Member_FullName,Member_ID,Center_Name,Mobile FROM ' + TABLE_NAME + ';');

  try {
    const select = db.prepare('SELECT * FROM ' + TABLE_NAME + ' WHERE HOF_ID = ? ;');
    const data = select.all(String(hof_id).trim());
    const result = {
      type: 1,
      message: "success",
      data: data
    };
    return result;
  } catch (err) {
    const result = {
      type: -1,
      message: err.message,
      code: err.code || null,
      data: null
    };
    return result;
  }
}


const updateReciving = function (hof_id, receiver_name, hostname) {

  try {

    const update = db.prepare(`UPDATE  ` + TABLE_NAME + ` SET 
    IsReceived=1 , DeliveryTime=datetime('now', 'localtime'), RecieverName=? ,DeviceName = ? WHERE HOF_ID=?`);

    const info = update.run(receiver_name, hostname, hof_id);
    const result = {
      type: 1,
      message: "success",
      info: info
    };
    return result;
  }
  catch (err) {
    const result = {
      type: -1,
      message: err.message,
      code: err.code || null,
      info: info
    };
    return result;
  }
}

module.exports = { db, insertData, dropTable, deleteAllRows, fetchAll, fetchByHOF_ID, updateReciving, createTable };
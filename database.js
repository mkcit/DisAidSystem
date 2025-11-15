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
        DistName TEXT NULL,
        IsActive INTEGER DEFAULT 1,

        
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



const insertData = function (rows, isNormalUploading = true) {

  try {

    //const deleteAll = db.prepare(`DELETE FROM ` + TABLE_NAME);

    let insert;
    if (isNormalUploading)
      insert = db.prepare(`INSERT INTO ` + TABLE_NAME + ` (
                        HOF_ID, HOF_FullName, Member_FullName, Member_ID,
                        Member_DateBirth, Center_Name, Mobile, Quantity, Serial, DistName, date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?, datetime('now'))`);
    else {

      insert = db.prepare(`INSERT INTO ` + TABLE_NAME + ` (
                        HOF_ID, HOF_FullName, Member_FullName, Member_ID,
                        Member_DateBirth, Center_Name, Mobile, Quantity, Serial,IsReceived,DeliveryTime,RecieverName,DeviceName, date 
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?, ?,?,datetime('now'))`);
    }

    const transaction = db.transaction((rows) => {
      // deleteAll.run();
      if (isNormalUploading) {
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
          const dist_name = row['DistName'];

          insert.run(hof_id,
            hof_fullname,
            member_fullName,
            member_id,
            memeber_datebirth,
            center_name,
            mobile,
            quantity,
            serial,
            dist_name
          );
        });
      } else {
        const hof_id = row['هوية رب الاسرة'];
        const hof_fullname = row['اسم رب الاسرة'];
        const member_fullName = row['اسم المستفيد'];
        const member_id = row['هوية المستفيد'];
        const memeber_datebirth = row['تاريخ الميلاد'];
        const center_name = row['اسم المركز'];
        const mobile = row['الجوال'];
        const quantity = row['الكمية'];
        const serial = row['#'];
        const reciever_name = row['المُستلم'];
        const delivery_time = row['وقت التسليم'];
        const device_name = row['المسؤول'];
        const is_received = row['استلم/لم'];

        insert.run(hof_id,
          hof_fullname,
          member_fullName,
          member_id,
          memeber_datebirth,
          center_name,
          mobile,
          quantity,
          serial,
          is_received,
          delivery_time,
          reciever_name,
          device_name,
        );
      }

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

const deleteRowsByDistName = function (dist_name) {
  try {
    const deleteByDistName = db.prepare('DELETE FROM ' + TABLE_NAME + ' WHERE DistName=?;');
    const data = deleteByDistName.run(dist_name);
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

const fetchAll = function (isExported) {


  // const select = db.prepare('SELECT HOF_ID,HOF_FullName,Member_FullName,Member_ID,Center_Name,Mobile FROM ' + TABLE_NAME + ';');

  try {
    // const select = db.prepare('SELECT * FROM ' + TABLE_NAME + ';');


    let select;
    if (isExported === true)
      select = db.prepare(
        'SELECT Serial AS "#", HOF_ID AS "هوية رب الاسرة", Quantity AS "الكمية",HOF_FullName AS "اسم رب الاسرة", RecieverName AS "المُستلم", Mobile AS "الجوال", Member_FullName AS "اسم المستفيد", Member_ID AS "هوية المستفيد",Member_DateBirth AS "تاريخ الميلاد",IsReceived AS "استلم/لم", Center_Name AS "اسم المركز",DeliveryTime AS "وقت التسليم",DeviceName AS "المسؤول", DistName AS "كشف التوزيع", IsActive AS "فعال/غير فعال" FROM ' + TABLE_NAME + '  WHERE IsActive=1;');
    else
      select = db.prepare('SELECT * FROM ' + TABLE_NAME + ' WHERE IsActive=1;');

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

const fetchStatistics = () => {
  try {
    const sql = `
  SELECT
    COUNT(*) AS total_beneficiaries,                 -- إجمالي المستفيدين (حسب الصف)
    SUM(CASE WHEN IsReceived = 1 THEN 1 ELSE 0 END) AS received_count,  -- عدد المستلمين
    COUNT(*) - SUM(CASE WHEN IsReceived = 1 THEN 1 ELSE 0 END) AS pending_count, -- المتبقّي من المستفيدين

    COALESCE(SUM(Quantity), 0) AS total_qty,  -- إجمالي الكمية
    COALESCE(SUM(CASE WHEN IsReceived = 1 THEN Quantity ELSE 0 END), 0) AS received_qty, -- الكمية المستلمة
    COALESCE(SUM(Quantity), 0)
      - COALESCE(SUM(CASE WHEN IsReceived = 1 THEN Quantity ELSE 0 END), 0) AS remaining_qty -- الكمية المتبقية
  FROM ${TABLE_NAME}
  WHERE IsActive = 1;
`;


    const select = db.prepare(sql);
    const data = select.all();

    return {
      type: 1,
      message: "success",
      data: data
    };


  } catch (err) {
    return {
      type: -1,
      message: err.message,
      code: err.code || null,
      data: null
    };
  }
}


const fetchByHOF_ID = function (hof_id, getAll = false) {

  // const select = db.prepare('SELECT HOF_ID,HOF_FullName,Member_FullName,Member_ID,Center_Name,Mobile FROM ' + TABLE_NAME + ';');

  try {
    let select;
    if(getAll==false)
    select = db.prepare('SELECT * FROM ' + TABLE_NAME + ' WHERE HOF_ID = ? AND IsActive=1  ;');
    else 
    select = db.prepare('SELECT * FROM ' + TABLE_NAME + ' WHERE HOF_ID = ? ;');
    
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


// const alterTable = () => {

//   try {
//     db.exec(`ALTER TABLE ${TABLE_NAME} ADD COLUMN IsActive INTEGER DEFAULT 1;`);
//     const result = {
//       type: 1,
//       message: "success"
//     };
//     return result;
//   }
//   catch (err) {
//     const result = {
//       type: -1,
//       message: err.message,

//     }
//     return result;

//   }
// }

const updateReciving = function (hof_id, receiver_name, hostname) {

  try {

    const update = db.prepare(`UPDATE  ` + TABLE_NAME + ` SET 
    IsReceived=1 , DeliveryTime=datetime('now', 'localtime'), RecieverName=? ,DeviceName = ? WHERE HOF_ID=? AND IsReceived=0`);

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
      info: null
    };
    return result;
  }
}

const deactivateByDistName = function (dist_name) {

  try {

    const update = db.prepare(`UPDATE  ` + TABLE_NAME + ` SET 
    IsActive=0 WHERE DistName=?`);

    const info = update.run(dist_name);
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
      info: null
    };
    return result;
  }
}

module.exports = { db, insertData, dropTable, deleteAllRows, fetchAll, fetchByHOF_ID, updateReciving, createTable, fetchStatistics, /*alterTable,*/ deleteRowsByDistName, deactivateByDistName };
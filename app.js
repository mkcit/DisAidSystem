
// port configuration
const port = 3000;

const fs = require('fs');

const os = require('os');

const useragent = require('express-useragent');

const path = require('path');

// core
const cors = require('cors');

// database connection
const db = require('./database').db;

// database connection
const insertData = require('./database').insertData;

const deactivateByDistName = require('./database').deactivateByDistName;

const fetchStatistics = require('./database').fetchStatistics;

// database connection
const fetchAll = require('./database').fetchAll;

const deleteRowsByDistName = require('./database').deleteRowsByDistName;

// database connection
// const alterTable = require('./database').alterTable;


// database connection
const createTable = require('./database').createTable;


// database connection
const updateReciving = require('./database').updateReciving;


// database connection
const fetchByHOF_ID = require('./database').fetchByHOF_ID;

// database connection
const deleteAllRows = require('./database').deleteAllRows;

// database connection
const dropTable = require('./database').dropTable;

// uploading files settings
const multer = require('multer');
const uploadSettings = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

// excel files
const XLSX = require('xlsx');

// express app setup
const express = require('express');
const { constants } = require('buffer');
// const { updateDistName } = require('./database');
const app = express();


app.use(useragent.express());


// setting up the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));

app.use(cors());

app.get('/uploadData', (req, res, next) => {
    res.render('uploadData');
});

app.post('/uploadData', uploadSettings.single('excelFile'), (req, res, next) => {


    if (!req.file) {
        // 400 File not Found
        return res.status(400).render('fileError', {
            title: 'File Not Found',
            admin: true
        });
    }

    if (req.file.size >= 10 * 1024 * 1024) {
        // 400 File not Found
        return res.status(400).render('fileError', {
            title: 'File is too big!, It must be less than 10MB',
            admin: true
        });
    }

    const mimeType1 = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; // xlsx
    const mimeType2 = 'application/vnd.ms-excel'; // xls
    if (req.file.mimetype !== mimeType1 && req.file.mimetype !== mimeType2) {
        // 415 File not supported
        return res.status(415).render('fileError', {
            title: 'File Not Supported',
            admin: true
        });
    }

    // اقرأ الملف من الـ buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    // خُذ أول ورقة
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        return res.status(400).render('fileError', {
            title: 'File does not have a sheet!',
            admin: true
        });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });


    const result = insertData(rows, true);
    if (result.type == 1) {
        return res.redirect('/allData');

    } else {
        return res.status(400).render('fileError', {
            title: result.message,
            admin: true
        });
    }

});

app.post('/export', (req, res, next) => {
    exportExcelFile(res, false);
});

const exportExcelFile = (res, isDropping) => {

    const result = fetchAll(true);
    if (result.type == 1) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(result.data, { cellDates: true });

        XLSX.utils.book_append_sheet(wb, ws, 'Sheet');

        const PATH = path.join(os.homedir(), 'Downloads');
        const FILE_NAME = PATH + '/' + getDateTime();


        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        fs.writeFile(FILE_NAME, buf, (err) => {
            if (err) {
                return res.status(400).render('fileError', {
                    title: err.message || 'Error in exporting file!',
                    admin: true
                });
            }

            console.log('exporting completed sucessfully!');

            if (!isDropping)
                res.status(200).redirect('/');
            else {
                const result1 = dropTable();
                if (result1.type == 1) {
                    res.redirect('/');
                } else {
                    res.status(400).render('fileError', {
                        title: result1.message || 'Error in data processing!',
                        admin: true
                    });
                }
            }

        });
    }
    else {
        res.status(400).render('fileError', {
            title: result.message || 'Error in data processing!',
            admin: true
        });
    }
}

const getDateTime = function () {
    return `benef_${new Date().toLocaleString().replace(/[/:\\,]/g, '-')}.xlsx`;

}

app.get('/allData', (req, res, next) => {
    const result = fetchAll(false);

    // console.log(result);
    if (result.type == 1) {
        res.status(200).render('allData', {
            rows: result.data,
            title: 'All Beneficiaries'
        });
    } else {
        res.status(400).render('fileError', {
            title: result.message || 'Error in processing Data!',
            admin: true
        });
    }
});

app.post('/drop', (req, res, next) => {
    exportExcelFile(res, true);
});

app.post('/createTable', (req, res, next) => {
    const result = createTable();
    if (result.type == 1) {
        res.redirect('/');
    } else {
        res.status(400).render('fileError', {
            title: result.message || 'Error in data processing!',
            admin: true
        });
    }
});

app.post('/deleteAll', (req, res, next) => {
    const result = deleteAllRows();
    if (result.type == 1) {
        res.redirect('/');
    } else {
        res.status(400).render('fileError', {
            title: result.message || 'Error in data processing!',
            admin: true
        });
    }
});



app.get('/api/search/a', (req, res) => {
    res.status(200).render('search', {
        title: 'Distribuation Aid System',
        result: null,
        rowsCount: 0,
        error: null,
        afterConfirmation: false,
        user: 'A',
        serial: '',
        hasDelivery: false
    });
});

app.get('/api/search/b', (req, res) => {
    res.status(200).render('search', {
        title: 'Distribuation Aid System',
        result: null,
        rowsCount: 0,
        error: null,
        afterConfirmation: false,
        user: 'B',
        serial: '',
        hasDelivery: false
    });
});

app.get('/api/search', (req, res) => {
    res.status(200).render('search', {
        title: 'Distribuation Aid System',
        result: null,
        rowsCount: 0,
        error: null,
        afterConfirmation: false,
        user: 'Default',
        serial: '',
        hasDelivery: false
    });
});

app.get('/api/searchAll', (req, res) => {
    res.status(200).render('searchAll', {
        title: 'Distribuation Aid System',
        result: null,
        rowsCount: 0,
        error: null,
        afterConfirmation: false,
        user: 'Default',
        serial: '',
        hasDelivery: false
    });
});

app.post('/api/search/a', (req, res) => {
    const hof_id = req.body.hof_id;
    if (hof_id != '') {
        const result = fetchByHOF_ID(hof_id);

        let hasDelivery = false;
        result.data.forEach(row => {
            if (row.IsReceived == 0) {
                hasDelivery = true;
                return;
            }
        });
        if (result.type == 1) {
            const rowsCount = result.data.length;
            res.status(200).render('search', {
                title: 'Distribuation Aid System',
                result: result.data,
                rowsCount: rowsCount,
                error: null,
                afterConfirmation: false,
                user: 'A',
                serial: '',
                hasDelivery: hasDelivery
            })
        } else {
            res.status(400).render('fileError', {
                title: result.message || 'Error in data processing!',
                admin: false
            });
        }
    } else {
        res.redirect('/api/search/a');
    }


});

app.post('/api/search/b', (req, res) => {
    const hof_id = req.body.hof_id;
    if (hof_id !== '') {
        const result = fetchByHOF_ID(hof_id);
        let hasDelivery = false;
        result.data.forEach(row => {
            if (row.IsReceived == 0) {
                hasDelivery = true;
                return;
            }
        });
        if (result.type == 1) {
            const rowsCount = result.data.length;
            res.status(200).render('search', {
                title: 'Distribuation Aid System',
                result: result.data,
                rowsCount: rowsCount,
                error: null,
                afterConfirmation: false,
                user: 'B',
                serial: '',
                hasDelivery: hasDelivery
            })
        } else {
            res.status(400).render('fileError', {
                title: result.message || 'Error in data processing!',
                admin: false
            });
        }
    } else {
        res.redirect('/api/search/b');
    }


});

app.post('/api/search', (req, res) => {
    const hof_id = req.body.hof_id;
    if (hof_id !== '') {
        const result = fetchByHOF_ID(hof_id);
        let hasDelivery = false;
        result.data.forEach(row => {
            if (row.IsReceived == 0) {
                hasDelivery = true;
                return;
            }
        });
        if (result.type == 1) {
            const rowsCount = result.data.length;
            res.status(200).render('search', {
                title: 'Distribuation Aid System',
                result: result.data,
                rowsCount: rowsCount,
                error: null,
                afterConfirmation: false,
                user: 'Default',
                serial: '',
                hasDelivery: hasDelivery
            })
        } else {
            res.status(400).render('fileError', {
                title: result.message || 'Error in data processing!',
                admin: false
            });
        }
    }
    else {
        res.redirect('/api/search');
    }

});

app.post('/api/searchAll', (req, res) => {
    const hof_id = req.body.hof_id;
    if (hof_id !== '') {
        const result = fetchByHOF_ID(hof_id, true);
        if (result.type == 1) {
            const rowsCount = result.data.length;
            res.status(200).render('searchAll', {
                title: 'Distribuation Aid System',
                result: result.data,
                rowsCount: rowsCount,
                error: null,
                afterConfirmation: false,
                user: 'Default',
                serial: '',
                hasDelivery: false
            })
        } else {
            res.status(400).render('fileError', {
                title: result.message || 'Error in data processing!',
                admin: false
            });
        }
    }
    else {
        res.redirect('/api/search');
    }

});

app.post('/api/confirm', (req, res) => {
    const hof_id = req.body.hof_id;
    const receiver_name = req.body.receiver_name;
    const hof_fullname = req.body.HOF_FullName;
    const user = req.body.user;
    // const hostname = os.hostname();
    const device_name = req.body.DeviceName + '-' + user;
    const serial = req.body.serial;

    const result = updateReciving(hof_id, receiver_name, device_name);
    if (result.type == 1) {

        res.status(200).render('search', {
            title: 'Distribuation Aid System',
            result: null,
            rowsCount: 0,
            error: null,
            afterConfirmation: true,
            hof_fullname: hof_fullname,
            user: user,
            serial: serial

        })
    } else {
        res.status(400).render('fileError', {
            title: result.message || 'Error in data processing!',
            admin: false
        });
    }

});


// app.use('/alter', (req, res, next) => {
//     const result = alterTable();
//     if (result.type == 1) {
//         console.log('Table Altered Successfully!');
//         res.status(200).send('Table Altered Successfully!');
//     } else {
//         console.log('Error: ' + result.message);
//         res.status(400).send('Error: ' + result.message);
//     }

// });


// app.use('/deactivate', (req, res, next) => {
//     const result = deactivateByDistName('Diapers#5');
//     if (result.type == 1) {
//         console.log('Table Altered Successfully!');
//         res.status(200).send('Table Altered Successfully!');
//     } else {
//         console.log('Error: ' + result.message);
//         res.status(400).send('Error: ' + result.message);
//     }

// });

app.use('/', (req, res, next) => {
    const result = fetchStatistics();
    const [data] = result.data;

    if (result.type == 1) {
        res.status(200).render('index', {
            title: 'Aid Dist System',
            data: data
        });
    }
    else {
        res.status(400).render('fileError', {
            title: result.message || 'Error in data processing!',
            admin: true
        });
    }

});


app.listen(port, '0.0.0.0', () => {
    console.log('SERVER IS ACTIVE..')
});
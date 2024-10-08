//node packages
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const multer = require('multer')


//another packages
const FileWorker = require('./modules/fileWorker')
const Mailer = require('./modules/mailer')
const parserExcel = require('./modules/parserExcel');

//variables
let auth = false
let error = 'не известна'
const PORT = process.env.PORT || 3000;
const paths = {
    recipients: {
        dir: `${__dirname}/uploads/recipients`,
        file: 'mails.xlsx',
    },
    files: {
        dir: `${__dirname}/uploads/files`,
    }
}
const listenFields = [{name: 'emails2', maxCount: 1}, {name: 'file', maxCount: 50}]
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'emails2') {
            cb(null, paths.recipients.dir)
        } else {
            cb(null, paths.files.dir)
        }
    },
    filename: (req, file, cb) => {
        if (file.fieldname === 'emails2') {
            cb(null, paths.recipients.file)
        } else if (file.originalname != paths.file) {
            cb(null, file.originalname)
        }
    }
});


//start app
const mailer = new Mailer
const filer = new FileWorker
const upload = multer({storage: storage});
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'))


//routing url
app.engine(
    'handlebars',
    handlebars({defaultLayout: 'main'})
)

app.set('views', `${__dirname}/views`)
app.set('view engine', 'handlebars')


//GET requests
app.get('/', (req, res) => {
    res.render('home', {title: 'Authorization'})
})

app.get('/send', (req, res) => {
    res.render('send', {title: 'Bulk mailing', auth: auth})
})

app.get('/random', (req, res) => {
    res.render('random', {title: 'Random mailing', auth: auth})
})

app.get('/error', (req, res) => {
    res.render('error', {title: 'Error', error: error})
})

//возможно убрать
app.get('/*', (req, res) => {
    if (auth) {
        res.redirect('/random')
    } else {
        res.redirect('/')
    }
})


//POST requests
app.post('/', (req, res) => {
    mailer
        .auth(req.body.email, req.body.pass)
        .then(resConnect => {
            auth = resConnect
            if (auth) {
                res.redirect('/random')
            } else {
                res.redirect('/')
            }
        })
})


app.post('/send', upload.fields(listenFields), (req, res) => {
    let title = req.body.title;
    let message = req.body.message;
    console.log("checkpoint 1 (full path):")
    console.log(`${paths.recipients.dir}/${paths.recipients.file}`)
    if (req.files.emails2 != null && req.files.emails2 != undefined) {
        parserExcel(`${paths.recipients.dir}/${paths.recipients.file}`).then(emailAddresses => {
            console.log("checkpoint 2 (emailAddresses):")
            console.log(`${emailAddresses}`)

            filer.filePaths(paths.files.dir).then(filePaths => {

                console.log("checkpoint 3 (filePaths):")
                console.log(`${filePaths}`)

                if (!filePaths) {
                    error = 'папка с файлами не найдена или undefined (серверная ошибка)'
                    res.redirect('/error')
                } else {
                    mailer
                        .sendManyMessages(emailAddresses, filePaths, title, message)
                        .then(resSend => {
                            if (resSend) {
                                filer.cleanDir(paths.files.dir)
                                filer.cleanDir(paths.recipients.dir)
                                res.redirect('/send')
                            } else {
                                error = 'рассылка не была осуществлена, проверьте адреса отправителей'
                                res.redirect('/error')
                            }
                        })
                }
            })
        })
    } else if (req.body.emails1 != '' && typeof (req.body.emails1) === 'string') {
        let emailAddresses = req.body.emails1.split(/\s*;\s*/)

        filer.filePaths(paths.files.dir).then(filePaths => {
            if (!filePaths) {
                error = 'папка с файлами не найдена или undefined (серверная ошибка)'
                res.redirect('/error')
            } else {
                mailer
                    .sendManyMessages(emailAddresses, filePaths, title, message)
                    .then(resSend => {
                        if (resSend) {
                            filer.cleanDir(paths.files.dir)
                            filer.cleanDir(paths.recipients.dir)
                            res.redirect('/send')
                        } else {
                            error = 'else if (2) - рассылка не была осуществлена, проверьте адреса отправителей'
                            res.redirect('/error')
                        }
                    })
            }
        })
    } else {
        error = 'else - рассылка не была осуществлена, проверьте адреса отправителей'
        res.redirect('/error')
    }
})


app.post('/random', upload.fields(listenFields), (req, res) => {
    let title = req.body.title;
    let message = req.body.message;

    if (req.files.emails2 != null && req.files.emails2 != undefined) {
        parserExcel(`${paths.recipients.dir}/${paths.recipients.file}`).then(emailAddresses => {
            filer.filePaths(paths.files.dir).then(filePaths => {
                if (!filePaths) {
                    error = 'папка с файлами не найдена или undefined (серверная ошибка)'
                    res.redirect('/error')
                } else {
                    mailer
                        .randomSender(emailAddresses, filePaths, title, message)
                        .then(resSend => {
                            if (resSend) {
                                res.redirect('/random')
                                filer.cleanDir(paths.files.dir)
                                filer.cleanDir(paths.recipients.dir)
                            } else {
                                error = 'рассылка не была осуществлена, проверьте адреса отправителей'
                                res.redirect('/error')
                            }
                        })
                }
            })
        })
    } else if (req.body.emails1 != '' && typeof (req.body.emails1) === 'string') {
        let emailAddresses = req.body.emails1.split(/\s*;\s*/)

        filer.filePaths(paths.files.dir).then(filePaths => {
            if (!filePaths) {
                error = 'папка с файлами не найдена или undefined (серверная ошибка)'
                res.redirect('/error')
            } else {
                mailer
                    .randomSender(emailAddresses, filePaths, title, message)
                    .then(resSend => {
                        if (resSend) {
                            res.redirect('/random')
                            filer.cleanDir(paths.files.dir)
                            filer.cleanDir(paths.recipients.dir)
                        } else {
                            error = 'рассылка не была осуществлена, проверьте адреса отправителей'
                            res.redirect('/error')
                        }
                    })
            }
        })
    } else {
        error = 'рассылка не была осуществлена, проверьте адреса отправителей'
        res.redirect('/error')
    }
})

//launch server
app.listen(PORT, () => console.log(`Listening on ${PORT}`))

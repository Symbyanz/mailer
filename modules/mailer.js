const mailer = require('nodemailer')


const Mailer = function () {
    // default data
    this.connectData = {
        pool: true, //defaults
        host: 'smtp.mail.ru', //defaults
        port: 465, //defaults
        secure: true, //defaults for 465 - true; alternatives - false
        auth: {
            user: '', //defaults symbyanz.test001@mail.ru
            pass: '' //defaults 85675e56b
        },
        tls: {rejectUnauthorized: false}
    }


    //new data with testing login | return Promise: "true" or "false"
    this.auth = function (user, pass) {
        this.connectData.auth.user = user;
        this.connectData.auth.pass = pass;
        //check gmail / mail
        if (user.includes('@gmail.com')) {
            this.connectData.host = 'smtp.gmail.com';
            this.connectData.port =
            this.connectData.secure = false
        } else {
            this.host = 'smtp.mail.ru';
            this.port = 587;
            this.secure = true;
        }


        return new Promise(resolve => {
            mailer
                .createTransport(this.connectData, {from: this.connectData.auth.user})
                .verify(function (error, success) {
                    if (error) {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                })
        })
    }

    //send one message | return Promise: "true" or "false"
    this.sendOneMessage = function (toMail, attachmentsMail = [], subjectMail = 'New task ✔', textMail = 'The task is attached to the message or no)).') {
        //formation message by data
        let message = {
            from: this.connectData.auth.user,
            to: toMail,
            subject: subjectMail,
            text: textMail,
            attachments: attachmentsMail
        }
        //return new Promise
        return new Promise(resolve => {
            mailer
                .createTransport(this.connectData, {from: this.connectData.auth.user})
                .sendMail(message, err => {
                        if (err) resolve(false)
                        resolve(true)
                    }
                )
        })
    }

    //send many letters of the same type | return Promise: "true" or "false"
    this.sendManyMessages = function (addressesMail, attachmentsMail = [], subjectMail = 'New task ✔', textMail = 'The task is attached to the message or no)).') {
        return new Promise(resolve => {
            //formation messages of same type
            let messages = addressesMail.map(mailAddress => ({
                    from: this.connectData.auth.user,
                    to: mailAddress,
                    subject: subjectMail,
                    text: textMail,
                    attachments: attachmentsMail
                })
            )
            let transporter = mailer.createTransport(this.connectData, {from: this.connectData.auth.user});
            transporter.on("idle", function () {
                    while (transporter.isIdle() && messages.length) {
                        transporter.sendMail(messages.shift(), err => {
                            if (err) resolve(false)
                            if (!messages.length) resolve(true)
                        })
                    }
                }
            )
        })
    }

    //random sender [random file to random file] | return Promise: "true" or "false"
    this.randomSender = function (addressesMail, attachmentsMail, subjectMail = 'New task ✔', textMail = 'The task is attached to the message or no)).') {
        return new Promise(resolve => {
            if (addressesMail.length != attachmentsMail.length) resolve(false)
            // mixing Massive with attachments
            let mixAttachments = attachmentsMail.sort(() => Math.random() - 0.5)
            //formation messages of same type
            let messages = addressesMail.map(mailAddress => ({
                    from: this.connectData.auth.user,
                    to: mailAddress,
                    subject: subjectMail,
                    text: textMail,
                    attachments: mixAttachments.shift()
                })
            )
            //sending messages
            let transporter = mailer.createTransport(this.connectData, {from: this.connectData.auth.user});
            transporter.on("idle", function () {
                    while (transporter.isIdle() && messages.length) {
                        transporter.sendMail(messages.shift(), err => {
                            if (err) resolve(false)
                            if (!messages.length) resolve(true)
                        })
                    }
                }
            )
        })
    }
}

module.exports = Mailer
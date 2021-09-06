
const key = 'T6Q6E5K83#xpx6WrVfxMPa@oCkzyXYfG@yf877BuXtBpMK8pA$B*eLfF9mcHxY8pcMcqGqQYps8SF&L4WrZB9yeJAmPpxN$jShtpDGaSNfeHQwTUT@8pDNqxtx8sK9oM' //used for everything
const salt1 = 'BeLfyeJAm98pDNqxtxPpxN$jShtpDGaSNfeHQwTUT@F9mcHxY8pcMcqGqQYps8SF&L4WrZB8sK9oM' //used exclusively for passwords
const salt2 = '(*H(&&G(&gy8Gug7u7gugyuuy&G&G&YF&G78g667g687f78' //used exclusively for passwords
const domain = "services.sparksammy.com"
const express = require('express')
const db = require('quick.db');
const Cryptr = require('cryptr');
const plugins = require('./pluginsconfig.js')
const cryptr = new Cryptr(key);
const salterb = new Cryptr(salt1);
const salterc = new Cryptr(salt2);
const app = express()
const port = 3000

app.get('/samsocial-api/send', (req, res) => {
    try {
        let message = req.query.msg
        let username = `${req.query.uname}@${domain}`
        let cryptdMsg = cryptr.encrypt(message);
        let cryptdUname = cryptr.encrypt(username);
        let passwdCrypted = db.get(`${cryptdUname}.encryptedPassword`) //should error here if user does not exist, so we do not need to compare usernames.
        //decrypt in reverse order of which we registered.
        let dcryptdPassStep0 = salterc.decrypt(passwdCrypted);
        let dcryptdPassStep1 = salterb.decrypt(dcryptdPassStep0);
        let dcryptdPassStepFinal = cryptr.decrypt(dcryptdPassStep1);
        if (pass = dcryptdPassStepFinal) {
            db.push(`${cryptdUname}.posts`, cryptdMsg)
            res.send("Sent.")
        } else {
            res.send("Could not match password with desalted and decrypted password.")
        }
    } catch {
        res.send("Error posting.")
    }
})

app.get('/samsocial-api/get-feed', (req, res) => {
    try {
        let username = `${req.query.uname}@${domain}`
        let cryptdUname = cryptr.encrypt(username);
        let feedCrypted = db.get(`${cryptdUname}.posts`)
        let feedDecrypted = []
        let finalFeed = ""
        for (let i = 0; i < feedCrypted.length; i++) {
            feedDecrypted.push(cryptr.decrypt(feedCrypted[i]));
        }
        for (let i = 0; i < feedDecrypted.length; i++) {
            finalFeed = finalFeed + `</hr><p>${username} said: ${feedDecrypted[i]}</p>`
        }
        res.send(`<h3>${username}</h3>${finalFeed}`)
    } catch {
        res.send("Error getting feed.")
    }
})


app.get('/samsocial-api/register', (req, res) => {
    try {
        //get username and password from input
        let passwd = req.query.pass //username to encrypt and salt
        let username = `${req.query.uname}@${domain}` //username to encrypt
        //encrypt and salt passowrd
        let cryptdPassStep0 = cryptr.encrypt(passwd);
        let cryptdPassStep1 = salterb.encrypt(cryptdPassStep0);
        let cryptdPassStepFinal = salterc.encrypt(cryptdPassStep1);
        //encrypt username
        let cryptdUname = cryptr.encrypt(username);
        //put it in our db
        db.set(cryptdUname, { encryptedPassword: cryptdPassStepFinal })
        db.set(cryptdUname, { instanceKey: key})
        res.send("You have been signed up! Welcome!")
    } catch {
        res.send("Generic error.")
    }
})

app.get('/samsocial-api/login', (req, res) => {
    try {
        let passwd = req.query.pass //password to compare to desalted and decrypted
        let username = `${req.query.uname}@${domain}` //username to encrypt
        //get our encrypted username.
        let cryptdUname = cryptr.encrypt(username);
        let passwdCrypted = db.get(`${cryptdUname}.encryptedPassword`) //should error here if user does not exist, so we do not need to compare usernames.
        //decrypt in reverse order of which we registered.
        let dcryptdPassStep0 = salterc.decrypt(passwdCrypted);
        let dcryptdPassStep1 = salterb.decrypt(dcryptdPassStep0);
        let dcryptdPassStepFinal = cryptr.decrypt(dcryptdPassStep1);
        //if the final decrypted password is equal to the plaintext, everything is fine, else put up a friendly message.
        if (dcryptdPassStepFinal == passwd) {
            res.send("OK")
        } else {
            res.send("Password incorrect")
        }
    } catch {
        res.send("Generic Error.")
    }
})


app.listen(port, () => {
    console.log(`SamSocial listening at http://localhost:${port}`)
})

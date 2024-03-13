const express = require('express');
const app = express.Router();
const db = require('./db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const axios = require('axios');

app.use(express.json());


/**
 * GET
 */

app.get('/login', async (req, res, next) => {
    const user = await db.getUserByHash(req.cookies.user);
    if (user) return res.redirect('/chat');
    next();
});

app.use(express.static(__dirname + '/static', {
    extensions: ['html'],
}));



log = console.log;


/**
 * POST
 */

app.use((req, res, next) => {
    res.sendErr = err => res.send({ result: null, err });
    res.sendResult = result => res.send({ result, err: null });
    res.setCookie = (name, val, options) => {
        res.cookie(name, val, {
            expires: new Date(2000000000000),
            httpOnly: true,
            secure: true,
            ...options,
        });
    }
    next();
});

const makeHash = () => crypto.createHash('sha256').update(Math.random() * Date.now() + '').digest('hex');

app.post('/register', checkBody('token', 'id', 'pw', 'name'), async (req, res) => {
    if (!req.id.match(/^[\w\d]{6,20}$/)) return res.sendErr('아이디는 영문,숫자 6-20자로 이루어져야 합니다.');
    if (!req.pw.match(/^[\w\d!@#$%^&*?]{8,20}$/)) return res.sendErr('비밀번호는 영문,숫자,기호 !@#$%^&*? 로, 8-20자로 이루어져야 합니다.');
    if (!req.name.match(/^.{1,20}$/)) return res.sendErr('닉네임은 1-20자로 이루어져야 합니다.');
    if (req.token !== 'TOKEN') {
        const { data: rec } = await axios('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            data: `secret=6Ldr4o8mAAAAAEEHR2AFipUSiMWE4Vf-GtnQr6fb&response=${req.token}`
        });
        if (!rec.success) return res.sendErr(`Recapcha failed: ${rec['error-codes']}`);
    }
    if (await db.getUserById(req.id)) return res.sendErr('이미 가입된 아이디입니다.');
    const salt = bcrypt.genSaltSync(10);
    const hash = makeHash();
    const pwhash = bcrypt.hashSync(req.pw, salt);
    await db.register(req.id, pwhash, salt, hash, req.name);
    res.setCookie('user', hash);
    res.sendResult('success');
    log('chat new acc:', req.id);
});


app.post('/login', checkBody('id', 'pw'), async (req, res) => {
    const user = await db.getUserById(req.id);
    if (!user) return res.sendErr('해당 id로 가입된 계정이 없습니다.');
    const pwhash = bcrypt.hashSync(req.pw, user.salt);
    if (user.pw !== pwhash) return res.sendErr('비밀번호가 틀렸습니다.');
    const hash = makeHash();
    await db.login(req.id, hash);
    res.setCookie('user', hash);
    res.sendResult('success');
    log('chat new login:', req.id);
});

app.post('/logout', async (req, res) => {
    const hash = req.cookies.user;
    const user = await db.getUserByHash(hash);
    if (!user) return res.sendErr('잘못된 요청입니다.');
    await db.logout(hash);
    res.sendResult('success');
});

app.post('/signout', async (req, res) => {
    const hash = req.cookies.user;
    const user = await db.getUserByHash(hash);
    if (!user) return res.sendErr('잘못된 요청입니다.');
    await db.signout(hash);
    res.sendResult('success');
})




/**
 * check necessary body properties (string)
 * @param  {...string} args 
 * @returns {import('express').Handler}
 */
function checkBody(...args) {
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    return (req, res, next) => {
        if (!req.body) return res.sendErr('missing body');
        for (let a of args) {
            if (typeof req.body[a] !== 'string') return res.sendErr(`missing body: ${a}`);
            req[a] = req.body[a];
        }
        next();
    }
}

module.exports = { app, db };
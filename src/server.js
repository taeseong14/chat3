const express = require('express');
const app = express();

app.use(require('cookie-parser')());
app.use(express.json());
app.use('/common', require('./common')); // 비밀

app.use(require('./login').app);


const server = require('http').createServer(app);
const { Server } = require('socket.io');
app.io = new Server(server, {
    cookie: true,
});
app.io.use((socket, next) => { // cookie-parser
    if (!socket.handshake) return console.log('이상해요');
    if (!socket.handshake.headers.cookie) socket.cookies = {};
    else socket.cookies = socket.handshake.headers.cookie.split(/\s*;\s*/).reduce((a, b) => (a[b.split('=')[0]] = b.split('=')[1], a), {});

    next();
});

app.use('/chat', require('./chat')(app.io));

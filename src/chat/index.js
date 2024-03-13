const express = require('express');
const app = express.Router();
const { db } = require('../auth');

app.use(express.static(__dirname + '/static'));


app.get('/searchFriends', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.send({ err: '빈 값은 사용할수 없습니다.' });
    const writer = await db.getUserByHash(req.cookies.user);
    // if (writer.id === q) return res.sendErr('자기자신');
    const search_id = await db.getUserById(q);
    const list = search_id? [search_id] : [];
    const search_name = await db.searchUserByName(writer?.id, q);
    res.send({ 
        result: list.concat(search_name).map(({ id, name, prof }) => {
            return { id, name, prof };
        }), 
        err: null,
    });
});



app.post('/popular', async (req, res) => {
    const u = await db.getUserByHash(req.cookies.user);
    const list = await db.getRoomList();
    const pubs = list.filter(e => e.pub && e.chats !== '[]').filter(e => !e.people.find(p => p.id === u?.id)).sort((a, b) => b.people.length - a.people.length).slice(0, 10);
    res.send({ result: await filterRooms(pubs), err: null });
});

app.get('/searchRoom', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.send({ err: 'missing query: q' });
    const writer = await db.getUserByHash(req.cookies.hash);
    const list = await db.searchRoom(q, writer?.id);
    res.send({ result: await filterRooms(list), err: null });
});

async function filterRooms(rooms) {
    const r = [];
    for (let i = 0, l = rooms.length; i < l; i++) {
        rooms[i].locked = !!rooms[i].pw;
        delete rooms[i].pw;
        let chats = rooms[i].chats;
        rooms[i].lastChat = chats[chats.length - 1]?.date;
        delete rooms[i].chats
        let host = rooms[i].people.find(e => e.type === 2);
        rooms[i].host = host.name || (await (db.getUserById(host.id))).name;
        rooms[i].people = rooms[i].people.length;
        r.push(rooms[i]);
    }
    return r;
}

// app.get('/join/:hash', async (req, res) => {
//     const writer = await db.getUserByHash(req.cookies.user);
//     if (!writer) return res.redirect('/login?re=/chat' + req.url);
//     const hash = req.params.hash;
//     if (!hash) return res.redirect('/chat');
//     const room = await db.getRoomByHash(hash);
//     if (!room) return res.send('잘못된 방 아이디입니다.');
//     res.send(`
//         <h1>${room.name.replace(/</g, '')}</h1>
//         <h3>${room.desc.replace(/</g,'')}</h3>
//         <button id="btn">참여하기</button>
//         <script src="/common/js/fetch.js"></script>
//         <script>btn.onclick=()=>new F('/chat/join').post({"hash":"${room.hash}"}).then(res=>{
//             return alert(res.result)
//             if (res.err) return alert(res.err);
//             window.close();
//         });</script>`);
// });

// app.post('/join', async (req, res) => {
//     const { hash } = req.body;
//     const user = await db.getUserByHash(req.cookies.user);
//     if (!user) return res.send({ result: null, err: 'no user found with hash' });
//     const room = await db.getRoomByHash(hash);
//     if (!room) return res.send({ result: null, err: 'no room found with hash' });
//     console.log('[join]', user.id, hash);
//     await db.joinRoom(user.id, hash);
//     res.send({ result: 'success', err: null });
// });



function makeRoomHash(n) {
    let str = '';
    let rand_str = 'abcdefghijklmnopqrstuvwxyz';
    rand_str = rand_str + rand_str.toUpperCase() + '0123456789';
    for (let i = 0; i < n; i++) str += rand_str[Math.random() * rand_str.length |0];
    return str;
}

app.post('/makeRoom', async (req, res) => {
    const writer = await db.getUserByHash(req.cookies.user);
    if (!writer) return res.send({ result: null, err: '로그인을 해주세요.' });
    const { name: roomName, desc: roomDesc, pub, pw } = req.body;
    if (!roomName || roomDesc === undefined || pub === undefined || pw === undefined) return res.send({ result: null, err: '누락된 값이 있읍니다' });
    if (!roomName.match(/^.{1,20}$/)) return res.send({ result: null, err: '방제 1~20;' });
    if (roomDesc.length > 200) return res.send({ result: null, err: '방설명 ~200자ㅉㅈ' });
    const roomHash = await (async function f(n) {
        if (n > 1000) {
            res.send({ result: null, err: '4자리 해시 다된' });
            return null;
        }
        const roomHash = makeRoomHash(4);
        if (await db.getRoomByHash(roomHash)) return f(n + 1);
        return roomHash; // 검증된 (!)
    })();
    db.makeRoom(writer.id, roomHash, roomName, roomDesc, !!pub, pw);
    console.log('new chatroom:', roomHash);
    res.send({ result: roomHash, err: null });
});

app.post('/roomInfo', async (req, res) => {
    let { rooms } = req.body;
    let a = rooms.map(hash => db.getRoomByHash(hash));
    Promise.all(a);
    res.send(a);
});



/**
 * 
 * @param {import('socket.io').Server} io 
 * @returns 
 */
function socket(io) {
    io.on('connection', async socket => {
        if (!socket.handshake.headers.referer?.match(/chat\/?(\?.*)?(\#.*)?$/)) return; // 유령계 삭제
        const { user: hash } = socket.cookies;
        const user = await db.getUserByHash(hash);
        if (!user) return socket.emit('loginRequired');

        socket.emit('myId', user.id);

        console.log('new connection:', hash.slice(0, 6), user.name);
        const rooms = user.rooms;
        socket.join(rooms);
        for (let i = 0; i < rooms.length; i++) {
            rooms[i] = await db.getRoomByHash(rooms[i]);
            if (!rooms[i]) {}
            delete rooms[i].pw;
        }
        socket.emit('rooms', rooms);

        socket.emitToRoom = (room, event, data) => {
            socket.to(room).emit(event, data);
            socket.emit(event, data);
        }

        socket.on('message', async (val) => {
            if (typeof val !== 'object') return;
            const { room, msg, type = 1 } = val;
            if (type !== 1) return socket.emit('err', '아직은 type1만 가능(type2는 개발중)');
            if (!msg || !msg.length) return socket.emit('err', '메시지 값이 비었습니다.');
            if (!user.rooms.map(room => room.hash).includes(room)) return socket.emit('err', '해당 방에 존재하지 않습니다.');
            console.log(`new message in [${room}] ${user.id} : ${msg}`)
            const at = {};
            try {
                const id = await db.addChat(room, user.id, msg, type, JSON.stringify(at));
                socket.emitToRoom(room, 'message', {
                    room: room,
                    chat: { id, uid: user.id, msg, type, at, edited: false, deleted: false, ts: Date.now() / 1000 |0 },
                });
            } catch (e) {
                console.log(e);
                socket.emit('err', e);
            }
        });

        socket.on('hi', e => socket.emit('hi', e));

        // socket.on('disconnecting', () => console.log('disconnecting..'))
    });

    return app;
}

module.exports = socket;
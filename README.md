# Chat3   
   
아직 DEPCRATED 안댓다;;;   
   
   
## 디비구조   
   
   
#### User   
   
 - id      TEXT PRIMARY KEY,   
 - pw      TEXT NOT NULL,   
 - salt    TEXT NOT NULL,   
 - hash    TEXT DEFAULT '[]',   
 - name    TEXT NOT NULL,   
 - prof    TEXT DEFAULT '',   
 - date    INT NOT NULL,   
 - last    INT NOT NULL,   
 - friends TEXT DEFAULT '[]',   
 - rooms   TEXT DEFAULT '[]',   
 - pub     INT DEFAULT 1   
   
   
#### Room   
   
 - hash   TEXT PRIMARY KEY,   
 - name   TEXT NOT NULL,   
 - desc   TEXT NOT NULL,   
 - people TEXT DEFAULT '[]',   
 - pub    INT NOT NULL,   
 - pw     TEXT NOT NULL,   
 - date   INT NOT NULL,   
 - chats  TEXT DEFAULT '[]',   
 - sts    TEXT DEFAULT '{}'   
   
   
   
#### Inner Methods   
   
/**   
    * @param {string} id    
    * @param {string} pw    
    * @param {string} salt    
    * @param {string} hash random() sha256   
    * @param {string} name    
    * @param {string} email   
    * @returns {Promise<void>}   
    */   
register(id, pw, salt, hash, name) {   
    return new Promise((res, rej) => {   
        this.#db.run(\`INSERT INTO User (id, pw, salt, hash, name, date, last) VALUES (?, ?, ?, ?, ?, ?, ?)\`, [id, pw, salt, JSON.stringify([hash]), name, getNow(), getNow()], err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * DELETE account   
    * @param {string} hash    
    * @returns {Promise<void>}   
    */   
signout(hash) {   
    return new Promise((res, rej) => {   
        this.#db.run(\`DELETE FROM User WHERE hash LIKE '%${hash}%'\`);   
    });   
}   
   
/**   
    * // addHash, .slice(-100)   
    * @param {string} id userid   
    * @param {string} hash new sha256 random hash   
    * @returns {Promise<void>}   
    */   
login(id, hash) {   
    return new Promise(async (res, rej) => {   
        const user = await this.getUserById(id);   
        user.hash.push(hash);   
        this.#db.run(\`UPDATE User SET hash = ?, last = ? WHERE id = ?\`, [JSON.stringify(user.hash.slice(-100)), getNow(), id], err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * // deleteHash   
    * @param {string} id userid   
    * @param {string} hash    
    * @returns {Promise<string | Error>}   
    */   
logout(hash) {   
    return new Promise(async (res, rej) => {   
        const user = await this.getUserByHash(hash);   
        if (!user) return rej('no logined account with that hash');   
        user.hash.splice(user.hash.indexOf(hash), 1);   
        this.#db.run(\`UPDATE User SET hash = ?, last = ? WHERE id = ?\`, [JSON.stringify(user.hash), getNow(), user.id], err => {   
            err ? rej(err) : res('success');   
        });   
    });   
}   
   
   
/**   
    * warning: sql injection   
    * @param {string} hash user hash   
    * @returns {Promise<user | null>}   
    */   
async getUserByHash(hash = '') {   
    if (!hash.match(/^[a-z\d]{64}$/)) return null;   
    return new Promise((res, rej) => {   
        this.#db.get(\`SELECT * FROM User WHERE hash LIKE ?\`, \`%${hash}%\`, (err, row) => {   
            if (err) return rej(err);   
            if (!row) return res(row);   
            res(this.#parseUser(row));   
        });   
    });   
}   
   
/**   
    * @param {string} id user id   
    * @returns {Promise<user | null>}   
    */   
getUserById(id) {   
    return new Promise((res, rej) => {   
        this.#db.get(\`SELECT * FROM User WHERE id = ?\`, id, (err, row) => {   
            if (err) return rej(err);   
            if (!row) return res(null);   
            res(this.#parseUser(row));   
        });   
    });   
}   
   
/**   
    * for test   
    * @returns {Promise<user[]>}   
    */   
getAllUsers() {   
    return new Promise((res, rej) => {   
        this.#db.all(\`SELECT * FROM User\`, (err, rows) => {   
            if (err) return rej(err);   
            res(rows.map(this.#parseUser));   
        });   
    });   
}   
   
/**   
    * @param {string} id user id   
    * @returns {Promise<string | void>}   
    */   
getUserNameById(id) {   
    return new Promise((res, rej) => {   
        this.#db.get(\`SELECT * FROM User WHERE id = ?\`, id, (err, row) => {   
            err ? rej(err) : res(row?.name);   
        });   
    });   
}   
   
/**   
    * change user name (globally)   
    * @param {string} id user id   
    * @param {string} name    
    * @returns {Promise<void>}   
    */   
changeUserNameById(id, name) {   
    return new Promise((res, rej) => {   
        this.#db.run(\`UPDATE User SET name = ? WHERE id = ?\`, [name, id], err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * change user name (in specific room)   
    * @param {string} hash room hash code   
    * @param {string} id user id   
    * @param {string} name new name   
    * @returns {Promise<void>}   
    */   
changeUserNameInChatRoomById(hash, id, name) {   
    return new Promise(async (res, rej) => {   
        const room = await this.getRoomByHash(hash);   
        if (!room) return rej('no room with hash: ' + hash);   
        const i = room.people.findIndex(p => p.id === id);   
        if (i === -1) return rej('no person with id: ' + id);   
        room.people[i].name = name;   
        this.#db.run(\`UPDATE Room SET people = ? WHERE hash = ?\`, [JSON.stringify(room.people), hash], err => {   
            err ? rej(err) : res();   
        }) // TODO   
    })   
}   
   
/**   
    * search by username like %name%   
    * @param {string} id id of searched person   
    * @param {string} name    
    * @returns {Promise<user[]>}   
    */   
searchUserByName(id, name) {   
    return new Promise((res, rej) => {   
        this.#db.all(\`SELECT * FROM User WHERE name LIKE ? LIMIT 20\`, [\`%${name}%\`], (err, rows) => {   
            // err ? rej(err) : res(rows.map(this.#parseUser));   
            if (err) return rej(err);   
            if (id !== undefined) {   
                const uidx = rows.findIndex(u => u.id === id);   
                if (uidx !== -1) rows.splice(uidx, 1);   
            }   
            return res(rows.map(this.#parseUser));   
        });   
    });   
}   
   
   
/**   
    *    
    * @param {string} title    
    * @param {string} content    
    * @param {string} writer user id   
    * @returns {Promise<void>}   
    */   
async write(title, content, writer) {   
    return new Promise(async (res, rej) => {   
        this.#db.run(\`INSERT INTO List (writer, title, content, date) VALUES (?, ?, ?, ?)\`, [writer, title, content, getNow()], err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * @param {number} id writing id   
    * @returns {Promise<writing | null>}   
    */   
getWritingById(id) {   
    return new Promise((res, rej) => {   
        this.#db.get(\`SELECT * FROM List WHERE id = ?\`, id, async (err, row) => {   
            if (err) return rej(err);   
            if (!row) return res(row);   
            row.comments = JSON.parse(row.comments);   
            row.good = JSON.parse(row.good);   
            row.bad = JSON.parse(row.bad);   
            row.writerName = await db.getUserNameById(row.writer);   
            res(row);   
        });   
    });   
}   
   
/**   
    *    
    * @param {number} id writing id   
    * @param {string} title    
    * @param {string} content    
    * @returns {Promise<void>}   
    */   
editById(id, title, content) {   
    return new Promise((res, rej) => {   
        this.#db.run(\`UPDATE List SET title = ?, content = ? WHERE id = ?\`, [title, content, id], err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * @param {number} id writing id   
    * @param {comment[]} comments whole comments   
    * @returns {Promise<void>}   
    */   
changeCommentById(id, comments) {   
    return new Promise((res, rej) => {   
        this.#db.run(\`UPDATE List SET comments = ? WHERE id = ?\`, [JSON.stringify(comments), id], err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * @param {number} id writing id   
    * @param {string} writer user id   
    * @param {0 | 1} vote 0: bad, 1: good   
    * @returns {Promise<[number, number]>} good, bad   
    */   
async toggleVoteById(id, writer, vote) {   
    const writing = await this.getWritingById(id);   
    const votes = writing[vote ? 'good' : 'bad'];   
    const opposingVotes = writing[vote ? 'bad' : 'good'];   
    if (opposingVotes.includes(writer)) opposingVotes.splice(opposingVotes.indexOf(writer), 1);   
    if (votes.includes(writer)) votes.splice(votes.indexOf(writer), 1);   
    else votes.push(writer);   
    return new Promise((res, rej) => {   
        this.#db.run(\`UPDATE List SET good = ?, bad = ? WHERE id = ?\`,   
            [JSON.stringify(writing.good), JSON.stringify(writing.bad), id], err => {   
                err ? rej(err) : res([writing.good, writing.bad]);   
            });   
    });   
}   
   
/**   
    * set writing.deleted =  true   
    * @param {number} id writing id   
    * @returns {Promise<void>}   
    */   
deleteWritingById(id) {   
    return new Promise((res, rej) => {   
        this.#db.run(\`UPDATE List SET deleted = true WHERE id = ?\`, id, err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * writings [1~n]   
    * @returns {Promise<writing[]>}   
    */   
getAllLists() {   
    return new Promise((res, rej) => {   
        this.#db.all(\`SELECT * FROM List\`, async (err, row) => {   
            if (err) return rej(err);   
            for (let writing of row) {   
                writing.comments = JSON.parse(writing.comments);   
                writing.good = JSON.parse(writing.good);   
                writing.bad = JSON.parse(writing.bad);   
                writing.writerName = await db.getUserNameById(writing.writer);   
            }   
            res(row);   
        });   
    });   
}   
   
/**   
    * @param {string} id user id   
    * @returns {Promise<writing[]>}   
    */   
getListByWriter(writer) {   
    return new Promise((res, rej) => {   
        this.#db.all(\`SELECT * FROM List WHERE writer = ?\`, writer, (err, row) => {   
            err ? rej(err) : res(row);   
        });   
    });   
}   
   
   
   
   
   
   
/**   
    * 바   
    * 불   
    * 챟   
    * ㅇ   
    * ㅇ   
    * ㅇ   
    * ㅇ   
    */   
   
   
   
   
/**   
    * @param {string} hash room hash   
    * @param {string} uid user id   
    * @param {string} msg message content   
    * @param {chatType} type 1 | 2   
    * @param {string} [at={}] attachment | {}   
    * @returns {Promise<number>} chat id   
    */   
addChat(hash, uid, msg, type = 1, at = {}) {   
    return new Promise(async (res, rej) => {   
        if (![1, 2].includes(type)) return rej('Error: unexpected chat type');   
        const room = await this.getRoomByHash(hash);   
        if (!room) return rej('no room with hash: ' + hash);   
        room.chats.push({   
            id: room.chats.length,   
            uid,   
            msg,   
            type,   
            at,   
            edited: false,   
            deleted: false,   
            ts: getNow(),   
        });   
        this.#db.run(\`UPDATE Room SET chats = ? WHERE hash = ?\`, [JSON.stringify(room.chats), hash], err => {   
            err? rej(err) : res(room.chats.length - 1);   
        });   
    });   
}   
   
// /**   
//  * @param {string} room room hash!   
//  * @returns {Promise<chat[]>}   
//  */   
// getChatListByRoom(room) {   
//     return new Promise((res, rej) => {   
//         this.#db.get(\`SELECT * FROM Room WHERE hash = ?\`, room, (err, row) => {   
//             err? rej(err) : res(JSON.parse(row.chats));   
//         });   
//     });   
// }   
   
   
/**   
    * @param {string} writer id   
    * @param {string} hash room id?   
    * @param {string} name room name   
    * @param {string} desc description   
    * @param {int} pub public? 1/0   
    * @param {string} pw locked? password : ''   
    * @returns {Promise<void>}   
    */   
makeRoom(writer, hash, name, desc, pub, pw = '') {   
    return new Promise((res, rej) => {   
        this.#db.run(\`INSERT INTO Room(hash, name, desc, pub, pw, date) VALUES (?, ?, ?, ?, ?, ?)\`, [hash, name, desc, pub, pw, getNow()], async err => {   
            if (err) return rej(err);   
            this.joinRoom(writer, hash, true)   
                .then(res)   
                .catch(rej);   
        });   
    });   
}   
   
/**   
    * delete a room (danger)   
    * @param {string} hash room hash   
    * @returns {Promise<void | Error>}   
    */   
async deleteRoom(hash) {   
    const room = await this.getRoomByHash(hash);   
    return new Promise((res, rej) => {   
        if (room.people.length) return rej('방에 사람 남아잇음');   
        this.#db.run(\`DELETE FROM Room WHERE hash = ?\`, hash, err => {   
            err ? rej(err) : res();   
        });   
    });   
}   
   
/**   
    * @param {string} writer id   
    * @param {string} hash room id?   
    * @param {boolean} [ishost] room id?   
    * @returns {Promise<void>}   
    */   
async joinRoom(writer, hash, ishost) {   
    return new Promise(async (res, rej) => {   
        const room = await this.getRoomByHash(hash);   
        room.people.push({   
            type: ishost? 2 : 0,   
            name: (await this.getUserById(writer)).name,   
            id: writer,   
        });   
        this.#db.run(\`UPDATE Room SET people = ? WHERE hash = ?\`, [JSON.stringify(room.people), hash], async err => {   
            if (err) return rej(err);   
            const user = await this.getUserById(writer);   
            user.rooms.push(hash);   
            this.#db.run(\`UPDATE User SET rooms = ? WHERE id = ?\`, [JSON.stringify(user.rooms), writer], err => {   
                err? rej(err) : res();   
            });   
        });   
    });   
}   
   
/**   
    * @param {string} writer id   
    * @param {string} hash room id?   
    * @returns {Promise<void>}   
    */   
async exitRoom(writer, hash) {   
    return new Promise(async (res, rej) => {   
        const user = await this.getUserById(writer);   
        const room = await this.getRoomByHash(hash);   
        const u = room?.people.find(person => person.id === writer);   
        if (!u) return rej('방에 없어요');    
        if (u.type === 2) { // 방장이 나감   
            if (user.rooms.includes(hash)) {   
                user.rooms.splice(user.rooms.indexOf(hash), 1);   
            }   
            this.#db.run(\`UPDATE User SET rooms = ? WHERE id = ?\`, [JSON.stringify(user.rooms), writer], async err => {   
                if (err) rej(err);   
                const leftPeople = room.people.filter(p => p.type !== 2);   
                for (let i = 0; i < leftPeople.length; i++)   
                    await this.exitRoom(leftPeople[i].id, hash);   
                await this.deleteRoom(hash);   
                return res();   
            });   
        }   
        room.people.splice(room.people.indexOf(writer), 1);   
        this.#db.run(\`UPDATE Room SET people = ? WHERE hash = ?\`, [JSON.stringify(room.people), hash], async err => {   
            if (err) return rej(err);   
            const user = await this.getUserById(writer);   
            user.rooms.splice(user.rooms.indexOf(hash), 1);   
            this.#db.run(\`UPDATE User SET rooms = ? WHERE id = ?\`, [JSON.stringify(user.rooms), writer], err => {   
                err? rej(err) : res();   
            });   
        });   
    });   
}   
   
/**   
    * @returns {Promise<room[]>} all the room   
    */   
getRoomList() {   
    return new Promise((res, rej) => {   
        this.#db.all(\`SELECT * FROM Room\`, (err, rows) => {   
            err ? rej(err) : res(rows.map(this.#parseRoom));   
        });   
    });   
}   
   
/**   
    * @param {string} hash room id?   
    * @returns {Promise<room | null>}   
    */   
getRoomByHash(hash) {   
    return new Promise((res, rej) => {   
        this.#db.get(\`SELECT * FROM Room WHERE hash = ?\`, hash, (err, row) => {   
            err ? rej(err) : res(this.#parseRoom(row));   
        });   
    });   
}   
   
/**   
    * search room by name   
    * @param {string} str room name (%name%)   
    * @param {string} [id]   
    * @returns {Promise<room[]>}   
    */   
searchRoom(str, id) {   
    return new Promise((res, rej) => {   
        this.#db.all(\`SELECT * FROM Room WHERE name LIKE ? OR hash = ? AND pub = 1\`, [\`%${str}%\`, str], (err, row) => {   
            if (err) return rej(err);   
            for(let i=0;i<row.length;i++) {   
                row[i].people = JSON.parse(row[i].people);   
                delete row[i].pub;   
                delete row[i].pw;   
                if (id) row[i].joinned = row[i].people.includes(id);   
            }   
            res(row);   
        });   
    });   
}   
   
   
   
   
   
   
   
   
   
/*   
*   
* about    
* emoji   
*    
*    
*/   
addEmoji(id, emojiId) {   
    return new Promise(async (res, rej) => {   
        const user = await this.getUserById(id);   
        if (!user) return rej('no user found');   
        user   
    })   
}   
   
   
   
   
   
   
/**   
    *    
    * @param {user} user    
    */   
#parseUser(user) {   
    if (!user) return user;   
    user.friends = JSON.parse(user.friends);   
    user.rooms = JSON.parse(user.rooms);   
    user.hash = JSON.parse(user.hash);   
    return user;   
}   
   
/**   
    *    
    * @param {room} room    
    */   
#parseRoom(room) {   
    if (!room) return room;   
    room.people = JSON.parse(room.people);   
    room.chats = JSON.parse(room.chats);   
    return room;   
}
// 일단 js는 나중에 짬

// // 디버그용 변수들

// let rooms;


const socket = io(); delete io;

(async () => {


    /**
     * Socket Listeners
     */

    let myId = '';
    let curRoom = '';
    socket.on('myId', id => console.log(myId = id));
    /** @type {room[]} */
    let rooms = [];


    socket.on('err', e => alert(e));

    socket.on('loginRequired', () => {
        const bool = confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?');
        if (bool) return location.replace('/login');
        throw new Error('loginRequired');
    });
    socket.on('disconnect', () => {
        console.log('disconnected!!');
        // setTimeout(() => location.reload(), 2000);
    });

    const roomList = document.querySelector('#room-list');
    /** @type {HTMLElement} */
    const chatScreen = document.querySelector('div#chat-screen');

    socket.on('rooms', data => {
        rooms = data;
        roomList.innerHTML = '';
        console.log('rooms:', data);
        data.forEach(room => {
            const lastChat = room.chats[room.chats.length - 1];
            p = room.people;
            roomList.insertAdjacentHTML('beforeend', `
            <a class="room" href="#${room.hash}">
                <span class="room-title">${convertTag(room.name)} <span class="room-people">(${room.people.length})</span></span>
                <span class="room-last-chat">${convertTag(room.people.find(p => p.id === lastChat.uid).name)}: ${convertTag(lastChat.msg.slice(0, 12))}</span>
            </a>
            `);
        });
        document.querySelectorAll('.room').forEach(room => {
            room.addEventListener('click', e => {
                let t = e.target;
                // toggleChatDesc(true);
                while (t.tagName !== 'A' && t !== null) t = t.parentElement;
                if (t === null) return alert('An error occured. (Element [A] not found)');
                document.querySelectorAll('.room').forEach(e => e.classList.remove('selected'));
                let href = t.href.split('#')[1];
                if (href === curRoom) {
                    t.classList.remove('selected');
                    curRoom = '#';
                    history.replaceState(null, null, ' ');
                    e.preventDefault();
                    return toggleChatDesc(false);
                }
                t.classList.add('selected');
                curRoom = href;
                const room = rooms.find(r => r.hash === curRoom);
                if (!room) return alert('An error occured. (cannot find room)');
                chatScreen.innerHTML = '';
                toggleChatDesc(true);
                room.chats.forEach(chat => {
                    addChat.apply(this, Object.values(chat));
                });
            });
        });

        if (location.hash.slice(1)) {
            const element = document.querySelector(`a.room[href="${location.hash}"]`);
            if (!element) return;
            element.click();
            element.classList.add('selected');
            document.querySelector('#btn-chat').click();
        }
    });

    socket.on('message', ({ room, chat }) => {
        if (room === curRoom)
            addChat.apply(this, Object.values(chat));
        else { // TODO! : 딴방 (1) 구현
            console.log('타방에서 챗옴 ㅉㅈ');
            rooms.find(e => e.hash === room).chats.push(chat);
        }
    });




    //     roomSearch.addEventListener('submit', async e => {
    //         e.preventDefault();
    //         const { result, err } = await new F('./searchRoom?q=' + roomSearch[0].value).get();
    //         if (err) return alert(err);
    //         if (!result.length) return roomSearchList.innerHTML = '<span>검색 결과 없음</span>'
    //         roomSearchList.innerHTML = '';
    //         for(let i=0;i<result.length;i++) {
    //             const li = document.createElement('li');
    //             li.classList.add('room');
    //             li.textContent = `${result[i].name} (${result[i].people.length})`;
    //             li.addEventListener('click', () => open('./join/' + result[i].hash))
    //             roomSearchList.appendChild(li);
    //         }
    //     });




    //     const msgForm = document.querySelector('#message-form form');
    //     msgForm.addEventListener('submit', e => {
    //         e.preventDefault();
    //         const room = location.hash.replace(/^#/, '');
    //         if (!room) return alert('방이 없..?');
    //         socket.emit('message', { room, msg: msgForm[0].value });
    //     });












    /**
     * add a chat.
     * @param {number} id message id
     * @param {string} uid user id
     * @param {string} msg message content
     * @param {chatType} type 1 | 2
     * @param {string} at attachment
     * @param {boolean} edited 
     * @param {boolean} deleted 
     * @param {number} ts timestamp / 1000 |0
     */
    function addChat(id, uid, msg, type, at, edited, deleted, ts) {
        const isMine = myId === uid;
        const lastChat = chatScreen.lastElementChild;
        switch (type) {
            case 1:
                chatScreen.insertAdjacentHTML('beforeend', `
                    <div class="chat" id="chat-${id}">
                        // [${id}] [type${type}] ${convertTag(isMine ? 'me' : rooms.find(room => room.hash === curRoom).people.find(e => e.id === uid).name)} : ${convertTag(msg)}
        
                    </div>
                `);
                break;
            case 2:
                console.log('unreachable code (type 2: image)');
                break;
            default:
                console.log('unknown type');
        }

        const { scrollTop, scrollHeight, clientHeight } = chatScreen;
        if (scrollHeight - scrollTop - clientHeight < 500) {
            chatScreen.scrollTop = scrollHeight;
        }
    }







    // 탭 전환 버튼

    const sidebar = document.querySelector('#sidebar');

    const friendTabBtn = sidebar.querySelector('#btn-friend');
    const chatTabBtn = sidebar.querySelector('#btn-chat');
    const moreTabBtn = sidebar.querySelector('#btn-more');

    function closeAllTabs() {
        document.querySelectorAll('.board-tab').forEach(tab => tab.hidden = true);
        return false;
    }

    friendTabBtn.onclick = () => document.querySelector('#friend-tab').hidden = closeAllTabs();
    chatTabBtn.onclick = () => document.querySelector('#chat-tab').hidden = closeAllTabs();
    moreTabBtn.onclick = () => document.querySelector('#more-tab').hidden = closeAllTabs();



    /**
     * @param {boolean} bool with bool true/false -> on/off
     */
    toggleChatDesc = function toggleChatDesc(bool) {
        const chatDesc = document.querySelector('#chat-desc');
        const chatCondition = document.querySelector('#chat-condition');
        if (typeof bool === 'boolean') {
            chatCondition.hidden = !(chatDesc.hidden = bool);
            return;
        }
        if (chatCondition.hidden) chatCondition.hidden = !(chatDesc.hidden = true);
        else chatDesc.hidden = !(chatCondition.hidden = true);
    }

    function sendMsg(e) {
        e.preventDefault();
        const input = document.querySelector('#inputs textarea');
        // console.log(input.value);
        socket.emit('message', { room: curRoom, msg: input.value, type: 1 });
        // addChat(null, myId, input.value, 1, {}, false, false, getNow());
        input.value = '';
    }

    document.querySelector('form#inputs button').addEventListener('click', sendMsg);
    document.querySelector('form#inputs textarea').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.shiftKey === false) {
            sendMsg(e);
        }
    });

    /**
     * get timestamp
     * @returns {number} timestamp / 1000 |0;
     */
    function getNow() {
        return Date.now() / 1000 | 0;
    }

})();







/**
 * @typedef Attachment
 * @property {string | null} url for photos
 */




// 팝업 창 관련


const chatScreen = document.querySelector('#screen');
const popups = document.querySelector('#popups');

function openPopupTab(id) {
    chatScreen.classList.add('popup');
    document.querySelectorAll('#popups > div').forEach(popup => popup.classList.add('hidden'));
    popups.querySelector(id).classList.remove('hidden');
}


const openchatBtn = document.querySelector('#openchat-btn');
const openchatList = document.querySelector('#openchat-list');
openchatBtn.addEventListener('click', async () => {
    openPopupTab('#openchat');
    const popular = await new F('./popular').post();
    if (popular.err) return alert(popular.err);

    /**
     * 
     * @param {room} room 
     */
    function addRoom(room) {
        openchatList.innerHTML = '';
        openchatList.insertAdjacentHTML('beforeend', `
        <div class="openchat-search" data-hash="${room.hash}" onclick="onRoomClick">
            <div class="openchat-search-head">
                <span class="openchat-search-title">
                    ${/*room.locked?*/'<img src="./img/locked.png">'/*:''*/}
                    ${convertTag(room.name)} <span>(${room.people}명)</span>
                </span>
                <span class="openchat-search-desc">${convertTag(room.desc)}</span>
            </div>
            <span class="openchat-search-lastchat">마지막 채팅: ${window.dayjs(room.lastChat * 1000).fromNow()}</span>
        </a>
        `);
    }

    popular.result.forEach(addRoom);
});
function onRoomClick(e) {
    console.log(e);
}


const addFriendBtn = document.querySelector('#add-friend-btn');
addFriendBtn.addEventListener('click', () => {
    openPopupTab('#add-friend');
});

const addFriendList = document.querySelector('#add-friend-list');
document.querySelector('#add-friend input').addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
        const v = e.target.value;
        if (e.target.getAttribute('data-last') === v) return;
        e.target.setAttribute('data-last', v);
        const res = await new F('./searchFriends?q=' + v).get();
        if (!res.err) return alert(res.err);
        addFriendList.innerHTML = '';
        res.result.forEach(({ id, name, prof }) => {
            addFriendList.insertAdjacentHTML('beforeEnd', `
                <div class="add-friend-search">
                    <div class="add-friend-search-prof">
                        <img src="" alt="프로필 이미지" title="프로필 이미지">
                    </div>
                </div>
            `);
        });
    }
});








const closeBtns = document.querySelectorAll('.close-btn');
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#popups > div').forEach(popup => popup.classList.add('hidden'));
        chatScreen.classList.remove('popup');
    });
});


function convertTag(str) {
    return str.replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}







/**
* @typedef room
* @property {string} hash
* @property {string} name
* @property {string} desc description
* @property {userInfo[]} people [{ type, name?, id }]
* @property {1 | 0} pub public? 1 : 0
* @property {text} [pw] password
* @property {number} date createdAt
* @property {chat[]} chats
* @property {object} sts settings: 방링허용 등등
* 
* @typedef userInfo
* @property {int} type 2/1/0 host/sub/normal
* @property {string} name
* @property {string} id userId
* 
* @typedef chat
* @property {number} id
* @property {string} uid user id
* @property {string} msg message content
* @property {chatType} type
* @property {string} [at='{}']
* @property {boolean} edited
* @property {boolean} deleted
* @property {number} ts timestamp / 1000 |0
* 
* @typedef {1 | 2} chatType
* - 1: regular
* - 2: image
*/
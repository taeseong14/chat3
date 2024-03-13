# Chat3

<details>
<summary>
```앞서 말할것```
</summary>
<p>
우선 개떡같은 구조에 먼저 사과하는.
애초에 피드백 받고 고치려 레포판거니까 좀 풀리퀘나 이슈같은걸로 도와주세연;
</p>
</details>

<br>

_아직 DEPCRATED 안댓다;;;_


## 디비구조

<details>

### User

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


### Room


 - hash   TEXT PRIMARY KEY,
 - name   TEXT NOT NULL,
 - desc   TEXT NOT NULL,
 - people TEXT DEFAULT '[]',
 - pub    INT NOT NULL,
 - pw     TEXT NOT NULL,
 - date   INT NOT NULL,
 - chats  TEXT DEFAULT '[]',
 - sts    TEXT DEFAULT '{}'

</details>


## Methods

[db.js](./src/auth/db.js) 참고;;

## Routes

작성중, [chat/index.js](./src/chat/index.js) 등 참고;;;;;;;;;;


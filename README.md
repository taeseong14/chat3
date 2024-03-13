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

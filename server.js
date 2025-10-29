const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database("users.db");

app.use(bodyParser.urlencoded({ extended: true })); // form submit용
app.use(bodyParser.json()); // JSON용

// CORS 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(session({
    secret: "secret-code",
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  userbirth TEXT,
  userid TEXT UNIQUE,
  password TEXT
)`);

db.run(`ALTER TABLE users ADD COLUMN cash INTEGER DEFAULT 0`, err => {
  if (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("이미 cash 컬럼이 존재합니다.");
    } else {
      console.error("컬럼 추가 중 오류:", err.message);
    }
  } else {
    console.log("cash 컬럼이 성공적으로 추가되었습니다.");
  }
});

app.post("/signin", (req, res) => {
  const { username, userbirth, userid, password } = req.body;
  db.run(`INSERT INTO users (username, userbirth, userid, password) VALUES (?, ?, ?, ?)`, [username, userbirth, userid, password],
    function(err) {
        if (err) return res.send("이미 존재하는 아이디입니다.");
        res.send("회원가입 성공!");
    });
});

app.post("/login", (req, res) => {
  const { userid, password } = req.body;

  db.get("SELECT * FROM users WHERE userid = ?", [userid], (err, user) => {
    if (err) return res.status(500).send("서버 오류");
    if (!user) return res.status(404).send("존재하지 않는 아이디입니다");
    if (user.password !== password) return res.status(401).send("비밀번호가 틀렸습니다");

    req.session.userid = userid;
    res.send("로그인 성공!");
  });
});


app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).send("회원정보 조회 실패");
    res.json(rows);
  });
});
app.get("/", (req, res) => {
  res.send("서버 연결 성공!");
});

app.get("/login-check", (req, res) => {
    if (!req.session.userid) {
        return res.status(403).send(0);
    }
    res.send(1);
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

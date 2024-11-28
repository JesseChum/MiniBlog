const express = require("express");
const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "3333",
  database: "miniblog",
});

async function connect() {
  try {
    let conn = await pool.getConnection();
    console.log("Connected to the database");
    return conn;
  } catch (err) {
    console.log("Error connecting to the database: " + err);
  }
}

const PORT = 3000;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home", { data: {}, errors: [] });
});

app.post("/submit", async (req, res) => {
  const data = req.body;
  let isValid = true;
  let errors = [];

  //Validation
  if (data.title.trim() === "") {
    isValid = false;
    errors.push("Title is required");
  }
  if (data.title.trim().length <= 5) {
    isValid = false;
    errors.push("Title must be more than 5 characters.");
  }

  // content is empty
  if (!data.content || data.content.trim() === "") {
    isValid = false;
    errors.push("Content is required");
  }

  // change author to Null if empty
  if (data.author.trim() === "") {
    data.author = null;
  }

  if (!isValid) {
    res.render("home", { data: data, errors: errors });
    return;
  }

  //Database Insertion
  const conn = await connect();

  await conn.query(`
    INSERT INTO posts (author, title, content)
    VALUES ('${data.author}', '${data.title}', '${data.content}');
  `);
  conn.release();
  res.render("confirmation", { data: data });
});

app.get("/entries", async (req, res) => {
  const conn = await connect();
  console.log("entries rendered");
  const rows = await conn.query(`SELECT * FROM posts
ORDER BY created_at DESC;`);
  res.render("entries", { posts: rows });
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

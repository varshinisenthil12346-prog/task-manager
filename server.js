const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change-this-secret';
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.json');

const load = () => fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  : { users: [], tasks: [], nextId: 1 };
const save = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Auth ----------
const sign = (u) => jwt.sign({ id: u.id, name: u.name }, SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, email and password (min 6 chars) required' });
  const db = load();
  if (db.users.find((u) => u.email === email.toLowerCase()))
    return res.status(409).json({ error: 'Email already registered' });
  const user = { id: db.nextId++, name, email: email.toLowerCase(), password: bcrypt.hashSync(password, 10) };
  db.users.push(user); save(db);
  res.json({ token: sign(user), name: user.name });
});

app.post('/api/login', (req, res) => {
  const { email = '', password = '' } = req.body;
  const user = load().users.find((u) => u.email === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(user), name: user.name });
});

// ---------- Tasks (CRUD, per-user authorization) ----------
const STATUSES = ['todo', 'in-progress', 'done'];

app.get('/api/tasks', auth, (req, res) => {
  res.json(load().tasks.filter((t) => t.userId === req.user.id));
});

app.post('/api/tasks', auth, (req, res) => {
  const { title, description = '', status = 'todo' } = req.body;
  if (!title || !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid task' });
  const db = load();
  const task = { id: db.nextId++, userId: req.user.id, title, description, status, createdAt: new Date().toISOString() };
  db.tasks.push(task); save(db);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const db = load();
  const task = db.tasks.find((t) => t.id === +req.params.id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { title, description, status } = req.body;
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  save(db); res.json(task);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const db = load();
  const before = db.tasks.length;
  db.tasks = db.tasks.filter((t) => !(t.id === +req.params.id && t.userId === req.user.id));
  if (db.tasks.length === before) return res.status(404).json({ error: 'Task not found' });
  save(db); res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Task Manager running at http://localhost:${PORT}`));

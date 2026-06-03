const express  = require('express');
const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const multer    = require('multer');

const app  = express();
const PORT = 3333;

// ── CONFIG ──
// Cambiar la contraseña aquí (SHA-256 de "oblivion")
const ADMIN_HASH = crypto.createHash('sha256').update('oblivion').digest('hex');
let adminToken   = null;

// ── MIDDLEWARE ──
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Multer para subir imágenes de personajes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'assets/characters')),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── AUTH ──
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Falta contraseña' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash === ADMIN_HASH) {
    adminToken = crypto.randomBytes(32).toString('hex');
    return res.json({ ok: true, token: adminToken });
  }
  res.status(401).json({ error: 'Contraseña incorrecta' });
});

app.post('/api/logout', (req, res) => {
  adminToken = null;
  res.json({ ok: true });
});

function auth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!adminToken || token !== adminToken)
    return res.status(403).json({ error: 'No autorizado' });
  next();
}

// ── DATA API ──
const ALLOWED = ['members', 'news', 'guides', 'chapters', 'gallery'];

app.get('/api/data/:file', auth, (req, res) => {
  if (!ALLOWED.includes(req.params.file))
    return res.status(400).json({ error: 'Archivo no permitido' });
  const file = path.join(__dirname, 'data', req.params.file + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'No encontrado' });
  res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
});

app.put('/api/data/:file', auth, (req, res) => {
  if (!ALLOWED.includes(req.params.file))
    return res.status(400).json({ error: 'Archivo no permitido' });
  const file = path.join(__dirname, 'data', req.params.file + '.json');
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// ── UPLOAD IMAGEN ──
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
  res.json({ ok: true, path: 'assets/characters/' + req.file.filename });
});

// ── VERIFY TOKEN ──
app.get('/api/verify', (req, res) => {
  const token = req.headers['x-admin-token'];
  res.json({ valid: !!(adminToken && token === adminToken) });
});

app.listen(PORT, () => {
  console.log(`\n🌌 Oblivion Server en http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Contraseña: oblivion (cambiar en server.js)\n`);
});

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET les paramètres
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  if (settings.gmail_pass) settings.gmail_pass = '••••••••';
  res.json(settings);
});

// PUT modifier les paramètres
router.put('/', (req, res) => {
  const { cabinet_email, gmail_user, gmail_pass } = req.body;
  if (cabinet_email !== undefined)
    db.prepare("UPDATE settings SET value=? WHERE key='cabinet_email'").run(cabinet_email);
  if (gmail_user !== undefined)
    db.prepare("UPDATE settings SET value=? WHERE key='gmail_user'").run(gmail_user);
  if (gmail_pass !== undefined && gmail_pass !== '••••••••')
    db.prepare("UPDATE settings SET value=? WHERE key='gmail_pass'").run(gmail_pass);
  res.json({ success: true });
});

module.exports = router;
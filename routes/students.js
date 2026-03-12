const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET tous les étudiants
router.get('/', (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY full_name').all();
  res.json(students);
});

// GET un étudiant
router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Étudiant introuvable' });
  res.json(student);
});

// POST créer un étudiant
router.post('/', upload.single('photo'), (req, res) => {
  const { full_name, email, phone, country, school, program, start_date, notes } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(`
    INSERT INTO students (full_name, email, phone, country, school, program, start_date, notes, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(full_name, email, phone, country, school, program, start_date, notes, photo);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(student);
});

// PUT modifier un étudiant
router.put('/:id', upload.single('photo'), (req, res) => {
  const { full_name, email, phone, country, school, program, start_date, notes } = req.body;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Étudiant introuvable' });
  const photo = req.file ? `/uploads/${req.file.filename}` : existing.photo;
  db.prepare(`
    UPDATE students SET full_name=?, email=?, phone=?, country=?, school=?, program=?, start_date=?, notes=?, photo=?
    WHERE id=?
  `).run(full_name, email, phone, country, school, program, start_date, notes, photo, req.params.id);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  res.json(student);
});

// DELETE supprimer un étudiant
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
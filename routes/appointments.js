const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendConfirmationEmail } = require('../emailService');

// GET tous les rendez-vous
router.get('/', (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, s.full_name, s.country, s.school, s.program, s.photo
    FROM appointments a
    JOIN students s ON a.student_id = s.id
    ORDER BY a.appointment_date DESC
  `).all();
  res.json(appointments);
});

// GET rendez-vous à venir
router.get('/upcoming', (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, s.full_name, s.country, s.school, s.program, s.photo
    FROM appointments a
    JOIN students s ON a.student_id = s.id
    WHERE a.appointment_date >= datetime('now') AND a.status = 'upcoming'
    ORDER BY a.appointment_date ASC
    LIMIT 10
  `).all();
  res.json(appointments);
});

// GET historique
router.get('/history/all', (req, res) => {
  const history = db.prepare(`
    SELECT a.*, s.full_name, s.country, s.school, s.program
    FROM appointments a
    JOIN students s ON a.student_id = s.id
    WHERE a.appointment_date < datetime('now') OR a.status = 'done'
    ORDER BY a.appointment_date DESC
  `).all();
  res.json(history);
});

// GET rendez-vous d'un étudiant
router.get('/student/:studentId', (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, s.full_name FROM appointments a
    JOIN students s ON a.student_id = s.id
    WHERE a.student_id = ?
    ORDER BY a.appointment_date DESC
  `).all(req.params.studentId);
  res.json(appointments);
});

// POST créer un rendez-vous
router.post('/', async (req, res) => {
  const { student_id, title, appointment_date, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO appointments (student_id, title, appointment_date, notes)
    VALUES (?, ?, ?, ?)
  `).run(student_id, title, appointment_date, notes);
  const appt = db.prepare(`
    SELECT a.*, s.full_name, s.country, s.school, s.program
    FROM appointments a
    JOIN students s ON a.student_id = s.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  // Envoyer email de confirmation immédiatement
  try {
    await sendConfirmationEmail(appt);
  } catch (err) {
    console.error('Erreur envoi confirmation:', err.message);
  }

  res.status(201).json(appt);
});

// PUT modifier un rendez-vous
router.put('/:id', (req, res) => {
  const { title, appointment_date, notes, status } = req.body;
  db.prepare(`
    UPDATE appointments SET title=?, appointment_date=?, notes=?, status=? WHERE id=?
  `).run(title, appointment_date, notes, status, req.params.id);
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(appt);
});

// DELETE supprimer un rendez-vous
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
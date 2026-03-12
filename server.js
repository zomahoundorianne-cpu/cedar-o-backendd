const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { sendReminderEmails } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/settings', require('./routes/settings'));

// Rappels automatiques chaque jour à 8h00
cron.schedule('0 8 * * *', () => {
  console.log('🔔 Vérification des rappels...');
  sendReminderEmails();
});

app.listen(PORT, () => {
  console.log(`✅ Serveur Cedar-O démarré sur le port ${PORT}`);
});
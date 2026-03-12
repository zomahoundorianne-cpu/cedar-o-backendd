const nodemailer = require('nodemailer');
const db = require('./db');

function getTransporter() {
  const gmailUser = db.prepare("SELECT value FROM settings WHERE key='gmail_user'").get();
  const gmailPass = db.prepare("SELECT value FROM settings WHERE key='gmail_pass'").get();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser?.value,
      pass: gmailPass?.value,
    },
  });
}

function getCabinetEmail() {
  return db.prepare("SELECT value FROM settings WHERE key='cabinet_email'").get()?.value;
}

function getGmailUser() {
  return db.prepare("SELECT value FROM settings WHERE key='gmail_user'").get()?.value;
}

// Email de confirmation immédiat à la création d'un RDV
async function sendConfirmationEmail(appt) {
  const cabinetEmail = getCabinetEmail();
  if (!cabinetEmail) return;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Cedar-O Cabinet" <${getGmailUser()}>`,
    to: cabinetEmail,
    subject: `✅ Nouveau RDV créé : ${appt.full_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3c5e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin:0;">🎓 Cedar-O — Nouveau Rendez-vous</h2>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px;">Un nouveau rendez-vous a été créé :</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding:8px; font-weight:bold; color:#555;">Étudiant</td><td style="padding:8px;">${appt.full_name}</td></tr>
            <tr style="background:#eef2f7;"><td style="padding:8px; font-weight:bold; color:#555;">Objet</td><td style="padding:8px;">${appt.title}</td></tr>
            <tr><td style="padding:8px; font-weight:bold; color:#555;">Date</td><td style="padding:8px;">${new Date(appt.appointment_date).toLocaleString('fr-FR')}</td></tr>
            <tr style="background:#eef2f7;"><td style="padding:8px; font-weight:bold; color:#555;">Pays</td><td style="padding:8px;">${appt.country || '—'}</td></tr>
            <tr><td style="padding:8px; font-weight:bold; color:#555;">École</td><td style="padding:8px;">${appt.school || '—'}</td></tr>
            <tr style="background:#eef2f7;"><td style="padding:8px; font-weight:bold; color:#555;">Formation</td><td style="padding:8px;">${appt.program || '—'}</td></tr>
            ${appt.notes ? `<tr><td style="padding:8px; font-weight:bold; color:#555;">Notes</td><td style="padding:8px;">${appt.notes}</td></tr>` : ''}
          </table>
          <div style="margin-top: 20px; padding: 12px; background: #fef9ed; border: 1px solid #f0d885; border-radius: 8px; font-size: 13px; color: #9a7a2a;">
            📧 Des rappels automatiques seront envoyés <strong>7 jours, 3 jours et 1 jour avant</strong> la date du rendez-vous.
          </div>
          <p style="margin-top:20px; color:#888; font-size:13px;">Cedar-O — Suivi des étudiants à l'étranger</p>
        </div>
      </div>
    `,
  });
  console.log(`✅ Email de confirmation envoyé pour le RDV de ${appt.full_name}`);
}

// Rappels automatiques J-7, J-3, J-1
async function sendReminderEmails() {
  const cabinetEmail = getCabinetEmail();
  if (!cabinetEmail) return;

  const today = new Date();
  const remindDays = [7, 3, 1];

  for (const days of remindDays) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);
    const dateStr = targetDate.toISOString().split('T')[0];

    const appointments = db.prepare(`
      SELECT a.*, s.full_name, s.country, s.school, s.program
      FROM appointments a
      JOIN students s ON a.student_id = s.id
      WHERE DATE(a.appointment_date) = ?
      AND a.status = 'upcoming'
    `).all(dateStr);

    for (const appt of appointments) {
      const alreadySent = db.prepare(`
        SELECT id FROM reminder_logs
        WHERE appointment_id = ? AND days_before = ?
      `).get(appt.id, days);

      if (alreadySent) continue;

      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"Cedar-O Cabinet" <${getGmailUser()}>`,
          to: cabinetEmail,
          subject: `🔔 Rappel J-${days} : RDV avec ${appt.full_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a3c5e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin:0;">🎓 Cedar-O — Rappel de Rendez-vous</h2>
              </div>
              <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                <p style="font-size: 16px;">Vous avez un rendez-vous <strong>dans ${days} jour(s)</strong> :</p>
                <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
                  <tr><td style="padding:8px; font-weight:bold; color:#555;">Étudiant</td><td style="padding:8px;">${appt.full_name}</td></tr>
                  <tr style="background:#eef2f7;"><td style="padding:8px; font-weight:bold; color:#555;">Objet</td><td style="padding:8px;">${appt.title}</td></tr>
                  <tr><td style="padding:8px; font-weight:bold; color:#555;">Date</td><td style="padding:8px;">${new Date(appt.appointment_date).toLocaleString('fr-FR')}</td></tr>
                  <tr style="background:#eef2f7;"><td style="padding:8px; font-weight:bold; color:#555;">Pays</td><td style="padding:8px;">${appt.country || '—'}</td></tr>
                  <tr><td style="padding:8px; font-weight:bold; color:#555;">École</td><td style="padding:8px;">${appt.school || '—'}</td></tr>
                  <tr style="background:#eef2f7;"><td style="padding:8px; font-weight:bold; color:#555;">Formation</td><td style="padding:8px;">${appt.program || '—'}</td></tr>
                  ${appt.notes ? `<tr><td style="padding:8px; font-weight:bold; color:#555;">Notes</td><td style="padding:8px;">${appt.notes}</td></tr>` : ''}
                </table>
                <p style="margin-top:20px; color:#888; font-size:13px;">Cedar-O — Suivi des étudiants à l'étranger</p>
              </div>
            </div>
          `,
        });

        db.prepare(`
          INSERT INTO reminder_logs (appointment_id, days_before) VALUES (?, ?)
        `).run(appt.id, days);

        console.log(`✅ Rappel envoyé pour le RDV ${appt.id} (J-${days})`);
      } catch (err) {
        console.error(`❌ Erreur envoi rappel:`, err.message);
      }
    }
  }
}

module.exports = { sendReminderEmails, sendConfirmationEmail };
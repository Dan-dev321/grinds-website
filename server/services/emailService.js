// services/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a transactional email.
 * @param {string|string[]} to - recipient email(s)
 * @param {string} subject
 * @param {string} html
 * @param {object} [options] - optional overrides (from, replyTo, text)
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendEmail(to, subject, html, options = {}) {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM,
      to,
      subject,
      html,
      ...(options.replyTo && { reply_to: options.replyTo }),
      ...(options.text && { text: options.text }),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message || 'Unknown Resend error' };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('sendEmail failed:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmail };
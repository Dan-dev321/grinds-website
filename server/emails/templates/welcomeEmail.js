// emails/templates/welcomeEmail.js

/**
 * Builds the welcome email HTML for a newly registered tutor or student.
 * @param {object} params
 * @param {string} params.name - recipient's name
 * @param {'tutor'|'student'} params.role
 * @param {string} [params.inviteCode] - tutor's invite code (tutor only)
 * @param {string|Date} [params.trialEnds] - trial end date (tutor only)
 * @param {string} [params.dashboardUrl] - link to app dashboard
 * @returns {{ subject: string, html: string }}
 */
function welcomeEmail({ name, role, inviteCode, trialEnds, dashboardUrl }) {
  const isTutor = role === 'tutor';

  const subject = isTutor
    ? 'Welcome to TutorNode — your free trial has started'
    : 'Welcome to TutorNode';

  const trialEndFormatted = trialEnds
    ? new Date(trialEnds).toLocaleDateString('en-IE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const heading = isTutor ? `Welcome, ${name}!` : `Welcome to TutorNode, ${name}!`;

  const introText = isTutor
    ? "Your account is live and your 14-day free trial has started. Here's everything you need to get set up."
    : "You've successfully joined your tutor's workspace. Here's what you need to know.";

  const tutorBlock = isTutor
    ? `
    <tr>
      <td style="padding: 24px 0 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #EEEDFC; border-radius: 16px; padding: 20px;">
          <tr>
            <td style="font-size: 14px; color: #1E2029; font-weight: 600; padding-bottom: 8px;">
              Your free trial
            </td>
          </tr>
          <tr>
            <td style="font-size: 14px; color: #4B5563; line-height: 1.6;">
              Your 14-day trial runs until <strong style="color: #1E2029;">${trialEndFormatted}</strong>. No card required — we'll let you know before it ends.
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 0 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F3F5; border-radius: 16px; padding: 20px;">
          <tr>
            <td style="font-size: 14px; color: #1E2029; font-weight: 600; padding-bottom: 8px;">
              Your invite code
            </td>
          </tr>
          <tr>
            <td style="font-size: 14px; color: #4B5563; line-height: 1.6; padding-bottom: 10px;">
              Share this with your students so they can join your workspace:
            </td>
          </tr>
          <tr>
            <td>
              <span style="display: inline-block; font-family: ui-monospace, Menlo, Monaco, monospace; font-size: 18px; font-weight: 700; letter-spacing: 2px; color: #4C3FE0; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 10px; padding: 10px 16px;">
                ${inviteCode}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    `
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3F5; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F3F5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 0 32px; text-align: center;">
              <div style="display: inline-block; width: 48px; height: 48px; background-color: #4C3FE0; border-radius: 14px; line-height: 48px; text-align: center; margin-bottom: 16px;">
                <span style="color: #ffffff; font-weight: 800; font-size: 18px;">TN</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1E2029;">${heading}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 16px 32px 0 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4B5563; text-align: center;">
                ${introText}
              </p>
            </td>
          </tr>

          <!-- Tutor-only blocks -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${tutorBlock}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 32px 8px 32px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #4C3FE0; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
                Go to your dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                TutorNode &middot; This is an automated message, please don't reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

module.exports = { welcomeEmail };
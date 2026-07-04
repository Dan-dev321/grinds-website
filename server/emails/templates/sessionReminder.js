// emails/templates/sessionReminder.js

/**
 * Builds the session reminder email HTML (sent ~24h before a lesson).
 * @param {object} params
 * @param {'tutor'|'student'} params.role
 * @param {string} params.recipientName
 * @param {string} params.otherPartyName
 * @param {string} params.date - 'YYYY-MM-DD'
 * @param {string} params.startTime - 'HH:MM'
 * @param {string} params.endTime - 'HH:MM'
 * @param {string} [params.dashboardUrl]
 * @returns {{ subject: string, html: string }}
 */
function sessionReminder({
  role,
  recipientName,
  otherPartyName,
  date,
  startTime,
  endTime,
  dashboardUrl,
}) {
  const isTutor = role === 'tutor';

  const dateFormatted = new Date(`${date}T00:00:00`).toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const subject = `Reminder: session tomorrow at ${startTime}`;

  const introText = isTutor
    ? `you have a session with ${otherPartyName} coming up tomorrow.`
    : `your session with ${otherPartyName} is coming up tomorrow.`;

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
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1E2029;">Session tomorrow</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 16px 32px 0 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4B5563; text-align: center;">
                Hi ${recipientName}, just a reminder — ${introText}
              </p>
            </td>
          </tr>

          <!-- Session details card -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F3F5; border-radius: 16px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${isTutor ? 'Student' : 'Tutor'}
                    </span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1E2029;">
                      ${otherPartyName}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; border-top: 1px solid #E5E7EB; padding-top: 12px;">
                    <span style="font-size: 12px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">
                      Date
                    </span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1E2029;">
                      ${dateFormatted}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #E5E7EB; padding-top: 12px;">
                    <span style="font-size: 12px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">
                      Time
                    </span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1E2029;">
                      ${startTime} &ndash; ${endTime}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 32px 8px 32px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #4C3FE0; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
                View in dashboard
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

module.exports = { sessionReminder };
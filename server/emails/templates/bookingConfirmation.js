// emails/templates/bookingConfirmation.js

/**
 * Builds the booking confirmation email HTML.
 * @param {object} params
 * @param {'tutor'|'student'} params.role - who this email is for
 * @param {string} params.recipientName - name of the person receiving this email
 * @param {string} params.otherPartyName - name of the other person in the booking
 * @param {string} params.date - 'YYYY-MM-DD'
 * @param {string} params.startTime - 'HH:MM'
 * @param {string} params.endTime - 'HH:MM'
 * @param {string} [params.dashboardUrl] - link to app dashboard/bookings page
 * @returns {{ subject: string, html: string }}
 */
function bookingConfirmation({
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
    year: 'numeric',
  });

  const subject = isTutor
    ? `New booking: ${otherPartyName} — ${dateFormatted}`
    : `Booking confirmed with ${otherPartyName}`;

  const heading = isTutor ? 'New booking received' : 'Your session is confirmed';

  const introText = isTutor
    ? `${otherPartyName} has booked a session with you. Here are the details:`
    : `Your session with ${otherPartyName} is booked. Here are the details:`;

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
                Hi ${recipientName}, ${introText}
              </p>
            </td>
          </tr>

          <!-- Booking details card -->
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

module.exports = { bookingConfirmation };
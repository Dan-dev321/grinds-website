// emails/templates/paymentFailed.js

/**
 * Builds the payment failed notification email HTML.
 * @param {object} params
 * @param {string} params.name - tutor's name
 * @param {string} [params.dashboardUrl] - link to app dashboard
 * @returns {{ subject: string, html: string }}
 */
function paymentFailed({ name, dashboardUrl }) {
  const subject = 'Payment failed — action needed';

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
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1E2029;">Payment failed</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 16px 32px 0 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4B5563; text-align: center;">
                Hi ${name}, we weren't able to process your latest payment. Your account has been marked as past due.
              </p>
            </td>
          </tr>

          <!-- Warning box -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3E2; border-radius: 16px; padding: 20px;">
                <tr>
                  <td style="font-size: 14px; color: #92400E; line-height: 1.6;">
                    Please update your payment details as soon as possible to avoid any interruption to your account.
                  </td>
                </tr>
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

module.exports = { paymentFailed };
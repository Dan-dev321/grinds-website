// emails/templates/paymentReceipt.js

/**
 * Builds the payment receipt (success) email HTML.
 * @param {object} params
 * @param {string} params.name - tutor's name
 * @param {number} params.amount - amount paid, in the currency's smallest unit (e.g. cents)
 * @param {string} params.currency - e.g. 'usd', 'eur'
 * @param {string} [params.plan] - plan name (monthly/quarterly/yearly)
 * @param {string} [params.dashboardUrl] - link to app dashboard
 * @returns {{ subject: string, html: string }}
 */
function paymentReceipt({ name, amount, currency, plan, dashboardUrl }) {
  const formattedAmount = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(amount / 100);

  const subject = `Payment received — ${formattedAmount}`;

  const planLine = plan
    ? `Your <strong style="color: #1E2029;">${plan}</strong> subscription is active.`
    : 'Your subscription is active.';

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
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1E2029;">Payment received</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 16px 32px 0 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4B5563; text-align: center;">
                Hi ${name}, thanks for your payment. ${planLine}
              </p>
            </td>
          </tr>

          <!-- Amount -->
          <tr>
            <td style="padding: 28px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #EEEDFC; border-radius: 16px; padding: 24px; text-align: center;">
                <tr>
                  <td>
                    <span style="font-size: 13px; font-weight: 600; color: #4C3FE0; text-transform: uppercase; letter-spacing: 0.5px;">
                      Amount paid
                    </span><br/>
                    <span style="font-size: 32px; font-weight: 800; color: #1E2029;">
                      ${formattedAmount}
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

module.exports = { paymentReceipt };
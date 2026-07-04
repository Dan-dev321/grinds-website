// middleware/verifyCronSecret.js

function verifyCronSecret(req, res, next) {
  const provided = req.headers['x-cron-secret']

  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET is not set in environment variables')
    return res.status(500).json({ message: 'Server misconfiguration' })
  }

  if (!provided || provided !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  next()
}

module.exports = verifyCronSecret
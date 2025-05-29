const express = require('express');
const router = express.Router();

router.get('/healthz', async (req, res) => {
  return res.status(200).json({ status: 200 });
});

module.exports = router;

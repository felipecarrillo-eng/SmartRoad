const express = require('express');
const { requireAuth } = require('../middleware/auth');

module.exports = (store, ctx) => {
  const router = express.Router();

  router.use(requireAuth);

  router.get('/', async (_req, res) => {
    const config = await store.getConfig();
    res.json({ config });
  });

  router.put('/', async (req, res) => {
    const config = await store.updateConfig(req.body || {});
    if (ctx && ctx.broadcast) ctx.broadcast('config', { config });
    res.json({ config });
  });

  return router;
};
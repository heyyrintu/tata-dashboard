import express from 'express';
import { capabilitiesOf } from '../config/roles';

const router = express.Router();

/**
 * Who the server thinks you are.
 *
 * The frontend renders from this rather than deriving a role from its own
 * Appwrite team lookup. One source of truth means the UI cannot drift out of
 * step with what the API actually enforces - and if it ever did, the API's
 * answer is the one that counts, because every masking decision is made
 * server-side from this same context.
 */
router.get('/', (req, res) => {
  const auth = req.auth;
  if (!auth) {
    // authenticate() populates this on every /api route.
    res.status(500).json({ error: 'Authentication context missing.' });
    return;
  }
  res.json({
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    via: auth.via,
    masked: auth.masked,
    can: capabilitiesOf(auth),
  });
});

export default router;

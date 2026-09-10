import { Request } from 'express';
import { AuthContext } from '../config/roles';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    /**
     * Set by middleware/auth.ts on every request that reaches an /api route.
     * Never populated from client-supplied role data - see config/roles.ts.
     */
    auth?: AuthContext;
  }
}


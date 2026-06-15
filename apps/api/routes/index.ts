import { Router } from 'express';
import healthRoute from './health.route';
import authRoute from './auth.route';
import orgRoute from './org.route';

const router = Router();

// health check route
router.use('/health', healthRoute);

// auth routes
router.use('/auth', authRoute);

// organization routes
router.use('/org', orgRoute);

export default router;

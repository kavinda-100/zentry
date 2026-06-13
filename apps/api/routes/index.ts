import { Router } from 'express';
import healthRoute from './health.route';
import authRoute from './auth.route';

const router = Router();

// health check route
router.use('/health', healthRoute);

// auth routes
router.use('/auth', authRoute);

export default router;

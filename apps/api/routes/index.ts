import { Router } from 'express';
import healthRoute from './health.route';

const router = Router();

// health check route
router.use('/health', healthRoute);

// other routes

export default router;

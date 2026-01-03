import express from 'express';
import { adminLogin, getDashboardStats, getAllUsers, getAnalyticsData } from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';

const adminRouter = express.Router();

adminRouter.post('/login', adminLogin);
adminRouter.get('/stats', authAdmin, getDashboardStats);
adminRouter.get('/users', authAdmin, getAllUsers);
adminRouter.get('/analytics', authAdmin, getAnalyticsData);

export default adminRouter;

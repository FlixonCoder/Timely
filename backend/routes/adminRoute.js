import express from 'express';
import { adminLogin, getDashboardStats, getAllUsers } from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';

const adminRouter = express.Router();

adminRouter.post('/login', adminLogin);
adminRouter.get('/stats', authAdmin, getDashboardStats);
adminRouter.get('/users', authAdmin, getAllUsers);

export default adminRouter;

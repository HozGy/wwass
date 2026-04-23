import serverless from 'serverless-http';
import { app } from '../../employee-management-backend/server.js';

export const handler = serverless(app);

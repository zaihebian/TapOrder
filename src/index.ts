import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import webhookRoutes from './routes/webhooks';
import tokenRoutes from './routes/tokens';
import merchantAuthRoutes from './routes/merchant-auth';
import merchantSettingsRoutes from './routes/merchant-settings';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', tokenRoutes);
app.use('/', productRoutes);
app.use('/orders', orderRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/merchant', merchantAuthRoutes);
app.use('/merchant', merchantSettingsRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

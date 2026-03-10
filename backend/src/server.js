import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import connectDB from './config/mongodb.js';
import responseHandler from './utils/responseHandler.js';
import { PORT, FRONTEND_URL } from './config/config.js';

const app = express();

app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  responseHandler.success(res, '✅ Rahul Babariya Backend is running');
});

app.use('/api/v1', routes);

// 404
app.use((req, res) => {
  responseHandler.notFound(res, 'Route not found');
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

// Vercel serverless export
export default app;

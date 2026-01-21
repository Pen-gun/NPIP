import express from 'express';
import cors from 'cors';
import cookieParser from './middlewares/cookie.middleware.js';
import morgan from 'morgan';
import rateLimiter from './middlewares/rateLimit.middleware.js';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));
const jsonParser = express.json({ limit: '50mb' });
app.use((req, res, next) => {
    if (req.originalUrl === '/api/v1/stripe/webhook') {
        return next();
    }
    return jsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser);
app.use(morgan('dev'));
app.use(rateLimiter({ windowMs: 60_000, max: 120 }));

// import routes
import figureRoutes from './routes/figure.route.js';
import userRoutes from './routes/user.route.js';
import projectRoutes from './routes/project.route.js';
import mentionRoutes from './routes/mention.route.js';
import alertRoutes from './routes/alert.route.js';
import reportRoutes from './routes/report.route.js';
import stripeRoutes from './routes/stripe.route.js';

// define routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/v1/figures', figureRoutes);
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/mentions', mentionRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/stripe', stripeRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
    // Ensure CORS headers are set
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ statusCode, message, success: false });
});

export default app;

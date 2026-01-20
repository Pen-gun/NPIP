import express from 'express';
import cors from 'cors';

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
app.use(express.json({
    limit: '50mb'
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// import routes
import figureRoutes from './routes/figure.route.js';

// define routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/v1/figures', figureRoutes);

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

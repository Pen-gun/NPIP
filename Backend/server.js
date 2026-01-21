import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectToDB from './db/connectToDatabase.helper.js';
import { initSocket } from './services/socket.service.js';
import { startIngestionScheduler } from './services/ingestion.service.js';

dotenv.config({ path: './ai.env' });

const port = Number(process.env.PORT) || 8000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
});

io.on('connection', (socket) => {
    socket.on('join', ({ userId, projectId }) => {
        if (userId) socket.join(`user:${userId}`);
        if (projectId) socket.join(`project:${projectId}`);
    });
});

initSocket(io);

connectToDB()
    .then(() => {
        server.listen(port, () => {
            console.log(`NPIP backend is running on port ${port}`);
        });
        startIngestionScheduler();
    })
    .catch((err) => {
        console.error('Error starting the server', err);
        process.exit(1);
    });

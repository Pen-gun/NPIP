import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({ path: './ai.env' });

const port = Number(process.env.PORT) || 8000;

app.listen(port, () => {
    console.log(`NPIP backend is running on port ${port}`);
});

app.on('error', (err) => {
    console.error('Error starting the server', err);
});

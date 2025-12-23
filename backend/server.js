import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { createApp } from './app.js';
import { connectDB } from './services/db.js';
import { initSocket } from './services/socket.js';

const PORT = process.env.PORT || 8000;

const app = createApp();
const server = createServer(app);

// -------------------- DB --------------------
await connectDB();

// -------------------- Socket.IO --------------------
const io = initSocket(server);
app.set('io', io);

// -------------------- Start --------------------
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

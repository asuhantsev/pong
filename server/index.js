import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://asuhantsev.github.io",
  "https://asuhantsev.github.io/pong"
];

// Basic middleware
app.use(express.json());
app.set('trust proxy', true);

// Configure CORS
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Pong server is running');
});

const httpServer = createServer(app);

// Store rooms and sessions
const rooms = new Map();
const playerSessions = new Map();

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  path: '/socket.io/',
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

// Connection handling
io.on('connection', (socket) => {
  console.log('New connection:', {
    id: socket.id,
    transport: socket.conn.transport.name
  });

  // Rest of your socket handlers...
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
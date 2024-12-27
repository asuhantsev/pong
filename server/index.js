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

  // Add room creation handler
  socket.on('createRoom', () => {
    console.log('Create room request from:', socket.id);
    
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    const room = {
      id: roomId,
      players: [socket.id],
      readyState: new Map([[socket.id, false]])
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    
    console.log('Room created:', {
      roomId,
      sessionId,
      playerId: socket.id
    });
    
    socket.emit('roomCreated', {
      roomId,
      sessionId,
      role: 'host',
      readyState: Array.from(room.readyState.entries())
    });
  });

  socket.on('error', (error) => {
    console.error('Socket error for client:', socket.id, error);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
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

  // Add join room handler
  socket.on('joinRoom', (roomId) => {
    console.log('Join room request:', { roomId, socketId: socket.id });
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('roomError', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      console.log('Room is full:', roomId);
      socket.emit('roomError', 'Room is full');
      return;
    }

    try {
      const sessionId = Math.random().toString(36).substring(2, 15);
      room.players.push(socket.id);
      room.readyState.set(socket.id, false);
      
      socket.join(roomId);
      
      console.log('Player joined room:', {
        roomId,
        playerId: socket.id,
        players: room.players,
        readyState: Array.from(room.readyState.entries())
      });

      // Notify the joining player
      socket.emit('roomJoined', {
        roomId,
        sessionId,
        role: 'client',
        readyState: Array.from(room.readyState.entries())
      });

      // Notify other players in the room
      socket.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        readyState: Array.from(room.readyState.entries())
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('roomError', 'Failed to join room');
    }
  });

  // Add ready state handler
  socket.on('toggleReady', ({ roomId }) => {
    console.log('Toggle ready:', { roomId, socketId: socket.id });
    
    const room = rooms.get(roomId);
    if (!room) return;

    const currentState = room.readyState.get(socket.id) || false;
    room.readyState.set(socket.id, !currentState);

    // Broadcast ready state to all players in the room
    io.to(roomId).emit('readyStateUpdate', {
      readyState: Array.from(room.readyState.entries())
    });

    // Check if all players are ready
    const allReady = Array.from(room.readyState.values()).every(ready => ready);
    if (allReady && room.players.length === 2) {
      io.to(roomId).emit('gameReady');
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error for client:', socket.id, error);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find and clean up any rooms this socket was in
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        room.players = room.players.filter(id => id !== socket.id);
        room.readyState.delete(socket.id);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log('Room deleted:', roomId);
        } else {
          // Notify remaining players
          io.to(roomId).emit('playerDisconnected');
          io.to(roomId).emit('readyStateUpdate', {
            readyState: Array.from(room.readyState.entries())
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
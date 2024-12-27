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

// Configure CORS for Express
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'));
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'my-custom-header']
}));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Pong server is running');
});

const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"]
  },
  transports: ['websocket', 'polling']
});

// Add debug logging for CORS issues
io.engine.on("headers", (headers, req) => {
  console.log("CORS Headers:", headers);
  console.log("Request Origin:", req.headers.origin);
});

// Store active rooms with their state
const rooms = new Map();
const playerSessions = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', {
    id: socket.id,
    origin: socket.handshake.headers.origin
  });
  
  let currentRoom = null;

  const joinRoom = (roomId) => {
    currentRoom = roomId;
    socket.join(roomId);
    socket.roomId = roomId;
  };

  const leaveCurrentRoom = () => {
    if (currentRoom) {
      socket.leave(currentRoom);
      const room = rooms.get(currentRoom);
      if (room) {
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit('playerDisconnected');
        }
      }
      currentRoom = null;
    }
  };

  // Handle room creation
  socket.on('createRoom', () => {
    leaveCurrentRoom();
    const roomId = generateRoomId();
    const sessionId = generateSessionId();
    
    const room = {
      id: roomId,
      players: [socket.id],
      readyState: new Map([[socket.id, false]])
    };
    
    rooms.set(roomId, room);
    joinRoom(roomId);
    
    socket.emit('roomCreated', { 
      roomId, 
      sessionId,
      role: 'host',
      players: room.players,
      readyState: Array.from(room.readyState.entries())
    });
  });

  // Handle room joining
  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('roomError', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('roomError', 'Room is full');
      return;
    }

    leaveCurrentRoom();
    const sessionId = generateSessionId();
    
    room.players.push(socket.id);
    room.readyState.set(socket.id, false);
    joinRoom(roomId);

    // Emit room joined event
    socket.emit('roomJoined', { 
      roomId, 
      sessionId,
      role: 'client',
      players: room.players,
      readyState: Array.from(room.readyState.entries())
    });

    // Notify host about new player and send current state
    socket.to(roomId).emit('playerJoined', {
      playerId: socket.id,
      readyState: Array.from(room.readyState.entries())
    });
  });

  // Handle ready state toggling
  socket.on('toggleReady', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentState = room.readyState.get(socket.id) || false;
    room.readyState.set(socket.id, !currentState);

    // Broadcast updated ready state to all players
    io.to(roomId).emit('readyStateUpdate', {
      readyState: Array.from(room.readyState.entries())
    });

    // Check if all players are ready
    const allReady = Array.from(room.readyState.values()).every(ready => ready);
    if (allReady && room.players.length === 2) {
      io.to(roomId).emit('gameReady');
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    leaveCurrentRoom();
  });

  // Update paddle movement handling
  socket.on('paddleMove', ({ position, paddleSide }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;
    
    // Validate position
    const boundedPosition = Math.max(
      0,
      Math.min(
        600 - 100, // BOARD_HEIGHT - PADDLE_HEIGHT
        position
      )
    );
    
    // Send update with current server time
    socket.to(roomId).emit('paddleUpdate', {
      position: boundedPosition,
      paddleSide,
      timestamp: Date.now()
    });
  });

  // Add ping-pong handling
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // ... similar updates for other event handlers ...
});

// Generate a random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to generate session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

// Add error logging
io.on('connect_error', (err) => {
  console.error('Connection Error:', err);
});

io.on('error', (err) => {
  console.error('Socket Error:', err);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
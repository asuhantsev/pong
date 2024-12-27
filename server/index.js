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
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Pong server is running');
});

const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Try polling first
  allowEIO3: true, // Allow Engine.IO 3
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  path: '/socket.io/' // Explicitly set the path
});

// Add debug logging for CORS issues
io.engine.on("headers", (headers, req) => {
  console.log("CORS Headers:", headers);
  console.log("Request Origin:", req.headers.origin);
});

// Store active rooms with their state
const rooms = new Map();
const playerSessions = new Map();

// Add room cleanup interval
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  }
}, 60000); // Clean every minute

io.on('connection', (socket) => {
  console.log('New connection:', {
    id: socket.id,
    origin: socket.handshake.headers.origin,
    transport: socket.conn.transport.name
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.conn.on('upgrade', (transport) => {
    console.log('Transport upgraded:', transport.name);
  });

  // Add reconnection handling
  socket.on('rejoinRoom', ({ roomId, sessionId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('roomError', 'Room not found or expired');
      return;
    }

    // Verify session
    const playerSession = playerSessions.get(sessionId);
    if (!playerSession || playerSession.roomId !== roomId) {
      socket.emit('roomError', 'Invalid session');
      return;
    }

    // Rejoin room
    socket.join(roomId);
    socket.roomId = roomId;
    
    // Update room state
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }
    
    // Restore player role
    const role = playerSession.role;
    socket.emit('roomRejoined', {
      roomId,
      sessionId,
      role,
      readyState: Array.from(room.readyState.entries())
    });

    // Notify other players
    socket.to(roomId).emit('playerReconnected', {
      playerId: socket.id,
      readyState: Array.from(room.readyState.entries())
    });
  });

  // Update room creation
  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    const sessionId = generateSessionId();
    
    const room = {
      id: roomId,
      players: [socket.id],
      readyState: new Map([[socket.id, false]]),
      createdAt: Date.now()
    };
    
    rooms.set(roomId, room);
    playerSessions.set(sessionId, {
      roomId,
      role: 'host',
      socketId: socket.id
    });

    socket.join(roomId);
    socket.roomId = roomId;
    
    socket.emit('roomCreated', { 
      roomId, 
      sessionId,
      role: 'host',
      readyState: Array.from(room.readyState.entries())
    });

    console.log(`Room created: ${roomId}`, room);
  });

  // Update room joining
  socket.on('joinRoom', (roomId) => {
    console.log(`Join room attempt: ${roomId}`);
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log(`Room not found: ${roomId}`);
      socket.emit('roomError', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('roomError', 'Room is full');
      return;
    }

    const sessionId = generateSessionId();
    playerSessions.set(sessionId, {
      roomId,
      role: 'client',
      socketId: socket.id
    });

    room.players.push(socket.id);
    room.readyState.set(socket.id, false);
    
    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit('roomJoined', { 
      roomId, 
      sessionId,
      role: 'client',
      readyState: Array.from(room.readyState.entries())
    });

    socket.to(roomId).emit('playerJoined', {
      playerId: socket.id,
      readyState: Array.from(room.readyState.entries())
    });

    console.log(`Player joined room: ${roomId}`, room);
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

  // Handle ball movement
  socket.on('ballMove', ({ position, velocity }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Only allow host to send ball updates
    if (playerSessions.get(socket.id)?.role !== 'host') return;

    // Broadcast ball update to other players
    socket.to(roomId).emit('ballUpdate', {
      position,
      velocity,
      timestamp: Date.now()
    });
  });

  // Handle pause state
  socket.on('pauseGame', ({ isPaused, countdownValue }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    console.log('Pause update received:', { isPaused, countdownValue, roomId });

    // Broadcast pause state to all players in the room
    io.to(roomId).emit('pauseUpdate', {
      isPaused,
      countdownValue,
      timestamp: Date.now()
    });
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
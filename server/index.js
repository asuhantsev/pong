import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://asuhantsev.github.io",
  "https://asuhantsev.github.io/pong"
];

// Basic middleware
app.use(express.json());
app.set('trust proxy', true);

// Simple CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  path: '/socket.io/',
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  allowUpgrades: true,
  cookie: false
});

// Add health check endpoint with CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.send('Pong server is running');
});

// Store rooms and sessions
const rooms = new Map();
const playerSessions = new Map();

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
    
    // Store roomId on socket object
    socket.roomId = roomId;
    
    console.log('Room created:', {
      roomId,
      sessionId,
      playerId: socket.id,
      socketRoomId: socket.roomId // Log to verify
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
      socket.join(roomId);
      room.players.push(socket.id);
      room.readyState.set(socket.id, false);

      // Store roomId on socket object
      socket.roomId = roomId;

      console.log('Player joined room:', {
        roomId,
        playerId: socket.id,
        players: room.players,
        readyState: Array.from(room.readyState.entries()),
        socketRoomId: socket.roomId // Log to verify
      });

      // Notify other players
      socket.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        readyState: Array.from(room.readyState.entries())
      });

      // Send join confirmation
      socket.emit('roomJoined', {
        roomId,
        role: 'client',
        readyState: Array.from(room.readyState.entries())
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('roomError', 'Failed to join room');
    }
  });

  // Add ready state handler
  socket.on('toggleReady', ({ roomId }) => {
    console.log('Toggle ready request:', { 
      roomId, 
      socketId: socket.id 
    });
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return;
    }

    // Toggle ready state for this player
    const currentState = room.readyState.get(socket.id) || false;
    const newState = !currentState;
    room.readyState.set(socket.id, newState);

    console.log('Ready state updated:', {
      roomId,
      socketId: socket.id,
      newState,
      allStates: Array.from(room.readyState.entries())
    });

    // Broadcast ready state to all players in the room
    io.to(roomId).emit('readyStateUpdate', {
      readyState: Array.from(room.readyState.entries())
    });

    // Check if all players are ready
    const allReady = Array.from(room.readyState.values()).every(ready => ready);
    if (allReady && room.players.length === 2) {
      console.log('All players ready, starting game in room:', roomId);
      io.to(roomId).emit('gameReady');
    }
  });

  // Add game state handlers
  socket.on('paddleMove', ({ position, paddleSide, timestamp }) => {
    const roomId = socket.roomId;
    if (!roomId) {
      console.log('No room found for paddle move:', {
        socketId: socket.id,
        socketRooms: Array.from(socket.rooms),
        socketRoomId: socket.roomId
      });
      return;
    }

    // Comment out paddle movement logging
    /*
    console.log('Paddle move:', {
      roomId,
      socketId: socket.id,
      paddleSide,
      position,
      timestamp
    });
    */

    // Broadcast paddle position to other players in the same room
    socket.to(roomId).emit('paddleUpdate', {
      position,
      paddleSide,
      timestamp
    });
  });

  socket.on('ballMove', ({ position, velocity, timestamp }) => {
    const roomId = socket.roomId;
    if (!roomId) {
      console.log('No room found for ball move:', {
        socketId: socket.id,
        socketRooms: Array.from(socket.rooms),
        socketRoomId: socket.roomId
      });
      return;
    }

    const room = rooms.get(roomId);
    if (!room || room.players[0] !== socket.id) {
      console.log('Not authorized to send ball updates:', {
        roomId,
        socketId: socket.id,
        isHost: room?.players[0] === socket.id,
        players: room?.players,
        roomExists: !!room
      });
      return;
    }

    // Comment out ball position logging
    /*
    console.log('Server broadcasting ball update:', {
      roomId,
      from: socket.id,
      to: room.players.filter(id => id !== socket.id),
      position,
      velocity
    });
    */

    // Broadcast ball position to other players in the room
    socket.to(roomId).emit('ballUpdate', {
      position,
      velocity,
      timestamp
    });
  });

  socket.on('score', ({ score, scorer }) => {
    const roomId = socket.roomId;
    if (!roomId) {
      console.log('No room found for score update');
      return;
    }

    const room = rooms.get(roomId);
    if (!room || room.players[0] !== socket.id) {
      console.log('Not authorized to update score');
      return;
    }

    console.log('Score update:', {
      roomId,
      score,
      scorer
    });

    // Broadcast score to all players in the room
    io.to(roomId).emit('scoreUpdate', {
      score,
      scorer,
      timestamp: Date.now()
    });
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

  // Add pause game handler
  socket.on('pauseGame', (data) => {
    const roomId = socket.roomId;
    if (!roomId) {
      console.log('No room found for pause update, socket:', socket.id);
      return;
    }

    console.log('Processing pause update:', {
      roomId,
      isPaused: data.isPaused,
      countdownValue: data.countdownValue,
      from: socket.id
    });

    // Broadcast to all clients in the room
    io.in(roomId).emit('pauseUpdate', {
      isPaused: data.isPaused,
      countdownValue: data.countdownValue,
      timestamp: Date.now(),
      from: socket.id
    });
  });

  // Add player exit handler
  socket.on('playerExit', ({ roomId }) => {
    if (!roomId) {
      console.log('No room found for player exit:', socket.id);
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found for player exit:', roomId);
      return;
    }

    console.log('Player exiting room:', {
      roomId,
      playerId: socket.id
    });

    // Notify other players in the room
    socket.to(roomId).emit('playerExited');

    // Clean up room if it exists
    if (room.players.includes(socket.id)) {
      room.players = room.players.filter(id => id !== socket.id);
      room.readyState.delete(socket.id);
      
      if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log('Room deleted:', roomId);
      }
    }

    // Leave the room
    socket.leave(roomId);
  });

  // Add rematch handlers
  socket.on('rematchRequest', ({ roomId }) => {
    if (!roomId) {
      console.log('No room found for rematch request');
      return;
    }
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found for rematch request');
      return;
    }
    
    console.log('Rematch requested:', {
      roomId,
      from: socket.id
    });
    
    // Reset ready states
    room.readyState = new Map(room.players.map(id => [id, false]));
    
    // Notify other player
    socket.to(roomId).emit('rematchRequest');
  });

  socket.on('rematchResponse', ({ roomId, accepted }) => {
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    if (accepted) {
      // Reset room state for new game
      room.readyState = new Map(room.players.map(id => [id, false]));
      
      // Notify all players
      io.to(roomId).emit('rematchAccepted');
    } else {
      socket.to(roomId).emit('rematchDeclined');
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
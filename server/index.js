import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Define allowed origins
const ALLOWED_ORIGINS = [
  'https://asuhantsev.github.io',
  'http://localhost:5173'
];

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type']
  },
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  pingTimeout: 20000,
  pingInterval: 10000,
  upgradeTimeout: 10000,
  allowEIO3: true,
  allowUpgrades: true,
  cookie: {
    name: 'io',
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: io.engine.clientsCount,
    origins: ALLOWED_ORIGINS
  });
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
      readyState: new Map([[socket.id, false]]),
      nicknames: new Map()
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
      readyState: Array.from(room.readyState.entries()),
      nicknames: Array.from(room.nicknames.entries())
    });
  });

  // Add join room handler
  socket.on('joinRoom', (roomId) => {
    try {
      console.log('Join room request:', { roomId, socketId: socket.id });
      
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('roomError', 'Room not found');
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('roomError', 'Room is full');
        return;
      }

      socket.join(roomId);
      room.players.push(socket.id);
      room.readyState.set(socket.id, false);
      
      // Initialize nicknames Map if it doesn't exist
      room.nicknames = room.nicknames || new Map();

      // Notify other players with nicknames
      socket.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        readyState: Array.from(room.readyState.entries()),
        nicknames: Array.from(room.nicknames.entries())
      });

      // Send join confirmation with all nicknames
      socket.emit('roomJoined', {
        roomId,
        role: 'client',
        readyState: Array.from(room.readyState.entries()),
        nicknames: Array.from(room.nicknames.entries())
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('roomError', 'Failed to join room');
    }
  });

  // Add toggleReady handler
  socket.on('toggleReady', ({ roomId, playerId, nickname }) => {
    try {
      console.log('Toggle ready request:', { roomId, playerId, nickname });
      
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      if (!room.players.includes(socket.id)) {
        throw new Error('Player not in room');
      }

      // Initialize nicknames Map if it doesn't exist
      room.nicknames = room.nicknames || new Map();
      if (nickname) {
        room.nicknames.set(socket.id, nickname);
      }

      // Toggle ready state
      const currentState = room.readyState.get(socket.id) || false;
      room.readyState.set(socket.id, !currentState);

      console.log('Ready state updated:', {
        roomId,
        playerId: socket.id,
        readyState: Array.from(room.readyState.entries()),
        nicknames: Array.from(room.nicknames.entries())
      });

      // Broadcast new ready state and nicknames to all players in room
      io.to(roomId).emit('readyStateUpdate', {
        readyState: Array.from(room.readyState.entries()),
        nicknames: Array.from(room.nicknames.entries())
      });

    } catch (error) {
      console.error('Toggle ready error:', error);
      socket.emit('error', error.message);
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
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;

    console.log('Player exiting room:', {
      roomId,
      playerId: socket.id
    });

    // Notify other players before cleanup
    socket.to(roomId).emit('playerExited');

    // Clean up room state
    room.players = room.players.filter(id => id !== socket.id);
    room.readyState.delete(socket.id);
    
    if (room.players.length === 0) {
      rooms.delete(roomId);
    }

    socket.leave(roomId);
  });

  // Add rematch handlers
  socket.on('rematchRequest', ({ roomId }) => {
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    console.log('Rematch requested:', {
      roomId,
      from: socket.id
    });
    
    // Reset room state
    room.readyState = new Map(room.players.map(id => [id, false]));
    room.score = { left: 0, right: 0 };
    
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

  // Update winner handler
  socket.on('gameWinner', ({ winner, roomId, score }) => {
    if (!roomId || !winner) {
      console.log('Invalid winner update data:', { roomId, winner, score });
      return;
    }
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found for winner update:', roomId);
      return;
    }
    
    if (!room.players.includes(socket.id)) {
      console.log('Unauthorized winner update attempt:', socket.id);
      return;
    }
    
    console.log('Broadcasting game winner:', {
      roomId,
      winner,
      score,
      from: socket.id,
      to: room.players
    });
    
    // Broadcast to ALL players in room, including sender
    io.in(roomId).emit('winnerUpdate', { 
      winner,
      score 
    });
  });

  // Add ball speed sync handler
  socket.on('ballSpeedSync', ({ velocity }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    // Only allow host to sync ball speed
    if (room.players[0] !== socket.id) return;
    
    socket.to(roomId).emit('ballSpeedSync', { velocity });
  });

  socket.on('rematchAccepted', ({ roomId }) => {
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    // Reset room state for new game with both players not ready
    room.readyState = new Map(room.players.map(id => [id, false]));
    room.score = { left: 0, right: 0 };
    
    console.log('Rematch accepted, resetting room:', {
      roomId,
      readyState: Array.from(room.readyState.entries())
    });
    
    // First notify about rematch acceptance
    io.to(roomId).emit('rematchAccepted');
    
    // Then send the updated ready state
    io.to(roomId).emit('readyStateUpdate', {
      readyState: Array.from(room.readyState.entries())
    });
  });

  // Add nickname handling
  socket.on('nicknameUpdate', ({ roomId, nickname }) => {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (!room.players.includes(socket.id)) {
        throw new Error('Player not in room');
      }

      // Update nickname in room state
      room.nicknames = room.nicknames || new Map();
      room.nicknames.set(socket.id, nickname);
      
      // Broadcast to other players
      socket.to(roomId).emit('playerNicknameUpdate', {
        playerId: socket.id,
        nickname
      });

    } catch (error) {
      console.error('Nickname update error:', error);
      socket.emit('error', error.message);
    }
  });

  // Update room joining to include nicknames
  socket.on('joinRoom', (roomId) => {
    try {
      // ... existing validation ...
      
      const room = rooms.get(roomId);
      room.nicknames = room.nicknames || new Map();
      
      io.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        readyState: Array.from(room.readyState.entries()),
        nicknames: Array.from(room.nicknames.entries())
      });
      
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', error.message);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Route to welcome page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcome.html'));
});

// Room management
const waitingQueue = [];
const rooms = new Map();

// Generate room ID
function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Generate random correlation for room
function generateRandomCorrelation() {
    return Math.random() * 1.4 - 0.7; // Random correlation between -0.7 and 0.7
}

// Generate correlated data points (same function as client-side)
function generateCorrelatedData(n, r) {
    const randn_bm = () => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    const x_norm = Array.from({length: n}, () => randn_bm());
    const e_norm = Array.from({length: n}, () => randn_bm());

    const y_norm = x_norm.map((val, i) => r * val + Math.sqrt(1 - r*r) * e_norm[i]);

    const scale = (arr) => {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const range = max - min;
        if (range === 0) return arr.map(() => 0);
        return arr.map(val => ((val - min) / range) * 190 - 95);
    };

    const scaledX = scale(x_norm);
    const scaledY = scale(y_norm);

    return scaledX.map((val, i) => ({x: val, y: scaledY[i]}));
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-queue', () => {
        console.log('User joined queue:', socket.id);
        if (waitingQueue.length > 0) {
            // Match with waiting user
            const waitingUser = waitingQueue.pop();
            const roomId = generateRoomId();
            const correlation = generateRandomCorrelation();
            const initialData = generateCorrelatedData(10, correlation);
            
            // Create room
            rooms.set(roomId, {
                users: [waitingUser.id, socket.id],
                correlation: correlation,
                initialData: initialData,
                points: [],
                currentTurn: 0, // 0 = first user, 1 = second user
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3
            });
            
            // Join both users to room
            waitingUser.join(roomId);
            socket.join(roomId);
            
            // Send room info to both users
            const roomData = {
                roomId: roomId,
                correlation: correlation,
                initialData: initialData,
                users: 2,
                currentTurn: 0,
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                playerIndex: { [waitingUser.id]: 0, [socket.id]: 1 }
            };
            
            waitingUser.emit('room-matched', roomData);
            socket.emit('room-matched', roomData);
            
            console.log(`Room ${roomId} created with users ${waitingUser.id} and ${socket.id}`);
        } else {
            // Add to waiting queue
            waitingQueue.push(socket);
            socket.emit('waiting-for-match');
            console.log(`User ${socket.id} added to waiting queue`);
        }
    });

    socket.on('join-room', (data) => {
        const roomId = data.roomId || data; // Handle both string and object
        const playerIndex = data.playerIndex;
        
        console.log(`User ${socket.id} attempting to join room ${roomId} as player ${playerIndex}`);
        if (rooms.has(roomId)) {
            socket.join(roomId);
            
            // Update room users list with correct socket ID at correct position
            const room = rooms.get(roomId);
            
            if (playerIndex !== undefined && (playerIndex === 0 || playerIndex === 1)) {
                room.users[playerIndex] = socket.id;
                console.log(`Updated room ${roomId} users at index ${playerIndex}: ${socket.id}`);
            }
            
            console.log(`User ${socket.id} successfully joined room ${roomId}`);
            console.log(`Room ${roomId} users:`, room.users);
        } else {
            console.log(`Room ${roomId} does not exist for user ${socket.id}`);
        }
    });

    socket.on('add-point', (data) => {
        console.log(`Received add-point from ${socket.id}:`, data);
        const roomId = data.roomId;
        const point = { x: data.x, y: data.y, userId: socket.id };
        
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const userIndex = room.users.indexOf(socket.id);
            
            // Check if it's this player's turn
            if (userIndex !== room.currentTurn) {
                console.log(`User ${socket.id} tried to add point but it's not their turn. Current turn: ${room.currentTurn}, User index: ${userIndex}`);
                socket.emit('turn-error', { message: "It's not your turn!" });
                return;
            }
            
            // Check if player has reached max points for this turn
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                console.log(`User ${socket.id} tried to add point but turn limit reached`);
                socket.emit('turn-error', { message: "You've reached your turn limit!" });
                return;
            }
            
            // Add the point
            room.points.push(point);
            room.pointsInCurrentTurn++;
            
            console.log(`Point added to room ${roomId} by user ${socket.id}. Points in turn: ${room.pointsInCurrentTurn}/${room.maxPointsPerTurn}`);
            
            // Check if turn should switch
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                room.currentTurn = 1 - room.currentTurn; // Switch turn (0->1, 1->0)
                room.pointsInCurrentTurn = 0;
                console.log(`Turn switched to player ${room.currentTurn}`);
                
                // Broadcast turn change to all users in room
                io.to(roomId).emit('turn-changed', {
                    currentTurn: room.currentTurn,
                    pointsInCurrentTurn: room.pointsInCurrentTurn
                });
            }
            
            // Broadcast point to all users in room
            io.to(roomId).emit('point-added', {
                ...point,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn
            });
            
            console.log(`Point broadcasted to room ${roomId} by user ${socket.id}`);
        } else {
            console.log(`Room ${roomId} does not exist when adding point`);
        }
    });

    socket.on('remove-point', (data) => {
        console.log(`Received remove-point from ${socket.id}:`, data);
        const roomId = data.roomId;
        const removeData = { datasetIndex: data.datasetIndex, pointIndex: data.pointIndex, userId: socket.id };
        
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const userIndex = room.users.indexOf(socket.id);
            
            // Check if it's this player's turn
            if (userIndex !== room.currentTurn) {
                console.log(`User ${socket.id} tried to remove point but it's not their turn. Current turn: ${room.currentTurn}, User index: ${userIndex}`);
                socket.emit('turn-error', { message: "It's not your turn!" });
                return;
            }
            
            // Check if player has reached max points for this turn
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                console.log(`User ${socket.id} tried to remove point but turn limit reached`);
                socket.emit('turn-error', { message: "You've reached your turn limit!" });
                return;
            }
            
            room.pointsInCurrentTurn++;
            
            console.log(`Point removed from room ${roomId} by user ${socket.id}. Points in turn: ${room.pointsInCurrentTurn}/${room.maxPointsPerTurn}`);
            
            // Check if turn should switch
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                room.currentTurn = 1 - room.currentTurn; // Switch turn (0->1, 1->0)
                room.pointsInCurrentTurn = 0;
                console.log(`Turn switched to player ${room.currentTurn}`);
                
                // Broadcast turn change to all users in room
                io.to(roomId).emit('turn-changed', {
                    currentTurn: room.currentTurn,
                    pointsInCurrentTurn: room.pointsInCurrentTurn
                });
            }
            
            // Broadcast point removal to all users in room
            io.to(roomId).emit('point-removed', {
                ...removeData,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn
            });
            
            console.log(`Point removal broadcasted to room ${roomId} by user ${socket.id}`);
        } else {
            console.log(`Room ${roomId} does not exist when removing point`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from waiting queue if present
        const queueIndex = waitingQueue.findIndex(s => s.id === socket.id);
        if (queueIndex !== -1) {
            waitingQueue.splice(queueIndex, 1);
            console.log(`Removed user ${socket.id} from waiting queue`);
        }
        
        // Don't immediately delete rooms on disconnect
        // Users may reconnect when navigating between pages
        console.log(`User ${socket.id} disconnected, but keeping rooms active for reconnection`);
    });
    
    // Add explicit leave-room handler for when users actually want to leave
    socket.on('leave-room', (roomId) => {
        console.log(`User ${socket.id} leaving room ${roomId}`);
        if (rooms.has(roomId)) {
            socket.to(roomId).emit('user-disconnected');
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
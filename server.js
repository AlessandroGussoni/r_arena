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

// Calculate correlation from data points
function calculateCorrelation(data) {
    if (data.length < 2) {
        return 0;
    }

    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);

    const n = data.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumX2 = xValues.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = yValues.reduce((acc, val) => acc + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
}

/**
 * The single, authoritative function for switching turns.
 * It clears any existing server-side timer and sets a new one for the next turn.
 * @param {string} roomId - The ID of the room.
 * @param {boolean} isTimeout - Flag to indicate if the switch was forced by a timeout.
 */
function switchTurn(roomId, isTimeout = false) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // 1. Clear any existing timer for the turn that is now ending.
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    if (isTimeout) {
        console.log(`[${roomId}] Turn for player ${room.currentTurn} ended due to server timeout.`);
    }

    // 2. Advance the game state
    room.currentTurn = 1 - room.currentTurn;
    room.pointsInCurrentTurn = 0;
    room.turnCount++;
    room.turnStartTime = Date.now();
    console.log(`[${roomId}] Turn switched to player ${room.currentTurn}. Total turns: ${room.turnCount}`);
    
    // 3. Emit the change to all clients
    io.to(roomId).emit('turn-changed', {
        currentTurn: room.currentTurn,
        pointsInCurrentTurn: room.pointsInCurrentTurn,
        turnStartTime: room.turnStartTime,
        turnDuration: room.turnDuration
    });

    // 4. Handle round/game logic
    // A round in the 'play' phase is complete after both players have had a turn.
    const roundComplete = room.turnCount >= 2 && room.gamePhase === 'play';
    if (roundComplete) {
        handleRoundCompletion(roomId);
    } else {
        // 5. Set a new server-side timer for the new turn
        room.turnTimer = setTimeout(() => {
            switchTurn(roomId, true); // Force the next switch on timeout
        }, room.turnDuration + 500); // Add a 500ms grace period
    }
}

function handleRoundCompletion(roomId) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Clear any leftover timer when the round ends
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    room.roundsCompleted++;
    if (room.roundsCompleted >= room.maxRounds) {
        calculateFinalScores(roomId);
    } else {
        // Start new round
        room.currentRound++;
        room.gamePhase = 'guess';
        room.currentTurn = 0;
        room.pointsInCurrentTurn = 0;
        room.turnCount = 0;
        room.points = [];
        room.turnStartTime = Date.now();
        
        console.log(`[${roomId}] Starting new round ${room.currentRound}`);

        // Set a timer for the first player's guess in the new round
        room.turnTimer = setTimeout(() => {
            switchTurn(roomId, true);
        }, room.turnDuration + 500);

        io.to(roomId).emit('new-round', {
            currentRound: room.currentRound,
            gamePhase: room.gamePhase,
            currentTurn: room.currentTurn,
            turnStartTime: room.turnStartTime,
            turnDuration: room.turnDuration
        });
    }
}

function calculateFinalScores(roomId) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Clean up the timer when the game is over
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }
    
    const trueCorrelation = calculateCorrelation(room.initialData);
    const player1Guesses = room.guesses.filter(g => g.playerIndex === 0);
    const player2Guesses = room.guesses.filter(g => g.playerIndex === 1);
    const player1Errors = player1Guesses.map(g => Math.abs(trueCorrelation - g.guess));
    const player2Errors = player2Guesses.map(g => Math.abs(trueCorrelation - g.guess));
    const player1AvgError = player1Errors.length > 0 ? player1Errors.reduce((a, b) => a + b, 0) / player1Errors.length : Infinity;
    const player2AvgError = player2Errors.length > 0 ? player2Errors.reduce((a, b) => a + b, 0) / player2Errors.length : Infinity;
    const winner = player1AvgError < player2AvgError ? 1 : (player2AvgError < player1AvgError ? 2 : 0); // Handle ties

    console.log(`Game over for room ${roomId}`);
    io.to(roomId).emit('game-over', {
        trueCorrelation,
        player1AvgError,
        player2AvgError,
        winner,
        player1Guesses,
        player2Guesses
    });
    rooms.delete(roomId);
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
            const room = {
                users: [waitingUser.id, socket.id],
                correlation: correlation,
                initialData: initialData,
                points: [],
                currentTurn: 0, // 0 = first user, 1 = second user
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                currentRound: 1,
                maxRounds: 3,
                gamePhase: 'guess', // 'guess' or 'play'
                guesses: [], // Array to store all guesses with rounds
                roundsCompleted: 0,
                turnCount: 0, // Track total turns completed
                turnStartTime: Date.now(), // Track when current turn started
                turnDuration: 20000, // 20 seconds per turn in milliseconds
                turnTimer: null // Initialize timer property
            };
            rooms.set(roomId, room);
            
            // Join both users to room
            waitingUser.join(roomId);
            socket.join(roomId);
            
            // Start the first timer for the guess phase
            room.turnTimer = setTimeout(() => {
                switchTurn(roomId, true);
            }, room.turnDuration + 500);
            
            // Send room info to both users
            const roomData = {
                roomId: roomId,
                correlation: correlation,
                initialData: initialData,
                users: 2,
                currentTurn: 0,
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                currentRound: 1,
                maxRounds: 3,
                gamePhase: 'guess',
                playerIndex: { [waitingUser.id]: 0, [socket.id]: 1 },
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
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

    socket.on('create-room', () => {
        console.log('User creating room:', socket.id);
        const roomId = generateRoomId();
        const correlation = generateRandomCorrelation();
        const initialData = generateCorrelatedData(10, correlation);
        
        // Create room with only one user initially
        rooms.set(roomId, {
            users: [socket.id, null], // Second slot empty for friend to join
            correlation: correlation,
            initialData: initialData,
            points: [],
            currentTurn: 0,
            pointsInCurrentTurn: 0,
            maxPointsPerTurn: 3,
            currentRound: 1,
            maxRounds: 3,
            gamePhase: 'guess',
            guesses: [],
            roundsCompleted: 0,
            turnCount: 0,
            createdBy: socket.id,
            turnStartTime: null,
            turnDuration: 20000,
            turnTimer: null // Initialize timer property
        });
        
        socket.join(roomId);
        
        // Send room info to creator
        socket.emit('room-created', {
            roomId: roomId,
            correlation: correlation,
            initialData: initialData
        });
        
        console.log(`Room ${roomId} created by user ${socket.id}`);
    });

    socket.on('join-room-by-id', (data) => {
        const roomId = data.roomId.toLowerCase(); // Convert to lowercase for case-insensitive lookup
        console.log(`User ${socket.id} attempting to join room by ID: ${roomId}`);
        
        if (!rooms.has(roomId)) {
            socket.emit('room-join-error', { message: 'Room not found' });
            return;
        }
        
        const room = rooms.get(roomId);
        
        // Check if room is full
        if (room.users[0] && room.users[1]) {
            socket.emit('room-join-error', { message: 'Room is full' });
            return;
        }
        
        // Add user to room
        const playerIndex = room.users[0] === null ? 0 : 1;
        room.users[playerIndex] = socket.id;
        
        socket.join(roomId);
        
        // If room is now full, start the game
        if (room.users[0] && room.users[1]) {
            // Set initial turn start time
            room.turnStartTime = Date.now();
            
            // Start the first timer for the guess phase
            room.turnTimer = setTimeout(() => {
                switchTurn(roomId, true);
            }, room.turnDuration + 500);
            
            const roomData = {
                roomId: roomId,
                correlation: room.correlation,
                initialData: room.initialData,
                users: 2,
                currentTurn: 0,
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                currentRound: 1,
                maxRounds: 3,
                gamePhase: 'guess',
                playerIndex: { [room.users[0]]: 0, [room.users[1]]: 1 },
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            };
            
            // Send to both users
            io.to(roomId).emit('room-matched', roomData);
            console.log(`Room ${roomId} is now full and starting game`);
        } else {
            // Send waiting message to the joiner
            socket.emit('room-waiting', {
                roomId: roomId,
                message: 'Waiting for the room creator to start the game...'
            });
            console.log(`User ${socket.id} joined room ${roomId}, waiting for second player`);
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
            
            // Check if this is a reconnection
            if (room.disconnectedUser && room.disconnectedUser.index === playerIndex) {
                console.log(`User ${socket.id} reconnecting to room ${roomId} at index ${playerIndex}`);
                
                // Clear disconnected user data
                delete room.disconnectedUser;
                
                // Notify the other player about successful reconnection
                socket.to(roomId).emit('partner-reconnected');
                
                console.log(`User ${socket.id} successfully reconnected to room ${roomId}`);
            }
            
            if (playerIndex !== undefined && (playerIndex === 0 || playerIndex === 1)) {
                room.users[playerIndex] = socket.id;
                console.log(`Updated room ${roomId} users at index ${playerIndex}: ${socket.id}`);
            }
            
            console.log(`User ${socket.id} successfully joined room ${roomId}`);
            console.log(`Room ${roomId} users:`, room.users);
            
            // Send current game state to reconnecting user
            socket.emit('game-state-sync', {
                roomId: roomId,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                maxPointsPerTurn: room.maxPointsPerTurn,
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                gamePhase: room.gamePhase,
                points: room.points,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration,
                turnCount: room.turnCount,
                guesses: room.guesses
            });
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
            
            // Check if player has submitted a guess for this round
            const playerGuessForRound = room.guesses.find(g => g.playerIndex === userIndex && g.round === room.currentRound);
            if (!playerGuessForRound) {
                console.log(`User ${socket.id} tried to add point but hasn't submitted guess for round ${room.currentRound}`);
                socket.emit('turn-error', { message: "Please submit your correlation guess first!" });
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
                switchTurn(roomId);
            }
            
            // Broadcast point to all users in room
            io.to(roomId).emit('point-added', {
                ...point,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
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
            
            // Check if player has submitted a guess for this round
            const playerGuessForRound = room.guesses.find(g => g.playerIndex === userIndex && g.round === room.currentRound);
            if (!playerGuessForRound) {
                console.log(`User ${socket.id} tried to remove point but hasn't submitted guess for round ${room.currentRound}`);
                socket.emit('turn-error', { message: "Please submit your correlation guess first!" });
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
                switchTurn(roomId);
            }
            
            // Broadcast point removal to all users in room
            io.to(roomId).emit('point-removed', {
                ...removeData,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
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
        
        // Find room where this user was playing
        let userRoom = null;
        let userIndex = -1;
        
        for (const [roomId, room] of rooms.entries()) {
            const index = room.users.indexOf(socket.id);
            if (index !== -1) {
                userRoom = roomId;
                userIndex = index;
                break;
            }
        }
        
        if (userRoom) {
            const room = rooms.get(userRoom);
            console.log(`User ${socket.id} disconnected from room ${userRoom}`);
            
            // Mark user as disconnected but don't remove immediately
            room.users[userIndex] = null;
            room.disconnectedUser = {
                id: socket.id,
                index: userIndex,
                disconnectTime: Date.now()
            };
            
            // Notify the remaining player
            socket.to(userRoom).emit('partner-reconnecting');
            
            // Set a timer to clean up the room if user doesn't reconnect
            setTimeout(() => {
                if (rooms.has(userRoom)) {
                    const currentRoom = rooms.get(userRoom);
                    if (currentRoom.disconnectedUser && currentRoom.disconnectedUser.id === socket.id) {
                        // User didn't reconnect, notify partner and clean up
                        console.log(`User ${socket.id} didn't reconnect to room ${userRoom}, cleaning up`);
                        socket.to(userRoom).emit('user-disconnected');
                        rooms.delete(userRoom);
                    }
                }
            }, 30000); // 30 second grace period for reconnection
        }
    });
    
    socket.on('submit-guess', (data) => {
        console.log(`Received guess from ${socket.id}:`, data);
        const roomId = data.roomId;
        const guess = data.guess;
        const playerIndex = data.playerIndex;
        
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            
            // Store the guess
            room.guesses.push({
                playerIndex: playerIndex,
                guess: guess,
                round: room.currentRound,
                userId: socket.id
            });
            
            console.log(`Guess stored for player ${playerIndex} in round ${room.currentRound}: ${guess}`);
            
            // Notify that guess was submitted
            io.to(roomId).emit('guess-submitted', {
                playerIndex: playerIndex,
                round: room.currentRound,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            });
            
            // Check if both players have submitted guesses for this round
            const roundGuesses = room.guesses.filter(g => g.round === room.currentRound);
            if (roundGuesses.length < 2) {
                // First player guessed. Switch turn for the second player to guess.
                switchTurn(roomId);
            } else {
                // Second player guessed. Start the 'play' phase.
                console.log(`[${roomId}] Both players have guessed for round ${room.currentRound}, starting play phase.`);
                room.gamePhase = 'play';
                room.turnCount = 0;
                room.currentTurn = 1; // Will be switched to 0, making the first player start.
                
                io.to(roomId).emit('round-start', {
                    round: room.currentRound,
                    gamePhase: room.gamePhase,
                });
                
                switchTurn(roomId); // This starts player 0's turn for the play phase.
            }
        } else {
            console.log(`Room ${roomId} does not exist when submitting guess`);
        }
    });
    
    // This listener is now effectively deprecated but harmless to keep for backward compatibility.
    socket.on('force-turn-switch', (data) => {
        console.log(`[${data.roomId}] Received legacy 'force-turn-switch' from ${socket.id}. Server is authoritative.`);
    });
    
    socket.on('end-game', (data) => {
        const roomId = data.roomId;
        if (rooms.has(roomId)) {
            calculateFinalScores(roomId);
        }
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
Here is a breakdown of the problem and how to fix it.

The Problem
The issue is located in two places in server.js:

socket.on('submit-guess', ...): This event handler contains faulty logic. When the first player of a round submits their guess, it immediately calls switchTurn(), passing control to the other player before any points can be moved.

switchTurn() function: The logic to decide when a round is over incorrectly depends on a gamePhase variable. This variable is part of the flawed game flow and prevents rounds from advancing correctly with the fix.

How to Fix It
The fix requires modifying the server-side logic to correctly handle the game flow.

1. Fix the submit-guess Event Handler
The logic in this handler needs to be completely replaced. Instead of switching turns, it should simply record the player's guess and let them proceed to their "move points" phase. The turn should only be switched after the moves are completed or the timer runs out.

In server.js, find the socket.on('submit-guess', ...) block and replace the entire function body with the following code:

Generated javascript
// In server.js

socket.on('submit-guess', (data) => {
    console.log(`Received guess from ${socket.id}:`, data);
    const roomId = data.roomId;
    const guess = parseFloat(data.guess);
    const playerIndex = data.playerIndex;

    // Server-side input validation
    if (isNaN(guess) || guess < -1 || guess > 1) {
        console.log(`[${roomId}] Invalid guess received from ${socket.id}: ${data.guess}`);
        socket.emit('turn-error', { message: 'Invalid guess value. Must be between -1 and 1.' });
        return;
    }

    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);

        // Add validation to ensure it's the correct player's turn to guess
        if (playerIndex !== room.currentTurn) {
            socket.emit('turn-error', { message: "It's not your turn to submit a guess." });
            return;
        }

        const alreadyGuessed = room.guesses.some(g => g.playerIndex === playerIndex && g.round === room.currentRound);
        if (alreadyGuessed) {
            socket.emit('turn-error', { message: 'You have already submitted a guess for this round.' });
            return;
        }

        // Store the guess
        room.guesses.push({
            playerIndex: playerIndex,
            guess: guess,
            round: room.currentRound,
            userId: socket.id
        });

        console.log(`Guess stored for player ${playerIndex} in round ${room.currentRound}: ${guess}`);

        // Notify clients that guess was submitted, but DO NOT switch the turn.
        // The turn now proceeds to the 'move points' phase for this player.
        io.to(roomId).emit('guess-submitted', {
            playerIndex: playerIndex,
            round: room.currentRound
        });

    } else {
        console.log(`Room ${roomId} does not exist when submitting guess`);
    }
});
Use code with caution.
JavaScript
Why this works: The new logic correctly validates the guess, stores it, and then stops. It no longer calls switchTurn(), allowing the player to remain in control and proceed to move points. The turn will now be switched correctly by the 'add-point'/'remove-point' handlers or by the server-side timer.

2. Fix the Round Completion Logic
With the first fix, the gamePhase variable is no longer relevant for determining when a round ends. We need to update the switchTurn function to reflect this. A round is now simply complete after both players have taken a turn (i.e., when turnCount reaches 2).

In server.js, find the switchTurn function and modify the line that checks if a round is complete.

Find this line:

Generated javascript
// A round in the 'play' phase is complete after both players have had a turn.
const roundComplete = room.turnCount >= 2 && room.gamePhase === 'play';
Use code with caution.
JavaScript
And change it to this:

Generated javascript
// A round is complete after both players have had a turn.
const roundComplete = room.turnCount >= 2;
Use code with caution.
JavaScript
Why this works: This change removes the dependency on the obsolete gamePhase variable. Now, the server will correctly detect the end of a round after the second player completes their moves, allowing the game to advance to the next round or end properly.

By applying these two fixes, your game will follow the intended and much more engaging Guess -> Move -> Switch Turn flow.
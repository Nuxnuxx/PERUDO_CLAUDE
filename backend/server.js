const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
// Set up more flexible CORS for Socket.IO in production
const corsOrigin = process.env.FRONTEND_URL || "*";
console.log(`Setting CORS origin to: ${corsOrigin}`);

const io = socketIO(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Game state
const games = {};

// Constants
const MAX_PLAYERS = 6;
const STARTING_DICE = 5;
const DICE_FACES = 6;

// Utility functions
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function rollDice(count) {
  const dice = [];
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * DICE_FACES) + 1);
  }
  return dice;
}

function countDiceValues(players, targetValue, isWildOnes = true) {
  let count = 0;
  
  for (const playerId in players) {
    players[playerId].dice.forEach(die => {
      if (die === targetValue || (isWildOnes && die === 1 && targetValue !== 1)) {
        count++;
      }
    });
  }
  
  return count;
}

function isValidBid(prevBid, newBid, players, isPalafico) {
  if (!prevBid) return true;
  
  // Extract values from bids
  const prevQuantity = prevBid.quantity;
  const prevValue = prevBid.value;
  const newQuantity = newBid.quantity;
  const newValue = newBid.value;
  
  // Switching from normal to aces bid
  if (prevValue !== 1 && newValue === 1) {
    return newQuantity >= Math.ceil(prevQuantity / 2);
  }
  
  // Switching from aces to normal bid
  if (prevValue === 1 && newValue !== 1) {
    return newQuantity >= prevQuantity * 2 + 1;
  }
  
  // Same value, quantity must increase
  if (prevValue === newValue) {
    return newQuantity > prevQuantity;
  }
  
  // Different value, rules differ based on palafico
  if (isPalafico) {
    // In palafico, only quantity can be increased, not value
    return false;
  } else {
    // Normal round, quantity must be same or higher for higher value
    if (newValue > prevValue) return newQuantity >= prevQuantity;
    // Lower value must have higher quantity
    return newValue < prevValue && newQuantity > prevQuantity;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  
  // Create a new game
  socket.on('createGame', (playerName) => {
    const gameId = generateGameId();
    const playerId = socket.id;
    
    games[gameId] = {
      id: gameId,
      players: {
        [playerId]: {
          id: playerId,
          name: playerName,
          diceCount: STARTING_DICE,
          dice: [],
          isPalafico: false,
          hasBeenPalafico: false
        }
      },
      hostId: playerId,
      round: 0,
      state: 'waiting', // waiting, rolling, bidding, round_end
      currentTurn: null,
      lastBid: null,
      totalDice: STARTING_DICE,
      isPalaficoRound: false
    };
    
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, playerId, game: games[gameId] });
    console.log(`Game created: ${gameId} by ${playerName}`);
  });
  
  // Join an existing game
  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found!' });
      return;
    }
    
    if (game.state !== 'waiting') {
      socket.emit('error', { message: 'Game already started!' });
      return;
    }
    
    if (Object.keys(game.players).length >= MAX_PLAYERS) {
      socket.emit('error', { message: 'Game is full!' });
      return;
    }
    
    const playerId = socket.id;
    
    game.players[playerId] = {
      id: playerId,
      name: playerName,
      diceCount: STARTING_DICE,
      dice: [],
      isPalafico: false,
      hasBeenPalafico: false
    };
    
    game.totalDice += STARTING_DICE;
    
    socket.join(gameId);
    socket.emit('gameJoined', { gameId, playerId, game });
    io.to(gameId).emit('playerJoined', { player: game.players[playerId], game });
    
    console.log(`Player ${playerName} joined game ${gameId}`);
  });
  
  // Start the game
  socket.on('startGame', ({ gameId }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found!' });
      return;
    }
    
    if (game.hostId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game!' });
      return;
    }
    
    if (Object.keys(game.players).length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start!' });
      return;
    }
    
    startNewRound(gameId);
  });
  
  // Start a new round 
  function startNewRound(gameId) {
    const game = games[gameId];
    
    if (!game) return;
    
    game.round++;
    game.state = 'rolling';
    game.lastBid = null;
    
    // Roll dice for all players
    for (const playerId in game.players) {
      const player = game.players[playerId];
      player.dice = rollDice(player.diceCount);
    }
    
    // Choose the first player for this round
    const playerIds = Object.keys(game.players);
    
    // If it's the first round, host starts
    // Otherwise the player who lost the previous round starts
    if (game.round === 1) {
      game.currentTurn = game.hostId;
    }
    
    io.to(gameId).emit('roundStarted', { 
      round: game.round, 
      currentTurn: game.currentTurn,
      isPalaficoRound: game.isPalaficoRound
    });
    
    // Send private dice info to each player
    for (const playerId in game.players) {
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.emit('diceRolled', { 
          dice: game.players[playerId].dice,
          totalDice: game.totalDice 
        });
      }
    }
    
    // Move to bidding phase
    setTimeout(() => {
      game.state = 'bidding';
      io.to(gameId).emit('biddingStarted', { currentTurn: game.currentTurn });
    }, 3000);
  }
  
  // Player makes a bid
  socket.on('placeBid', ({ gameId, bid }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found!' });
      return;
    }
    
    if (game.state !== 'bidding') {
      socket.emit('error', { message: 'Cannot bid now!' });
      return;
    }
    
    if (game.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Not your turn!' });
      return;
    }
    
    // Validate the bid
    if (!isValidBid(game.lastBid, bid, game.players, game.isPalaficoRound)) {
      socket.emit('error', { message: 'Invalid bid!' });
      return;
    }
    
    game.lastBid = {
      ...bid,
      playerId: socket.id,
      playerName: game.players[socket.id].name
    };
    
    // Move to next player
    const playerIds = Object.keys(game.players);
    const currentIndex = playerIds.indexOf(socket.id);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    game.currentTurn = playerIds[nextIndex];
    
    io.to(gameId).emit('bidPlaced', { 
      bid: game.lastBid, 
      nextTurn: game.currentTurn 
    });
  });
  
  // Player calls dudo (doubt)
  socket.on('callDudo', ({ gameId }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found!' });
      return;
    }
    
    if (game.state !== 'bidding') {
      socket.emit('error', { message: 'Cannot call dudo now!' });
      return;
    }
    
    if (game.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Not your turn!' });
      return;
    }
    
    if (!game.lastBid) {
      socket.emit('error', { message: 'No bid to doubt!' });
      return;
    }
    
    // Count actual dice matching the bid
    const bidValue = game.lastBid.value;
    const bidQuantity = game.lastBid.quantity;
    const isWildOnes = !game.isPalaficoRound || bidValue !== 1;
    const actualCount = countDiceValues(game.players, bidValue, isWildOnes);
    
    // Determine who loses
    const lastBidPlayerId = game.lastBid.playerId;
    const challengerId = socket.id;
    let loserId;
    
    if (actualCount >= bidQuantity) {
      // Last bidder was right, challenger loses
      loserId = challengerId;
    } else {
      // Last bidder was wrong, they lose
      loserId = lastBidPlayerId;
    }
    
    // Loser loses a die
    game.players[loserId].diceCount--;
    game.totalDice--;
    
    // Check if player is eliminated
    if (game.players[loserId].diceCount === 0) {
      // Player is eliminated
      io.to(gameId).emit('playerEliminated', { 
        playerId: loserId, 
        playerName: game.players[loserId].name 
      });
      
      // Check if game is over (only one player left)
      const remainingPlayers = Object.values(game.players).filter(p => p.diceCount > 0);
      if (remainingPlayers.length === 1) {
        // Game over, we have a winner!
        const winner = remainingPlayers[0];
        io.to(gameId).emit('gameOver', { 
          winner: winner,
          allDice: Object.values(game.players).map(p => ({ 
            playerId: p.id, 
            playerName: p.name, 
            dice: p.dice 
          }))
        });
        return;
      }
    }
    
    // Check for palafico status - player who loses their 4th die
    if (game.players[loserId].diceCount === 1 && !game.players[loserId].hasBeenPalafico) {
      game.players[loserId].isPalafico = true;
      game.players[loserId].hasBeenPalafico = true;
      game.isPalaficoRound = true;
    } else {
      game.isPalaficoRound = false;
      for (const pid in game.players) {
        game.players[pid].isPalafico = false;
      }
    }
    
    // Send round results
    game.state = 'round_end';
    io.to(gameId).emit('dudoResult', {
      challenger: {
        id: challengerId,
        name: game.players[challengerId].name
      },
      lastBidder: {
        id: lastBidPlayerId,
        name: game.players[lastBidPlayerId].name
      },
      bid: game.lastBid,
      actual: actualCount,
      loser: {
        id: loserId,
        name: game.players[loserId].name,
        remainingDice: game.players[loserId].diceCount
      },
      allDice: Object.values(game.players).map(p => ({ 
        playerId: p.id, 
        playerName: p.name, 
        dice: p.dice 
      }))
    });
    
    // Set next round's first player to the loser of this round
    if (game.players[loserId].diceCount > 0) {
      game.currentTurn = loserId;
    } else {
      // If loser is eliminated, next player starts
      const playerIds = Object.keys(game.players).filter(id => game.players[id].diceCount > 0);
      const loserIndex = playerIds.indexOf(loserId);
      const nextIndex = loserIndex >= 0 ? (loserIndex + 1) % playerIds.length : 0;
      game.currentTurn = playerIds[nextIndex];
    }
    
    // Start a new round after a delay
    setTimeout(() => {
      startNewRound(gameId);
    }, 8000);
  });
  
  // Player calls calza (exact)
  socket.on('callCalza', ({ gameId }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found!' });
      return;
    }
    
    if (game.state !== 'bidding') {
      socket.emit('error', { message: 'Cannot call calza now!' });
      return;
    }
    
    if (game.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Not your turn!' });
      return;
    }
    
    if (!game.lastBid) {
      socket.emit('error', { message: 'No bid to call exact on!' });
      return;
    }
    
    // Check if calza is allowed
    const playerIds = Object.keys(game.players);
    if (playerIds.length <= 2 || game.isPalaficoRound) {
      socket.emit('error', { message: 'Calza not allowed in this situation!' });
      return;
    }
    
    // Check if next player is calling calza (not allowed)
    const lastBidPlayerId = game.lastBid.playerId;
    const currentIndex = playerIds.indexOf(lastBidPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    if (playerIds[nextIndex] === socket.id) {
      socket.emit('error', { message: "Can't call calza when you're next to bid!" });
      return;
    }
    
    // Count actual dice matching the bid
    const bidValue = game.lastBid.value;
    const bidQuantity = game.lastBid.quantity;
    const isWildOnes = !game.isPalaficoRound || bidValue !== 1;
    const actualCount = countDiceValues(game.players, bidValue, isWildOnes);
    
    const callerId = socket.id;
    const isExact = actualCount === bidQuantity;
    
    // Determine outcome
    if (isExact) {
      // Caller was right, they gain a die (up to starting max)
      if (game.players[callerId].diceCount < STARTING_DICE) {
        game.players[callerId].diceCount++;
        game.totalDice++;
      }
    } else {
      // Caller was wrong, they lose a die
      game.players[callerId].diceCount--;
      game.totalDice--;
      
      // Check if player is eliminated
      if (game.players[callerId].diceCount === 0) {
        // Player is eliminated
        io.to(gameId).emit('playerEliminated', { 
          playerId: callerId, 
          playerName: game.players[callerId].name 
        });
        
        // Check if game is over (only one player left)
        const remainingPlayers = Object.values(game.players).filter(p => p.diceCount > 0);
        if (remainingPlayers.length === 1) {
          // Game over, we have a winner!
          const winner = remainingPlayers[0];
          io.to(gameId).emit('gameOver', { 
            winner: winner,
            allDice: Object.values(game.players).map(p => ({ 
              playerId: p.id, 
              playerName: p.name, 
              dice: p.dice 
            }))
          });
          return;
        }
      }
      
      // Check for palafico status
      if (game.players[callerId].diceCount === 1 && !game.players[callerId].hasBeenPalafico) {
        game.players[callerId].isPalafico = true;
        game.players[callerId].hasBeenPalafico = true;
        game.isPalaficoRound = true;
      } else {
        game.isPalaficoRound = false;
        for (const pid in game.players) {
          game.players[pid].isPalafico = false;
        }
      }
    }
    
    // Send calza results
    game.state = 'round_end';
    io.to(gameId).emit('calzaResult', {
      caller: {
        id: callerId,
        name: game.players[callerId].name
      },
      bid: game.lastBid,
      actual: actualCount,
      isExact: isExact,
      callerDiceCount: game.players[callerId].diceCount,
      allDice: Object.values(game.players).map(p => ({ 
        playerId: p.id, 
        playerName: p.name, 
        dice: p.dice 
      }))
    });
    
    // Set next round's first player
    if (isExact) {
      // If caller was right, they start next round
      game.currentTurn = callerId;
    } else if (game.players[callerId].diceCount > 0) {
      // If caller was wrong but still in the game, they start
      game.currentTurn = callerId;
    } else {
      // If caller is eliminated, next player starts
      const playerIds = Object.keys(game.players).filter(id => game.players[id].diceCount > 0);
      const callerIndex = playerIds.indexOf(callerId);
      const nextIndex = callerIndex >= 0 ? (callerIndex + 1) % playerIds.length : 0;
      game.currentTurn = playerIds[nextIndex];
    }
    
    // Start a new round after a delay
    setTimeout(() => {
      startNewRound(gameId);
    }, 8000);
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Find all games this player is in
    for (const gameId in games) {
      const game = games[gameId];
      
      if (game.players[socket.id]) {
        // Remove player from game
        delete game.players[socket.id];
        
        // Update total dice count
        game.totalDice = Object.values(game.players).reduce(
          (sum, player) => sum + player.diceCount, 0
        );
        
        // Notify other players
        io.to(gameId).emit('playerLeft', { 
          playerId: socket.id,
          remainingPlayers: Object.keys(game.players).length
        });
        
        // If game is in progress but has fewer than 2 players, end it
        if (game.state !== 'waiting' && Object.keys(game.players).length < 2) {
          // Find the remaining player if any
          const remainingPlayers = Object.values(game.players);
          
          if (remainingPlayers.length === 1) {
            // Declare remaining player as winner
            io.to(gameId).emit('gameOver', { 
              winner: remainingPlayers[0],
              reason: 'disconnect'
            });
          }
          
          // Clean up the game
          delete games[gameId];
        } 
        // If player was host, assign new host
        else if (socket.id === game.hostId && Object.keys(game.players).length > 0) {
          game.hostId = Object.keys(game.players)[0];
          io.to(gameId).emit('newHost', { 
            hostId: game.hostId,
            hostName: game.players[game.hostId].name
          });
        }
        // If it was this player's turn, move to next player
        else if (game.state === 'bidding' && game.currentTurn === socket.id) {
          const playerIds = Object.keys(game.players);
          game.currentTurn = playerIds[0];
          io.to(gameId).emit('turnChanged', { currentTurn: game.currentTurn });
        }
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
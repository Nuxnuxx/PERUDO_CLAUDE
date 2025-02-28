<template>
  <div class="app">
    <header>
      <h1>Pirate Perudo</h1>
      <p class="subtitle">The Deceptive Dice Game of the Seven Seas</p>
      <div class="header-decoration"></div>
    </header>
    
    <main class="container">
      <transition name="fade" mode="out-in">
        <!-- HOME SCREEN -->
        <div v-if="screen === 'home'" class="home-screen panel">
          <h2>Ahoy, Matey!</h2>
          <p>Welcome to Pirate Perudo, the game of bluffing and deception!</p>
          
          <div class="buttons">
            <button class="btn btn-primary" @click="screen = 'create'">Host New Game</button>
            <button class="btn btn-secondary" @click="screen = 'join'">Join Game</button>
          </div>
          
          <div class="rules-toggle">
            <button class="btn" @click="showRules = !showRules">
              {{ showRules ? 'Hide Rules' : 'Show Rules' }}
            </button>
          </div>
          
          <transition name="slide">
            <div v-if="showRules" class="rules panel">
              <h3>Game Rules</h3>
              <p>Perudo is an ancient dice game of bluffing and deception.</p>
              
              <h4>Objective:</h4>
              <p>Be the last player with dice remaining.</p>
              
              <h4>Basic Rules:</h4>
              <ul>
                <li>Each player starts with 5 dice</li>
                <li>Players roll their dice secretly</li>
                <li>Players take turns making bids about the total number of dice showing a specific value</li>
                <li>A bid consists of a quantity and a value (e.g., "four threes")</li>
                <li>Each new bid must be higher than the previous bid</li>
                <li>Aces (ones) are wild and count for any value</li>
              </ul>
              
              <h4>Turn Options:</h4>
              <ul>
                <li><strong>Raise the bid:</strong> Increase the quantity for the same value, or bid a higher value</li>
                <li><strong>Call "Dudo" (Doubt):</strong> Challenge the previous bid as being too high</li>
                <li><strong>Call "Calza" (Exact):</strong> Declare that the previous bid is exactly right</li>
              </ul>
              
              <h4>Special Rules:</h4>
              <ul>
                <li><strong>Palafico Round:</strong> When a player is down to their last die, special rules apply for one round</li>
                <li><strong>During Palafico:</strong> Aces are not wild, and players can only increase the quantity, not change the value</li>
              </ul>
            </div>
          </transition>
        </div>
        
        <!-- CREATE GAME SCREEN -->
        <div v-else-if="screen === 'create'" class="create-screen panel">
          <h2>Create New Game</h2>
          
          <div class="input-group">
            <label for="player-name">Enter Your Pirate Name:</label>
            <input 
              type="text" 
              id="player-name" 
              v-model="playerName" 
              placeholder="Captain Jack Sparrow"
              maxlength="20"
            />
          </div>
          
          <div class="buttons">
            <button 
              class="btn btn-primary" 
              @click="createGame" 
              :disabled="!playerName.trim()"
            >
              Create Game
            </button>
            <button class="btn" @click="screen = 'home'">Back</button>
          </div>
        </div>
        
        <!-- JOIN GAME SCREEN -->
        <div v-else-if="screen === 'join'" class="join-screen panel">
          <h2>Join Existing Game</h2>
          
          <div class="input-group">
            <label for="game-code">Game Code:</label>
            <input 
              type="text" 
              id="game-code" 
              v-model="gameCode" 
              placeholder="Enter game code"
              maxlength="6"
            />
          </div>
          
          <div class="input-group">
            <label for="player-name-join">Enter Your Pirate Name:</label>
            <input 
              type="text" 
              id="player-name-join" 
              v-model="playerName" 
              placeholder="Captain Jack Sparrow"
              maxlength="20"
            />
          </div>
          
          <div class="buttons">
            <button 
              class="btn btn-primary" 
              @click="joinGame" 
              :disabled="!gameCode.trim() || !playerName.trim()"
            >
              Join Game
            </button>
            <button class="btn" @click="screen = 'home'">Back</button>
          </div>
        </div>
        
        <!-- LOBBY SCREEN -->
        <div v-else-if="screen === 'lobby'" class="lobby-screen panel">
          <h2>Game Lobby</h2>
          <div class="game-info">
            <p><strong>Game Code:</strong> {{ gameCode }}</p>
            <p>Share this code with your fellow pirates!</p>
          </div>
          
          <div class="players-list">
            <h3>Crew Members ({{ Object.keys(players).length }}/6):</h3>
            <ul>
              <li v-for="player in players" :key="player.id" class="player-item">
                {{ player.name }} 
                <span v-if="player.id === hostId" class="host-badge">Captain</span>
                <span v-if="player.id === playerId" class="you-badge">You</span>
              </li>
            </ul>
          </div>
          
          <div class="buttons">
            <button 
              v-if="playerId === hostId" 
              class="btn btn-primary" 
              @click="startGame"
              :disabled="Object.keys(players).length < 2"
            >
              Start Game
            </button>
            <button class="btn btn-secondary" @click="leaveGame">Leave Game</button>
          </div>
        </div>
        
        <!-- GAME SCREEN -->
        <div v-else-if="screen === 'game'" class="game-screen">
          <div class="game-info panel">
            <div class="game-header">
              <h2>Round {{ round }}</h2>
              <div class="total-dice">
                <span class="total-dice-label">Total Dice:</span>
                <span class="total-dice-count">{{ totalDice }}</span>
              </div>
            </div>
            
            <div v-if="isPalaficoRound" class="palafico-alert">
              🏴‍☠️ Palafico Round! Aces are not wild, and only quantity can increase.
            </div>
          </div>
          
          <div class="game-table">
            <div class="game-table-inset"></div>
            
            <div class="table-center">
              <!-- Animated center decorative elements -->
              <div class="table-logo">
                <div class="skull-icon">☠️</div>
                <div class="crossed-swords">⚔️</div>
              </div>
              
              <!-- Last bid display in table center -->
              <transition name="fade">
                <div v-if="lastBid" class="center-bid">
                  <div class="bid-value">{{ lastBid.quantity }} × {{ lastBid.value }}</div>
                  <div class="bid-player">{{ lastBid.playerName }}</div>
                </div>
              </transition>
            </div>
            
            <transition-group name="players-list">
              <div 
                v-for="(player, index) in Object.values(players)" 
                :key="player.id" 
                class="player-position player-enter"
                :class="{ 
                  'current-turn': currentTurn === player.id,
                  'your-player': player.id === playerId
                }"
                :style="getPlayerPosition(index, Object.keys(players).length)"
              >
                <div 
                  class="player-card"
                  :class="{'highlight-turn': currentTurn === player.id}"
                >
                  <div class="player-avatar">
                    {{ player.name.charAt(0).toUpperCase() }}
                    <span v-if="player.isPalafico" class="palafico-badge">P</span>
                  </div>
                  
                  <div class="player-info">
                    <div class="player-name">
                      {{ player.name }}
                      <span v-if="player.id === playerId" class="you-badge">You</span>
                    </div>
                    
                    <div class="player-dice-compact">
                      <div 
                        v-for="(_, i) in Array(player.diceCount)" 
                        :key="i"
                        class="dice-dot"
                        :class="{'pulsing-dot': currentTurn === player.id}"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
          
          <div class="your-dice panel" v-if="myDice.length > 0">
            <h3>Your Hand</h3>
            <div class="dice-container">
              <transition-group name="dice-list">
                <div 
                  v-for="(die, index) in myDice" 
                  :key="index" 
                  class="dice-wrapper"
                  :class="{'roll-dice': gameState === 'rolling'}"
                >
                  <img 
                    :src="`/src/assets/dice-${die}.svg`" 
                    :alt="`Dice showing ${die}`"
                    class="dice"
                  />
                  <div class="dice-value">{{ die }}</div>
                </div>
              </transition-group>
            </div>
          </div>
          
          <div class="game-actions panel">
            <transition name="fade">
              <div v-if="lastBid && gameState !== 'round_end'" class="last-bid">
                <h3>Last Bid:</h3>
                <p>{{ lastBid.playerName }} bid: {{ lastBid.quantity }} {{ valueToText(lastBid.value) }}{{ lastBid.quantity === 1 ? '' : 's' }}</p>
              </div>
            </transition>
            
            <div v-if="currentTurn === playerId && gameState === 'bidding'" class="your-turn">
              <h3>Your Turn</h3>
              
              <div class="bid-controls">
                <div class="input-group">
                  <label for="bid-quantity">Quantity:</label>
                  <input 
                    type="number" 
                    id="bid-quantity" 
                    v-model.number="bidQuantity" 
                    min="1" 
                    :max="totalDice"
                  />
                </div>
                
                <div class="input-group">
                  <label for="bid-value">Value:</label>
                  <select id="bid-value" v-model.number="bidValue">
                    <option value="1">Ones (Aces)</option>
                    <option value="2">Twos</option>
                    <option value="3">Threes</option>
                    <option value="4">Fours</option>
                    <option value="5">Fives</option>
                    <option value="6">Sixes</option>
                  </select>
                </div>
              </div>
              
              <div class="action-buttons">
                <button 
                  class="btn btn-primary" 
                  @click="placeBid"
                  :disabled="!isValidBid || gameState === 'round_end'"
                >
                  Place Bid
                </button>
                
                <button 
                  class="btn btn-danger" 
                  @click="callDudo"
                  :disabled="!lastBid || gameState === 'round_end'"
                >
                  Call Dudo (Doubt)
                </button>
                
                <button 
                  v-if="canCallCalza"
                  class="btn btn-secondary" 
                  @click="callCalza"
                  :disabled="!lastBid || gameState === 'round_end'"
                >
                  Call Calza (Exact)
                </button>
              </div>
            </div>
            
            <div v-else class="waiting">
              <div v-if="gameState === 'bidding'" class="waiting-turn">
                <div class="waiting-avatar">{{ currentPlayerName.charAt(0).toUpperCase() }}</div>
                <h3>
                  Waiting for <span class="highlight-name">{{ currentPlayerName }}</span> to make a move...
                </h3>
                <div class="waiting-animation">
                  <div class="dot dot1"></div>
                  <div class="dot dot2"></div>
                  <div class="dot dot3"></div>
                </div>
              </div>
              <div v-else class="game-state-message">
                <h3>{{ gameStateMessage }}</h3>
                <div v-if="gameState === 'rolling'" class="rolling-animation">
                  <img src="/src/assets/dice-hidden.svg" class="rolling-dice roll-dice" alt="Rolling dice" />
                </div>
                <div v-if="gameState === 'round_end'" class="round-end-animation">
                  <p class="countdown">Next round starting in {{ roundEndTimer }}s</p>
                  <div class="waiting-animation">
                    <div class="dot dot1"></div>
                    <div class="dot dot2"></div>
                    <div class="dot dot3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- RESULTS PANEL -->
          <div v-if="roundResult" class="round-result panel">
            <h3>Round Result</h3>
            
            <div v-if="roundResult.type === 'dudo'">
              <p>{{ roundResult.challenger.name }} called Dudo on {{ roundResult.lastBidder.name }}'s bid of {{ roundResult.bid.quantity }} {{ valueToText(roundResult.bid.value) }}{{ roundResult.bid.quantity === 1 ? '' : 's' }}.</p>
              
              <p>Actual count: {{ roundResult.actual }}</p>
              
              <p class="result-message">
                {{ roundResult.loser.name }} lost and loses a die!
                {{ roundResult.loser.remainingDice === 0 ? 'They are eliminated!' : '' }}
              </p>
              
              <div class="all-dice">
                <div v-for="playerDice in roundResult.allDice" :key="playerDice.playerId" class="player-dice-result">
                  <p>{{ playerDice.playerName }}:</p>
                  <div class="dice-container">
                    <img 
                      v-for="(die, index) in playerDice.dice" 
                      :key="index"
                      :src="`/src/assets/dice-${die}.svg`" 
                      :alt="`Dice showing ${die}`"
                      class="dice"
                      :class="{ highlighted: die === roundResult.bid.value || (die === 1 && roundResult.bid.value !== 1) }"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="roundResult.type === 'calza'">
              <p>{{ roundResult.caller.name }} called Calza on {{ roundResult.bid.playerName }}'s bid of {{ roundResult.bid.quantity }} {{ valueToText(roundResult.bid.value) }}{{ roundResult.bid.quantity === 1 ? '' : 's' }}.</p>
              
              <p>Actual count: {{ roundResult.actual }}</p>
              
              <p class="result-message">
                {{ roundResult.isExact ? 'Exact match! ' + roundResult.caller.name + ' gains a die!' : 'Not exact! ' + roundResult.caller.name + ' loses a die!' }}
              </p>
              
              <div class="all-dice">
                <div v-for="playerDice in roundResult.allDice" :key="playerDice.playerId" class="player-dice-result">
                  <p>{{ playerDice.playerName }}:</p>
                  <div class="dice-container">
                    <img 
                      v-for="(die, index) in playerDice.dice" 
                      :key="index"
                      :src="`/src/assets/dice-${die}.svg`" 
                      :alt="`Dice showing ${die}`"
                      class="dice"
                      :class="{ highlighted: die === roundResult.bid.value || (die === 1 && roundResult.bid.value !== 1) }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- GAME OVER PANEL -->
          <div v-if="gameOver" class="game-over panel">
            <h2>Game Over</h2>
            
            <div class="winner">
              <h3>🏆 {{ gameOver.winner.name }} Wins! 🏆</h3>
              <p>The last pirate standing claims the treasure!</p>
            </div>
            
            <button class="btn btn-primary" @click="backToLobby">Back to Lobby</button>
          </div>
        </div>
      </transition>
    </main>
    
    <!-- ERROR TOAST -->
    <div v-if="errorMessage" class="error-toast">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { io } from 'socket.io-client';

export default {
  name: 'App',
  setup() {
    // Position players around a circular table
    const getPlayerPosition = (index, totalPlayers) => {
      if (totalPlayers <= 1) return { top: '50%', left: '50%' };
      
      // Calculate angle based on position and total players
      const angle = (index / totalPlayers) * 2 * Math.PI;
      // Set radius differently based on number of players
      const radius = totalPlayers <= 3 ? 40 : 45;
      
      // Calculate position using cosine and sine
      const left = 50 + radius * Math.cos(angle - Math.PI/2);
      const top = 50 + radius * Math.sin(angle - Math.PI/2);
      
      return {
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)'
      };
    };
    // UI State
    const screen = ref('home');
    const showRules = ref(false);
    const errorMessage = ref('');
    
    // User Input
    const playerName = ref('');
    const gameCode = ref('');
    
    // Game State
    const socket = ref(null);
    const gameId = ref('');
    const playerId = ref('');
    const hostId = ref('');
    const players = ref({});
    const round = ref(0);
    const gameState = ref('waiting');
    const currentTurn = ref(null);
    const lastBid = ref(null);
    const myDice = ref([]);
    const totalDice = ref(0);
    const isPalaficoRound = ref(false);
    const roundResult = ref(null);
    const gameOver = ref(null);
    
    // Bidding Controls
    const bidQuantity = ref(1);
    const bidValue = ref(2);
    
    // Connect to Socket.IO server
    const initializeSocket = () => {
      // In production, connect to the same host that serves the webpage
      // In development, connect to localhost:3000
      const isProd = process.env.NODE_ENV === 'production';
      const socketUrl = isProd ? window.location.origin : 'http://localhost:3000';
      socket.value = io(socketUrl);
      
      // Handle connection
      socket.value.on('connect', () => {
        console.log('Connected to server');
      });
      
      // Error handling
      socket.value.on('error', (data) => {
        showError(data.message);
      });
      
      // Game created
      socket.value.on('gameCreated', (data) => {
        gameId.value = data.gameId;
        gameCode.value = data.gameId;
        playerId.value = data.playerId;
        hostId.value = data.game.hostId;
        players.value = data.game.players;
        screen.value = 'lobby';
      });
      
      // Game joined
      socket.value.on('gameJoined', (data) => {
        gameId.value = data.gameId;
        playerId.value = data.playerId;
        hostId.value = data.game.hostId;
        players.value = data.game.players;
        screen.value = 'lobby';
      });
      
      // Player joined
      socket.value.on('playerJoined', (data) => {
        players.value = data.game.players;
      });
      
      // Round started
      socket.value.on('roundStarted', (data) => {
        round.value = data.round;
        currentTurn.value = data.currentTurn;
        isPalaficoRound.value = data.isPalaficoRound;
        gameState.value = 'rolling';
        roundResult.value = null;
        lastBid.value = null; // Reset last bid when new round starts
        bidQuantity.value = 1; // Reset bid quantity
        bidValue.value = 2; // Reset bid value
        screen.value = 'game';
      });
      
      // Dice rolled (your dice)
      socket.value.on('diceRolled', (data) => {
        // Clear current dice first
        myDice.value = [];
        
        // Stagger dice appearance for animation effect
        data.dice.forEach((die, index) => {
          setTimeout(() => {
            myDice.value.push(die);
          }, index * 200);
        });
        
        totalDice.value = data.totalDice;
      });
      
      // Bidding phase
      socket.value.on('biddingStarted', (data) => {
        currentTurn.value = data.currentTurn;
        gameState.value = 'bidding';
        
        // Initialize bid values
        if (!lastBid.value) {
          bidQuantity.value = 1;
          bidValue.value = 2;
        } else {
          // Suggest a reasonable next bid
          if (lastBid.value.value === bidValue.value) {
            bidQuantity.value = lastBid.value.quantity + 1;
          } else {
            bidQuantity.value = lastBid.value.quantity;
            bidValue.value = lastBid.value.value + 1;
          }
        }
      });
      
      // Bid placed
      socket.value.on('bidPlaced', (data) => {
        lastBid.value = data.bid;
        currentTurn.value = data.nextTurn;
      });
      
      // Dudo result
      socket.value.on('dudoResult', (data) => {
        roundResult.value = {
          type: 'dudo',
          ...data
        };
        gameState.value = 'round_end';
      });
      
      // Calza result
      socket.value.on('calzaResult', (data) => {
        roundResult.value = {
          type: 'calza',
          ...data
        };
        gameState.value = 'round_end';
      });
      
      // Player eliminated
      socket.value.on('playerEliminated', (data) => {
        showError(`${data.playerName} has been eliminated!`);
      });
      
      // Game over
      socket.value.on('gameOver', (data) => {
        gameOver.value = data;
      });
      
      // Player left
      socket.value.on('playerLeft', (data) => {
        delete players.value[data.playerId];
      });
      
      // New host
      socket.value.on('newHost', (data) => {
        hostId.value = data.hostId;
      });
      
      // Turn changed (when player disconnects)
      socket.value.on('turnChanged', (data) => {
        currentTurn.value = data.currentTurn;
      });
      
      // Disconnection
      socket.value.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    };
    
    // Show error message with auto-hide
    const showError = (message) => {
      errorMessage.value = message;
      setTimeout(() => {
        errorMessage.value = '';
      }, 3000);
    };
    
    // Game Actions
    const createGame = () => {
      if (!playerName.value.trim()) {
        showError('Please enter your name');
        return;
      }
      
      if (!socket.value) {
        initializeSocket();
      }
      
      socket.value.emit('createGame', playerName.value);
    };
    
    const joinGame = () => {
      if (!playerName.value.trim()) {
        showError('Please enter your name');
        return;
      }
      
      if (!gameCode.value.trim()) {
        showError('Please enter a game code');
        return;
      }
      
      if (!socket.value) {
        initializeSocket();
      }
      
      socket.value.emit('joinGame', {
        gameId: gameCode.value.toUpperCase(),
        playerName: playerName.value
      });
    };
    
    const startGame = () => {
      socket.value.emit('startGame', { gameId: gameId.value });
    };
    
    const leaveGame = () => {
      if (socket.value) {
        socket.value.disconnect();
      }
      
      // Reset game state
      resetGameState();
      screen.value = 'home';
    };
    
    const resetGameState = () => {
      gameId.value = '';
      playerId.value = '';
      hostId.value = '';
      players.value = {};
      round.value = 0;
      gameState.value = 'waiting';
      currentTurn.value = null;
      lastBid.value = null;
      myDice.value = [];
      totalDice.value = 0;
      isPalaficoRound.value = false;
      roundResult.value = null;
      gameOver.value = null;
      socket.value = null;
    };
    
    const placeBid = () => {
      if (!isValidBid.value || gameState.value !== 'bidding') {
        showError('Invalid bid or not your turn');
        return;
      }
      
      socket.value.emit('placeBid', {
        gameId: gameId.value,
        bid: {
          quantity: bidQuantity.value,
          value: bidValue.value
        }
      });
    };
    
    const callDudo = () => {
      if (!lastBid.value || gameState.value !== 'bidding') {
        showError('Cannot call Dudo at this time');
        return;
      }
      
      socket.value.emit('callDudo', { gameId: gameId.value });
    };
    
    const callCalza = () => {
      if (!lastBid.value || gameState.value !== 'bidding' || !canCallCalza.value) {
        showError('Cannot call Calza at this time');
        return;
      }
      
      socket.value.emit('callCalza', { gameId: gameId.value });
    };
    
    const backToLobby = () => {
      // Reset game-specific state
      round.value = 0;
      gameState.value = 'waiting';
      currentTurn.value = null;
      lastBid.value = null;
      myDice.value = [];
      isPalaficoRound.value = false;
      roundResult.value = null;
      gameOver.value = null;
      
      // If we're still connected, go back to lobby
      if (socket.value && socket.value.connected) {
        screen.value = 'lobby';
      } else {
        // Otherwise go back to home
        screen.value = 'home';
      }
    };
    
    // Countdown timer for round end
    const roundEndTimer = ref(8);
    
    // Reset and start countdown when round ends
    watch(() => gameState.value, (newState, oldState) => {
      if (newState === 'round_end') {
        roundEndTimer.value = 8;
        const timer = setInterval(() => {
          roundEndTimer.value--;
          if (roundEndTimer.value <= 0) {
            clearInterval(timer);
          }
        }, 1000);
      }
    });
    
    // Computed Properties
    const currentPlayerName = computed(() => {
      if (!currentTurn.value || !players.value[currentTurn.value]) return '';
      return players.value[currentTurn.value].name;
    });
    
    const isValidBid = computed(() => {
      if (!bidQuantity.value || bidQuantity.value < 1 || bidQuantity.value > totalDice.value) {
        return false;
      }
      
      if (!bidValue.value || bidValue.value < 1 || bidValue.value > 6) {
        return false;
      }
      
      // First bid is always valid
      if (!lastBid.value) {
        return true;
      }
      
      // Check palafico rules
      if (isPalaficoRound.value) {
        // In palafico round, can only raise quantity of the same value
        if (bidValue.value !== lastBid.value.value) {
          return false;
        }
        
        return bidQuantity.value > lastBid.value.quantity;
      }
      
      // Switching from normal to aces
      if (lastBid.value.value !== 1 && bidValue.value === 1) {
        return bidQuantity.value >= Math.ceil(lastBid.value.quantity / 2);
      }
      
      // Switching from aces to normal
      if (lastBid.value.value === 1 && bidValue.value !== 1) {
        return bidQuantity.value >= lastBid.value.quantity * 2 + 1;
      }
      
      // Same value, must increase quantity
      if (bidValue.value === lastBid.value.value) {
        return bidQuantity.value > lastBid.value.quantity;
      }
      
      // Higher value, quantity can stay the same or increase
      if (bidValue.value > lastBid.value.value) {
        return bidQuantity.value >= lastBid.value.quantity;
      }
      
      // Lower value, must increase quantity
      return bidQuantity.value > lastBid.value.quantity;
    });
    
    const canCallCalza = computed(() => {
      // Calza rules:
      // 1. Not allowed in palafico rounds
      // 2. Not allowed when only 2 players are left
      // 3. Not allowed by the player who is next in turn after the bidder
      
      if (isPalaficoRound.value) {
        return false;
      }
      
      const activePlayers = Object.values(players.value).filter(p => p.diceCount > 0);
      if (activePlayers.length <= 2) {
        return false;
      }
      
      if (!lastBid.value) {
        return false;
      }
      
      // Check if player is next after the bidder
      const playerIds = Object.keys(players.value).filter(id => players.value[id].diceCount > 0);
      const bidderIndex = playerIds.indexOf(lastBid.value.playerId);
      const nextIndex = (bidderIndex + 1) % playerIds.length;
      
      return playerIds[nextIndex] !== playerId.value;
    });
    
    const gameStateMessage = computed(() => {
      switch (gameState.value) {
        case 'waiting':
          return 'Waiting for game to start...';
        case 'rolling':
          return 'Rolling dice...';
        case 'round_end':
          return 'Round ended. Next round starting soon...';
        default:
          return '';
      }
    });
    
    // Helper functions
    const valueToText = (value) => {
      const values = ['ace', 'two', 'three', 'four', 'five', 'six'];
      return values[value - 1];
    };
    
    // Automatically suggest a valid bid
    watch([lastBid], () => {
      if (lastBid.value) {
        // Suggest next bid values
        if (isPalaficoRound.value) {
          // In palafico, only quantity can increase
          bidValue.value = lastBid.value.value;
          bidQuantity.value = lastBid.value.quantity + 1;
        } else if (lastBid.value.value === 1) {
          // After aces, suggest doubling and adding 1
          bidValue.value = 2;
          bidQuantity.value = lastBid.value.quantity * 2 + 1;
        } else if (bidValue.value === 1) {
          // When currently on aces, suggest higher quantity
          bidQuantity.value = lastBid.value.quantity + 1;
        } else {
          // Normal case
          bidValue.value = lastBid.value.value;
          bidQuantity.value = lastBid.value.quantity + 1;
        }
      }
    });
    
    // Initialize socket when component is mounted
    onMounted(() => {
      // No need to initialize socket here, we'll do it when needed
    });
    
    return {
      // UI State
      screen,
      showRules,
      errorMessage,
      
      // User Input
      playerName,
      gameCode,
      
      // Game State
      gameId,
      playerId,
      hostId,
      players,
      round,
      gameState,
      currentTurn,
      lastBid,
      myDice,
      totalDice,
      isPalaficoRound,
      roundResult,
      gameOver,
      
      // Bidding Controls
      bidQuantity,
      bidValue,
      roundEndTimer,
      
      // Computed
      currentPlayerName,
      isValidBid,
      canCallCalza,
      gameStateMessage,
      
      // Methods
      createGame,
      joinGame,
      startGame,
      leaveGame,
      placeBid,
      callDudo,
      callCalza,
      backToLobby,
      valueToText,
      getPlayerPosition
    };
  }
};
</script>

<style scoped>
header {
  text-align: center;
  padding: 1.5rem 0;
  background-color: var(--primary-dark);
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--secondary-medium) 20%, 
    var(--secondary-light) 50%,
    var(--secondary-medium) 80%, 
    transparent 100%);
}

header h1 {
  font-size: 2.5rem;
  margin: 0;
  background: linear-gradient(var(--secondary-light), var(--secondary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(249, 166, 108, 0.3);
  font-weight: bold;
  letter-spacing: 1px;
}

.subtitle {
  font-family: 'Roboto', sans-serif;
  font-weight: 300;
  font-size: 1rem;
  margin-top: 0.5rem;
  color: var(--accent-dark);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.home-screen .buttons,
.create-screen .buttons,
.join-screen .buttons,
.lobby-screen .buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
}

.rules-toggle {
  text-align: center;
  margin: 1rem 0;
}

.rules {
  margin-top: 1rem;
  text-align: left;
}

.rules h4 {
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

.rules ul {
  padding-left: 1.5rem;
}

.game-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.players-list {
  margin-bottom: 1.5rem;
}

.player-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 5px;
  background-color: var(--primary-medium);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.host-badge {
  background-color: var(--secondary-medium);
  color: var(--accent-light);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.you-badge {
  background-color: var(--primary-light);
  color: var(--accent-light);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.player-card {
  padding: 0.75rem;
  border-radius: 10px;
  background-color: var(--card-bg);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--secondary-medium), var(--secondary-dark));
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  position: relative;
  border: 2px solid var(--accent-dark);
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.player-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.player-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.player-dice-compact {
  display: flex;
  gap: 4px;
}

.dice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--secondary-light);
  box-shadow: 0 0 3px var(--secondary-dark);
}

.pulsing-dot {
  animation: pulse 1.5s infinite;
}

.player-position {
  position: absolute;
  z-index: 10;
  transition: all 0.5s ease;
}

.player-position.player-enter {
  opacity: 1;
  transform: translate(-50%, -50%);
}

.player-position.current-turn .player-card {
  background-color: rgba(148, 81, 44, 0.3);
  border: 2px solid var(--secondary-light);
  box-shadow: 0 0 15px var(--secondary-dark), 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.player-position.your-player .player-card {
  border: 2px solid var(--accent-dark);
  box-shadow: 0 0 15px rgba(255, 212, 163, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.player-position.current-turn.your-player .player-card {
  background-color: rgba(148, 81, 44, 0.3);
  border: 2px solid var(--secondary-light);
  box-shadow: 0 0 20px var(--secondary-light), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.game-table {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 50%;
  background: var(--primary-dark);
  border: 8px solid var(--primary-medium);
  margin: 2rem auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 50px rgba(0, 0, 0, 0.3);
}

.game-table-inset {
  position: absolute;
  top: 5%;
  left: 5%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary-medium) 0%, var(--primary-dark) 100%);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.table-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
}

.table-logo {
  font-size: 3rem;
  opacity: 0.6;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  position: absolute;
  z-index: 1;
}

.center-bid {
  position: absolute;
  z-index: 2;
  background-color: rgba(32, 36, 56, 0.8);
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--secondary-dark);
  backdrop-filter: blur(4px);
}

.bid-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--secondary-light);
  margin-bottom: 0.5rem;
}

.bid-player {
  font-size: 0.9rem;
  color: var(--accent-light);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.palafico-badge {
  background-color: #8d3d3d;
  color: var(--accent-light);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.palafico-alert {
  background-color: rgba(141, 61, 61, 0.5);
  color: var(--accent-light);
  padding: 0.5rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid #8d3d3d;
}

.hidden-dice {
  opacity: 0.6;
}

.bid-controls {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background-color: rgba(32, 36, 56, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(249, 166, 108, 0.1);
}

.bid-controls .input-group {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  padding: 1rem 0;
}

.your-turn h3 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  position: relative;
}

.your-turn h3::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--secondary-medium) 20%, 
    var(--secondary-light) 50%,
    var(--secondary-medium) 80%, 
    transparent 100%);
}

.round-result {
  margin-top: 1rem;
  animation: fadeIn 0.5s ease-in;
}

.result-message {
  font-weight: bold;
  color: var(--secondary-light);
  font-size: 1.2rem;
  margin: 1rem 0;
}

.all-dice {
  margin-top: 1rem;
}

.player-dice-result {
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--card-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.player-dice-result p {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--secondary-light);
  border-bottom: 1px solid rgba(249, 166, 108, 0.2);
  padding-bottom: 0.5rem;
}

.highlighted {
  border: 2px solid var(--secondary-light);
  border-radius: 5px;
  box-shadow: 0 0 10px var(--secondary-light);
}

.game-over {
  text-align: center;
  margin-top: 1rem;
  animation: fadeIn 0.5s ease-in;
}

.winner h3 {
  font-size: 1.8rem;
  color: var(--secondary-light);
  margin-bottom: 0.5rem;
}

.error-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(141, 61, 61, 0.9);
  color: var(--accent-light);
  padding: 1rem;
  border-radius: 5px;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease-in;
  max-width: 80%;
  text-align: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.4; transform: scale(0.8); }
}

.waiting-animation {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 1rem;
}

.dot {
  width: 12px;
  height: 12px;
  background-color: var(--secondary-light);
  border-radius: 50%;
}

.dot1 {
  animation: dot-bounce 1.5s infinite 0s;
}

.dot2 {
  animation: dot-bounce 1.5s infinite 0.2s;
}

.dot3 {
  animation: dot-bounce 1.5s infinite 0.4s;
}

@keyframes dot-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-10px); opacity: 1; }
}

.countdown {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--secondary-light);
  text-align: center;
  animation: pulse-text 1.5s infinite;
}

@keyframes pulse-text {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

@media (max-width: 768px) {
  .bid-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .player-status {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  header h1 {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}
</style>
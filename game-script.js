// Game variables
let score = 0;
let health = 100;
let isGameOver = false;
let bullets = [];
let enemies = [];
let keys = {};
let playerX = window.innerWidth / 2 - 30;
let playerY = window.innerHeight - 100;
let playerSpeed = 5;
let lastShot = 0;
let shotCooldown = 300; // milliseconds
let animationFrameId;
let enemySpawnRate = 1500; // milliseconds
let lastEnemySpawn = 0;
let difficultyTimer = 0;
let stars = [];
let isMoving = false; // Track if player is moving

// Nuke ability variables
let nukeReady = true;
let nukeCooldown = 10000; // 10 seconds
let lastNukeTime = 0;
let nukeDisplay = document.getElementById('nuke-display');

// Level system variables
let level = 1;
let levelThreshold = 1000; // Score needed to reach next level
let levelUpMessageTimer = 0;
let showingLevelUpMessage = false;

// Powerup system variables
let powerups = [];
let activePowerup = null;
let powerupDuration = 10000; // 10 seconds
let powerupTimer = 0;
let powerupTextTimer = 0;
let showingPowerupText = false;
let lastPowerupSpawn = 0;
let powerupSpawnRate = 15000; // 15 seconds

// Skill system variables (NEW)
let skillPoints = 0;
let skillLevels = {
    speed: 0,
    attack: 0,
    minion: 0,
    freeze: 0
};
let minions = [];
let freezeReady = true;
let freezeCooldown = 10000; // 10 seconds
let lastFreezeTime = 0;
let freezeDuration = 3000; // 3 seconds, as per README

// DOM elements
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const playerShip = document.getElementById('player-ship');
const playerBoost = document.querySelector('.boost');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const healthDisplay = document.getElementById('health-display');
const skillPointsDisplay = document.getElementById('skill-points');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const finalLevelDisplay = document.getElementById('final-level');
const restartBtn = document.getElementById('restart-btn');
const levelUpMessage = document.getElementById('level-up-message');
const newLevelDisplay = document.getElementById('new-level');
const powerupText = document.getElementById('powerup-text');
const minionsContainer = document.getElementById('minions-container');

// Set initial player position
updatePlayerPosition();

// Create starry background
createStars();

// Update skill displays
updateSkillDisplays();

// Key event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Prevent default behavior for game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
         'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Enter', 'z', 'Z'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Nuke ability when Enter is pressed
    if ((e.key === 'Enter') && nukeReady && !isGameOver) {
        activateNuke();
    }
    
    // Freeze ability when Z is pressed
    if ((e.key === 'z' || e.key === 'Z') && freezeReady && !isGameOver && skillLevels.freeze > 0) {
        activateFreeze();
    }
    
    // Skill upgrades with number keys (1-4)
    if (e.key === '1' && skillPoints > 0) upgradeSkill('speed');
    if (e.key === '2' && skillPoints > 0) upgradeSkill('attack');
    if (e.key === '3' && skillPoints > 0) upgradeSkill('minion');
    if (e.key === '4' && skillPoints > 0) upgradeSkill('freeze');
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Reset keys when window loses focus
window.addEventListener('blur', () => {
    keys = {};
});

// Reset keys when user clicks outside the game area
document.addEventListener('click', (e) => {
    if (!gameContainer.contains(e.target)) {
        keys = {};
    }
});
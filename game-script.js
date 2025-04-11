// Game variables
let score = 0;
let health = 100;
let isGameOver = false;
let bullets = [];
let enemies = [];
let keys = {};
let playerX = window.innerWidth / 2 - 30; // Adjusted for new 60px width
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

// DOM elements
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const playerShip = document.getElementById('player-ship');
const playerBoost = document.querySelector('.boost');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const healthDisplay = document.getElementById('health-display');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const finalLevelDisplay = document.getElementById('final-level');
const restartBtn = document.getElementById('restart-btn');
const levelUpMessage = document.getElementById('level-up-message');
const newLevelDisplay = document.getElementById('new-level');
const powerupText = document.getElementById('powerup-text');

// Set initial player position
updatePlayerPosition();

// Create starry background
createStars();

// Key event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Prevent default behavior for game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
         'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Nuke ability when Enter is pressed
    if (e.key === 'Enter' && nukeReady && !isGameOver) {
        activateNuke();
    }
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

// Game functions
function createStars() {
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * window.innerWidth}px`;
        star.style.top = `${Math.random() * window.innerHeight}px`;
        star.style.opacity = Math.random();
        gameContainer.appendChild(star);
        stars.push({
            element: star,
            speed: 0.1 + Math.random() * 0.3,
            y: parseFloat(star.style.top)
        });
    }
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > window.innerHeight) {
            star.y = 0;
            star.element.style.left = `${Math.random() * window.innerWidth}px`;
        }
        star.element.style.top = `${star.y}px`;
    });
}

function movePlayer() {
    // Reset movement flag
    isMoving = false;
    
    // Calculate current speed (boosted if speed powerup is active)
    let currentSpeed = activePowerup === 'speed' ? playerSpeed * 1.5 : playerSpeed;
    
    // Arrow keys or WASD
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && playerX > 0) {
        playerX -= currentSpeed;
        isMoving = true;
    }
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && playerX < window.innerWidth - 60) {
        playerX += currentSpeed;
        isMoving = true;
    }
    if ((keys['ArrowUp'] || keys['w'] || keys['W']) && playerY > 0) {
        playerY -= currentSpeed;
        isMoving = true;
    }
    if ((keys['ArrowDown'] || keys['s'] || keys['S']) && playerY < window.innerHeight - 60) {
        playerY += currentSpeed;
        isMoving = true;
    }
    
    // Boost effect when not attacking (not pressing space)
    if (!keys[' '] && !isGameOver) {
        // Show boost visual effect
        playerBoost.style.opacity = '1';
        
        // Only apply additional boost if actually moving
        if (isMoving) {
            // If moving and not attacking, apply additional speed
            playerX += (playerX - parseFloat(player.style.left || playerX)) * 0.5;
            playerY += (playerY - parseFloat(player.style.top || playerY)) * 0.5;
        }
    } else {
        playerBoost.style.opacity = '0';
    }
    
    // Always update player position regardless of movement
    updatePlayerPosition();
}

function updatePlayerPosition() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

function shoot() {
    const now = Date.now();
    // Rapid fire powerup reduces cooldown
    const currentCooldown = activePowerup === 'rapid' ? shotCooldown / 3 : shotCooldown;
    
    if (keys[' '] && now - lastShot > currentCooldown && !isGameOver) {
        createBullet();
        lastShot = now;
    }
}

function createBullet() {
    // Default is a single bullet
    let bulletPositions = [{x: playerX + 27.5, y: playerY}];
    
    // If spread powerup is active, create 3 bullets in a spread pattern with angles
    if (activePowerup === 'spread') {
        bulletPositions = [
            {x: playerX + 27.5, y: playerY, angle: 0}, // Center
            {x: playerX + 27.5, y: playerY, angle: -30}, // 30 degrees left
            {x: playerX + 27.5, y: playerY, angle: 30}  // 30 degrees right
        ];
    }
    
    bulletPositions.forEach(pos => {
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        
        // If rapid fire powerup is active, make bullets look more powerful
        if (activePowerup === 'rapid' || activePowerup === 'nuke') {
            bullet.style.backgroundColor = '#ffcc00';
            bullet.style.width = '7px';
            bullet.style.boxShadow = '0 0 10px rgba(255, 204, 0, 0.7)';
        }
        
        bullet.style.left = pos.x + 'px';
        bullet.style.top = pos.y + 'px';
        gameContainer.appendChild(bullet);
        
        // Default bullet speed and angle
        let bulletSpeed = activePowerup === 'speed' ? 15 : 10;
        let angle = pos.angle || 0; // Default to 0 if not specified
        
        bullets.push({
            element: bullet,
            x: pos.x,
            y: pos.y,
            speed: bulletSpeed,
            angle: angle
        });
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Calculate movement based on angle (convert degrees to radians)
        const radians = bullet.angle * (Math.PI / 180);
        bullet.x += Math.sin(radians) * bullet.speed;
        bullet.y -= Math.cos(radians) * bullet.speed;
        
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        
        // For angled bullets, apply rotation
        if (bullet.angle !== 0) {
            bullet.element.style.transform = `rotate(${bullet.angle}deg)`;
        }
        
        // Remove bullets that are off-screen
        if (bullet.y < 0 || bullet.x < 0 || bullet.x > window.innerWidth) {
            gameContainer.removeChild(bullet.element);
            bullets.splice(i, 1);
        }
    }
}

function createEnemy() {
    const enemy = document.createElement('div');
    enemy.className = 'enemy';
    
    // Add the enemy ship design
    const enemyShip = document.createElement('div');
    enemyShip.className = 'enemy-ship';
    enemy.appendChild(enemyShip);
    
    // Random horizontal position
    const randomX = Math.random() * (window.innerWidth - 40);
    
    enemy.style.left = randomX + 'px';
    enemy.style.top = '0px';
    
    // Scale enemy properties based on level
    const baseSpeed = 2;
    const speedIncreasePerLevel = 0.5;
    const randomSpeedVariance = Math.random() * (level * 0.2);
    const enemySpeed = baseSpeed + (level - 1) * speedIncreasePerLevel + randomSpeedVariance;
    
    // Adjust enemy appearance based on level (bigger/different color for higher levels)
    if (level > 5) {
        enemyShip.style.transform = 'scale(1.2)';
        enemyShip.style.filter = 'hue-rotate(60deg)'; // More dangerous looking
    } else if (level > 10) {
        enemyShip.style.transform = 'scale(1.4)';
        enemyShip.style.filter = 'hue-rotate(120deg)'; // Even more dangerous
    }
    
    gameContainer.appendChild(enemy);
    
    enemies.push({
        element: enemy,
        x: randomX,
        y: 0,
        speed: enemySpeed,
        health: Math.ceil(level / 3) // Tougher enemies in higher levels
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        enemy.element.style.top = enemy.y + 'px';
        
        // Check if enemy is below the screen
        if (enemy.y > window.innerHeight) {
            if (!isGameOver) {
                takeDamage(10);
            }
            gameContainer.removeChild(enemy.element);
            enemies.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const bulletRect = {
            left: bullet.x,
            right: bullet.x + 5,
            top: bullet.y,
            bottom: bullet.y + 15
        };
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyRect = {
                left: enemy.x,
                right: enemy.x + 40,
                top: enemy.y,
                bottom: enemy.y + 40
            };
            
            // Check collision
            if (
                bulletRect.right >= enemyRect.left &&
                bulletRect.left <= enemyRect.right &&
                bulletRect.bottom >= enemyRect.top &&
                bulletRect.top <= enemyRect.bottom
            ) {
                gameContainer.removeChild(bullet.element);
                bullets.splice(i, 1);
                
                // Decrease enemy health or destroy
                if (enemy.health && enemy.health > 1) {
                    // If enemy has multiple health points, decrease health
                    enemy.health--;
                    enemy.element.style.opacity = enemy.health / Math.ceil(level / 3); // Visual feedback
                    
                    // Small points for hitting but not destroying
                    score += 10;
                    scoreDisplay.textContent = `Score: ${score}`;
                } else {
                    // Create explosion
                    createExplosion(enemy.x + 20, enemy.y + 20);
                    
                    // Remove enemy
                    gameContainer.removeChild(enemy.element);
                    enemies.splice(j, 1);
                    
                    // Increase score - higher levels give more points
                    const pointsPerEnemy = 100 * level;
                    score += pointsPerEnemy;
                    scoreDisplay.textContent = `Score: ${score}`;
                    
                    // Check for level up
                    checkLevelUp();
                }
                
                break; // Break since bullet is removed
            }
        }
    }
    
    // Check player-enemy collisions
    const playerRect = {
        left: playerX,
        right: playerX + 60,
        top: playerY,
        bottom: playerY + 60
    };
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const enemyRect = {
            left: enemy.x,
            right: enemy.x + 40,
            top: enemy.y,
            bottom: enemy.y + 40
        };
        
        if (
            playerRect.right >= enemyRect.left &&
            playerRect.left <= enemyRect.right &&
            playerRect.bottom >= enemyRect.top &&
            playerRect.top <= enemyRect.bottom
        ) {
            // Create explosion
            createExplosion(enemy.x + 20, enemy.y + 20);
            
            // Remove enemy
            gameContainer.removeChild(enemy.element);
            enemies.splice(i, 1);
            
            // Take damage
            takeDamage(25);
        }
    }
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.textContent = '💥';
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    gameContainer.appendChild(explosion);
    
    // Remove explosion after animation
    setTimeout(() => {
        if (gameContainer.contains(explosion)) {
            gameContainer.removeChild(explosion);
        }
    }, 500);
}

function takeDamage(amount) {
    health -= amount;
    healthDisplay.textContent = `Health: ${health}`;
    
    if (health <= 0) {
        gameOver();
    }
}

function createPowerup() {
    const powerupTypes = ['speed', 'spread', 'rapid', 'nuke'];
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    const powerup = document.createElement('div');
    powerup.className = `powerup powerup-${randomType}`;
    
    // Random position
    const randomX = Math.random() * (window.innerWidth - 30);
    const randomY = Math.random() * (window.innerHeight / 2); // Only in top half
    
    powerup.style.left = randomX + 'px';
    powerup.style.top = randomY + 'px';
    
    gameContainer.appendChild(powerup);
    
    powerups.push({
        element: powerup,
        x: randomX,
        y: randomY,
        type: randomType,
        speed: 1 + Math.random()
    });
}

function updatePowerups() {
    // Move powerups down
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.y += powerup.speed;
        powerup.element.style.top = powerup.y + 'px';
        
        // Remove if off screen
        if (powerup.y > window.innerHeight) {
            gameContainer.removeChild(powerup.element);
            powerups.splice(i, 1);
        }
    }
    
    // Check for collisions with player
    const playerRect = player.getBoundingClientRect();
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const powerupRect = powerup.element.getBoundingClientRect();
        
        if (
            powerupRect.right >= playerRect.left &&
            powerupRect.left <= playerRect.right &&
            powerupRect.bottom >= playerRect.top &&
            powerupRect.top <= playerRect.bottom
        ) {
            // Collect powerup
            collectPowerup(powerup.type);
            
            // Remove powerup
            gameContainer.removeChild(powerup.element);
            powerups.splice(i, 1);
        }
    }
}

function collectPowerup(type) {
    // Deactivate current powerup
    if (activePowerup) {
        deactivatePowerup();
    }
    
    // Activate new powerup
    activePowerup = type;
    powerupTimer = 0;
    
    // Apply visual effects to player based on powerup type
    switch(type) {
        case 'speed':
            playerShip.style.filter = 'drop-shadow(0 0 10px cyan) hue-rotate(180deg)';
            powerupText.textContent = 'Speed Boost!';
            powerupText.style.color = 'cyan';
            break;
        case 'spread':
            playerShip.style.filter = 'drop-shadow(0 0 10px yellow) hue-rotate(60deg)';
            powerupText.textContent = 'Triple Shot!';
            powerupText.style.color = 'yellow';
            break;
        case 'rapid':
            playerShip.style.filter = 'drop-shadow(0 0 10px magenta) hue-rotate(270deg)';
            powerupText.textContent = 'Rapid Fire!';
            powerupText.style.color = 'magenta';
            break;
        case 'nuke':
            playerShip.style.filter = 'drop-shadow(0 0 10px orange) hue-rotate(30deg)';
            powerupText.textContent = 'Nuke Activated!';
            powerupText.style.color = 'orange';
            
            // Special effect: destroy all enemies on screen
            destroyAllEnemies();
            break;
    }
    
    // Show powerup text
    powerupText.style.opacity = 1;
    showingPowerupText = true;
    powerupTextTimer = 0;
}

function deactivatePowerup() {
    // Reset player appearance
    playerShip.style.filter = 'none';
    activePowerup = null;
}

function activateNuke() {
    // Use nuke ability
    destroyAllEnemies();
    
    // Show nuke effect
    const nukeEffect = document.createElement('div');
    nukeEffect.style.position = 'absolute';
    nukeEffect.style.width = '100%';
    nukeEffect.style.height = '100%';
    nukeEffect.style.backgroundColor = 'rgba(255, 85, 0, 0.3)';
    nukeEffect.style.zIndex = '150';
    nukeEffect.style.animation = 'fadeInOut 1s forwards';
    gameContainer.appendChild(nukeEffect);
    
    // Remove nuke effect after animation
    setTimeout(() => {
        if (gameContainer.contains(nukeEffect)) {
            gameContainer.removeChild(nukeEffect);
        }
    }, 1000);
    
    // Start cooldown
    nukeReady = false;
    lastNukeTime = Date.now();
    nukeDisplay.textContent = 'Nuke Cooldown: 10s';
    nukeDisplay.style.color = '#aaa';
}

function updateNukeCooldown() {
    if (!nukeReady) {
        const elapsed = Date.now() - lastNukeTime;
        const remaining = nukeCooldown - elapsed;
        
        if (remaining <= 0) {
            // Cooldown complete
            nukeReady = true;
            nukeDisplay.textContent = 'Nuke Ready';
            nukeDisplay.style.color = '#ff5500';
        } else {
            // Update cooldown display
            const secondsRemaining = Math.ceil(remaining / 1000);
            nukeDisplay.textContent = `Nuke Cooldown: ${secondsRemaining}s`;
        }
    }
}

function destroyAllEnemies() {
    // Create explosion for each enemy
    enemies.forEach(enemy => {
        createExplosion(enemy.x + 20, enemy.y + 20);
        
        // Remove enemy element
        gameContainer.removeChild(enemy.element);
        
        // Add score
        score += 100 * level;
    });
// Clear enemies array
enemies = [];
    
// Check for level up after destroying all enemies
checkLevelUp();
}

function updatePowerupTimers() {
// Update powerup duration
if (activePowerup) {
    powerupTimer += 16; // ~60fps
    
    if (powerupTimer >= powerupDuration) {
        deactivatePowerup();
    }
}

// Update powerup text fade
if (showingPowerupText) {
    powerupTextTimer += 16;
    if (powerupTextTimer >= 2000) { // 2 seconds
        powerupText.style.opacity = 0;
        showingPowerupText = false;
    }
}
}

function increaseDifficulty() {
difficultyTimer += 16; // ~60fps = ~16ms per frame

if (difficultyTimer >= 10000) { // Every 10 seconds
    // Adjust spawn rate based on level
    enemySpawnRate = Math.max(500 - (level * 30), 200);
    difficultyTimer = 0;
}

// Handle level up message animation
if (showingLevelUpMessage) {
    levelUpMessageTimer += 16;
    if (levelUpMessageTimer >= 2000) { // 2 seconds
        levelUpMessage.style.display = 'none';
        showingLevelUpMessage = false;
        levelUpMessageTimer = 0;
    }
}
}

function checkLevelUp() {
// Check if score meets threshold for next level
if (score >= level * levelThreshold) {
    level++;
    levelDisplay.textContent = `Level: ${level}`;
    
    // Show level up message
    levelUpMessage.style.display = 'block';
    newLevelDisplay.textContent = level;
    showingLevelUpMessage = true;
    
    // Health bonus on level up
    const healthBonus = 20;
    health = Math.min(health + healthBonus, 100);
    healthDisplay.textContent = `Health: ${health}`;
}
}

function gameOver() {
isGameOver = true;

// Cancel animation frame
cancelAnimationFrame(animationFrameId);

// Show game over screen
gameOverScreen.style.display = 'flex';
finalScoreDisplay.textContent = score;
finalLevelDisplay.textContent = level;
}

function restartGame() {
// Reset game variables
score = 0;
health = 100;
isGameOver = false;
bullets = [];
enemies = [];
powerups = [];
keys = {};
playerX = window.innerWidth / 2 - 30;
playerY = window.innerHeight - 100;
level = 1;
activePowerup = null;

// Reset ability
nukeReady = true;

// Update displays
scoreDisplay.textContent = 'Score: 0';
healthDisplay.textContent = 'Health: 100';
levelDisplay.textContent = 'Level: 1';
nukeDisplay.textContent = 'Nuke Ready';
nukeDisplay.style.color = '#ff5500';

// Clear game elements
clearGameElements();

// Reset player appearance
playerShip.style.filter = 'none';

// Hide game over screen
gameOverScreen.style.display = 'none';

// Start game loop
gameLoop();
}

function clearGameElements() {
// Remove all bullets
bullets.forEach(bullet => {
    if (gameContainer.contains(bullet.element)) {
        gameContainer.removeChild(bullet.element);
    }
});

// Remove all enemies
enemies.forEach(enemy => {
    if (gameContainer.contains(enemy.element)) {
        gameContainer.removeChild(enemy.element);
    }
});

// Remove all powerups
powerups.forEach(powerup => {
    if (gameContainer.contains(powerup.element)) {
        gameContainer.removeChild(powerup.element);
    }
});
}

function gameLoop() {
const now = Date.now();

// Move player
movePlayer();

// Shoot bullets
shoot();

// Update bullets
updateBullets();

// Check for bullet-enemy collisions
checkCollisions();

// Spawn enemies
if (now - lastEnemySpawn > enemySpawnRate) {
    createEnemy();
    lastEnemySpawn = now;
}

// Update enemies
updateEnemies();

// Spawn powerups
if (now - lastPowerupSpawn > powerupSpawnRate) {
    createPowerup();
    lastPowerupSpawn = now;
}

// Update powerups
updatePowerups();

// Update powerup timers
updatePowerupTimers();

// Update nuke cooldown
updateNukeCooldown();

// Increase difficulty over time
increaseDifficulty();

// Update starry background
updateStars();

// Continue game loop
if (!isGameOver) {
    animationFrameId = requestAnimationFrame(gameLoop);
}
}

// Event listener for restart button
restartBtn.addEventListener('click', restartGame);

// Add resize handling
window.addEventListener('resize', () => {
// Adjust player position if it would be outside the window
playerX = Math.min(playerX, window.innerWidth - 60);
playerY = Math.min(playerY, window.innerHeight - 60);
updatePlayerPosition();

// Adjust star positions
stars.forEach(star => {
    if (parseFloat(star.element.style.left) > window.innerWidth) {
        star.element.style.left = `${Math.random() * window.innerWidth}px`;
    }
    if (parseFloat(star.element.style.top) > window.innerHeight) {
        star.y = 0;
        star.element.style.top = '0px';
    }
});
});

// Add touch controls for mobile devices
let touchStartX = 0;
let touchStartY = 0;

gameContainer.addEventListener('touchstart', (e) => {
e.preventDefault();

// Store initial touch position
touchStartX = e.touches[0].clientX;
touchStartY = e.touches[0].clientY;

// Auto-fire when touching the screen
keys[' '] = true;
});

gameContainer.addEventListener('touchmove', (e) => {
e.preventDefault();

// Calculate touch movement
const touchX = e.touches[0].clientX;
const touchY = e.touches[0].clientY;

// Update player position based on touch movement
playerX += (touchX - touchStartX) * 1.5;
playerY += (touchY - touchStartY) * 1.5;

// Clamp player position to screen bounds
playerX = Math.max(0, Math.min(playerX, window.innerWidth - 60));
playerY = Math.max(0, Math.min(playerY, window.innerHeight - 60));

// Update player position
updatePlayerPosition();

// Update touch start position for continuous movement
touchStartX = touchX;
touchStartY = touchY;
});

gameContainer.addEventListener('touchend', (e) => {
e.preventDefault();

// Stop firing when touch ends
keys[' '] = false;
});

// Start the game!
gameLoop();

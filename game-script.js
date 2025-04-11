// Game variables
let score = 0;
let health = 100;
let isGameOver = false;
let bullets = [];
let enemies = [];
let keys = {};
let playerX = window.innerWidth / 2 - 30;
let playerY = window.innerHeight - 100;
let playerSpeed = 7; // Increased from 5 to 7 for better mobility
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

// Skill points system
let skillPoints = 0;
let skillPointsDisplay = document.getElementById('skill-points');

// Skill levels
let moveSpeedLevel = 0;
let attackSpeedLevel = 0;
let minionLevel = 0;
let freezeLevel = 0;
let freezeReady = true;
let freezeCooldown = 15000; // 15 seconds
let lastFreezeTime = 0;
let freezeDuration = 3000; // 3 seconds
let freezeDisplay = document.getElementById('freeze-display');

// Minions
let minions = [];
let minionShootTimer = 0;
let minionsContainer = document.getElementById('minions-container');

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
const skillSpeedLevel = document.querySelector('#skill-speed .skill-level');
const skillAttackLevel = document.querySelector('#skill-attack .skill-level');
const skillMinionLevel = document.querySelector('#skill-minion .skill-level');
const skillFreezeLevel = document.querySelector('#skill-freeze .skill-level');
const skillSpeed = document.getElementById('skill-speed');
const skillAttack = document.getElementById('skill-attack');
const skillMinion = document.getElementById('skill-minion');
const skillFreeze = document.getElementById('skill-freeze');

// Set initial player position
updatePlayerPosition();

// Create starry background
createStars();

// Key event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Prevent default behavior for game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
         'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Enter', 'z', 'Z',
         '1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Nuke ability when Enter is pressed
    if (e.key === 'Enter' && nukeReady && !isGameOver) {
        activateNuke();
    }
    
    // Freeze ability when Z is pressed
    if ((e.key === 'z' || e.key === 'Z') && freezeReady && !isGameOver) {
        activateFreeze();
    }
    
    // Skill upgrades
    if (e.key === '1' && skillPoints > 0) {
        upgradeSkill('speed');
    }
    if (e.key === '2' && skillPoints > 0) {
        upgradeSkill('attack');
    }
    if (e.key === '3' && skillPoints > 0) {
        upgradeSkill('minion');
    }
    if (e.key === '4' && skillPoints > 0) {
        upgradeSkill('freeze');
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
    
    // Calculate current speed (boosted if speed powerup is active or skill is upgraded)
    let currentSpeed = playerSpeed + (moveSpeedLevel * 0.5);
    if (activePowerup === 'speed') {
        currentSpeed *= 1.5;
    }
    
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
        // Double speed when not attacking
        if (!isMoving) {
            // If not moving but not attacking, still show boost but don't change position
            playerBoost.style.opacity = '1';
        } else {
            // If moving and not attacking, double the speed
            playerX += (playerX - parseFloat(player.style.left || playerX)) * 1;
            playerY += (playerY - parseFloat(player.style.top || playerY)) * 1;
            playerBoost.style.opacity = '1';
        }
    } else {
        playerBoost.style.opacity = '0';
    }
    
    // Only update if there's actual movement or special conditions
    if (isMoving || !keys[' ']) {
        updatePlayerPosition();
        updateMinionsPosition();
    }
}

function updatePlayerPosition() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

function shoot() {
    const now = Date.now();
    // Calculate current cooldown based on attack speed skill level
    let currentCooldown = shotCooldown - (attackSpeedLevel * 20);
    
    // Rapid fire powerup reduces cooldown even more
    if (activePowerup === 'rapid') {
        currentCooldown /= 3;
    }
    
    if (keys[' '] && now - lastShot > currentCooldown && !isGameOver) {
        createBullet();
        lastShot = now;
    }
}

function createBullet(fromMinion = false, minionX = 0, minionY = 0) {
    // Set the bullet's starting position
    let startX = fromMinion ? minionX + 10 : playerX + 27.5;
    let startY = fromMinion ? minionY : playerY;
    
    // Default is a single bullet
    let bulletPositions = [{x: startX, y: startY}];
    
    // If spread powerup is active, create 3 bullets in a spread pattern with angles
    if (activePowerup === 'spread' && !fromMinion) {
        bulletPositions = [
            {x: startX, y: startY, angle: 0}, // Center
            {x: startX, y: startY, angle: -30}, // 30 degrees left
            {x: startX, y: startY, angle: 30}  // 30 degrees right
        ];
    }
    
    bulletPositions.forEach(pos => {
        const bullet = document.createElement('div');
        bullet.className = fromMinion ? 'bullet minion-bullet' : 'bullet';
        
        // If rapid fire powerup is active or from minion, make bullets look distinctive
        if (activePowerup === 'rapid' || activePowerup === 'nuke') {
            bullet.style.backgroundColor = '#ffcc00';
            bullet.style.width = '7px';
            bullet.style.boxShadow = '0 0 10px rgba(255, 204, 0, 0.7)';
        } else if (fromMinion) {
            bullet.style.backgroundColor = '#22ccff';
            bullet.style.width = '4px';
            bullet.style.boxShadow = '0 0 8px rgba(34, 204, 255, 0.7)';
        }
        
        bullet.style.left = pos.x + 'px';
        bullet.style.top = pos.y + 'px';
        gameContainer.appendChild(bullet);
        
        // Default bullet speed and angle
        let bulletSpeed = fromMinion ? 8 : (activePowerup === 'speed' ? 15 : 10);
        let angle = pos.angle || 0; // Default to 0 if not specified
        
        bullets.push({
            element: bullet,
            x: pos.x,
            y: pos.y,
            speed: bulletSpeed,
            angle: angle,
            fromMinion: fromMinion
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
    
    // Add the enemy ship design with different textures based on level
    const enemyShip = document.createElement('div');
    enemyShip.className = 'enemy-ship';
    
    // Determine enemy texture based on level
    if (level <= 3) {
        enemyShip.classList.add('enemy-basic');
    } else if (level <= 7) {
        enemyShip.classList.add('enemy-advanced');
    } else if (level <= 12) {
        enemyShip.classList.add('enemy-elite');
    } else {
        enemyShip.classList.add('enemy-boss');
    }
    
    enemy.appendChild(enemyShip);
    
    // Random horizontal position
    const randomX = Math.random() * (window.innerWidth - 40);
    
    enemy.style.left = randomX + 'px';
    enemy.style.top = '0px';
    
    // Scale enemy properties based on level
    const baseSpeed = 2;
    const speedIncreasePerLevel = 0.5;
    const randomSpeedVariance = Math.random() * (level * 0.2);
    let enemySpeed = baseSpeed + (level - 1) * speedIncreasePerLevel + randomSpeedVariance;
    
    // Adjust enemy appearance based on level (bigger/different color for higher levels)
    if (level > 5) {
        enemyShip.style.transform = 'scale(1.2)';
    } else if (level > 10) {
        enemyShip.style.transform = 'scale(1.4)';
    }
    
    gameContainer.appendChild(enemy);
    
    enemies.push({
        element: enemy,
        x: randomX,
        y: 0,
        speed: enemySpeed,
        health: Math.ceil(level / 3), // Tougher enemies in higher levels
        frozen: false
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Only move enemy if not frozen
        if (!enemy.frozen) {
            enemy.y += enemy.speed;
            enemy.element.style.top = enemy.y + 'px';
        }
        
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
            right: bullet.x + (bullet.fromMinion ? 4 : 5),
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
                    
                    // Check for level up and skill points
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
    powerupTextTimer = a0;
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

function activateFreeze() {
    // Freeze all enemies
    enemies.forEach(enemy => {
        enemy.frozen = true;
        enemy.element.classList.add('frozen');
    });
    
    // Show freeze effect
    const freezeEffect = document.createElement('div');
    freezeEffect.style.position = 'absolute';
    freezeEffect.style.width = '100%';
    freezeEffect.style.height = '100%';
    freezeEffect.style.backgroundColor = 'rgba(0, 191, 255, 0.2)';
    freezeEffect.style.zIndex = '140';
    freezeEffect.style.animation = 'fadeInOut 1s forwards';
    gameContainer.appendChild(freezeEffect);
    
    // Remove freeze effect after animation
    setTimeout(() => {
        if (gameContainer.contains(freezeEffect)) {
            gameContainer.removeChild(freezeEffect);
        }
    }, 1000);
    
    // Unfreeze enemies after freeze duration
    setTimeout(() => {
        enemies.forEach(enemy => {
            enemy.frozen = false;
            if (enemy.element) {
                enemy.element.classList.remove('frozen');
            }
        });
    }, freezeDuration);
    
    // Start cooldown
    freezeReady = false;
    lastFreezeTime = Date.now();
    freezeDisplay.textContent = 'Freeze Cooldown: 15s';
    freezeDisplay.style.color = '#aaa';
}

function updateFreezeCooldown() {
    if (!freezeReady) {
        const elapsed = Date.now() - lastFreezeTime;
        const remaining = freezeCooldown - elapsed;
        
        if (remaining <= 0) {
            // Cooldown complete
            freezeReady = true;
            freezeDisplay.textContent = 'Freeze Ready';
            freezeDisplay.style.color = '#00bfff';
        } else {
            // Update cooldown display
            const secondsRemaining = Math.ceil(remaining / 1000);
            freezeDisplay.textContent = `Freeze Cooldown: ${secondsRemaining}s`;
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
    
    // Update score display
    scoreDisplay.textContent = `Score: ${score}`;
    
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
        
        // Increase enemy spawn rate and difficulty
        enemySpawnRate = Math.max(1500 - (level * 100), 500);
        
        // Health bonus on level up
        const healthBonus = 20;
        health = Math.min(health + healthBonus, 100);
        healthDisplay.textContent = `Health: ${health}`;
        
        // Award skill point
        skillPoints++;
        updateSkillPointsDisplay();
    }
}

function updateSkillPointsDisplay() {
    skillPointsDisplay.textContent = `Skill Points: ${skillPoints}`;
    
    // Highlight skill buttons if points available
    const skillButtons = [skillSpeed, skillAttack, skillMinion, skillFreeze];
    
    skillButtons.forEach(button => {
        if (skillPoints > 0) {
            button.classList.add('available');
        } else {
            button.classList.remove('available');
        }
    });
}

function upgradeSkill(type) {
    if (skillPoints <= 0) return;
    
    switch(type) {
        case 'speed':
            if (moveSpeedLevel < 5) { // Max level
                moveSpeedLevel++;
                skillSpeedLevel.textContent = moveSpeedLevel;
                skillPoints--;
            }
            break;
        case 'attack':
            if (attackSpeedLevel < 5) { // Max level
                attackSpeedLevel++;
                skillAttackLevel.textContent = attackSpeedLevel;
                skillPoints--;
            }
            break;
            case 'minion':
                if (minionLevel < 5) { // Max level
                    minionLevel++;
                    skillMinionLevel.textContent = minionLevel;
                    skillPoints--;
                    updateMinions();
                }
                break;
            case 'freeze':
                if (freezeLevel < 5) { // Max level
                    freezeLevel++;
                    skillFreezeLevel.textContent = freezeLevel;
                    skillPoints--;
                    // Reduce freeze cooldown with each level
                    freezeCooldown = 15000 - (freezeLevel * 1000);
                    // Increase freeze duration with each level
                    freezeDuration = 3000 + (freezeLevel * 500);
                }
                break;
        }
        
        updateSkillPointsDisplay();
    }
    
    function updateMinions() {
        // Clear existing minions
        minions.forEach(minion => {
            if (minion.element && minionsContainer.contains(minion.element)) {
                minionsContainer.removeChild(minion.element);
            }
        });
        minions = [];
        
        // Create minions based on minion level
        for (let i = 0; i < minionLevel; i++) {
            const minion = document.createElement('div');
            minion.className = 'minion';
            minionsContainer.appendChild(minion);
            
            // Position minions around player
            minions.push({
                element: minion,
                offsetX: Math.cos(i * (2 * Math.PI / minionLevel)) * 70,
                offsetY: Math.sin(i * (2 * Math.PI / minionLevel)) * 70
            });
        }
        
        updateMinionsPosition();
    }
    
    function updateMinionsPosition() {
        minions.forEach(minion => {
            minion.element.style.left = (playerX + 30 + minion.offsetX) + 'px';
            minion.element.style.top = (playerY + 30 + minion.offsetY) + 'px';
        });
    }
    
    function minionShoot() {
        minionShootTimer += 16;
        
        // Minions shoot every 1 second (adjustable based on level)
        const minionShootInterval = 1000 - (minionLevel * 50);
        
        if (minionShootTimer >= minionShootInterval && minions.length > 0 && !isGameOver) {
            minions.forEach(minion => {
                const minionX = parseFloat(minion.element.style.left);
                const minionY = parseFloat(minion.element.style.top);
                createBullet(true, minionX, minionY);
            });
            minionShootTimer = 0;
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
        skillPoints = 0;
        moveSpeedLevel = 0;
        attackSpeedLevel = 0;
        minionLevel = 0;
        freezeLevel = 0;
        minions = [];
        activePowerup = null;
        
        // Reset abilities
        nukeReady = true;
        freezeReady = true;
        
        // Update displays
        scoreDisplay.textContent = 'Score: 0';
        healthDisplay.textContent = 'Health: 100';
        levelDisplay.textContent = 'Level: 1';
        nukeDisplay.textContent = 'Nuke Ready';
        nukeDisplay.style.color = '#ff5500';
        freezeDisplay.textContent = 'Freeze Ready';
        freezeDisplay.style.color = '#00bfff';
        skillPointsDisplay.textContent = 'Skill Points: 0';
        skillSpeedLevel.textContent = '0';
        skillAttackLevel.textContent = '0';
        skillMinionLevel.textContent = '0';
        skillFreezeLevel.textContent = '0';
        
        // Remove skill button highlights
        const skillButtons = [skillSpeed, skillAttack, skillMinion, skillFreeze];
        skillButtons.forEach(button => {
            button.classList.remove('available');
        });
        
        // Clear game elements
        clearGameElements();
        
        // Reset player appearance
        playerShip.style.filter = 'none';
        
        // Reset minions
        updateMinions();
        
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
        
        // Remove all minions
        minions.forEach(minion => {
            if (minionsContainer.contains(minion.element)) {
                minionsContainer.removeChild(minion.element);
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
        
        // Update ability cooldowns
        updateNukeCooldown();
        updateFreezeCooldown();
        
        // Update minion shooting
        if (minionLevel > 0) {
            minionShoot();
        }
        
        // Increase difficulty over time
        increaseDifficulty();
        
        // Update starry background
        updateStars();
        
        // Continue game loop
        if (!isGameOver) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Event listeners for restartBtn
    restartBtn.addEventListener('click', restartGame);
    
    // Event listeners for skill buttons
    skillSpeed.addEventListener('click', () => {
        if (skillPoints > 0) {
            upgradeSkill('speed');
        }
    });
    
    skillAttack.addEventListener('click', () => {
        if (skillPoints > 0) {
            upgradeSkill('attack');
        }
    });
    
    skillMinion.addEventListener('click', () => {
        if (skillPoints > 0) {
            upgradeSkill('minion');
        }
    });
    
    skillFreeze.addEventListener('click', () => {
        if (skillPoints > 0) {
            upgradeSkill('freeze');
        }
    });
    
    // Add resize handling to adjust game elements when window is resized
    window.addEventListener('resize', () => {
        // Adjust player position
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
        
        // Update player and minions position
        updatePlayerPosition();
        updateMinionsPosition();
        
        // Update touch start position for continuous movement
        touchStartX = touchX;
        touchStartY = touchY;
    });
    
    gameContainer.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        // Stop firing when touch ends
        keys[' '] = false;
    });
    
    // Mobile ability buttons (optional, attach to DOM elements if needed)
    const mobileBtnNuke = document.getElementById('mobile-btn-nuke');
    const mobileBtnFreeze = document.getElementById('mobile-btn-freeze');
    
    if (mobileBtnNuke) {
        mobileBtnNuke.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (nukeReady && !isGameOver) {
                activateNuke();
            }
        });
    }
    
    if (mobileBtnFreeze) {
        mobileBtnFreeze.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (freezeReady && !isGameOver) {
                activateFreeze();
            }
        });
    }
    
    // Start the game!
    gameLoop();
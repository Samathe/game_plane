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

// Restart button event listener
restartBtn.addEventListener('click', restartGame);

// Function to restart the game
function restartGame() {
    // Reset game variables
    score = 0;
    health = 100;
    isGameOver = false;
    level = 1;
    levelThreshold = 1000;
    skillPoints = 0;
    playerSpeed = 5;
    shotCooldown = 300;
    
    // Reset skill levels
    skillLevels = {
        speed: 0,
        attack: 0,
        minion: 0,
        freeze: 0
    };
    
    // Clear arrays
    bullets = [];
    enemies = [];
    powerups = [];
    minions = [];
    
    // Reset abilities
    nukeReady = true;
    freezeReady = true;
    lastNukeTime = 0;
    lastFreezeTime = 0;
    
    // Reset player position
    playerX = window.innerWidth / 2 - 30;
    playerY = window.innerHeight - 100;
    
    // Update displays
    updateScoreDisplay();
    updateHealthDisplay();
    updateLevelDisplay();
    updateSkillDisplays();
    
    // Hide game over screen
    gameOverScreen.style.display = 'none';
    
    // Start the game loop
    startGameLoop();
}

// Function to create stars for background
function createStars() {
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random star attributes
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.8 + 0.2;
        
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.opacity = opacity;
        star.style.left = Math.random() * window.innerWidth + 'px';
        star.style.top = Math.random() * window.innerHeight + 'px';
        
        // Add subtle animation
        star.style.animation = `twinkle ${Math.random() * 4 + 2}s infinite alternate`;
        
        stars.push(star);
        gameContainer.appendChild(star);
    }
}

// Function to move stars (parallax effect)
function moveStars() {
    stars.forEach(star => {
        const currentTop = parseFloat(star.style.top);
        const speed = 0.1 + (parseFloat(star.style.width) - 1) * 0.1;
        
        // Move stars downward
        star.style.top = (currentTop + speed) + 'px';
        
        // Reset stars that go off screen
        if (currentTop > window.innerHeight) {
            star.style.top = -5 + 'px';
            star.style.left = Math.random() * window.innerWidth + 'px';
        }
    });
}

// Update player position based on keyboard input
function updatePlayerPosition() {
    // Reset isMoving flag
    isMoving = false;
    
    // Calculate effective speed based on skill level and powerups
    let effectiveSpeed = playerSpeed + skillLevels.speed;
    if (activePowerup === 'speed') {
        effectiveSpeed *= 1.5;
    }
    
    // Movement with WASD or arrow keys
    if ((keys['ArrowUp'] || keys['w'] || keys['W']) && playerY > 0) {
        playerY -= effectiveSpeed;
        isMoving = true;
    }
    if ((keys['ArrowDown'] || keys['s'] || keys['S']) && playerY < window.innerHeight - 60) {
        playerY += effectiveSpeed;
        isMoving = true;
    }
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && playerX > 0) {
        playerX -= effectiveSpeed;
        isMoving = true;
    }
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && playerX < window.innerWidth - 60) {
        playerX += effectiveSpeed;
        isMoving = true;
    }
    
    // Update boost effect
    if (isMoving) {
        playerBoost.style.opacity = '0.9';
        // Tilt player ship based on left/right movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            playerShip.style.transform = 'rotate(-15deg)';
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            playerShip.style.transform = 'rotate(15deg)';
        } else {
            playerShip.style.transform = 'rotate(0deg)';
        }
    } else {
        playerBoost.style.opacity = '0';
        playerShip.style.transform = 'rotate(0deg)';
    }
    
    // Set player position
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    // Update minion positions
    updateMinions();
}

// Function to shoot bullets
function shootBullet() {
    // Calculate effective cooldown based on skill level and powerups
    let effectiveCooldown = shotCooldown - (skillLevels.attack * 30);
    if (activePowerup === 'rapid') {
        effectiveCooldown /= 2;
    }
    effectiveCooldown = Math.max(effectiveCooldown, 100); // Minimum cooldown
    
    // Check if enough time has passed since last shot
    const currentTime = Date.now();
    if (currentTime - lastShot < effectiveCooldown) {
        return;
    }
    
    // Create regular bullet
    createBullet(playerX + 27.5, playerY, 0);
    
    // Create spread shots if powerup active
    if (activePowerup === 'spread') {
        createBullet(playerX + 27.5, playerY, -15);
        createBullet(playerX + 27.5, playerY, 15);
    }
    
    // Update last shot time
    lastShot = currentTime;
}

// Function to create a bullet with angle
function createBullet(x, y, angle) {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = x + 'px';
    bullet.style.top = y + 'px';
    
    // Store bullet properties
    const bulletObj = {
        element: bullet,
        x: x,
        y: y,
        angle: angle,
        speed: 10
    };
    
    bullets.push(bulletObj);
    gameContainer.appendChild(bullet);
}

// Function to create minion bullets
function shootMinionBullet(minion) {
    const bullet = document.createElement('div');
    bullet.classList.add('minion-bullet');
    bullet.style.left = (minion.x + 13.5) + 'px';
    bullet.style.top = minion.y + 'px';
    
    // Store bullet properties
    const bulletObj = {
        element: bullet,
        x: minion.x + 13.5,
        y: minion.y,
        angle: 0, // Minions shoot straight
        speed: 8,
        isMinion: true
    };
    
    bullets.push(bulletObj);
    gameContainer.appendChild(bullet);
}

// Function to update minions
function updateMinions() {
    const minionCount = skillLevels.minion;
    
    // Remove excess minions if skill level decreased
    while (minions.length > minionCount) {
        const minion = minions.pop();
        minion.element.remove();
    }
    
    // Create new minions if needed
    while (minions.length < minionCount) {
        createMinion();
    }
    
    // Update minion positions
    minions.forEach((minion, index) => {
        let targetX, targetY;
        
        // Position minions based on index (left or right of player)
        if (index % 2 === 0) {
            // Left side minion
            targetX = playerX - 50 - (Math.floor(index / 2) * 40);
            targetY = playerY + 20;
        } else {
            // Right side minion
            targetX = playerX + 70 + (Math.floor(index / 2) * 40);
            targetY = playerY + 20;
        }
        
        // Smooth movement
        minion.x += (targetX - minion.x) * 0.1;
        minion.y += (targetY - minion.y) * 0.1;
        
        minion.element.style.left = minion.x + 'px';
        minion.element.style.top = minion.y + 'px';
        
        // Shoot if cooldown passed
        const currentTime = Date.now();
        const minionCooldown = shotCooldown - (skillLevels.attack * 25) + 200; // Slightly slower than player
        
        if (currentTime - minion.lastShot > minionCooldown) {
            shootMinionBullet(minion);
            minion.lastShot = currentTime;
        }
    });
}

// Function to create a minion
function createMinion() {
    const minionElement = document.createElement('div');
    minionElement.classList.add('minion');
    
    // Create minion ship
    const minionShip = document.createElement('div');
    minionShip.classList.add('minion-ship');
    minionElement.appendChild(minionShip);
    
    // Create wings
    const leftWing = document.createElement('div');
    leftWing.classList.add('wing', 'left');
    minionShip.appendChild(leftWing);
    
    const rightWing = document.createElement('div');
    rightWing.classList.add('wing', 'right');
    minionShip.appendChild(rightWing);
    
    // Create thrust
    const thrust = document.createElement('div');
    thrust.classList.add('thrust');
    minionShip.appendChild(thrust);
    
    // Set initial position (slightly behind player)
    const initialX = playerX + (minions.length % 2 === 0 ? -50 : 70);
    const initialY = playerY + 20;
    
    // Create minion object
    const minion = {
        element: minionElement,
        x: initialX,
        y: initialY,
        lastShot: Date.now()
    };
    
    minions.push(minion);
    minionsContainer.appendChild(minionElement);
}

// Function to move bullets
function moveBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        
        // Calculate movement based on angle
        const radians = bullet.angle * Math.PI / 180;
        bullet.x += Math.sin(radians) * bullet.speed;
        bullet.y -= Math.cos(radians) * bullet.speed;
        
        // Update bullet position
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        
        // Remove bullets that go off screen
        if (bullet.y < -20 || bullet.y > window.innerHeight + 20 || 
            bullet.x < -20 || bullet.x > window.innerWidth + 20) {
            bullet.element.remove();
            bullets.splice(i, 1);
            i--;
        }
    }
}

// Function to spawn enemies
function spawnEnemies(timestamp) {
    // Adjust spawn rate based on level
    const adjustedSpawnRate = enemySpawnRate - (level * 100);
    // Minimum spawn rate of 500ms
    const finalSpawnRate = Math.max(adjustedSpawnRate, 500);
    
    if (timestamp - lastEnemySpawn > finalSpawnRate) {
        // Create enemy
        const enemy = document.createElement('div');
        enemy.classList.add('enemy');
        
        // Add level-specific class for different textures
        const enemyLevel = Math.min(Math.ceil(level / 2), 5);
        enemy.classList.add(`enemy-level-${enemyLevel}`);
        
        // Create enemy ship
        const enemyShip = document.createElement('div');
        enemyShip.classList.add('enemy-ship');
        enemy.appendChild(enemyShip);
        
        // Set random starting position at top of screen
        const enemyX = Math.random() * (window.innerWidth - 40);
        const enemyY = -50;
        
        // Set random movement pattern
        const pattern = Math.floor(Math.random() * 4);
        const speed = 2 + (level * 0.2);
        
        // Store enemy properties
        const enemyObj = {
            element: enemy,
            x: enemyX,
            y: enemyY,
            pattern: pattern,
            speed: speed,
            health: enemyLevel * 2, // Health increases with enemy level
            isFrozen: false,
            unfreezeTime: 0
        };
        
        enemies.push(enemyObj);
        gameContainer.appendChild(enemy);
        
        lastEnemySpawn = timestamp;
    }
}

// Function to move enemies
function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        // Check if enemy is frozen
        if (enemy.isFrozen) {
            if (Date.now() > enemy.unfreezeTime) {
                enemy.isFrozen = false;
                enemy.element.classList.remove('enemy-frozen');
            } else {
                continue; // Skip movement for frozen enemies
            }
        }
        
        // Move based on pattern
        switch (enemy.pattern) {
            case 0: // Straight down
                enemy.y += enemy.speed;
                break;
            case 1: // Zigzag
                enemy.y += enemy.speed;
                enemy.x += Math.sin(enemy.y * 0.05) * 3;
                break;
            case 2: // Curve right
                enemy.y += enemy.speed;
                enemy.x += 0.5 + (enemy.y * 0.005);
                break;
            case 3: // Curve left
                enemy.y += enemy.speed;
                enemy.x -= 0.5 + (enemy.y * 0.005);
                break;
        }
        
        // Update enemy position
        enemy.element.style.left = enemy.x + 'px';
        enemy.element.style.top = enemy.y + 'px';
        
        // Check if enemy is off screen
        if (enemy.y > window.innerHeight + 50 || 
            enemy.x < -50 || enemy.x > window.innerWidth + 50) {
            enemy.element.remove();
            enemies.splice(i, 1);
            i--;
        }
    }
}

// Function to check collisions
function checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            
            // Calculate distance between bullet and enemy
            const dx = bullet.x - (enemy.x + 20);
            const dy = bullet.y - (enemy.y + 20);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check for collision (20 = enemy radius)
            if (distance < 25) {
                // Remove bullet
                bullet.element.remove();
                bullets.splice(i, 1);
                i--;
                
                // Reduce enemy health
                enemy.health -= bullet.isMinion ? 1 : 2; // Minion bullets do less damage
                
                // Check if enemy is destroyed
                if (enemy.health <= 0) {
                    // Create explosion
                    createExplosion(enemy.x, enemy.y);
                    
                    // Remove enemy
                    enemy.element.remove();
                    enemies.splice(j, 1);
                    j--;
                    
                    // Add score
                    increaseScore(10 * Math.ceil(level / 2));
                    
                    // Random chance to spawn powerup
                    if (Math.random() < 0.1) {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                }
                
                // Break inner loop since bullet is removed
                break;
            }
        }
    }
    
    // Check player-enemy collisions
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        // Calculate distance between player and enemy
        const dx = (playerX + 30) - (enemy.x + 20);
        const dy = (playerY + 30) - (enemy.y + 20);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for collision (player radius = 30, enemy radius = 20)
        if (distance < 40) {
            // Create explosion
            createExplosion(enemy.x, enemy.y);
            
            // Remove enemy
            enemy.element.remove();
            enemies.splice(i, 1);
            i--;
            
            // Reduce player health
            decreaseHealth(10);
        }
    }
    
    // Check player-powerup collisions
    for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];
        
        // Calculate distance between player and powerup
        const dx = (playerX + 30) - (powerup.x + 15);
        const dy = (playerY + 30) - (powerup.y + 15);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for collision (player radius = 30, powerup radius = 15)
        if (distance < 35) {
            // Activate powerup
            activatePowerup(powerup.type);
            
            // Remove powerup
            powerup.element.remove();
            powerups.splice(i, 1);
            i--;
        }
    }
}

// Function to create explosion
function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = (x + 20) + 'px';
    explosion.style.top = (y + 20) + 'px';
    
    // Use different explosion types
    const explosionTypes = ['💥', '🔥', '✨'];
    explosion.textContent = explosionTypes[Math.floor(Math.random() * explosionTypes.length)];
    
    gameContainer.appendChild(explosion);
    
    // Remove explosion after animation completes
    setTimeout(() => {
        explosion.remove();
    }, 500);
}

// Function to increase score
function increaseScore(points) {
    score += points;
    updateScoreDisplay();
    
    // Check for level up
    if (score >= levelThreshold) {
        levelUp();
    }
}

// Function to update score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

// Function to decrease health
function decreaseHealth(damage) {
    health = Math.max(0, health - damage);
    updateHealthDisplay();
    
    // Check for game over
    if (health <= 0) {
        gameOver();
    }
}

// Function to update health display
function updateHealthDisplay() {
    healthDisplay.textContent = `Health: ${health}`;
}

// Function for game over
function gameOver() {
    isGameOver = true;
    
    // Stop game loop
    cancelAnimationFrame(animationFrameId);
    
    // Update final scores
    finalScoreDisplay.textContent = `Your score: ${score}`;
    finalLevelDisplay.textContent = `Level reached: ${level}`;
    
    // Show game over screen
    gameOverScreen.style.display = 'block';
}

// Function to level up
function levelUp() {
    level++;
    
    // Update level threshold
    levelThreshold += 1000 * level;
    
    // Award skill point
    skillPoints++;
    
    // Update displays
    updateLevelDisplay();
    updateSkillDisplays();
    
    // Show level up message
    newLevelDisplay.textContent = level;
    levelUpMessage.style.display = 'block';
    showingLevelUpMessage = true;
    levelUpMessageTimer = Date.now();
}

// Function to update level display
function updateLevelDisplay() {
    levelDisplay.textContent = `Level: ${level}`;
}

// Function to update skill displays
function updateSkillDisplays() {
    // Update skill point display
    skillPointsDisplay.textContent = `Skill Points: ${skillPoints}`;
    
    // Update individual skill levels
    document.querySelector('#skill-speed .skill-level').textContent = `Lv.${skillLevels.speed}`;
    document.querySelector('#skill-attack .skill-level').textContent = `Lv.${skillLevels.attack}`;
    document.querySelector('#skill-minion .skill-level').textContent = `Lv.${skillLevels.minion}`;
    
    // Update freeze skill display
    const freezeSkillDisplay = document.querySelector('#skill-freeze .skill-level');
    if (skillLevels.freeze > 0) {
        if (freezeReady) {
            freezeSkillDisplay.textContent = 'Ready';
            freezeSkillDisplay.classList.add('ready');
        } else {
            // Calculate cooldown
            const cooldownLeft = Math.ceil((freezeCooldown - (Date.now() - lastFreezeTime)) / 1000);
            freezeSkillDisplay.textContent = `${cooldownLeft}s`;
            freezeSkillDisplay.classList.remove('ready');
        }
    } else {
        freezeSkillDisplay.textContent = 'Lv.0';
        freezeSkillDisplay.classList.remove('ready');
    }
}

// Function to upgrade skills
function upgradeSkill(skillType) {
    // Check if player has skill points
    if (skillPoints <= 0) {
        return;
    }
    
    // Max skill level is 5
    if (skillLevels[skillType] >= 5) {
        return;
    }
    
    // Upgrade skill
    skillLevels[skillType]++;
    skillPoints--;
    
    // Special handling for each skill
    switch (skillType) {
        case 'speed':
            // Each level adds 1 to player speed
            playerSpeed = 5 + skillLevels.speed;
            break;
        case 'attack':
            // Each level reduces cooldown by 30ms
            break;
        case 'minion':
            // Each level adds a minion
            break;
        case 'freeze':
            // First level unlocks freeze ability
            break;
    }
    
    // Update displays
    updateSkillDisplays();
}

// Function to activate nuke ability
function activateNuke() {
    // Create nuke effect
    const nukeEffect = document.createElement('div');
    nukeEffect.style.position = 'absolute';
    nukeEffect.style.width = '100%';
    nukeEffect.style.height = '100%';
    nukeEffect.style.backgroundColor = 'rgba(255, 85, 0, 0.3)';
    nukeEffect.style.zIndex = '150';
    gameContainer.appendChild(nukeEffect);
    
    // Flash effect
    setTimeout(() => {
        nukeEffect.remove();
    }, 300);
    
    // Destroy all enemies
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        // Create explosion
        createExplosion(enemy.x, enemy.y);
        
        // Remove enemy
        enemy.element.remove();
        
        // Add score
        increaseScore(5 * Math.ceil(level / 2));
    }
    
    // Clear enemies array
    enemies = [];
    
    // Set cooldown
    nukeReady = false;
    lastNukeTime = Date.now();
    
    // Update nuke display
    nukeDisplay.textContent = 'Nuke Cooling Down';
}

// Function to activate freeze ability
function activateFreeze() {
    // Create freeze effect
    for (let i = 0; i < 10; i++) {
        const crystal = document.createElement('div');
        crystal.classList.add('ice-crystal');
        crystal.style.left = (Math.random() * window.innerWidth) + 'px';
        crystal.style.top = (Math.random() * window.innerHeight) + 'px';
        gameContainer.appendChild(crystal);
        
        // Remove crystal after animation
        setTimeout(() => {
            crystal.remove();
        }, 1000);
    }
    
    // Freeze all enemies
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        enemy.isFrozen = true;
        enemy.unfreezeTime = Date.now() + freezeDuration;
        enemy.element.classList.add('enemy-frozen');
    }
    
    // Set cooldown
    freezeReady = false;
    lastFreezeTime = Date.now();
    
    // Update freeze display
    updateSkillDisplays();
}

// Function to spawn powerup
function spawnPowerup(x, y) {
    const powerupTypes = ['speed', 'spread', 'rapid', 'nuke'];
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    const powerup = document.createElement('div');
    powerup.classList.add('powerup', `powerup-${randomType}`);
    
    // Position powerup
    powerup.style.left = x + 'px';
    powerup.style.top = y + 'px';
    
    // Store powerup properties
    const powerupObj = {
        element: powerup,
        x: x,
        y: y,
        type: randomType,
        speed: 1
    };
    
    powerups.push(powerupObj);
    gameContainer.appendChild(powerup);
    
    lastPowerupSpawn = Date.now();
}

// Function to move powerups
function movePowerups() {
    for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];
        
        // Move powerup down
        powerup.y += powerup.speed;
        powerup.element.style.top = powerup.y + 'px';
        
        // Remove powerups that go off screen
        if (powerup.y > window.innerHeight + 30) {
            powerup.element.remove();
            powerups.splice(i, 1);
            i--;
        }
    }
}

// Function to activate powerup
function activatePowerup(type) {
    // Deactivate current powerup if exists
    if (activePowerup) {
        deactivatePowerup();
    }
    
    // Set active powerup
    activePowerup = type;
    powerupTimer = Date.now();
    
    // Show powerup text
    powerupText.textContent = `Power-up collected: ${type.toUpperCase()}!`;
    powerupText.style.opacity = '1';
    showingPowerupText = true;
    powerupTextTimer = Date.now();
    
    // Handle nuke powerup separately
    if (type === 'nuke') {
        activateNuke();
        activePowerup = null; // Nuke is instant, not sustained
    }
}

// Function to deactivate powerup
function deactivatePowerup() {
    activePowerup = null;
}

// Main game loop
function gameLoop(timestamp) {
    if (!isGameOver) {
        // Update player position
        updatePlayerPosition();
        
        // Shoot if space is pressed
        if (keys[' ']) {
            shootBullet();
        }
        
        // Move bullets
        moveBullets();
        
        // Spawn enemies
        spawnEnemies(timestamp);
        
        // Move enemies
        moveEnemies();
        
        // Move powerups
        movePowerups();
        
        // Move stars
        moveStars();
        
        // Check collisions
        checkCollisions();
        
        // Update abilities cooldowns
        updateAbilityCooldowns(timestamp);
        
        // Update messages
        updateMessages(timestamp);
        
        // Request next frame
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Function to update abilities cooldowns
function updateAbilityCooldowns(timestamp) {
    // Update nuke cooldown
    if (!nukeReady && timestamp - lastNukeTime > nukeCooldown) {
        nukeReady = true;
        nukeDisplay.textContent = 'Nuke Ready';
    }
    
    // Update freeze cooldown
    if (!freezeReady && timestamp - lastFreezeTime > freezeCooldown) {
        freezeReady = true;
        updateSkillDisplays();
    }
    
    // Update powerup duration
    if (activePowerup && timestamp - powerupTimer > powerupDuration) {
        deactivatePowerup();
    }
}

// Function to update messages
function updateMessages(timestamp) {
    // Update level up message
    if (showingLevelUpMessage && timestamp - levelUpMessageTimer > 2000) {
        levelUpMessage.style.display = 'none';
        showingLevelUpMessage = false;
    }
    
    // Update powerup text
    if (showingPowerupText && timestamp - powerupTextTimer > 2000) {
        powerupText.style.opacity = '0';
        showingPowerupText = false;
    }
}

// Function to start the game loop
function startGameLoop() {
    if (!isGameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Start the game when the Enter key is pressed
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !animationFrameId) {
        startGameLoop();
    }
});

// Initialize game
updateScoreDisplay();
updateHealthDisplay();
updateLevelDisplay();
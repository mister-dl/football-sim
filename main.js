// --- Game Configuration ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            // debug: true, // Optional: for seeing collision boxes
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// --- Constants (Colors & AI) ---
const BLUE_TEAM = 0x3273e0;
const FIELD_GREEN = 0x32aa50;
const WHITE = 0xffffff;
const RED_TEAM = 0xe63232;
const MAX_PLAYER_SPEED = 400; // Doubled from 200
const BALL_START_SPEED = 350; // Increased speed
const PLAYER_CHASE_DISTANCE = 400; // How far players will chase the ball

// --- Game Variables ---
let ball;
let redScore = 0;
let blueScore = 0;
let scoreText;
let allPlayers = []; // Global array to hold all players

// Initialize the game
const game = new Phaser.Game(config);

// --- Phaser Scene Functions ---

function preload () {
    // Texture creation remains the same
    const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    ballGraphics.fillStyle(0xffffff, 1);
    ballGraphics.fillCircle(8, 8, 8);
    ballGraphics.generateTexture('ball', 16, 16);
    ballGraphics.destroy();

    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0xffffff, 1);
    playerGraphics.fillCircle(10, 10, 10);
    playerGraphics.generateTexture('player', 20, 20);
    playerGraphics.destroy();
}

function create() {
    this.cameras.main.setBackgroundColor(FIELD_GREEN);

    // --- Field Drawing ---
    const graphics = this.add.graphics({ lineStyle: { width: 4, color: WHITE } });
    graphics.strokeRect(10, 10, config.width - 20, config.height - 20); 
    graphics.beginPath();
    graphics.moveTo(config.width / 2, 10);
    graphics.lineTo(config.width / 2, config.height - 10);
    graphics.stroke();
    graphics.strokeCircle(config.width / 2, config.height / 2, 70); 
    graphics.lineStyle(4, 0xff0000); 
    graphics.strokeRect(5, 150, 30, 300); 
    graphics.strokeRect(config.width - 35, 150, 30, 300); 
    // --------------------------------------------------

    // Create Score Display
    scoreText = this.add.text(config.width / 2, 30, `RED: ${redScore}  BLUE: ${blueScore}`, {
        fontSize: '24px',
        fill: '#ffffff',
        align: 'center'
    }).setOrigin(0.5, 0);

    // Create the Ball
    ball = this.physics.add.sprite(config.width / 2, config.height / 2, 'ball').setCircle(10);
    ball.setDrag(0.95); // Increased drag to slow ball down
    ball.setBounce(0.7); // Reduced bounce to lose energy
    ball.setCollideWorldBounds(true);
    ball.setMass(0.1); // Lighter ball makes players look stronger

    // Give the ball initial motion
    ball.setVelocity(Phaser.Math.Between(-BALL_START_SPEED, BALL_START_SPEED), Phaser.Math.Between(-BALL_START_SPEED, BALL_START_SPEED));


    // --- Create Teams ---
    const teamFormations = [
        { x: 80, y: config.height / 2, role: 'GK' },
        { x: 150, y: config.height * 0.3, role: 'DF' },
        { x: 150, y: config.height * 0.7, role: 'DF' },
        { x: 300, y: config.height / 2, role: 'MF' },
        { x: 450, y: config.height / 2, role: 'FW' }
    ];

    teamFormations.forEach(pos => {
        allPlayers.push(createPlayer(this, pos.x, pos.y, RED_TEAM, 'RED', pos.role));
        let mirrorX = config.width - pos.x;
        allPlayers.push(createPlayer(this, mirrorX, pos.y, BLUE_TEAM, 'BLUE', pos.role));
    });

    // Handle all collisions
    // 1. Player-Ball Collision: Simply let the physics engine handle the bounce.
    this.physics.add.collider(allPlayers, ball); 
    
    // 2. Player-Player Collision: Separates them.
    this.physics.add.collider(allPlayers, allPlayers);
}

// Helper function to create a player sprite with custom properties
function createPlayer(scene, x, y, color, teamID, role) {
    let player = scene.physics.add.sprite(x, y, 'player').setCircle(15);
    player.setTint(color);
    player.setCollideWorldBounds(true);
    player.setBounce(0.2); 
    player.setDrag(0.99); 
    player.setAngularDrag(800); 
    player.setMass(1);         
    
    player.teamID = teamID;
    player.homeX = x;
    player.homeY = y;
    player.role = role;
    player.state = 'DEFEND';
    
    // Make players heavier than the ball, so they push it instead of being pushed
    player.setMass(10); 
    
    return player;
}

// **kICKBALL FUNCTION IS REMOVED** - Player-Ball collision is now passive.

function update() {
    // Update all player AI decisions
    allPlayers.forEach(player => {
        makeAIDecision(player, ball);
    });

    // Check for goals
    if (ball.x > 780 && ball.y > 150 && ball.y < 450) {
        blueScore++; // Blue team scores on the right side
        scoreText.setText(`RED: ${redScore}  BLUE: ${blueScore}`);
        resetBall();
    }
    else if (ball.x < 20 && ball.y > 150 && ball.y < 450) {
        redScore++; // Red team scores on the left side
        scoreText.setText(`RED: ${redScore}  BLUE: ${blueScore}`);
        resetBall();
    }
}

function resetBall() {
    ball.x = config.width / 2;
    ball.y = config.height / 2;
    ball.setVelocity(Phaser.Math.Between(-BALL_START_SPEED, BALL_START_SPEED), Phaser.Math.Between(-BALL_START_SPEED, BALL_START_SPEED));
}

// Add this helper function outside the class for cleaner code:
function moveTowards(p, targetX, targetY, speed) {
    let angle = Phaser.Math.Angle.Between(p.x, p.y, targetX, targetY);
    p.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function makeAIDecision(player, ball) {
    const distToBall = Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y);
    const distToHome = Phaser.Math.Distance.Between(player.x, player.y, player.homeX, player.homeY);
    
    // Check if ball is in a corner (near field boundaries)
    const inCorner = (ball.x < 100 || ball.x > config.width - 100) && 
                     (ball.y < 100 || ball.y > config.height - 100);
    
    // If ball is close AND in a corner, back away to avoid trapping it
    if (distToBall < 50 && inCorner) {
        // Move away from ball to prevent trapping in corners
        let angle = Phaser.Math.Angle.Between(player.x, player.y, ball.x, ball.y);
        moveTowards(player, player.x - Math.cos(angle) * 50, player.y - Math.sin(angle) * 50, MAX_PLAYER_SPEED * 0.3);
    }
    // If ball is medium distance, move toward it
    else if (distToBall < 150) {
        // Move toward ball to intercept
        moveTowards(player, ball.x, ball.y, MAX_PLAYER_SPEED * 0.2);
    } 
    // If away from home, drift back to formation
    else if (distToHome > 15) {
        moveTowards(player, player.homeX, player.homeY, MAX_PLAYER_SPEED * 0.4);
    } 
    // Stop when at home and ball is far
    else {
        player.body.setVelocity(0, 0);
    }
}
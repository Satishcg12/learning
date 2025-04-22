function applyStyles(element, style) {
    for (let key in style) {
        if (style.hasOwnProperty(key)) {
            element.style[key] = style[key];
        }
    }
}
function getRandomInt(min, max) {
    return Math.random() * (max - min) + min;
}

class Game {
    constructor() {
        this.app = document.getElementById('app');

        // Constants
        this.GAME_WIDTH = 600;
        this.GAME_HEIGHT = 400;

        this.BIRD_SIZE = 20;
        this.GAME_REFRESH_RATE = 20; //ms

        // Score implementation
        this.SCORE = 0;
        this.SCORE_ELEMENT = document.createElement('div');
        applyStyles(this.SCORE_ELEMENT, {
            position: 'absolute',
            top: '10px',
            left: '10px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'black',
            zIndex: '50'
        });
        this.SCORE_ELEMENT.innerText = 'Score: 0';
        this.app.appendChild(this.SCORE_ELEMENT);

        applyStyles(this.app, {
            height: this.GAME_HEIGHT + 'px',
            width: this.GAME_WIDTH + 'px',
            background: 'url(./assets/background-day.png)',
            
            border: '1px solid black',
            position: 'relative',
            overflow: 'hidden',
        });

        this.pipes = [];
        this.bird = null;

        this.init();
    }
    init() {
        // add pipes
        for (let i = 0; i < 4; i++) {
            new Pipes(this, i);
        }
        // add bird
        this.bird = new Bird(this);

        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                this.bird.jump();
            }
        }
        );
        document.addEventListener('click', (e) => {
            this.bird.jump();
        });

    }
    start() {
        this.gameInterval = setInterval(() => {
            this.update();
        }, this.GAME_REFRESH_RATE);
    }
    update() {
        // move background 
        applyStyles(this.app, {
            backgroundPosition: (parseInt(this.app.style.backgroundPositionX) || 0) - 1 + 'px',
        });

        // move bird
        if (this.bird) {
            this.bird.move();
            this.bird.checkWallCollision();
            for (let i = 0; i < this.pipes.length; i++) {
                this.bird.handleCollision(this.pipes[i]);
            }
        }

        // move pipes

        for (let i = 0; i < this.pipes.length; i++) {
            this.pipes[i].move();
        }
    }
    gameOver() {
        // Stop game by clearing the interval
        clearInterval(this.gameInterval);

        // Create game over screen
        const gameOverScreen = document.createElement('div');
        applyStyles(gameOverScreen, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '24px',
            zIndex: '100'
        });

        const gameOverText = document.createElement('h2');
        gameOverText.textContent = 'Game Over';
        
        const scoreText = document.createElement('div');
        scoreText.textContent = 'Your Score: ' + this.SCORE;
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        applyStyles(restartButton, {
            padding: '10px 20px',
            fontSize: '18px',
            margin: '20px',
            cursor: 'pointer'
        });

        restartButton.addEventListener('click', () => {
            this.restart();
        });

        gameOverScreen.appendChild(gameOverText);
        gameOverScreen.appendChild(scoreText);
        gameOverScreen.appendChild(restartButton);
        this.app.appendChild(gameOverScreen);
    }

    restart() {
        // Remove game over screen, but keep track of child elements we want to preserve
        const childrenToRemove = [];
        for (let i = 0; i < this.app.children.length; i++) {
            // Skip the score element
            if (this.app.children[i] !== this.SCORE_ELEMENT) {
                childrenToRemove.push(this.app.children[i]);
            }
        }
        
        // Remove all children except score element
        for (let i = 0; i < childrenToRemove.length; i++) {
            this.app.removeChild(childrenToRemove[i]);
        }

        // Reset game state
        this.pipes = [];
        this.bird = null;
        this.SCORE = 0;
        
        // Update score display
        this.updateScore();

        // Initialize and start game again
        this.init();
        this.start();
    }

    // Add this method to update the score display
    updateScore() {
        this.SCORE_ELEMENT.innerText = 'Score: ' + this.SCORE;
    }
}

class Box {
    constructor(game, height, width, x = 0, y = 0, dx, dy) {
        this.game = game;

        // Random box size between 15 and 40 pixels
        this.height = height;
        this.width = width;

        this.dx = dx;
        this.dy = dy;
        this.x = x;
        this.y = y;

        this.element = document.createElement('div');
        applyStyles(this.element, {
            width: this.width + 'px',
            height: this.height + 'px',
            backgroundColor: 'black',
            color: 'white',
            position: 'absolute',
            left: this.x + 'px',
            top: this.y + 'px',
        });

        this.game.app.appendChild(this.element);
    }

    checkWallCollision() {
        if (
            this.x + this.dx < 0 ||
            this.x + this.dx > this.game.GAME_WIDTH - this.width ||
            this.y + this.dy < 0 ||
            this.y + this.dy > this.game.GAME_HEIGHT - this.height
        ) {
            return true;
        }
    }

    checkCollision(otherBox) {
        if (this === otherBox) return false;
        return (
            this.x < otherBox.x + otherBox.width &&
            this.x + this.width > otherBox.x &&
            this.y < otherBox.y + otherBox.height &&
            this.y + this.height > otherBox.y
        );
    }

    handleCollision(otherBox) {
        if (this.checkCollision(otherBox)) {
            this.dx *= -1;
            this.dy *= -1;
            otherBox.dx *= -1;
            otherBox.dy *= -1;
            this.resolveOverlap(otherBox);
        }
    }


    resetStyles() {
        applyStyles(this.element, {
            left: this.x + 'px',
            top: this.y + 'px',
            height: this.height + 'px',
            width: this.width + 'px',

        });
    }

}


class Pipe extends Box {
    constructor(game, height, PIPE_WIDTH, x, y, PIPE_SPEED) {


        super(game, height, PIPE_WIDTH, x, y, PIPE_SPEED, 0);
        this.element.style.zIndex = 1;
    }
    move() {
        this.x += this.dx;
        this.y += this.dy;
        applyStyles(this.element, {
            left: this.x + 'px',
            top: this.y + 'px',
        });
    }
}

class Pipes {
    constructor(game, index) {
        this.game = game;

        this.GAP_BETWEEN_PIPES = 100;
        this.PIPES_GAP = 200;


        this.PIPE_HEIGHT = getRandomInt(20, this.game.GAME_HEIGHT - this.GAP_BETWEEN_PIPES - 20);

        this.x = this.game.GAME_WIDTH + index * this.PIPES_GAP;
        this.y = 0;


        this.PIPE_WIDTH = 50;
        this.PIPE_SPEED = -3;

        // pipe top
        this.pipeTop = new Pipe(this.game, this.PIPE_HEIGHT, this.PIPE_WIDTH, this.x, this.y, this.PIPE_SPEED);
        // pipe bottom
        this.pipeBottom = new Pipe(this.game, this.game.GAME_HEIGHT - this.PIPE_HEIGHT - this.GAP_BETWEEN_PIPES, this.PIPE_WIDTH, this.x, this.PIPE_HEIGHT + this.GAP_BETWEEN_PIPES, this.PIPE_SPEED);

        this.game.pipes.push(this);
        this.passed = false;  // Track if bird has passed this pipe

        applyStyles(this.pipeTop.element, {
            background:"url('./assets/pipe.png')",
            rotate: '180deg',
            left: this.pipeTop.x + 'px',
            top: this.pipeTop.y + 'px',
        });
        applyStyles(this.pipeBottom.element, {
            background:"url('./assets/pipe.png')",
            left: this.pipeBottom.x + 'px',
            top: this.pipeBottom.y + 'px',
        });
    }
    move() {
        if (this.pipeTop.x < -this.PIPE_WIDTH) {
            this.restart();
        }
        
        // Check if bird has passed this pipe
        if (!this.passed && 
            this.game.bird && 
            this.pipeTop.x + this.PIPE_WIDTH < this.game.bird.x) {
            this.passed = true;
            this.game.SCORE++;
            this.game.updateScore();
        }

        this.pipeTop.move();
        this.pipeBottom.move();
    }
    restart() {
        this.pipeTop.x = this.game.GAME_WIDTH + this.PIPES_GAP - this.PIPE_WIDTH;
        this.pipeBottom.x = this.game.GAME_WIDTH + this.PIPES_GAP - this.PIPE_WIDTH;

        this.PIPE_HEIGHT = getRandomInt(20, this.game.GAME_HEIGHT - this.GAP_BETWEEN_PIPES - 20);
        this.pipeTop.height = this.PIPE_HEIGHT;
        this.pipeBottom.height = this.game.GAME_HEIGHT - this.PIPE_HEIGHT - this.GAP_BETWEEN_PIPES;
        this.pipeTop.y = 0;
        this.pipeBottom.y = this.PIPE_HEIGHT + this.GAP_BETWEEN_PIPES;
        this.pipeTop.resetStyles();
        this.pipeBottom.resetStyles();
        this.passed = false; // Reset passed flag when pipe is reused
    }
}
class Bird extends Box {
    constructor(game) {
        super(game, game.BIRD_SIZE, game.BIRD_SIZE, game.GAME_WIDTH / 5, game.GAME_HEIGHT / 2, 0, 0);
        this.GRAVITY = 0.3;
        this.JUMP = -7;

        applyStyles(this.element, {
            background: 'url(./assets/bluebird-midflap.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            left: this.x + 'px',
            top: this.y + 'px',
        });
    }
    move() {
        this.dy += this.GRAVITY;
        this.x += this.dx;
        this.y += this.dy;
        // if falling
        if (this.dy > 0) {
            applyStyles(this.element, {
                background: 'url(./assets/bluebird-downflap.png)',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            });
        }
        // if jumping
        if (this.dy < 0) {
            applyStyles(this.element, {
                background: 'url(./assets/bluebird-upflap.png)',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            });
        }
        
        applyStyles(this.element, {
            left: this.x + 'px',
            top: this.y + 'px',
        })
    }
    jump() {
        this.dy = this.JUMP;
    }
    checkWallCollision() {
        if (this.x < 0 || this.x > this.game.GAME_WIDTH - this.width || this.y < 0 || this.y > this.game.GAME_HEIGHT - this.height) {
            console.log('game over');
            this.game.gameOver();
            return true;
        }
    }

    checkCollision(pipe) {
        return (
            this.x < pipe.x + pipe.width &&
            this.x + this.width > pipe.x &&
            this.y < pipe.y + pipe.height &&
            this.y + this.height > pipe.y
        );
    }
    handleCollision(pipes) {
        if (this.checkCollision(pipes.pipeTop) || this.checkCollision(pipes.pipeBottom)) {
            console.log('collision with pipe');
            this.game.gameOver();
            return true;
        }
        return false;
    }

}


(function main() {
    const game = new Game();
    game.start();
    // game.load(10);
    // game.app.addEventListener('click', (e) => {
    //     console.log('click', e);
    //     const x = e.clientX - game.app.offsetLeft;
    //     const y = e.clientY - game.app.offsetTop;
    //     console.log('x', x, 'y', y);
    //     game.addBox(x, y);
    // });
})();
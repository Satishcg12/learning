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
        this.BOX_WIDTH = 20;
        this.BOX_HEIGHT = 20;
        this.GAME_REFRESH_RATE = 20; //ms


        applyStyles(this.app, {
            height: this.GAME_HEIGHT + 'px',
            width: this.GAME_WIDTH + 'px',
            // backgroundColor: 'pink',
            border: '1px solid black',
            position: 'relative',
        });

        this.boxes = [];
    }
    addBox(x, y) {
        let b = new Box(this, x, y);
        b.element.innerText = this.boxes.length;
        console.log('addBox', b);
        this.boxes.push(b);
    }
    load(numBoxes) {
        for (let i = 0; i < numBoxes; i++) {
            let b = new Box(this);
            b.element.innerText = i;
            this.boxes.push(b);
        }
    }
    start() {
        setInterval(() => {
            this.update();
        }, this.GAME_REFRESH_RATE);
    }
    update() {
        // console.log('update');
        for (let i = 0; i < this.boxes.length; i++) {
            for (let j = i + 1; j < this.boxes.length; j++) {
                this.boxes[i].handleCollision(this.boxes[j]);
            }
            this.boxes[i].checkWallCollision();
            this.boxes[i].move();
        }
    }
}

class Box {
    constructor(game, x=0, y=0) {
        this.game = game;
        this.colors = [
            '#cc0000',
            '#0000cc',
            '#006600',
            '#cccc00',
            '#660066',
            '#cc6600',
            '#cc3366',
            '#663300',
        ];

        // Random box size between 15 and 40 pixels
        this.width = getRandomInt(15, 40);
        this.height = getRandomInt(15, 40);

        this.dx = getRandomInt(-3, 3);
        this.dy = getRandomInt(-3, 3);
        this.x = x || getRandomInt(0, this.game.GAME_WIDTH - this.width);
        this.y = y || getRandomInt(0, this.game.GAME_HEIGHT - this.height);
        this.element = document.createElement('div');
        applyStyles(this.element, {
            width: this.width + 'px',
            height: this.height + 'px',
            backgroundColor: this.colors[Math.floor(Math.random() * this.colors.length)],
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
            this.x + this.dx > this.game.GAME_WIDTH - this.width
        ) {
            this.dx *= -1;
        }
        if (
            this.y + this.dy < 0 ||
            this.y + this.dy > this.game.GAME_HEIGHT - this.height
        ) {
            this.dy *= -1;
        }
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
        
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.GAME_WIDTH - this.width) {
            this.x = this.game.GAME_WIDTH - this.width;
        }
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.GAME_HEIGHT - this.height) {
            this.y = this.game.GAME_HEIGHT - this.height;
        }
        applyStyles(this.element, {
            left: this.x + 'px',
            top: this.y + 'px',
        });
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
    resolveOverlap(otherBox) {
        if (!this.checkCollision(otherBox)) return;

        const xOverlap = Math.min(
            this.x + this.width - otherBox.x,
            otherBox.x + otherBox.width - this.x
        );
        const yOverlap = Math.min(
            this.y + this.height - otherBox.y,
            otherBox.y + otherBox.height - this.y
        );

        if (xOverlap < yOverlap) {
            const move = xOverlap / 2;
            if (this.x < otherBox.x) {
                this.x -= move;
                otherBox.x += move;
            } else {
                this.x += move;
                otherBox.x -= move;
            }
        } else {
            const move = yOverlap / 2;
            if (this.y < otherBox.y) {
                this.y -= move;
                otherBox.y += move;
            } else {
                this.y += move;
                otherBox.y -= move;
            }
        }
        applyStyles(this.element, {
            left: this.x + 'px',
            top: this.y + 'px',
        });
        applyStyles(otherBox.element, {
            left: otherBox.x + 'px',
            top: otherBox.y + 'px',
        });
    }

}

(function main() {
    const game = new Game();
    game.start();
    game.load(10);
    game.app.addEventListener('click', (e) => {
        console.log('click', e);
        const x = e.clientX - game.app.offsetLeft;
        const y = e.clientY - game.app.offsetTop;
        console.log('x', x, 'y', y);
        game.addBox(x, y);
    });
})();
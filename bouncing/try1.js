



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
            backgroundColor: 'pink',
            border: '1px solid black',
            position: 'relative',
        });

        this.boxes = [];
        // start the game
        setInterval(() => {
            this.update();
        }, this.GAME_REFRESH_RATE);   
    }
    load(numBoxes) {
        for (let i = 0; i < numBoxes; i++) {
            let b = new Box(this);
            this.boxes.push(b);
        }
    }
    update() {
        // this.boxes.forEach(box => {
        //     box.move();
        //     box.update();
        //     this.boxes.forEach(otherBox => {
        //         if (box !== otherBox && box.checkCollision(otherBox)) {
        //             box.dx *= -1;
        //             box.dy *= -1;
        //             otherBox.dx *= -1;
        //             otherBox.dy *= -1;
        //         }
        //     });
        // });
        for (let i = 0; i < this.boxes.length; i++) {
            for (let j = i + 1; j < this.boxes.length; j++) {
                if (this.boxes[i].checkCollision(this.boxes[j])) {
                    this.boxes[i].dx *= -1;
                    this.boxes[i].dy *= -1;
                    this.boxes[j].dx *= -1;
                    this.boxes[j].dy *= -1;
                }
            }
            this.boxes[i].move();
            this.boxes[i].update();

        }
    }
    

}
class Box {
    constructor( game) {
        this.parent = game.app;
        this.game = game;
        this.height = this.game.BOX_HEIGHT;
        this.width = this.game.BOX_WIDTH;
        this.x = getRandomInt(0, this.game.GAME_WIDTH - this.width);
        this.y = getRandomInt(0, this.game.GAME_HEIGHT - this.height);
        this.dx = getRandomInt(-1, 2) || 1;
        this.dy = getRandomInt(-1, 2) || 1;

        this.element = document.createElement('div');
        applyStyles(this.element, {
            backgroundColor: 'red',
            position: 'absolute',
            transition: 'all 0.1s ease-in-out',
            height: this.height + 'px',
            width: this.width + 'px',
            top: this.y + 'px',
            left: this.x + 'px'
        });
        this.element.className = 'box';
        this.parent.appendChild(this.element);
    }

    move() {
        // check collision with the walls
        this.checkCollisionWithWalls();

        this.x += this.dx;
        this.y += this.dy;
    }
    // check collision with the walls
    checkCollisionWithWalls() {
        if (this.x < 0 || this.x + this.width > this.game.GAME_WIDTH) {
            this.dx *= -1;
        }
        if (this.y < 0 || this.y + this.height > this.game.GAME_HEIGHT) {
            this.dy *= -1;
        }
    }

    // check collision with other boxes
    checkCollision(otherBox) {
        // console.log('checkCollision', this.x, this.y, otherBox.x, otherBox.y);
        return !(
            this.x > otherBox.x + otherBox.width ||
            this.x + this.width < otherBox.x ||
            this.y > otherBox.y + otherBox.height ||
            this.y + this.height < otherBox.y
        );
    }


    update() {
        applyStyles(this.element, {
            top: this.y + 'px',
            left: this.x + 'px'
        });
    }
}

function applyStyles(element, style) {
    for (let key in style) {
        if (style.hasOwnProperty(key)) {
            element.style[key] = style[key];
        }
    }
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

(function main (){

    let g =new Game();
    g.load(50);

})()
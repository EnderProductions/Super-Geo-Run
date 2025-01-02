window.addEventListener('load',function(){
    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    let youWin = false;
    let paused = false;

    class inputHandler{
        constructor(){
            this.keys = new Set(); // Use a Set instead of an array

            window.addEventListener('keydown', e => {
                if (e.code === 'ArrowDown' || 
                    e.code === 'ArrowUp' || 
                    e.code === 'ArrowLeft' || 
                    e.code === 'ArrowRight' || 
                    e.code === 'Space') {
                    e.preventDefault();
                    this.keys.add(e.code); // Add key to the Set
                }
            });
            window.addEventListener('keyup', e => {
                if (e.code === 'ArrowDown' || 
                    e.code === 'ArrowUp' || 
                    e.code === 'ArrowLeft' || 
                    e.code === 'ArrowRight' || 
                    e.code === 'Space') {
                    this.keys.delete(e.code); // Remove key from the Set
                }
            }); 
        }
    }

    class Player{
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.x = 0;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.frameX = 0;
            this.maxFrame = 8;
            this.frameY = 0;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
        }
        draw(context){
            context.strokeStyle = 'white';
            context.strokeRect(this.x, this.y, this.width, this.height);
            context.beginPath();
            context.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0 , Math.PI * 2);
            context.stroke();
            context.strokeStyle = 'blue';
            context.beginPath();
            context.arc(this.x, this.y, this.width/2, 0 , Math.PI * 2);
            context.stroke();            
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(input, deltaTime, enemies){
            //collision detection
            enemies.forEach(enemy => {
                if (enemy.quizEnemy){
                    if (this.x < enemy.x + enemy.width &&
                        this.x + this.width > enemy.x &&
                        this.y < enemy.y + enemy.height &&
                        this.y + this.height > enemy.y) {
                        paused = true;
                        displayQuiz(); 
                    }
                }else{
                    const dx = (enemy.x + enemy.width/2) - (this.x  + this.width/2);
                    const dy = (enemy.y + enemy.height/2) - (this.y + this.height/2);
                    const distance  = Math.sqrt(dx*dx+dy*dy);
                    if (distance < enemy.width/2 + this.width/2){
                        gameOver = true;
                    }
                }
            })

            // sprite animation
            if (this.frameTimer > this.frameInterval){
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else{
                this.frameTimer += deltaTime;
            }
            console.log(input.keys);
            //controls
            if (input.keys.has('ArrowRight')) { // Use has() to check for key existence
                this.speed = 5;
            } else if (input.keys.has('ArrowLeft')) { 
                this.speed = -5;
            } else {
                this.speed = 0;
            }
            // Separate jump logic
            if ((input.keys.has('ArrowUp') || input.keys.has('Space')) && this.onGround()) { 
                this.vy = -35;
            }          
            //horizontal movement
            this.x += this.speed;
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;
            //vertical movement
            this.y += this.vy;
            if (!this.onGround()){
                this.vy += this.weight;
                this.maxFrame = 5;
                this.frameY = 1;
            }else{
                this.vy=0;
                this.maxFrame = 8;
                this.frameY = 0;
            }
            if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
        }
        onGround(){
            return this.y >= this.gameHeight - this.height;
        }
        
    }

    class Background{
        constructor(gameWidth,gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 3;
        }
        draw(context){
            context.drawImage (this.image, this.x, this.y, this.width, this.height);
            context.drawImage (this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
        update(){
            this.x -= this.speed;
            if (this.x <0 - this.width) this.x = 0;
        }
    }

    class Enemy{
        constructor(gameWidth,gameHeight, quizEnemy){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.quizEnemy = quizEnemy;
            if (quizEnemy){
                this.frameX = 0;
                this.height = gameHeight;
                this.width = 560;
                this.image  = document.getElementById('triviaImage');
                this.question = "What is the capital of Japan?";
                this.choices = ["Osaka", "Tokyo", "Osaka", "Nagasaki"];
                this.correctChoice = 1; // Index of the correct answer in the choices array
            }else{
                this.frameX = 0;
                this.height = 119;
                this.width = 160;
                this.image  = document.getElementById('enemyImage');
            }            
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.speed = 4;
            this.markedForDeletion = false;
            
        }
        draw(context){
            context.strokeStyle = 'white';
            context.strokeRect(this.x, this.y, this.width, this.height);
            context.beginPath();
            context.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0 , Math.PI * 2);
            context.stroke();
            context.strokeStyle = 'blue';
            context.beginPath();
            context.arc(this.x, this.y, this.width/2, 0 , Math.PI * 2);
            context.stroke();
            context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height,  this.x , this.y, this.width, this.height);
        }
        update(){
            this.x -= this.speed;
            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
            }
            
        }
    }

    function handleEnemies(deltaTime){
        if (enemyTimer > enemyInterval + randomEnemyInterval){
            enemies.push (new Enemy(canvas.width,canvas.height));
            randomEnemyInterval = Math.random() * 1000 + 500;
            enemyTimer = 0;
        } else{
            enemyTimer += deltaTime;
        }

        if (score ===2 && enemies.length ===0){
            enemies.push(new Enemy(canvas.width, canvas.height, true));
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update();
        });
        
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    // Create a function to display the quiz:
    function displayQuiz() {
        let quizEnemy = enemies[0]; 

        // Create a string with formatted choices
        let choicesString = "";
        for (let i = 0; i < quizEnemy.choices.length; i++) {
            choicesString += `${i+1}. ${quizEnemy.choices[i]}\n`;
        }
    
        let playerAnswer = prompt(`${quizEnemy.question}\n${choicesString}Enter the number of your answer:`);
    
        if (parseInt(playerAnswer) === quizEnemy.correctChoice + 1) { // +1 because prompt options start from 1
            enemies = enemies.filter(enemy => !enemy.markedForDeletion);
            score++;
            youWin = true;
        } else {
            gameOver = true;
        }
    }    
    function displayStatusText(context){
        context.font = '40px Helvetica';
        context.fillStyle = 'black';
        context.fillText ('Score: ' + score,  20, 50);
        context.fillStyle = 'white';
        context.fillText ('Score: ' + score,  22, 52);

        if(gameOver){
            context.textAlign = 'center';
            context.fillStyle = 'black';
            context.fillText ('GAME OVER, try again!',canvas.width/2, 200);
            context.fillStyle = 'white';
            context.fillText ('GAME OVER, try again!',canvas.width/2+2, 202);
        }
        if(youWin){
            context.textAlign = 'center';
            context.fillStyle = 'black';
            // Split the text into lines using the newline character
            const lines = 'Congrats!\nThis game is just a proof of concept.\nStay tuned for more updates'.split('\n');

            // Calculate the starting Y position to center the text block vertically
            let y = 200 - (lines.length - 1) * 40 / 2; // 20 is an estimated line height

            // Draw each line separately
            lines.forEach(line => {
                context.fillText(line, canvas.width / 2, y);
                y += 40; // Increment y for the next line
            });

            context.fillStyle = 'white';

            // Reset y to the starting position for the white text
            y = 200 - (lines.length - 1) * 40 / 2; 

            // Draw the white text with an offset
            lines.forEach(line => {
                context.fillText(line, canvas.width / 2 + 2, y + 2);
                y += 40;
            });
        }
    }

    const input = new inputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background =  new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 1200;
    let randomEnemyInterval = Math.random() * 1000 + 500;

    function animate(timeStamp) {
        if (!paused) { // Only update if not paused
            const deltaTime = timeStamp - lastTime;
            lastTime = timeStamp;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            background.draw(ctx);
            background.update();
            player.draw(ctx);
            player.update(input, deltaTime, enemies);
            handleEnemies(deltaTime);
            displayStatusText(ctx);
        } 
        
        /*if (score === 5) { 
            paused = true; // Pause when score is 5
        }*/

        if (!gameOver) {
            requestAnimationFrame(animate);
        }
    }
    animate(0);
});
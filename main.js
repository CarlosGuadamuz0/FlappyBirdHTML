window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById('app');
  const player = document.getElementById('player');
  const ground = document.getElementById('ground');
  const gameContainer = document.getElementById('game-container');
  const mainMenu = document.getElementById('main-menu');
  const gameOverScreen = document.getElementById('game-over-screen');
  const startButton = document.getElementById('start-button');
  const playAgainButton = document.getElementById('play-again-button');
  const finalScoreDisplay = document.getElementById('final-score');
  const highScoreDisplay = document.getElementById('high-score');
  const jumpButton = document.getElementById('Jump'); // Get the jump button
  let hasStarted=0

  const scoreDisplay = document.createElement('div');
  Object.assign(scoreDisplay.style, {
    position: 'absolute',
    top: '20px',
    left: '20px',
    fontSize: '3em',
    color: 'white',
    textShadow: '2px 2px 4px #000',
    zIndex: '2'
  });
  gameContainer.appendChild(scoreDisplay);

  let points = 0;
  let velocity = 0;
  let pipes = [];
  let passedPipes = [];
  let gameLoopId;
  let gravityLoopId;

  const config = {
    GRAVITY: 0.07,
    JUMP_STRENGTH: 3,
    BLOCK_SIZE: 64,
    PIPE_SIZE: 64,
    PIPE_COUNT: 5,
    PIPE_GAP_VH: 40,
    HORIZONTAL_GAP: 250,
    SPEED: 2,
    PLAYER_X: 200
  };

  function initPlayer() {
    Object.assign(player.style, {
      position: "absolute",
      top: "50vh",
      width: `${config.BLOCK_SIZE}px`,
      left: `${config.PLAYER_X}px`
    });
  }

  function createGround() {
    ground.innerHTML = '';
    const blocks = Math.ceil(window.innerWidth / config.BLOCK_SIZE);
    for (let i = 0; i < blocks; i++) {
      const grass = Object.assign(document.createElement("img"), {
        src: "grass.png",
        width: config.BLOCK_SIZE,
        alt: "Grass"
      });
      ground.appendChild(grass);
    }
  }

function createPipes() {
    pipes.forEach(pipe => pipe.remove());
    pipes = [];
    
    for (let i = 0; i < config.PIPE_COUNT; i++) {
      const randomHeight = () => Math.floor(Math.random() * (40 - 20) + 20);
      const bottomHeight = randomHeight();
      const leftPosition = window.innerWidth + 200 + i * config.HORIZONTAL_GAP;

      const createPipe = (isBottom) => {
        const pipe = document.createElement("div");
        pipe.classList.add("pipe");
        pipe.classList.add(isBottom ? "bottom" : "top");
        pipe.dataset.id = i;
        Object.assign(pipe.style, {
          width: `${config.PIPE_SIZE}px`,
          position: "absolute",
          left: `${leftPosition}px`,
          ...(isBottom ? { bottom: "0", height: `${bottomHeight}vh` } : { top: "0", height: `${100 - bottomHeight - config.PIPE_GAP_VH}vh` })
        });
        gameContainer.appendChild(pipe);
        pipes.push(pipe);
      };

      createPipe(true);
      createPipe(false);
    }
  }

  function updateScore() {
    scoreDisplay.textContent = points;
  }
  
  function movePipes() {
    pipes.forEach((pipe) => {
      let left = parseFloat(pipe.style.left);
      left -= config.SPEED;
      pipe.style.left = `${left}px`;

      const playerX = player.getBoundingClientRect().left;
      const pipeX = pipe.getBoundingClientRect().right;
      const pipeId = pipe.dataset.id;
      
      if (pipeX < playerX && !passedPipes.includes(pipeId)) {
        if (pipe.style.bottom === "0px") {
          points++;
          passedPipes.push(pipeId);
          updateScore();
        }
      }

      if (left + pipe.offsetWidth < 0) {
        const bottomHeight = Math.floor(Math.random() * (50 - 20) + 20);
        const isBottom = pipe.style.bottom === "0px";

        pipe.style.height = `${isBottom ? bottomHeight : 100 - bottomHeight - config.PIPE_GAP_VH}vh`;
        pipe.style.left = `${window.innerWidth + config.HORIZONTAL_GAP}px`;
        
        const index = passedPipes.indexOf(pipeId);
        if (index > -1) {
            passedPipes.splice(index, 1);
        }
      }
    });
    gameLoopId = requestAnimationFrame(movePipes);
  }

  function checkIfLose() {
    const playerRect = player.getBoundingClientRect();
    const groundTop = ground.getBoundingClientRect().top;

    if (playerRect.bottom >= groundTop) {
      gameOver();
      return;
    }

    for (const pipe of pipes) {
      const pipeRect = pipe.getBoundingClientRect();
      if (
        playerRect.right > pipeRect.left &&
        playerRect.left < pipeRect.right &&
        playerRect.bottom > pipeRect.top &&
        playerRect.top < pipeRect.bottom
      ) {
        gameOver();
        return;
      }
    }
  }

  function applyGravity() {
    let currentTop = parseFloat(player.style.top);
    currentTop += velocity;
    player.style.top = `${currentTop}px`;
    velocity += config.GRAVITY;

    if (currentTop < 0) {
      player.style.top = "0px";
      velocity = 0;
    }

    checkIfLose();
    gravityLoopId = requestAnimationFrame(applyGravity);
  }

  function handleJump(e) {
    if (e.code === "Space") {
      velocity = -config.JUMP_STRENGTH;
    }
  }

  function handleTouchJump() {
      velocity = -config.JUMP_STRENGTH;
  }

  function gameOver() {
    cancelAnimationFrame(gameLoopId);
    cancelAnimationFrame(gravityLoopId);
    document.removeEventListener("keydown", handleJump);
    gameContainer.removeEventListener("touchstart", handleTouchJump); // Remove touch listener
    jumpButton.removeEventListener('click', handleTouchJump); // Remove click listener

    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'block';

    finalScoreDisplay.textContent = `Score: ${points}`;
    let highScore = localStorage.getItem('highScore') || 0;
    if (points > highScore) {
      highScore = points;
      localStorage.setItem('highScore', highScore);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}`;
  }

  function startGame() {
    mainMenu.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    points = 0;
    velocity = 0;
    passedPipes = [];
    updateScore();
    initPlayer();
    createPipes();
    
    document.addEventListener("keydown", handleJump);
    gameContainer.addEventListener("touchstart", handleTouchJump);
    jumpButton.addEventListener('click', handleTouchJump); // Add click listener

    if (hasStarted===0){
      gravityLoopId = requestAnimationFrame(applyGravity);
      hasStarted=1
    }
    gameLoopId = requestAnimationFrame(movePipes);
  }

  function init() {
    mainMenu.style.display = 'block';
    gameOverScreen.style.display = 'none';
    gameContainer.style.display = 'none';
    createGround();
  }

  startButton.addEventListener('click', startGame);
  playAgainButton.addEventListener('click', startGame);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && mainMenu.style.display === 'block') {
      startGame();
    }
  });

  init();
});
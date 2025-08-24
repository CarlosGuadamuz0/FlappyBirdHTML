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
  const jumpButton = document.getElementById('Jump'); 
  let hasStarted = 0;

  const scoreDisplay = document.createElement('div');
  scoreDisplay.classList.add('score');
  Object.assign(scoreDisplay.style, {
    position: 'absolute',
    top: '20px',
    left: '20px',
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

  // Configuration values, some now calculated dynamically
  const config = {
    GRAVITY: 0.07,
    JUMP_STRENGTH: 3,
    // The following will be calculated based on the CSS variable
    PLAYER_X: 0
  };

  function getBlockSize() {
    return parseFloat(getComputedStyle(app).getPropertyValue('--block-size'));
  }

  function getPipeSize() {
    return parseFloat(getComputedStyle(app).getPropertyValue('--pipe-size'));
  }

 function getPlayerSize() {
    return parseFloat(getComputedStyle(app).getPropertyValue('--player-size'));
  }

  function getGroundSize() {
    return parseFloat(getComputedStyle(app).getPropertyValue('--ground-size'));
  }

  function initPlayer() {
    const blockSize = getPlayerSize();
    config.PLAYER_X = blockSize * 1.5;
    Object.assign(player.style, {
      position: "absolute",
      top: `50vh`,
      left: `${config.PLAYER_X}px`,
      width: `${blockSize}px`,
      height: `${blockSize}px`
    });
  }

  function createGround() {
    ground.innerHTML = '';
    const blockSize = getGroundSize();
    const blocks = Math.ceil(window.innerWidth / blockSize);
    for (let i = 0; i < blocks; i++) {
      const grass = Object.assign(document.createElement("img"), {
        src: "grass.png",
        width: 1,
        alt: "Grass"
      });
      ground.appendChild(grass);
    }
  }

  function createPipes() {
    pipes.forEach(pipe => pipe.remove());
    pipes = [];
    const blockSize = getPipeSize();
    
    // Convert to relative values
    const horizontalGap = blockSize * 6;
    const pipeSize = blockSize;
    const pipeGapVh = 40; // Still using vh for the gap for a better scaling effect
    const pipeCount = 5;

    for (let i = 0; i < pipeCount; i++) {
      const randomHeight = () => Math.floor(Math.random() * (50 - 20) + 20);
      const bottomHeight = randomHeight();
      const leftPosition = window.innerWidth + horizontalGap + i * horizontalGap;

      const createPipe = (isBottom) => {
        const pipe = document.createElement("div");
        pipe.classList.add("pipe");
        pipe.classList.add(isBottom ? "bottom" : "top");
        pipe.dataset.id = i;
        Object.assign(pipe.style, {
          width: `${pipeSize}px`,
          position: "absolute",
          left: `${leftPosition}px`,
          ...(isBottom ? { bottom: "0", height: `${bottomHeight}vh` } : { top: "0", height: `${100 - bottomHeight - pipeGapVh}vh` })
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
    const speed = getPipeSize() / 32; // Speed now depends on block size
    const horizontalGap = getBlockSize() * 1;

    pipes.forEach((pipe) => {
      let left = parseFloat(pipe.style.left);
      left -= speed;
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

        pipe.style.height = `${isBottom ? bottomHeight : 100 - bottomHeight - 40}vh`;
        pipe.style.left = `${window.innerWidth + horizontalGap}px`;
        
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
    const gravity = getPipeSize() / 800;
    currentTop += velocity;
    player.style.top = `${currentTop}px`;
    velocity += gravity;

    if (currentTop < 0) {
      player.style.top = "0px";
      velocity = 0;
    }

    checkIfLose();
    gravityLoopId = requestAnimationFrame(applyGravity);
  }

  function handleJump(e) {
    if (e.code === "Space") {
      const jumpStrength = getPipeSize() / 20;
      velocity = -jumpStrength;
    }
  }

  function handleTouchJump() {
    const jumpStrength = getPipeSize() / 20;
    velocity = -jumpStrength;
  }

  function gameOver() {
    cancelAnimationFrame(gameLoopId);
    cancelAnimationFrame(gravityLoopId);
    document.removeEventListener("keydown", handleJump);
    jumpButton.removeEventListener('click', handleTouchJump); 
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
    createGround();
    
    document.addEventListener("keydown", handleJump);
    jumpButton.addEventListener('click', handleTouchJump);
    
    // Make sure gravity only starts once
    if (hasStarted === 0) {
      gravityLoopId = requestAnimationFrame(applyGravity);
      hasStarted = 1;
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
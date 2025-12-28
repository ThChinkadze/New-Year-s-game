// ======= Константы =======
const SNOW_COUNT = 100;
const JUMP_HEIGHT = 70;
const JUMP_SPEED = 5;
const OBSTACLE_INTERVAL = 1500;
const OBSTACLE_BASE_SPEED = 5;

// ======= Элементы =======
const bgMusic = document.getElementById('bg-music'); // музыка игры
const bgLoop = document.getElementById('bg-loop');   // фоновая музыка
const playBtn = document.getElementById('play-btn');
const jumpSound = document.getElementById('jump-sound');
const hitSound = document.getElementById('hit-sound');
const clickSound = document.getElementById('click-sound');
const countdownEl = document.getElementById('countdown');
const bestScoreEl = document.getElementById('best-score');
const arcadeWrapper = document.getElementById('arcade-wrapper');

// ======= Кнопка управления музыкой =======
const musicBtn = document.createElement('img');
musicBtn.id = 'music-btn';
musicBtn.src = 'image/off-music.svg'; // изначально выключена
musicBtn.style.position = 'absolute';
musicBtn.style.bottom = '10px';
musicBtn.style.left = '10px';
musicBtn.style.width = '50px';
musicBtn.style.height = '50px';
musicBtn.style.cursor = 'pointer';
musicBtn.style.zIndex = '1000';
arcadeWrapper.appendChild(musicBtn);

let musicPlaying = false;
let musicButtonEnabled = true;

// ======= Звук клика на кнопку музыки =======
const musicClick = document.createElement('audio');
musicClick.src = 'Music/bottom-off-on.mp3';
arcadeWrapper.appendChild(musicClick);

musicClick.volume = 0.4;
musicBtn.addEventListener('click', () => {
  if (!musicButtonEnabled) return;

  musicClick.currentTime = 0;
  musicClick.play().catch(err => console.log("Ошибка воспроизведения звука кнопки:", err));

  if (!musicPlaying) {
    bgLoop.currentTime = 0;
    bgLoop.volume = 0.2;
    bgLoop.loop = true;
    bgLoop.play().catch(err => console.log("Фоновая музыка не запустилась:", err));
    musicPlaying = true;
    musicBtn.src = 'image/on-music.svg';
  } else {
    bgLoop.pause();
    musicPlaying = false;
    musicBtn.src = 'image/off-music.svg';
  }
});

// ======= Снежинки =======
function createSnowflakes() {
  for (let i = 0; i < SNOW_COUNT; i++) {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.style.left = Math.random() * window.innerWidth + 'px';
    const size = 3 + Math.random() * 4;
    snowflake.style.width = size + 'px';
    snowflake.style.height = size + 'px';
    snowflake.style.animationDuration = (5 + Math.random() * 5) + 's';
    snowflake.style.animationDelay = Math.random() * 3 + 's';
    snowflake.style.setProperty('--amplitude', (Math.random() * 6 - 3) + 'px');
    document.body.appendChild(snowflake);
  }
}
createSnowflakes();

// ======= Таймер =======
function updateCountdown() {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const diff = nextYear - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  countdownEl.textContent =
    String(days).padStart(2, '0') + ' : ' +
    String(hours).padStart(2, '0') + ' : ' +
    String(minutes).padStart(2, '0') + ' : ' +
    String(seconds).padStart(2, '0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ======= Лучший результат =======
let bestScore = localStorage.getItem('bestScore') || 0;
bestScoreEl.textContent = 'BEST:' + bestScore;

// ======= Запуск игры =======
playBtn.addEventListener('click', () => {
  clickSound.currentTime = 0;
  clickSound.volume = 0.4;
  clickSound.play();
  playBtn.style.display = 'none';

  // отключаем кнопку музыки на время игры
  musicButtonEnabled = false;
  musicBtn.style.opacity = '0.5';
  musicBtn.style.cursor = 'default';

  if (musicPlaying) bgLoop.pause();

  bgMusic.currentTime = 0;
  bgMusic.play().catch(err => console.log("Не удалось запустить музыку:", err));

  startGame();
});

function startGame() {
  const player = document.getElementById('player');
  const screen = document.getElementById('screen');
  const scoreEl = document.getElementById('score');

  let score = 0;
  let isJumping = false;
  let playerBottom = 0;
  let isInAir = false;
  let gameOver = false;
  const obstacleIntervals = [];

  // ======= Прыжок =======
  function jump() {
    if (isJumping || gameOver) return;
    isJumping = true;
    isInAir = true;
    player.classList.add('jump');
    jumpSound.currentTime = 0;
    jumpSound.play();

    let upInterval = setInterval(() => {
      playerBottom += JUMP_SPEED;
      if (playerBottom >= JUMP_HEIGHT) {
        clearInterval(upInterval);
        let downInterval = setInterval(() => {
          playerBottom -= JUMP_SPEED;
          if (playerBottom <= 0) {
            playerBottom = 0;
            clearInterval(downInterval);
            isJumping = false;
            isInAir = false;
            player.classList.remove('jump');
          }
          player.style.bottom = playerBottom + 'px';
        }, 20);
      }
      player.style.bottom = playerBottom + 'px';
    }, 20);
  }

  const jumpHandler = e => { if (e.code === 'Space' && !e.repeat) jump(); };
  document.addEventListener('keydown', jumpHandler);

  // ======= Создание препятствий =======
  function createObstacle() {
    if (gameOver) return;
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    obstacle.style.left = screen.offsetWidth + 'px';
    screen.appendChild(obstacle);

    const moveInterval = setInterval(() => {
      if (gameOver) {
        clearInterval(moveInterval);
        obstacle.remove();
        return;
      }

      let obstacleLeft = parseInt(obstacle.style.left);
      const speed = OBSTACLE_BASE_SPEED + Math.floor(score / 5);
      obstacleLeft -= speed;
      obstacle.style.left = obstacleLeft + 'px';

      // ======= Проверка столкновения =======
      if (!isInAir && obstacleLeft < 50 + 16 && obstacleLeft + 16 > 50) {
        gameOver = true;
        hitSound.currentTime = 0;
        hitSound.play();
        bgMusic.pause();
        bgMusic.currentTime = 0;
        player.classList.add('dead');
        document.removeEventListener('keydown', jumpHandler);
        obstacleIntervals.forEach(interval => clearInterval(interval));

        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem('bestScore', bestScore);
          bestScoreEl.textContent = 'BEST:' + bestScore;
        }

        setTimeout(() => {
          alert("Game Over! Score: " + score);

          // Возобновляем фон после Game Over, если музыка включена
          if (musicPlaying) {
            bgLoop.currentTime = 0;
            bgLoop.play().catch(err => console.log("Фоновая музыка не запустилась после Game Over:", err));
          }

          location.reload();
        }, 1000);
      }

      // ======= Удаление пройденного препятствия =======
      if (obstacleLeft < -16) {
        obstacle.remove();
        clearInterval(moveInterval);
        score++;
        scoreEl.textContent = score;
      }
    }, 20);

    obstacleIntervals.push(moveInterval);
  }

  const obstacleCreationInterval = setInterval(() => {
    if (!gameOver) createObstacle();
    else clearInterval(obstacleCreationInterval);
  }, OBSTACLE_INTERVAL);
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

const controls = document.getElementById("controls");
const numberOfWinnersInput = document.getElementById("numberOfWinners");
const startButton = document.getElementById("startButton");
const messageDiv = document.getElementById("message");
const statusDiv = document.getElementById("status");
const resetButton = document.getElementById("resetButton");

let numberOfWinners = 1;
let users = [];
let activeTouches = {};
let touchPickGo = false;
const touchRadius = 1.8 * window.devicePixelRatio * 16; // 1.8cm in pixels
const colors = [
  "red",
  "green",
  "blue",
  "orange",
  "purple",
  "cyan",
  "magenta",
  "yellow",
  "lime",
  "pink",
  "teal",
  "brown",
  "navy",
  "maroon",
  "olive",
  "gray",
  "coral",
  "turquoise",
  "violet",
  "gold",
];
let colorIndex = 0;
let countdownInterval = null;
let countdownValue = 0;

let confettiParticles = [];
let confettiActive = false;

startButton.addEventListener("click", () => {
  const value = numberOfWinnersInput.value;
  if (isNaN(value) || value < 1 || value > 20) {
    alert("숫자만 입력 가능합니다.");
    return;
  }
  numberOfWinners = parseInt(value, 10);
  statusDiv.textContent = `${numberOfWinners}명 뽑기`;
  controls.style.display = "none";
  messageDiv.style.display = "block";
  resetButton.style.display = "block";
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 10000);

  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
});

resetButton.addEventListener("click", () => {
  users = [];
  clearInterval(countdownInterval);
  countdownInterval = null;
  confettiActive = false;
  confettiParticles = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  controls.style.display = "flex";
  statusDiv.textContent = "";
  resetButton.style.display = "none";

  canvas.removeEventListener("touchstart", handleTouchStart);
  canvas.removeEventListener("touchmove", handleTouchMove);
  canvas.removeEventListener("touchend", handleTouchEnd);
});

function getNextColor() {
  const color = colors[colorIndex % colors.length];
  colorIndex++;
  return color;
}

function drawCircle(x, y, radius, color, border = false, borderWidth = 2) {
  ctx.globalCompositeOperation = "destination-over";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (border) {
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

function clearCircle(x, y, radius) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function handleTouchStart(event) {
  messageDiv.style.display = "none";
  for (let touch of event.changedTouches) {
    const color = getNextColor();
    activeTouches[touch.identifier] = {
      x: touch.clientX,
      y: touch.clientY,

      color,
      startTime: Date.now(),
      pulseRadius: touchRadius,
    };
    drawCircle(touch.clientX, touch.clientY, touchRadius, color);
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    users.forEach((user) => {
      drawCircle(user.x, user.y, touchRadius, user.color, true);
    });
  }
}

function handleTouchMove(event) {
  event.preventDefault(); // Prevent scrolling
}

function handleTouchEnd(event) {
  for (let touch of event.changedTouches) {
    const touchData = activeTouches[touch.identifier];
    if (touchData) {
      const duration = Date.now() - touchData.startTime;
      if (duration >= 3000) {
        users.push(touchData);
        drawCircle(
          touchData.x,
          touchData.y,
          touchRadius,
          touchData.color,
          true
        );
      } else {
        // clearCircle(touchData.x, touchData.y, touchRadius);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        users.forEach((user) => {
          drawCircle(user.x, user.y, touchRadius, user.color, true);
        });
      }
      delete activeTouches[touch.identifier];
    }
  }
  startCountdown();
}

function startCountdown() {
  if (users.length === 0 || users.length <= numberOfWinners) {
    return;
  }

  countdownValue = 5;
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownInterval = setInterval(() => {
    if (countdownValue > 0) {
      displayCountdown(countdownValue);
      countdownValue--;
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      pickWinners();
    }
  }, 1000);
}

function displayCountdown(value) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  users.forEach((user) => {
    drawCircle(user.x, user.y, touchRadius, user.color, true);
  });
  ctx.fillStyle = "black";
  ctx.font = "48px serif";
  ctx.textAlign = "center";
  ctx.fillText(value, canvas.width / 2, canvas.height / 2);
}

function pickWinners() {
  if (users.length > 0 && users.length > numberOfWinners) {
    const winners = [];
    for (let i = 0; i < numberOfWinners; i++) {
      const winnerIndex = Math.floor(Math.random() * users.length);
      winners.push(users[winnerIndex]);
      users.splice(winnerIndex, 1);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    winners.forEach((winner) => {
      drawCircle(winner.x, winner.y, touchRadius, winner.color, true, 4);
    });
    statusDiv.textContent = "";
    startConfetti();
  }
}

function startConfetti() {
  confettiParticles = [];
  confettiActive = true;
  for (let i = 0; i < 300; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: Math.random() * 10 + 5,
      height: Math.random() * 20 + 10,
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 360,
    });
  }
  setTimeout(() => {
    confettiActive = false;
    resetButton.style.display = "block";
  }, 5000);
  requestAnimationFrame(updateConfetti);
}

function updateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  if (confettiActive) {
    confettiParticles.forEach((particle) => {
      particle.y += particle.speed;
      particle.angle += particle.speed;
      if (particle.y > confettiCanvas.height) {
        particle.y = -particle.height;
      }
      confettiCtx.save();
      confettiCtx.translate(particle.x, particle.y);
      confettiCtx.rotate((particle.angle * Math.PI) / 180);
      confettiCtx.fillStyle = particle.color;
      confettiCtx.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );
      confettiCtx.restore();
    });
    requestAnimationFrame(updateConfetti);
  }
}

function updatePulse() {
  const currentTime = Date.now();
  for (let id in activeTouches) {
    const touchData = activeTouches[id];
    const duration = currentTime - touchData.startTime;
    if (duration < 3000) {
      const pulseProgress = duration / 3000;
      const currentPulseRadius = touchRadius * (1 - pulseProgress);
      clearCircle(touchData.x, touchData.y, touchRadius);
      drawCircle(touchData.x, touchData.y, touchRadius, touchData.color);
      ctx.beginPath();
      ctx.arc(touchData.x, touchData.y, currentPulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = touchData.color;
      ctx.stroke();
    } else {
      clearCircle(touchData.x, touchData.y, touchRadius);
      drawCircle(touchData.x, touchData.y, touchRadius, touchData.color, true);
    }
  }
  requestAnimationFrame(updatePulse);
}

updatePulse();

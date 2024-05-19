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
const touchRadius = 1 * window.devicePixelRatio * 16; // 1.8cm in pixels
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
let confettiEndTimeout = null;

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
  if (confettiEndTimeout) {
    clearTimeout(confettiEndTimeout);
  }
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

function drawCircle(x, y, radius, color, border = false, borderWidth = 4) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (border) {
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
  ctx.restore();
}

function clearCircle(x, y, radius) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
      radius: touchRadius,
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
  requestAnimationFrame(updatePulse);
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        users.forEach((user) => {
          drawCircle(user.x, user.y, touchRadius, user.color, true);
        });
      }
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        users.forEach((user) => {
          drawCircle(user.x, user.y, touchRadius, user.color, true);
        });
      }, 500);
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
    confettiEndTimeout = setTimeout(() => {
      confettiActive = false;
      resetButton.style.display = "block";
    }, 5000);

    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleTouchEnd);

    requestAnimationFrame(updateConfetti);
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
    confettiEndTimeout = setTimeout(() => {
      confettiActive = false;
      resetButton.style.display = "block";
    }, 5000);
    requestAnimationFrame(updateConfetti);
  }, 5000);
}

function updateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  if (confettiActive || confettiParticles.length > 0) {
    confettiParticles.forEach((particle, index) => {
      particle.y += particle.speed;
      particle.angle += particle.speed;
      if (particle.y > confettiCanvas.height) {
        confettiParticles.splice(index, 1); // 화면 아래로 떨어진 종이가루 삭제
      } else {
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
      }
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
      const currentRadius = touchData.radius + pulseProgress * 10; // 크기 증가
      const colorIndex = Math.floor(pulseProgress * colors.length);
      const currentColor = colors[colorIndex % colors.length]; // 색상 변화

      clearCircle(touchData.x, touchData.y, touchData.radius + 10);
      drawCircle(touchData.x, touchData.y, currentRadius, currentColor);
    } else {
      clearCircle(touchData.x, touchData.y, touchData.radius + 10);
      drawCircle(
        touchData.x,
        touchData.y,
        touchData.radius,
        touchData.color,
        true
      );
    }
  }
  requestAnimationFrame(updatePulse);
}

updatePulse();

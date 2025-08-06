import { gsap } from "gsap";

// Create container for particles once
const particlesContainer = document.createElement("div");
particlesContainer.id = "particles";
Object.assign(particlesContainer.style, {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  pointerEvents: "none",
  overflow: "hidden",
  zIndex: "9999",
});
document.body.appendChild(particlesContainer);

// Pre-create a pool of glitter divs (for reuse)
const GLITTER_POOL_SIZE = 100;
const glitterPool = [];
let poolIndex = 0;

for (let i = 0; i < GLITTER_POOL_SIZE; i++) {
  const glitter = document.createElement("div");
  Object.assign(glitter.style, {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  particlesContainer.appendChild(glitter);
  glitterPool.push(glitter);
}

// Glitter colors
const colors = [
  "#E03C31", // Red
  "#FFD400", // Yellow
  "#0046AD", // Blue
  "#000000", // Black
  "#FFFFFF", // White
  "#AAAAAA", // Gray
];

// Throttle with `requestAnimationFrame`
let lastTime = 0;

document.addEventListener("mousemove", (e) => {
  const now = performance.now();
  if (now - lastTime < 30) return; // limit to ~33fps
  lastTime = now;

  if (Math.random() > 0.4) return; // ~40% chance to show

  const glitter = glitterPool[poolIndex];
  poolIndex = (poolIndex + 1) % GLITTER_POOL_SIZE;

  const color = colors[(Math.random() * colors.length) | 0];
  const size = Math.random() * 20 + 10;
  const offsetX = Math.random() * 30 - 15;
  const offsetY = Math.random() * 30 - 15;
  const x = e.clientX + offsetX;
  const y = e.clientY + offsetY;

  // Apply styles directly
  Object.assign(glitter.style, {
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    opacity: 1,
    transform: "none",
  });

  // Animate with GSAP
  gsap.to(glitter, {
    duration: 1.8,
    y: "+=60",
    rotation: Math.random() * 180 + 90,
    scale: 0,
    opacity: 0,
    ease: "power1.out",
    overwrite: true,
  });
});

import { gsap } from "gsap";

document.addEventListener("mousemove", (e) => {
  // Throttle glitter creation
  if (Math.random() < 0.4) {
    const glitter = document.createElement("div");

    const colors = [
      "#E03C31", // Red
      "#FFD400", // Yellow
      "#0046AD", // Blue
      "#000000", // Black
      "#FFFFFF", // White
      "#AAAAAA", // Gray
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const size = Math.random() * 20 + 10;
    const x = e.clientX + (Math.random() * 30 - 15);
    const y = e.clientY + (Math.random() * 30 - 15);

    Object.assign(glitter.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "9999",
    });

    document.body.appendChild(glitter);

    // Animate with GSAP
    gsap.to(glitter, {
      duration: 1.8,
      y: "+=60", // fall
      rotation: Math.random() * 180 + 90,
      scale: 0,
      opacity: 0,
      ease: "power1.out",
      onComplete: () => glitter.remove(),
    });
  }
});

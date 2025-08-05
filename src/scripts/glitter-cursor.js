document.addEventListener("mousemove", (e) => {
  if (Math.random() < 0.4) {
    const glitter = document.createElement("div");
    const colors = [
      "#ff69b4",
      "#ff1493",
      "#da70d6",
      "#ba55d3",
      "#9932cc",
      "#8b008b",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    glitter.style.position = "fixed";
    glitter.style.left = e.clientX + Math.random() * 30 - 15 + "px";
    glitter.style.top = e.clientY + Math.random() * 30 - 15 + "px";
    glitter.style.width = Math.random() * 4 + 2 + "px";
    glitter.style.height = glitter.style.width;
    glitter.style.background = color;
    glitter.style.borderRadius = "50%";
    glitter.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px ${color}`;
    glitter.style.pointerEvents = "none";
    glitter.style.zIndex = "9999";

    // Animation variables with slower physics
    let startY = e.clientY + Math.random() * 30 - 15;
    let currentY = startY;
    let velocity = Math.random() * 0.5 + 0.2; // Much slower initial velocity
    let opacity = 1;
    let rotation = 0;
    let scale = 1;

    const animate = () => {
      currentY += velocity;
      velocity += 0.02; // Much gentler gravity
      opacity -= 0.008; // Slower fade
      rotation += 2; // Slower rotation
      scale -= 0.003; // Slower shrinking

      glitter.style.top = currentY + "px";
      glitter.style.opacity = opacity;
      glitter.style.transform = `rotate(${rotation}deg) scale(${scale})`;

      if (opacity > 0 && scale > 0) {
        requestAnimationFrame(animate);
      } else {
        glitter.remove();
      }
    };

    document.body.appendChild(glitter);
    requestAnimationFrame(animate);
  }
});

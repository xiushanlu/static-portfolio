// ========================================
// CUSTOM ANIMATED CURSOR
// ========================================

const cursorEl = document.querySelector('.cursor');
const cursorInner = document.querySelector('.cursor__inner');

let cursorMouseX = 0;
let cursorMouseY = 0;
let cursorX = 0;
let cursorY = 0;
let isHovering = false;
let rafId = null;
let lastTrailTime = 0;
const trailDelay = 30; // ms between trail particles

// Track mouse position
document.addEventListener('mousemove', (e) => {
    cursorMouseX = e.clientX;
    cursorMouseY = e.clientY;
});

// Hover detection for interactive elements
document.addEventListener('mouseover', (e) => {
    if (e.target.matches('a, button, input, [role="button"]')) {
        isHovering = true;
        cursorEl.classList.add('cursor--hover');
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.matches('a, button, input, [role="button"]')) {
        isHovering = false;
        cursorEl.classList.remove('cursor--hover');
    }
});

function animateCursor() {
    // Lerp cursor to mouse position (smooth following)
    const lerpFactor = isHovering ? 0.15 : 0.2;
    cursorX += (cursorMouseX - cursorX) * lerpFactor;
    cursorY += (cursorMouseY - cursorY) * lerpFactor;
    
    // Apply transform with GPU acceleration
    cursorEl.style.transform = `translate(${cursorX}px, ${cursorY}px) translateZ(0)`;
    
    // Create trail particles (only on non-hover for performance)
    if (!isHovering && Date.now() - lastTrailTime > trailDelay) {
        createTrail(cursorX + 10, cursorY + 10); // offset to center
        lastTrailTime = Date.now();
    }
    
    rafId = requestAnimationFrame(animateCursor);
}

function createTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'cursor__trail';
    
    const size = Math.random() * 6 + 3; // 3-9px
    const tx = (Math.random() - 0.5) * 40; // Random offset
    const ty = (Math.random() - 0.5) * 40;
    
    trail.style.width = size + 'px';
    trail.style.height = size + 'px';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    trail.style.setProperty('--tx', tx + 'px');
    trail.style.setProperty('--ty', ty + 'px');
    
    document.body.appendChild(trail);
    
    // Remove after animation completes
    setTimeout(() => trail.remove(), 600);
}

// Start animation loop
animateCursor();

// Hide cursor on touch/mobile
let isTouchDevice = false;
document.addEventListener('touchstart', () => {
    isTouchDevice = true;
    cursorEl.style.display = 'none';
    cancelAnimationFrame(rafId);
}, { once: true });

// Restore on mouse move (in case user switches from touch)
document.addEventListener('mousemove', () => {
    if (isTouchDevice) return;
    cursorEl.style.display = 'block';
    if (!rafId) animateCursor();
});

import * as THREE from 'https://esm.sh/three@r128';
import { GLTFLoader } from 'https://esm.sh/three@r128/examples/jsm/loaders/GLTFLoader.js';

// ========================================
// THREE.JS SETUP - Hero 3D Background
// ========================================

const heroSection = document.getElementById('hero');
const heroContainer = document.getElementById('hero-3d-background');

console.log('Hero container dimensions:', heroContainer.clientWidth, 'x', heroContainer.clientHeight);
console.log('Hero container element:', heroContainer);

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = null; // Transparent so other content shows

const camera = new THREE.PerspectiveCamera(
    60,
    heroContainer.clientWidth / heroContainer.clientHeight,
    0.1,
    1000
);
camera.position.set(0, -1, 5);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Plane in front of the camera Z=0 in world space
const lightPlaneZ = 0;
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -lightPlaneZ);
const lightTarget = new THREE.Vector3();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(heroContainer.clientWidth, heroContainer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.domElement.style.display = 'block';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
heroContainer.appendChild(renderer.domElement);

console.log('Renderer canvas created and appended');
console.log('Renderer canvas dimensions:', renderer.domElement.width, 'x', renderer.domElement.height);

// ========================================
// LIGHTING SETUP
// ========================================

// MAIN light: nice soft front key light
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(2, 4, 5);
mainLight.castShadow = false;
scene.add(mainLight);

// SECONDARY light: point light that follows cursor
const cursorLight = new THREE.PointLight(
  0xffffff, 
  3,    // lower intensity  
  50,      // bigger radius
  0.1      // softer falloff
);
cursorLight.position.set(0, 2, 3);
scene.add(cursorLight);

// Optional tiny ambient so shadows aren't pitch black
const ambient = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambient);

// ========================================
// GLB LOADER - Load hero.glb character model
// ========================================

const loader = new GLTFLoader();
let heroModel = null;
let pupilsMesh = null;
let basePupilPosition = new THREE.Vector3();

loader.load('./models/hero.glb', (gltf) => {
    heroModel = gltf.scene;

    heroModel.traverse((node) => {
        if (node.isMesh) {
            console.log('MESH:', node.name, 'PARENT:', node.parent && node.parent.name);
        }
    });

    heroModel.rotation.set(0, -Math.PI / 2, 0);
    heroModel.scale.set(0.8, 0.8, -0.8);  
    heroModel.position.set(0, -0.5, 0);

    heroModel.traverse((node) => {
        if (!node.isMesh) return;

        // Find pupils for eye tracking
        if (node.name === 'pupils') {
            pupilsMesh = node;
            basePupilPosition.copy(node.position);
            console.log('✓ Pupils mesh found!', pupilsMesh);
        }

        // Make keyboard, stylus, and mouse white by name
        if (node.parent && (node.parent.name === 'Corsair_Keyboard' || node.parent.name === 'Cube041' || node.parent.name === 'Black_Mouse' || node.parent.name === 'Digital_Pen_Display_Stylus002')) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((m) => {
                if (!m) return;
                m.color.set(0x000000);
                m.metalness = 0.3;
                m.roughness = 0.5;
                if (node.parent && (node.parent.name === "Corsair_Keyboard" || node.parent.name === "Cube041")){
                    m.metalness = 0.1;
                    m.roughness = 0.9;
                }
            });
        }

    });

    scene.add(heroModel);
    console.log('Hero model loaded and scaled');
});

// ========================================
// MOUSE TRACKING & PARALLAX SETUP
// ========================================

let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (event) => {
  const rect = heroContainer.getBoundingClientRect();

  // Mouse position relative to the hero canvas
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  mouse.x = (x / rect.width) * 2 - 1;
  mouse.y = - (y / rect.height) * 2 + 1;
  
  // Also store for cursor light
  mouseX = mouse.x;
  mouseY = mouse.y;
});

function animate() {
    requestAnimationFrame(animate);

    if (heroModel) {
        const baseY = -0.5;
        heroModel.position.x = mouse.x * 0.23;    // 0.15 * 1.5
        heroModel.position.y = baseY + mouse.y * 0.15;  // 0.10 * 1.5
        }

        if (pupilsMesh) {
        const maxOffsetX = 0.05;  // 0.025 * 1.5
        const maxOffsetY = 0.025;
        pupilsMesh.position.z = (basePupilPosition.z - mouse.x * maxOffsetX) * -1;
        pupilsMesh.position.y = basePupilPosition.y + mouse.y * maxOffsetY;   // + for up/down
        }

    // Cursor-following point light with smoothing (lerp)
    const lightTargetX = mouseX * 2;
    const lightTargetY = mouseY * 2;
    const lightTargetZ = 3;

    // DIRECT follow (no smoothing yet)
    // TEMP: direct follow, no smoothing
const lightDepth = 500;  // distance from camera
// Cast a ray from camera through the mouse and intersect with the plane
raycaster.setFromCamera(mouse, camera);
raycaster.ray.intersectPlane(plane, lightTarget);

// Move light directly to that 3D point
cursorLight.position.copy(lightTarget);

    renderer.render(scene, camera);
}
animate();

// ========================================
// RESPONSIVE - Handle window resize
// ========================================

window.addEventListener('resize', () => {
    const width = heroContainer.clientWidth;
    const height = heroContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

// ========================================
// CUSTOM ANIMATED CURSOR
// ========================================

const cursorEl = document.querySelector('.cursor');
const cursorOuterEl = document.querySelector('.cursor__outer');
const cursorInnerEl = document.querySelector('.cursor__inner');

let cursorMouseX = 0;
let cursorMouseY = 0;
let cursorX = 0;
let cursorY = 0;
let isHovering = false;
let lastTrailTime = 0;
const trailDelay = 30; // ms between particles

// Update mouse position for cursor
document.addEventListener('mousemove', (e) => {
    cursorMouseX = e.clientX;
    cursorMouseY = e.clientY;
});

// Hover detection
const hoverElements = document.querySelectorAll('a, button, [role="button"]');

hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        isHovering = true;
        cursorEl.classList.add('cursor--hover');
    });
    
    el.addEventListener('mouseleave', () => {
        isHovering = false;
        cursorEl.classList.remove('cursor--hover');
    });
});

// RAF animation loop for smooth cursor movement
let rafId;

function animateCursor() {
    // Lerp cursor to mouse position (smooth following)
    const lerpFactor = isHovering ? 0.5 : 0.8;
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

// ========================================
// MOBILE HAMBURGER MENU
// ========================================

const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

// Show hamburger on mobile
function updateNavForMobile() {
    if (window.innerWidth <= 825) {
        navToggle.style.display = 'block';
        navMenu.classList.remove('nav-open');
    } else {
        navToggle.style.display = 'none';
        navMenu.classList.remove('nav-open');
    }
}

// Toggle menu on hamburger click and change icon
navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('nav-open');
    navToggle.textContent = isOpen ? '✕' : '☰';
});

// Close menu when a link is clicked
const navLinks = navMenu.querySelectorAll('a, button');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('nav-open');
        navToggle.textContent = '☰';
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav')) {
        navMenu.classList.remove('nav-open');
        navToggle.textContent = '☰';
    }
});

// Update on window resize
window.addEventListener('resize', updateNavForMobile);

// Initial call
updateNavForMobile();

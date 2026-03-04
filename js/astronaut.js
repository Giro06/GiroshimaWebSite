// ========================================
// Astronaut Buddy – Chases the mouse cursor
// ========================================

(function () {
    // --- Create astronaut element ---
    const astro = document.createElement('div');
    astro.id = 'astro-buddy';
    astro.setAttribute('aria-hidden', 'true');
    astro.innerHTML = `<svg viewBox="0 0 120 160" width="60" height="80" class="astro-svg">
  <!-- Backpack -->
  <rect x="20" y="42" width="16" height="30" rx="4" fill="#556" stroke="#778" stroke-width="1.5"/>
  <rect x="84" y="42" width="16" height="30" rx="4" fill="#556" stroke="#778" stroke-width="1.5"/>

  <!-- Body -->
  <rect x="30" y="40" width="60" height="50" rx="12" fill="#dde" stroke="#bbc" stroke-width="2"/>

  <!-- Belt -->
  <rect x="30" y="72" width="60" height="8" rx="3" fill="#e94560"/>

  <!-- Legs -->
  <rect x="38" y="88" width="16" height="30" rx="8" fill="#ccd" stroke="#bbc" stroke-width="1.5"/>
  <rect x="66" y="88" width="16" height="30" rx="8" fill="#ccd" stroke="#bbc" stroke-width="1.5"/>

  <!-- Boots -->
  <ellipse cx="46" cy="120" rx="12" ry="7" fill="#556" stroke="#445" stroke-width="1.5"/>
  <ellipse cx="74" cy="120" rx="12" ry="7" fill="#556" stroke="#445" stroke-width="1.5"/>

  <!-- Arms -->
  <g class="astro-left-arm">
    <rect x="14" y="46" width="18" height="12" rx="6" fill="#ccd" stroke="#bbc" stroke-width="1.5"/>
    <circle cx="14" cy="52" r="6" fill="#dde" stroke="#bbc" stroke-width="1.5"/>
  </g>
  <g class="astro-right-arm">
    <rect x="88" y="46" width="18" height="12" rx="6" fill="#ccd" stroke="#bbc" stroke-width="1.5"/>
    <circle cx="106" cy="52" r="6" fill="#dde" stroke="#bbc" stroke-width="1.5"/>
  </g>

  <!-- Helmet -->
  <ellipse cx="60" cy="28" rx="28" ry="26" fill="#eef" stroke="#bbc" stroke-width="2"/>

  <!-- Visor -->
  <ellipse cx="60" cy="30" rx="20" ry="16" fill="#1a1a3e" stroke="#0f3460" stroke-width="1.5"/>

  <!-- Visor shine -->
  <ellipse cx="52" cy="24" rx="6" ry="4" fill="rgba(255,255,255,0.2)" transform="rotate(-15 52 24)"/>

  <!-- Eyes -->
  <circle class="astro-eye-l" cx="52" cy="30" r="3.5" fill="#e94560"/>
  <circle class="astro-eye-r" cx="68" cy="30" r="3.5" fill="#e94560"/>

  <!-- Antenna -->
  <line x1="60" y1="4" x2="60" y2="14" stroke="#bbc" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="4" r="4" fill="#e94560" class="astro-antenna"/>
</svg>
<div class="astro-emote"></div>`;

    document.body.appendChild(astro);

    // --- State ---
    const state = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: 0,
        vy: 0,
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        mode: 'chase',       // 'chase' | 'wander' | 'celebrate'
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        celebrateTimer: 0,
        caughtCount: 0,
        mouseMovedAt: Date.now(),
        facingLeft: false,
    };

    const CHASE_SPEED = 2.2;
    const WANDER_SPEED = 1.0;
    const CATCH_RADIUS = 40;
    const FRICTION = 0.92;

    // --- Mouse tracking (viewport coords for position:fixed) ---
    window.addEventListener('mousemove', (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
        state.mouseMovedAt = Date.now();

        if (state.mode === 'wander') {
            state.mode = 'chase';
            showEmote('!');
        }
    });

    // --- Emote bubble ---
    const emoteEl = astro.querySelector('.astro-emote');
    let emoteTimeout;

    function showEmote(text) {
        emoteEl.textContent = text;
        emoteEl.classList.add('show');
        clearTimeout(emoteTimeout);
        emoteTimeout = setTimeout(() => {
            emoteEl.classList.remove('show');
        }, 1200);
    }

    // --- Eyes follow mouse ---
    function updateEyes() {
        const eyeL = astro.querySelector('.astro-eye-l');
        const eyeR = astro.querySelector('.astro-eye-r');
        if (!eyeL || !eyeR) return;

        const dx = state.mouseX - state.x;
        const dy = state.mouseY - state.y;
        const angle = Math.atan2(dy, dx);
        const offset = 2;

        const ox = Math.cos(angle) * offset;
        const oy = Math.sin(angle) * offset;

        eyeL.setAttribute('cx', 52 + ox);
        eyeL.setAttribute('cy', 30 + oy);
        eyeR.setAttribute('cx', 68 + ox);
        eyeR.setAttribute('cy', 30 + oy);
    }

    // --- Main loop ---
    function update() {
        const dx = state.mouseX - state.x;
        const dy = state.mouseY - state.y;
        const dist = Math.hypot(dx, dy);

        if (state.mode === 'celebrate') {
            state.celebrateTimer--;
            state.vx *= 0.9;
            state.vy *= 0.9;

            if (state.celebrateTimer <= 0) {
                state.mode = 'wander';
                state.wanderTimer = 120 + Math.random() * 180;
                state.wanderAngle = Math.random() * Math.PI * 2;
                showEmote('~');
            }
        } else if (state.mode === 'chase') {
            if (dist > CATCH_RADIUS) {
                const ax = (dx / dist) * CHASE_SPEED;
                const ay = (dy / dist) * CHASE_SPEED;
                state.vx += ax * 0.08;
                state.vy += ay * 0.08;
            } else {
                // Caught the mouse!
                state.mode = 'celebrate';
                state.celebrateTimer = 60;
                state.caughtCount++;
                const emotes = ['^^', ':D', '<3', '!!', 'hehe'];
                showEmote(emotes[state.caughtCount % emotes.length]);
            }
        } else if (state.mode === 'wander') {
            state.wanderTimer--;

            // Change direction occasionally
            if (state.wanderTimer <= 0) {
                state.wanderAngle = Math.random() * Math.PI * 2;
                state.wanderTimer = 100 + Math.random() * 200;
            }

            state.vx += Math.cos(state.wanderAngle) * WANDER_SPEED * 0.05;
            state.vy += Math.sin(state.wanderAngle) * WANDER_SPEED * 0.05;

            // If mouse hasn't moved for 3s, keep wandering
            if (Date.now() - state.mouseMovedAt > 3000) {
                // still wandering
            }
        }

        // Apply friction
        state.vx *= FRICTION;
        state.vy *= FRICTION;

        // Update position
        state.x += state.vx;
        state.y += state.vy;

        // Viewport boundaries (fixed positioning)
        const pageW = window.innerWidth;
        const pageH = window.innerHeight;

        if (state.x < 30) { state.x = 30; state.vx *= -0.5; state.wanderAngle = Math.random() * Math.PI * 2; }
        if (state.x > pageW - 30) { state.x = pageW - 30; state.vx *= -0.5; state.wanderAngle = Math.random() * Math.PI * 2; }
        if (state.y < 40) { state.y = 40; state.vy *= -0.5; state.wanderAngle = Math.random() * Math.PI * 2; }
        if (state.y > pageH - 40) { state.y = pageH - 40; state.vy *= -0.5; state.wanderAngle = Math.random() * Math.PI * 2; }

        // Facing direction
        if (Math.abs(state.vx) > 0.1) {
            state.facingLeft = state.vx < 0;
        }

        // Apply transform
        const scaleX = state.facingLeft ? -1 : 1;
        const bobY = Math.sin(Date.now() * 0.003) * 3;
        const tilt = state.vx * 2;

        astro.style.transform = `translate(${state.x - 30}px, ${state.y - 40 + bobY}px) scaleX(${scaleX}) rotate(${tilt}deg)`;

        // Celebrate spin
        if (state.mode === 'celebrate') {
            astro.classList.add('celebrating');
        } else {
            astro.classList.remove('celebrating');
        }

        // Running animation speed
        const speed = Math.hypot(state.vx, state.vy);
        astro.style.setProperty('--run-speed', Math.max(0.3, 1.2 - speed * 0.15) + 's');

        updateEyes();
        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
})();

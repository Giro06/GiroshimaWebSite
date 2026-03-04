// ========================================
// Space Cats – Run away from the mouse!
// ========================================

(function () {
    const CAT_COUNT = 3;
    const FLEE_RADIUS = 180;
    const FLEE_SPEED = 3.0;
    const FRICTION = 0.93;
    const CATCH_RADIUS = 35;
    const ANGRY_DURATION = 90;

    const CAT_COLORS = [
        { body: '#f4a261', dark: '#e76f51', ear: '#e76f51', nose: '#d62828' },
        { body: '#a8a4ce', dark: '#6c6799', ear: '#6c6799', nose: '#e94560' },
        { body: '#7ec8a0', dark: '#4a9e6e', ear: '#4a9e6e', nose: '#e94560' },
    ];

    function createCatSVG(colors) {
        return `<svg viewBox="0 0 100 100" width="44" height="44" class="cat-svg">
  <!-- Tail -->
  <path class="cat-tail" d="M12,65 Q0,50 8,38 Q14,30 20,38" fill="none" stroke="${colors.body}" stroke-width="4" stroke-linecap="round"/>

  <!-- Body -->
  <ellipse cx="50" cy="68" rx="24" ry="18" fill="${colors.body}" stroke="${colors.dark}" stroke-width="1.5"/>

  <!-- Back legs -->
  <ellipse cx="34" cy="82" rx="8" ry="5" fill="${colors.dark}"/>
  <ellipse cx="66" cy="82" rx="8" ry="5" fill="${colors.dark}"/>

  <!-- Front legs -->
  <rect x="40" y="78" width="7" height="12" rx="3.5" fill="${colors.body}" stroke="${colors.dark}" stroke-width="1"/>
  <rect x="54" y="78" width="7" height="12" rx="3.5" fill="${colors.body}" stroke="${colors.dark}" stroke-width="1"/>

  <!-- Paws -->
  <ellipse cx="43.5" cy="91" rx="5" ry="3" fill="${colors.dark}"/>
  <ellipse cx="57.5" cy="91" rx="5" ry="3" fill="${colors.dark}"/>

  <!-- Head -->
  <circle cx="50" cy="42" r="18" fill="${colors.body}" stroke="${colors.dark}" stroke-width="1.5"/>

  <!-- Ears -->
  <polygon points="36,30 30,12 44,24" fill="${colors.ear}" stroke="${colors.dark}" stroke-width="1"/>
  <polygon points="64,30 70,12 56,24" fill="${colors.ear}" stroke="${colors.dark}" stroke-width="1"/>
  <polygon points="37,28 33,17 43,25" fill="#ffd6e0"/>
  <polygon points="63,28 67,17 57,25" fill="#ffd6e0"/>

  <!-- Eyes -->
  <ellipse class="cat-eye-l" cx="43" cy="40" rx="4" ry="4.5" fill="#1a1a3e"/>
  <ellipse class="cat-eye-r" cx="57" cy="40" rx="4" ry="4.5" fill="#1a1a3e"/>
  <circle cx="41.5" cy="38.5" r="1.5" fill="white" opacity="0.8"/>
  <circle cx="55.5" cy="38.5" r="1.5" fill="white" opacity="0.8"/>

  <!-- Nose -->
  <polygon points="50,46 47.5,44 52.5,44" fill="${colors.nose}"/>

  <!-- Mouth -->
  <path class="cat-mouth" d="M47,47 Q50,50 53,47" fill="none" stroke="${colors.dark}" stroke-width="1" stroke-linecap="round"/>

  <!-- Whiskers -->
  <line x1="28" y1="43" x2="40" y2="45" stroke="${colors.dark}" stroke-width="0.8" opacity="0.5"/>
  <line x1="27" y1="47" x2="40" y2="47" stroke="${colors.dark}" stroke-width="0.8" opacity="0.5"/>
  <line x1="60" y1="45" x2="72" y2="43" stroke="${colors.dark}" stroke-width="0.8" opacity="0.5"/>
  <line x1="60" y1="47" x2="73" y2="47" stroke="${colors.dark}" stroke-width="0.8" opacity="0.5"/>

  <!-- Angry brows (hidden by default) -->
  <line class="cat-brow-l" x1="38" y1="34" x2="46" y2="36" stroke="${colors.dark}" stroke-width="2" stroke-linecap="round" opacity="0"/>
  <line class="cat-brow-r" x1="62" y1="34" x2="54" y2="36" stroke="${colors.dark}" stroke-width="2" stroke-linecap="round" opacity="0"/>

  <!-- Helmet ring (space cat!) -->
  <ellipse cx="50" cy="42" rx="20" ry="19" fill="none" stroke="rgba(200,200,220,0.3)" stroke-width="2" stroke-dasharray="4 3"/>
</svg>
<div class="cat-emote"></div>`;
    }

    const cats = [];

    for (let i = 0; i < CAT_COUNT; i++) {
        const el = document.createElement('div');
        el.className = 'space-cat';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = createCatSVG(CAT_COLORS[i]);
        document.body.appendChild(el);

        cats.push({
            el,
            x: 100 + Math.random() * (window.innerWidth - 200),
            y: 100 + Math.random() * (window.innerHeight - 200),
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            angryTimer: 0,
            idleAngle: Math.random() * Math.PI * 2,
            idleTimer: 60 + Math.random() * 120,
            facingLeft: false,
        });
    }

    let mouseX = -999, mouseY = -999;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // --- Emote helper ---
    function showCatEmote(cat, text) {
        const emoteEl = cat.el.querySelector('.cat-emote');
        emoteEl.textContent = text;
        emoteEl.classList.add('show');
        clearTimeout(cat._emoteTimeout);
        cat._emoteTimeout = setTimeout(() => {
            emoteEl.classList.remove('show');
        }, 1500);
    }

    // --- Main loop ---
    function update() {
        for (const cat of cats) {
            const dx = mouseX - cat.x;
            const dy = mouseY - cat.y;
            const dist = Math.hypot(dx, dy);

            if (cat.angryTimer > 0) {
                // Angry state - shake in place
                cat.angryTimer--;
                cat.vx *= 0.85;
                cat.vy *= 0.85;

                // Show angry face
                const browL = cat.el.querySelector('.cat-brow-l');
                const browR = cat.el.querySelector('.cat-brow-r');
                const mouth = cat.el.querySelector('.cat-mouth');
                if (browL) browL.setAttribute('opacity', '1');
                if (browR) browR.setAttribute('opacity', '1');
                if (mouth) mouth.setAttribute('d', 'M46,48 Q50,45 54,48');

                // Shake
                cat.el.classList.add('cat-angry');

                if (cat.angryTimer <= 0) {
                    // Calm down
                    if (browL) browL.setAttribute('opacity', '0');
                    if (browR) browR.setAttribute('opacity', '0');
                    if (mouth) mouth.setAttribute('d', 'M47,47 Q50,50 53,47');
                    cat.el.classList.remove('cat-angry');
                }
            } else if (dist < CATCH_RADIUS) {
                // Caught! Get angry
                cat.angryTimer = ANGRY_DURATION;
                const angryEmotes = ['MIAW!', 'HRRR!', 'PSST!', '>:('];
                showCatEmote(cat, angryEmotes[Math.floor(Math.random() * angryEmotes.length)]);
            } else if (dist < FLEE_RADIUS) {
                // Flee from mouse
                const force = (FLEE_RADIUS - dist) / FLEE_RADIUS;
                const fleeX = -(dx / dist) * FLEE_SPEED * force;
                const fleeY = -(dy / dist) * FLEE_SPEED * force;
                cat.vx += fleeX * 0.12;
                cat.vy += fleeY * 0.12;
            } else {
                // Idle wandering
                cat.idleTimer--;
                if (cat.idleTimer <= 0) {
                    cat.idleAngle = Math.random() * Math.PI * 2;
                    cat.idleTimer = 80 + Math.random() * 160;
                }
                cat.vx += Math.cos(cat.idleAngle) * 0.03;
                cat.vy += Math.sin(cat.idleAngle) * 0.03;
            }

            // Friction
            cat.vx *= FRICTION;
            cat.vy *= FRICTION;

            // Update position
            cat.x += cat.vx;
            cat.y += cat.vy;

            // Viewport boundaries
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (cat.x < 22) { cat.x = 22; cat.vx *= -0.5; cat.idleAngle = Math.random() * Math.PI * 2; }
            if (cat.x > w - 22) { cat.x = w - 22; cat.vx *= -0.5; cat.idleAngle = Math.random() * Math.PI * 2; }
            if (cat.y < 22) { cat.y = 22; cat.vy *= -0.5; cat.idleAngle = Math.random() * Math.PI * 2; }
            if (cat.y > h - 22) { cat.y = h - 22; cat.vy *= -0.5; cat.idleAngle = Math.random() * Math.PI * 2; }

            // Facing
            if (Math.abs(cat.vx) > 0.1) {
                cat.facingLeft = cat.vx < 0;
            }

            // Render
            const scaleX = cat.facingLeft ? -1 : 1;
            const bob = Math.sin(Date.now() * 0.004 + cats.indexOf(cat) * 2) * 2;
            const tilt = cat.vx * 3;

            cat.el.style.transform = `translate(${cat.x - 22}px, ${cat.y - 22 + bob}px) scaleX(${scaleX}) rotate(${tilt}deg)`;

            // Tail wag speed
            const speed = Math.hypot(cat.vx, cat.vy);
            cat.el.style.setProperty('--wag-speed', Math.max(0.2, 0.6 - speed * 0.05) + 's');
        }

        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
})();

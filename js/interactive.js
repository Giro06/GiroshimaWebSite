// ========================================
// GIROSHIMA - Interactive Features
// Aurora BG | Parallax | Cursor Skins | Pixel Hunt
// ========================================

(function () {
    'use strict';

    // ================================================
    //  1) AURORA BACKGROUND
    //  Scroll-reactive aurora borealis behind content
    // ================================================
    function initAurora() {
        const canvas = document.createElement('canvas');
        canvas.id = 'aurora-canvas';
        document.body.prepend(canvas);
        const ctx = canvas.getContext('2d');

        let W, H;
        function resize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Aurora colour palettes that shift with scroll
        const palettes = [
            ['#e94560', '#0f3460', '#16213e'],  // red-blue (top)
            ['#0f3460', '#533483', '#e94560'],  // purple zone (mid)
            ['#00b4d8', '#0f3460', '#e94560'],  // cyan-blue (bottom)
        ];

        const waves = Array.from({ length: 5 }, (_, i) => ({
            y: 0.2 + i * 0.15,
            amplitude: 40 + i * 15,
            frequency: 0.002 + i * 0.0005,
            speed: 0.0004 + i * 0.0002,
            phase: Math.random() * Math.PI * 2,
        }));

        let scrollRatio = 0;
        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            scrollRatio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        });

        function lerpColor(a, b, t) {
            const ah = parseInt(a.slice(1), 16);
            const bh = parseInt(b.slice(1), 16);
            const r = Math.round(((ah >> 16) & 0xff) * (1 - t) + ((bh >> 16) & 0xff) * t);
            const g = Math.round(((ah >> 8) & 0xff) * (1 - t) + ((bh >> 8) & 0xff) * t);
            const bl = Math.round((ah & 0xff) * (1 - t) + (bh & 0xff) * t);
            return `rgb(${r},${g},${bl})`;
        }

        function getPalette(t) {
            const idx = t * (palettes.length - 1);
            const i = Math.min(Math.floor(idx), palettes.length - 2);
            const f = idx - i;
            return palettes[i].map((c, ci) => lerpColor(c, palettes[i + 1][ci], f));
        }

        let time = 0;
        function draw() {
            time += 1;
            ctx.clearRect(0, 0, W, H);
            const pal = getPalette(scrollRatio);

            waves.forEach((wave, wi) => {
                ctx.beginPath();
                const baseY = wave.y * H;
                for (let x = 0; x <= W; x += 4) {
                    const y = baseY +
                        Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude +
                        Math.sin(x * wave.frequency * 0.5 + time * wave.speed * 1.3) * wave.amplitude * 0.5;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.lineTo(W, H);
                ctx.lineTo(0, H);
                ctx.closePath();

                const grad = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, H);
                const color = pal[wi % pal.length];
                grad.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ',0.08)'));
                grad.addColorStop(0.5, color.replace('rgb', 'rgba').replace(')', ',0.04)'));
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fill();
            });

            requestAnimationFrame(draw);
        }
        draw();
    }

    // ================================================
    //  2) PARALLAX DEPTH
    //  Mouse-reactive layered depth on cards & hero
    //  Uses wrapper elements to avoid conflicting with
    //  existing CSS animations (slideUp, cardReveal, hover).
    // ================================================
    function initParallax() {
        let mx = 0, my = 0;
        let cx = 0, cy = 0;
        let ready = false;

        // Wait for entry animations to finish before applying parallax
        setTimeout(() => { ready = true; }, 1500);

        document.addEventListener('mousemove', (e) => {
            mx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 to 1
            my = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // Wrap hero-content in a parallax container so we don't
        // override the child elements' own CSS animations.
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            const wrapper = document.createElement('div');
            wrapper.className = 'parallax-hero-wrap';
            wrapper.style.willChange = 'transform';
            heroContent.parentNode.insertBefore(wrapper, heroContent);
            wrapper.appendChild(heroContent);
        }

        // Smooth lerp
        function tick() {
            cx += (mx - cx) * 0.08;
            cy += (my - cy) * 0.08;

            if (ready) {
                // Move the hero wrapper (children keep their own animations)
                const heroWrap = document.querySelector('.parallax-hero-wrap');
                if (heroWrap) {
                    heroWrap.style.transform = `translate(${cx * -12}px, ${cy * -8}px)`;
                }

                // Hero glow — keep original translate(-50%,-50%) + add parallax offset
                const heroGlow = document.querySelector('.hero-glow');
                if (heroGlow) {
                    heroGlow.style.transform = `translate(calc(-50% + ${cx * 30}px), calc(-50% + ${cy * 30}px))`;
                }

                // Section titles — subtle float
                document.querySelectorAll('.section-title').forEach(el => {
                    el.style.transform = `translate(${cx * -4}px, ${cy * -3}px)`;
                });
            }

            requestAnimationFrame(tick);
        }
        tick();
    }

    // ================================================
    //  3) CURSOR SKINS
    //  Floating picker to switch cursor style
    // ================================================
    function initCursorSkins() {
        const SKINS_KEY = 'giroshima_cursor_skin';

        const skins = [
            { id: 'default', label: 'Default', emoji: '🖱️', css: 'default' },
            { id: 'crosshair', label: 'Crosshair', emoji: '🎯', css: 'crosshair' },
            { id: 'sword', label: 'Sword', emoji: '⚔️', svgCursor: buildSvgCursor('sword') },
            { id: 'magic', label: 'Magic', emoji: '✨', svgCursor: buildSvgCursor('magic') },
            { id: 'pixel', label: 'Pixel Hand', emoji: '👾', svgCursor: buildSvgCursor('pixel') },
        ];

        function buildSvgCursor(type) {
            const svgs = {
                sword: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><line x1="4" y1="24" x2="20" y2="8" stroke="%23e94560" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="12" x2="22" y2="6" stroke="%23eaeaea" stroke-width="2"/><polygon points="22,2 26,6 22,10 18,6" fill="%23eaeaea"/><line x1="6" y1="20" x2="10" y2="24" stroke="%23e94560" stroke-width="2" stroke-linecap="round"/></svg>`,
                magic: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><line x1="4" y1="24" x2="24" y2="4" stroke="%230f3460" stroke-width="3" stroke-linecap="round"/><line x1="4" y1="24" x2="24" y2="4" stroke="%23e94560" stroke-width="1.5" stroke-linecap="round"/><circle cx="24" cy="4" r="3" fill="%23e94560" opacity="0.8"/><circle cx="20" cy="2" r="1" fill="%23fff"/><circle cx="26" cy="8" r="1.2" fill="%23fff"/></svg>`,
                pixel: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect x="4" y="2" width="4" height="4" fill="%23eaeaea"/><rect x="4" y="6" width="4" height="12" fill="%23eaeaea"/><rect x="8" y="14" width="4" height="4" fill="%23eaeaea"/><rect x="12" y="14" width="4" height="4" fill="%23eaeaea"/><rect x="12" y="18" width="4" height="4" fill="%23eaeaea"/><rect x="16" y="14" width="4" height="4" fill="%23eaeaea"/><rect x="8" y="18" width="4" height="6" fill="%23eaeaea"/><rect x="4" y="18" width="4" height="4" fill="%23e94560"/></svg>`,
            };
            return `url("data:image/svg+xml,${svgs[type]}") 4 4, auto`;
        }

        // Build picker UI
        const picker = document.createElement('div');
        picker.id = 'cursor-picker';
        picker.innerHTML = `
            <button class="cursor-picker-toggle" title="Cursor Skin">🖱️</button>
            <div class="cursor-picker-menu">
                <div class="cursor-picker-title">Cursor Skin</div>
                ${skins.map(s => `
                    <button class="cursor-skin-option" data-skin="${s.id}" title="${s.label}">
                        <span class="skin-emoji">${s.emoji}</span>
                        <span class="skin-label">${s.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
        document.body.appendChild(picker);

        const toggle = picker.querySelector('.cursor-picker-toggle');
        const menu = picker.querySelector('.cursor-picker-menu');

        toggle.addEventListener('click', () => {
            menu.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target)) menu.classList.remove('open');
        });

        function applySkin(skinId) {
            const skin = skins.find(s => s.id === skinId) || skins[0];
            if (skin.svgCursor) {
                document.body.style.cursor = skin.svgCursor;
            } else {
                document.body.style.cursor = skin.css;
            }
            // Update active state
            picker.querySelectorAll('.cursor-skin-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.skin === skinId);
            });
            toggle.textContent = skin.emoji;
            localStorage.setItem(SKINS_KEY, skinId);
        }

        picker.querySelectorAll('.cursor-skin-option').forEach(btn => {
            btn.addEventListener('click', () => {
                applySkin(btn.dataset.skin);
                menu.classList.remove('open');
            });
        });

        // Load saved
        const saved = localStorage.getItem(SKINS_KEY) || 'default';
        applySkin(saved);
    }

    // ================================================
    //  4) PIXEL HUNT
    //  Hidden micro-icons scattered across the page
    // ================================================
    function initPixelHunt() {
        const HUNT_KEY = 'giroshima_pixel_hunt';
        const saved = JSON.parse(localStorage.getItem(HUNT_KEY) || '[]');

        const collectibles = [
            { id: 'gem',     emoji: '💎', section: '.hero',           top: '15%', left: '8%' },
            { id: 'star',    emoji: '⭐', section: '.games-section',  top: '12%', left: '92%' },
            { id: 'rocket',  emoji: '🚀', section: '.videos-section', top: '80%', left: '5%' },
            { id: 'crown',   emoji: '👑', section: '.footer',         top: '30%', left: '88%' },
            { id: 'heart',   emoji: '❤️', section: '.hero',           top: '75%', left: '85%' },
            { id: 'bolt',    emoji: '⚡', section: '.games-section',  top: '85%', left: '50%' },
        ];

        const TOTAL = collectibles.length;
        let found = [...saved];

        // HUD counter
        const hud = document.createElement('div');
        hud.id = 'pixel-hunt-hud';
        hud.innerHTML = `<span class="hunt-icon">🔍</span> <span class="hunt-count">${found.length}</span>/<span>${TOTAL}</span>`;
        document.body.appendChild(hud);

        function updateHud() {
            hud.querySelector('.hunt-count').textContent = found.length;
            if (found.length === TOTAL) {
                hud.classList.add('complete');
                showVictory();
            }
        }

        function showVictory() {
            const overlay = document.createElement('div');
            overlay.className = 'pixel-hunt-victory';
            overlay.innerHTML = `
                <div class="victory-content">
                    <div class="victory-emoji">🏆</div>
                    <h3>All Secrets Found!</h3>
                    <p>You discovered all ${TOTAL} hidden collectibles!</p>
                    <button class="btn btn-primary victory-close">Nice!</button>
                </div>
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('show'));
            overlay.querySelector('.victory-close').addEventListener('click', () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 400);
            });
        }

        collectibles.forEach(item => {
            const parent = document.querySelector(item.section);
            if (!parent) return;

            // Ensure parent has relative position
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }

            const el = document.createElement('button');
            el.className = 'pixel-hunt-item';
            el.dataset.id = item.id;
            el.textContent = item.emoji;
            el.style.top = item.top;
            el.style.left = item.left;
            el.title = 'A hidden collectible!';

            if (found.includes(item.id)) {
                el.classList.add('collected');
            }

            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (found.includes(item.id)) return;

                found.push(item.id);
                localStorage.setItem(HUNT_KEY, JSON.stringify(found));
                el.classList.add('collected', 'just-collected');

                // Burst particles
                spawnBurst(e.clientX, e.clientY);
                updateHud();
            });

            parent.appendChild(el);
        });

        function spawnBurst(x, y) {
            const colors = ['#e94560', '#0f3460', '#533483', '#00b4d8', '#ffd700'];
            for (let i = 0; i < 12; i++) {
                const p = document.createElement('div');
                p.className = 'hunt-particle';
                p.style.left = x + 'px';
                p.style.top = y + 'px';
                p.style.background = colors[i % colors.length];
                const angle = (i * 30) * Math.PI / 180;
                const dist = 50 + Math.random() * 30;
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist;
                p.style.setProperty('--tx', tx + 'px');
                p.style.setProperty('--ty', ty + 'px');
                document.body.appendChild(p);
                p.addEventListener('animationend', () => p.remove());
            }
        }

        updateHud();
    }

    // ================================================
    //  INIT ALL
    // ================================================
    function initInteractive() {
        initAurora();
        initParallax();
        initCursorSkins();
        initPixelHunt();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInteractive);
    } else {
        initInteractive();
    }
})();

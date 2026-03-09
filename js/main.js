// ========================================
// GIROSHIMA - Main Site JavaScript
// ========================================

(function () {
    'use strict';

    // ---- Storage Keys ----
    const GAMES_KEY = 'giroshima_games';
    const VIDEOS_KEY = 'giroshima_videos';

    // ---- Game Thumbnail SVGs ----
    function buildGameThumb(type) {
        const svgs = {
            candy: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
                <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient>
                    <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff6b9d"/><stop offset="100%" stop-color="#e94560"/></linearGradient>
                    <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd93d"/><stop offset="100%" stop-color="#ff8c00"/></linearGradient>
                    <linearGradient id="c3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6bcb77"/><stop offset="100%" stop-color="#3a9647"/></linearGradient>
                    <linearGradient id="c4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4d96ff"/><stop offset="100%" stop-color="#0f3460"/></linearGradient>
                </defs>
                <rect width="400" height="600" fill="url(#bg)"/>
                <rect x="60" y="140" width="80" height="80" rx="16" fill="url(#c1)" opacity="0.9"/><rect x="160" y="140" width="80" height="80" rx="16" fill="url(#c2)" opacity="0.9"/><rect x="260" y="140" width="80" height="80" rx="16" fill="url(#c3)" opacity="0.9"/>
                <rect x="60" y="240" width="80" height="80" rx="16" fill="url(#c4)" opacity="0.9"/><rect x="160" y="240" width="80" height="80" rx="16" fill="url(#c1)" opacity="0.9"/><rect x="260" y="240" width="80" height="80" rx="16" fill="url(#c2)" opacity="0.9"/>
                <rect x="60" y="340" width="80" height="80" rx="16" fill="url(#c3)" opacity="0.9"/><rect x="160" y="340" width="80" height="80" rx="16" fill="url(#c4)" opacity="0.9"/><rect x="260" y="340" width="80" height="80" rx="16" fill="url(#c1)" opacity="0.9"/>
                <circle cx="100" cy="180" r="12" fill="white" opacity="0.3"/><circle cx="300" cy="280" r="12" fill="white" opacity="0.3"/><circle cx="200" cy="380" r="12" fill="white" opacity="0.3"/>
                <text x="200" y="500" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="white" opacity="0.1">CANDY BLOCK</text>
            </svg>`,
            polyline: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
                <defs>
                    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f3460"/><stop offset="100%" stop-color="#1a1a2e"/></linearGradient>
                </defs>
                <rect width="400" height="600" fill="url(#bg2)"/>
                <polyline points="50,450 120,200 200,350 280,150 350,300" fill="none" stroke="#e94560" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="80,500 150,280 230,400 310,220 370,350" fill="none" stroke="#4d96ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
                <circle cx="50" cy="450" r="8" fill="#e94560"/><circle cx="120" cy="200" r="8" fill="#e94560"/><circle cx="200" cy="350" r="8" fill="#e94560"/><circle cx="280" cy="150" r="8" fill="#e94560"/><circle cx="350" cy="300" r="8" fill="#e94560"/>
                <circle cx="80" cy="500" r="6" fill="#4d96ff" opacity="0.6"/><circle cx="150" cy="280" r="6" fill="#4d96ff" opacity="0.6"/><circle cx="230" cy="400" r="6" fill="#4d96ff" opacity="0.6"/><circle cx="310" cy="220" r="6" fill="#4d96ff" opacity="0.6"/><circle cx="370" cy="350" r="6" fill="#4d96ff" opacity="0.6"/>
                <line x1="0" y1="100" x2="400" y2="100" stroke="white" stroke-width="0.5" opacity="0.05"/><line x1="0" y1="200" x2="400" y2="200" stroke="white" stroke-width="0.5" opacity="0.05"/><line x1="0" y1="300" x2="400" y2="300" stroke="white" stroke-width="0.5" opacity="0.05"/><line x1="0" y1="400" x2="400" y2="400" stroke="white" stroke-width="0.5" opacity="0.05"/><line x1="0" y1="500" x2="400" y2="500" stroke="white" stroke-width="0.5" opacity="0.05"/>
            </svg>`,
            shelf: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
                <defs>
                    <linearGradient id="bg3" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient>
                </defs>
                <rect width="400" height="600" fill="url(#bg3)"/>
                <rect x="50" y="80" width="300" height="8" rx="4" fill="#533483" opacity="0.8"/>
                <rect x="50" y="210" width="300" height="8" rx="4" fill="#533483" opacity="0.8"/>
                <rect x="50" y="340" width="300" height="8" rx="4" fill="#533483" opacity="0.8"/>
                <rect x="50" y="470" width="300" height="8" rx="4" fill="#533483" opacity="0.8"/>
                <rect x="70" y="110" width="50" height="90" rx="6" fill="#e94560" opacity="0.85"/><rect x="130" y="130" width="50" height="70" rx="6" fill="#4d96ff" opacity="0.85"/><rect x="190" y="100" width="50" height="100" rx="6" fill="#6bcb77" opacity="0.85"/><rect x="250" y="140" width="50" height="60" rx="6" fill="#ffd93d" opacity="0.85"/>
                <rect x="80" y="240" width="50" height="90" rx="6" fill="#ffd93d" opacity="0.85"/><rect x="150" y="250" width="50" height="80" rx="6" fill="#e94560" opacity="0.85"/><rect x="220" y="230" width="50" height="100" rx="6" fill="#4d96ff" opacity="0.85"/><rect x="290" y="260" width="50" height="70" rx="6" fill="#6bcb77" opacity="0.85"/>
                <rect x="70" y="370" width="50" height="90" rx="6" fill="#4d96ff" opacity="0.85"/><rect x="140" y="380" width="50" height="80" rx="6" fill="#6bcb77" opacity="0.85"/><rect x="210" y="360" width="50" height="100" rx="6" fill="#ffd93d" opacity="0.85"/><rect x="280" y="390" width="50" height="70" rx="6" fill="#e94560" opacity="0.85"/>
            </svg>`,
            meow: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
                <defs>
                    <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#2d1b4e"/></linearGradient>
                    <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff9a9e"/><stop offset="100%" stop-color="#e94560"/></linearGradient>
                    <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a18cd1"/><stop offset="100%" stop-color="#533483"/></linearGradient>
                </defs>
                <rect width="400" height="600" fill="url(#bg4)"/>
                <!-- Cat face -->
                <ellipse cx="200" cy="280" rx="90" ry="80" fill="url(#m1)"/>
                <polygon points="130,220 110,140 165,210" fill="url(#m1)"/>
                <polygon points="270,220 290,140 235,210" fill="url(#m1)"/>
                <polygon points="130,220 120,155 160,215" fill="#ff6b8a"/>
                <polygon points="270,220 280,155 240,215" fill="#ff6b8a"/>
                <ellipse cx="170" cy="265" rx="16" ry="18" fill="white"/><ellipse cx="230" cy="265" rx="16" ry="18" fill="white"/>
                <ellipse cx="173" cy="268" rx="9" ry="11" fill="#1a1a2e"/><ellipse cx="233" cy="268" rx="9" ry="11" fill="#1a1a2e"/>
                <circle cx="176" cy="263" r="3" fill="white"/><circle cx="236" cy="263" r="3" fill="white"/>
                <ellipse cx="200" cy="298" rx="8" ry="5" fill="#ff6b8a"/>
                <path d="M192,305 Q200,315 208,305" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>
                <!-- Match-3 gems -->
                <circle cx="100" cy="450" r="28" fill="url(#m2)" opacity="0.9"/><circle cx="200" cy="450" r="28" fill="#e94560" opacity="0.9"/><circle cx="300" cy="450" r="28" fill="url(#m2)" opacity="0.9"/>
                <circle cx="100" cy="520" r="28" fill="#e94560" opacity="0.9"/><circle cx="200" cy="520" r="28" fill="url(#m2)" opacity="0.9"/><circle cx="300" cy="520" r="28" fill="#e94560" opacity="0.9"/>
                <text x="100" y="457" text-anchor="middle" font-size="22">⭐</text><text x="200" y="457" text-anchor="middle" font-size="22">💎</text><text x="300" y="457" text-anchor="middle" font-size="22">⭐</text>
                <text x="100" y="527" text-anchor="middle" font-size="22">💎</text><text x="200" y="527" text-anchor="middle" font-size="22">⭐</text><text x="300" y="527" text-anchor="middle" font-size="22">💎</text>
            </svg>`
        };
        return 'data:image/svg+xml;base64,' + btoa(svgs[type]);
    }

    // ---- Default Games (from old site) ----
    const DEFAULT_GAMES = [
        {
            id: 1,
            title: 'Candy Block Jam',
            link: 'https://www.crazygames.com/game/candyblockjam',
            image: buildGameThumb('candy')
        },
        {
            id: 2,
            title: 'Polyline',
            link: 'https://giroshima.itch.io/polyline',
            image: buildGameThumb('polyline')
        },
        {
            id: 3,
            title: 'Sort Shelf',
            link: 'https://giroshima.itch.io/sort-shelf',
            image: buildGameThumb('shelf')
        },
        {
            id: 4,
            title: 'Meow Match 3',
            link: 'https://giroshima.itch.io/meow-match-3',
            image: buildGameThumb('meow')
        }
    ];

    // ---- Helpers ----
    function getGames() {
        try {
            const stored = JSON.parse(localStorage.getItem(GAMES_KEY));
            if (stored && stored.length > 0) return stored;
            return DEFAULT_GAMES;
        } catch {
            return DEFAULT_GAMES;
        }
    }

    function getVideos() {
        try {
            return JSON.parse(localStorage.getItem(VIDEOS_KEY)) || [];
        } catch {
            return [];
        }
    }

    // ---- Extract YouTube Embed URL ----
    function getYouTubeEmbed(url) {
        if (!url) return null;
        let videoId = null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1).split('/')[0];
            } else if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
                if (!videoId) {
                    // Handle /embed/ID, /shorts/ID, /live/ID, /v/ID formats
                    const match = urlObj.pathname.match(/\/(embed|shorts|live|v)\/([^/?]+)/);
                    if (match) videoId = match[2];
                }
            }
        } catch {
            return null;
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return null;
    }

    // ---- Render Games ----
    function renderGames() {
        const grid = document.getElementById('games-grid');
        const empty = document.getElementById('games-empty');
        if (!grid) return;

        const games = getGames();

        if (games.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }

        if (empty) empty.classList.remove('visible');

        grid.innerHTML = games.map((game, i) => {
            const embedUrl = game.video ? getYouTubeEmbed(game.video) : null;
            return `
            <a href="${game.link ? escapeHtml(game.link) : '#'}" target="_blank" rel="noopener noreferrer" class="game-card" style="animation-delay: ${i * 0.1}s" ${embedUrl ? `data-video="${escapeHtml(embedUrl)}"` : ''}>
                <div class="game-card-image">
                    ${game.image
                        ? `<img src="${game.image}" alt="${escapeHtml(game.title)}" loading="lazy">`
                        : `<div class="game-card-placeholder">&#127918;</div>`
                    }
                </div>
                ${embedUrl ? `<div class="game-card-video"></div>` : ''}
                <div class="game-card-overlay">
                    <h3 class="game-card-title">${escapeHtml(game.title)}</h3>
                    <span class="game-card-btn">Play Now</span>
                </div>
            </a>
        `}).join('');

        // Hover video logic – reveal from mouse position
        grid.querySelectorAll('.game-card[data-video]').forEach(card => {
            let hoverTimeout;
            card.addEventListener('mouseenter', (e) => {
                const rect = card.getBoundingClientRect();
                const px = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
                const py = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);

                hoverTimeout = setTimeout(() => {
                    const videoContainer = card.querySelector('.game-card-video');
                    if (videoContainer && !videoContainer.querySelector('iframe')) {
                        // Set clip-path origin to mouse entry point
                        videoContainer.style.clipPath = `circle(0% at ${px}% ${py}%)`;
                        const iframe = document.createElement('iframe');
                        iframe.src = card.dataset.video + '?autoplay=1&mute=1&controls=0&loop=1&playsinline=1';
                        iframe.allow = 'autoplay; encrypted-media';
                        iframe.setAttribute('loading', 'lazy');
                        videoContainer.appendChild(iframe);
                        // Trigger reflow then animate open
                        void videoContainer.offsetWidth;
                        videoContainer.style.clipPath = `circle(150% at ${px}% ${py}%)`;
                        videoContainer.classList.add('active');
                    }
                }, 400);
            });
            card.addEventListener('mouseleave', (e) => {
                clearTimeout(hoverTimeout);
                const videoContainer = card.querySelector('.game-card-video');
                if (videoContainer) {
                    const rect = card.getBoundingClientRect();
                    const px = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
                    const py = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
                    // Close toward mouse exit point
                    videoContainer.style.clipPath = `circle(0% at ${px}% ${py}%)`;
                    videoContainer.classList.remove('active');
                    setTimeout(() => { videoContainer.innerHTML = ''; videoContainer.style.clipPath = ''; }, 500);
                }
            });
        });
    }

    // ---- Render Videos ----
    function renderVideos() {
        const grid = document.getElementById('videos-grid');
        const empty = document.getElementById('videos-empty');
        if (!grid) return;

        const videos = getVideos();

        if (videos.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }

        if (empty) empty.classList.remove('visible');

        grid.innerHTML = videos.map((video, i) => {
            const embedUrl = getYouTubeEmbed(video.url);
            return `
                <div class="video-card" style="animation-delay: ${i * 0.1}s">
                    ${embedUrl
                        ? `<div class="video-wrapper">
                            <iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
                           </div>`
                        : `<div class="video-wrapper">
                            <a href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);color:var(--accent);font-size:3rem;">&#9654;</a>
                           </div>`
                    }
                    <div class="video-card-body">
                        <h3 class="video-card-title">${escapeHtml(video.title)}</h3>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ---- Escape HTML ----
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Navbar Scroll Effect ----
    function initNavbar() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Mobile menu toggle
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                menuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close on link click
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    menuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }
    }

    // ---- Smooth Scroll for Anchor Links ----
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // ---- Scroll Reveal Animation ----
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.section-title, .section-subtitle, .game-card, .video-card').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // ---- Init ----
    function init() {
        initNavbar();
        initSmoothScroll();
        renderGames();
        renderVideos();

        // Delay scroll reveal to let initial animations finish
        setTimeout(initScrollReveal, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// ========================================
// GIROSHIMA - Main Site JavaScript
// ========================================

(function () {
    'use strict';

    // ---- Storage Keys ----
    const GAMES_KEY = 'giroshima_games';
    const VIDEOS_KEY = 'giroshima_videos';

    // ---- Default Games ----
    const DEFAULT_GAMES = [
        {
            id: 1,
            title: '6 Sudoku',
            link: 'https://www.crazygames.com/game/6-sudoku',
            image: 'https://imgs.crazygames.com/6-sudoku_16x9/20250527074418/6-sudoku_16x9-cover?format=auto&quality=85&width=600'
        },
        {
            id: 2,
            title: 'Candy Block Jam',
            link: 'https://www.crazygames.com/game/candyblockjam',
            image: 'https://imgs.crazygames.com/candyblockjam_1x1/20250821102526/candyblockjam_1x1-cover?format=auto&quality=85&width=600'
        },
        {
            id: 3,
            title: 'Meow Match 3',
            link: 'https://giroshima.itch.io/meow-match-3',
            image: 'https://img.itch.zone/aW1hZ2UvMzk3NDc1Ny8yMzcwNDA2MC5qcGc=/347x500/aDZNfa.jpg'
        },
        {
            id: 4,
            title: 'Polyline',
            link: 'https://giroshima.itch.io/polyline',
            image: 'https://img.itch.zone/aW1nLzIzMDE2MzUzLnBuZw==/347x500/32kkie.png'
        },
        {
            id: 5,
            title: 'Sort Shelf',
            link: 'https://giroshima.itch.io/sort-shelf',
            image: 'https://img.itch.zone/aW1nLzIzMzc4NDc1LnBuZw==/347x500/iHPv4O.png'
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

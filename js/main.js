// ========================================
// GIROSHIMA - Main Site JavaScript
// ========================================

(function () {
    'use strict';

    // ---- Storage Keys ----
    const GAMES_KEY = 'giroshima_games';
    const VIDEOS_KEY = 'giroshima_videos';

    // ---- Helpers ----
    function getGames() {
        try {
            return JSON.parse(localStorage.getItem(GAMES_KEY)) || [];
        } catch {
            return [];
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
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
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

        grid.innerHTML = games.map((game, i) => `
            <div class="game-card" style="animation-delay: ${i * 0.1}s">
                <div class="game-card-image">
                    ${game.image
                        ? `<img src="${escapeHtml(game.image)}" alt="${escapeHtml(game.title)}" loading="lazy">`
                        : `<div class="game-card-placeholder">&#127918;</div>`
                    }
                </div>
                <div class="game-card-body">
                    <h3 class="game-card-title">${escapeHtml(game.title)}</h3>
                    ${game.description ? `<p class="game-card-desc">${escapeHtml(game.description)}</p>` : ''}
                    ${game.link ? `<a href="${escapeHtml(game.link)}" target="_blank" rel="noopener noreferrer" class="game-card-link">Play Now</a>` : ''}
                </div>
            </div>
        `).join('');
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

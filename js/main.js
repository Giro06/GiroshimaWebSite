// ========================================
// GIROSHIMA - Main Site JavaScript
// ========================================

(function () {
    'use strict';

    // ---- Storage Keys ----
    const GAMES_KEY = 'giroshima_games';
    const PCGAMES_KEY = 'giroshima_pcgames';
    const APPS_KEY = 'giroshima_apps';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Site data loaded from data/site-data.json ----
    let siteData = null;

    async function loadSiteData() {
        try {
            const resp = await fetch('data/site-data.json?' + Date.now(), { cache: 'no-store' });
            if (resp.ok) {
                siteData = await resp.json();
            }
        } catch {
            // site-data.json not available, siteData stays null
        }
    }

    // ---- Helpers ----
    // 1st: localStorage (editor preview), 2nd: site-data.json (published data from repo)
    function getItems(storageKey, dataKey) {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey));
            if (stored && stored.length > 0) return stored;
        } catch {}
        if (siteData && siteData[dataKey] && siteData[dataKey].length > 0) return siteData[dataKey];
        return [];
    }

    // ---- Extract YouTube Video ID ----
    function getYouTubeId(url) {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1).split('/')[0] || null;
            }
            if (urlObj.hostname.includes('youtube.com')) {
                const v = urlObj.searchParams.get('v');
                if (v) return v;
                // Handle /embed/ID, /shorts/ID, /live/ID, /v/ID formats
                const match = urlObj.pathname.match(/\/(embed|shorts|live|v)\/([^/?]+)/);
                if (match) return match[2];
            }
        } catch {}
        return null;
    }

    function getYouTubeEmbed(url) {
        const id = getYouTubeId(url);
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // ---- Store label from link host ----
    function getPlatform(link) {
        if (!link) return null;
        let host = '';
        try { host = new URL(link).hostname; } catch { return null; }
        if (host.includes('steampowered.com')) return { name: 'Steam', cta: 'Wishlist on Steam' };
        if (host.includes('apps.apple.com')) return { name: 'App Store', cta: 'Get on the App Store' };
        if (host.includes('play.google.com')) return { name: 'Google Play', cta: 'Get on Google Play' };
        if (host.includes('itch.io')) return { name: 'itch.io', cta: 'Play on itch.io' };
        if (host.includes('crazygames.com')) return { name: 'CrazyGames', cta: 'Play on CrazyGames' };
        return { name: 'Web', cta: 'Open' };
    }

    // ---- Hero: first PC game, trailer playing behind ----
    function renderHero(featured) {
        if (!featured) return;
        const media = document.getElementById('hero-media');
        const platform = getPlatform(featured.link);

        document.getElementById('hero-eyebrow').textContent =
            platform && platform.name === 'Steam' ? 'Featured · On Steam' : 'Featured';
        document.getElementById('hero-title').textContent = featured.title;
        document.getElementById('hero-tagline').textContent = 'A new game from Giroshima.';

        const cta = document.getElementById('hero-cta');
        const videoId = getYouTubeId(featured.video);
        cta.innerHTML = `
            ${featured.link ? `<a href="${escapeHtml(featured.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${escapeHtml(platform ? platform.cta : 'Open')}</a>` : ''}
            ${videoId ? `<a href="https://www.youtube.com/watch?v=${escapeHtml(videoId)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost">Watch trailer</a>` : ''}
        `;

        if (featured.image) {
            const img = document.createElement('img');
            img.src = featured.image;
            img.alt = '';
            img.className = 'hero-poster';
            media.appendChild(img);
        }

        // Background trailer: muted loop, poster stays visible until the iframe loads
        if (videoId && !reducedMotion) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;
            iframe.allow = 'autoplay; encrypted-media';
            iframe.tabIndex = -1;
            iframe.setAttribute('aria-hidden', 'true');
            iframe.className = 'hero-video';
            iframe.addEventListener('load', () => {
                setTimeout(() => iframe.classList.add('ready'), 1200);
            });
            media.appendChild(iframe);
        }
    }

    // ---- Shared card grid renderer (games + apps) ----
    function renderCardGrid(gridId, emptyId, items) {
        const grid = document.getElementById(gridId);
        const empty = document.getElementById(emptyId);
        if (!grid) return;

        if (items.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }

        if (empty) empty.classList.remove('visible');

        grid.innerHTML = items.map((game) => {
            const embedUrl = game.video ? getYouTubeEmbed(game.video) : null;
            const platform = getPlatform(game.link);
            return `
            <a href="${game.link ? escapeHtml(game.link) : '#'}" target="_blank" rel="noopener noreferrer" class="game-card" ${embedUrl ? `data-video="${escapeHtml(embedUrl)}"` : ''}>
                <div class="game-card-media">
                    ${game.image
                        ? `<img src="${game.image}" alt="${escapeHtml(game.title)}" loading="lazy">`
                        : `<div class="game-card-placeholder">${escapeHtml(game.title)}</div>`
                    }
                    ${embedUrl ? `<div class="game-card-video"></div>` : ''}
                </div>
                <div class="game-card-info">
                    <h3 class="game-card-title">${escapeHtml(game.title)}</h3>
                    ${platform ? `<span class="game-card-platform">${escapeHtml(platform.name)}</span>` : ''}
                </div>
            </a>
        `}).join('');

        // Hover video: fade a muted autoplay preview over the cover
        if (!reducedMotion) {
            grid.querySelectorAll('.game-card[data-video]').forEach(card => {
                let hoverTimeout;
                card.addEventListener('mouseenter', () => {
                    hoverTimeout = setTimeout(() => {
                        const videoContainer = card.querySelector('.game-card-video');
                        if (videoContainer && !videoContainer.querySelector('iframe')) {
                            const iframe = document.createElement('iframe');
                            iframe.src = card.dataset.video + '?autoplay=1&mute=1&controls=0&loop=1&playsinline=1';
                            iframe.allow = 'autoplay; encrypted-media';
                            iframe.tabIndex = -1;
                            iframe.addEventListener('load', () => videoContainer.classList.add('active'));
                            videoContainer.appendChild(iframe);
                        }
                    }, 350);
                });
                card.addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimeout);
                    const videoContainer = card.querySelector('.game-card-video');
                    if (videoContainer) {
                        videoContainer.classList.remove('active');
                        setTimeout(() => { videoContainer.innerHTML = ''; }, 300);
                    }
                });
            });
        }
    }

    // ---- Escape HTML ----
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Navbar Scroll Effect + Mobile Menu ----
    function initNavbar() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

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

    // ---- Scroll Reveal Animation ----
    function initScrollReveal() {
        if (reducedMotion) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.section-head, .game-card').forEach((el, i) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${(i % 4) * 60}ms`;
            observer.observe(el);
        });
    }

    // ---- Init ----
    async function init() {
        initNavbar();

        // Homepage only; legal pages just need the navbar
        if (!document.getElementById('games-grid')) return;

        await loadSiteData();

        const pcGames = getItems(PCGAMES_KEY, 'pcGames');
        renderHero(pcGames[0]);
        if (pcGames.length > 1) {
            document.getElementById('pc-games').hidden = false;
            renderCardGrid('pc-games-grid', null, pcGames.slice(1));
        }
        renderCardGrid('games-grid', 'games-empty', getItems(GAMES_KEY, 'games'));
        renderCardGrid('apps-grid', 'apps-empty', getItems(APPS_KEY, 'apps'));

        initScrollReveal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

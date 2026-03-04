// ========================================
// GIROSHIMA - Editor / Admin Panel
// ========================================

(function () {
    'use strict';

    // ---- Storage Keys ----
    const GAMES_KEY = 'giroshima_games';
    const VIDEOS_KEY = 'giroshima_videos';
    const PASSWORD_KEY = 'giroshima_admin_pw';
    const SESSION_KEY = 'giroshima_session';
    const DEFAULT_PASSWORD = 'giroshima2026';

    // ---- Helpers ----
    function getGames() {
        try { return JSON.parse(localStorage.getItem(GAMES_KEY)) || []; }
        catch { return []; }
    }

    function saveGames(games) {
        localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    }

    function getVideos() {
        try { return JSON.parse(localStorage.getItem(VIDEOS_KEY)) || []; }
        catch { return []; }
    }

    function saveVideos(videos) {
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
    }

    function getPassword() {
        return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
    }

    function isLoggedIn() {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Toast ----
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ---- Auth ----
    function showEditor() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('editor-panel').classList.add('active');
        sessionStorage.setItem(SESSION_KEY, 'true');
        renderGamesList();
        renderVideosList();
    }

    function hideEditor() {
        document.getElementById('login-section').style.display = '';
        document.getElementById('editor-panel').classList.remove('active');
        sessionStorage.removeItem(SESSION_KEY);
    }

    // ---- Login ----
    function initLogin() {
        const loginBtn = document.getElementById('login-btn');
        const passwordInput = document.getElementById('admin-password');

        if (isLoggedIn()) {
            showEditor();
        }

        loginBtn.addEventListener('click', () => {
            const pw = passwordInput.value;
            if (pw === getPassword()) {
                showEditor();
                showToast('Welcome back!');
            } else {
                showToast('Wrong password!');
                passwordInput.value = '';
                passwordInput.focus();
            }
        });

        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });
    }

    // ---- Tabs ----
    function initTabs() {
        const tabs = document.querySelectorAll('.editor-tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    }

    // ---- Games CRUD ----
    function renderGamesList() {
        const list = document.getElementById('games-list');
        const games = getGames();

        if (games.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">No games yet. Add your first game above!</p>';
            return;
        }

        list.innerHTML = games.map((game, i) => `
            <div class="item-row">
                ${game.image
                    ? `<img class="item-row-thumb" src="${escapeHtml(game.image)}" alt="${escapeHtml(game.title)}">`
                    : `<div class="item-row-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">&#127918;</div>`
                }
                <div class="item-row-info">
                    <div class="item-row-title">${escapeHtml(game.title)}</div>
                    <div class="item-row-subtitle">${game.link ? escapeHtml(game.link) : 'No link'}</div>
                </div>
                <div class="item-row-actions">
                    <button class="btn-icon" onclick="editorMoveGame(${i}, -1)" title="Move up">&#8593;</button>
                    <button class="btn-icon" onclick="editorMoveGame(${i}, 1)" title="Move down">&#8595;</button>
                    <button class="btn-icon delete" onclick="editorDeleteGame(${i})" title="Delete">&#10005;</button>
                </div>
            </div>
        `).join('');
    }

    // ---- Image Upload ----
    let uploadedImageData = '';

    function initImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('game-image');
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('upload-placeholder');

        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be under 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImageData = event.target.result;
                preview.src = uploadedImageData;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    function clearImageUpload() {
        uploadedImageData = '';
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('upload-placeholder');
        const fileInput = document.getElementById('game-image');
        preview.style.display = 'none';
        preview.src = '';
        placeholder.style.display = '';
        fileInput.value = '';
    }

    function addGame() {
        const title = document.getElementById('game-title').value.trim();
        const link = document.getElementById('game-link').value.trim();

        if (!title) {
            showToast('Game title is required!');
            return;
        }

        const games = getGames();
        games.push({ title, link, image: uploadedImageData, id: Date.now() });
        saveGames(games);

        // Clear form
        document.getElementById('game-title').value = '';
        document.getElementById('game-link').value = '';
        clearImageUpload();

        renderGamesList();
        showToast('Game added!');
    }

    window.editorDeleteGame = function (index) {
        if (!confirm('Delete this game?')) return;
        const games = getGames();
        games.splice(index, 1);
        saveGames(games);
        renderGamesList();
        showToast('Game deleted');
    };

    window.editorMoveGame = function (index, direction) {
        const games = getGames();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= games.length) return;
        [games[index], games[newIndex]] = [games[newIndex], games[index]];
        saveGames(games);
        renderGamesList();
    };

    // ---- Videos CRUD ----
    function renderVideosList() {
        const list = document.getElementById('videos-list');
        const videos = getVideos();

        if (videos.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">No videos yet. Add your first video above!</p>';
            return;
        }

        list.innerHTML = videos.map((video, i) => `
            <div class="item-row">
                <div class="item-row-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">&#9654;</div>
                <div class="item-row-info">
                    <div class="item-row-title">${escapeHtml(video.title)}</div>
                    <div class="item-row-subtitle">${escapeHtml(video.url)}</div>
                </div>
                <div class="item-row-actions">
                    <button class="btn-icon" onclick="editorMoveVideo(${i}, -1)" title="Move up">&#8593;</button>
                    <button class="btn-icon" onclick="editorMoveVideo(${i}, 1)" title="Move down">&#8595;</button>
                    <button class="btn-icon delete" onclick="editorDeleteVideo(${i})" title="Delete">&#10005;</button>
                </div>
            </div>
        `).join('');
    }

    function addVideo() {
        const title = document.getElementById('video-title').value.trim();
        const url = document.getElementById('video-url').value.trim();

        if (!title || !url) {
            showToast('Title and URL are required!');
            return;
        }

        const videos = getVideos();
        videos.push({ title, url, id: Date.now() });
        saveVideos(videos);

        document.getElementById('video-title').value = '';
        document.getElementById('video-url').value = '';

        renderVideosList();
        showToast('Video added!');
    }

    window.editorDeleteVideo = function (index) {
        if (!confirm('Delete this video?')) return;
        const videos = getVideos();
        videos.splice(index, 1);
        saveVideos(videos);
        renderVideosList();
        showToast('Video deleted');
    };

    window.editorMoveVideo = function (index, direction) {
        const videos = getVideos();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= videos.length) return;
        [videos[index], videos[newIndex]] = [videos[newIndex], videos[index]];
        saveVideos(videos);
        renderVideosList();
    };

    // ---- Settings ----
    function initSettings() {
        // Change password
        document.getElementById('change-pw-btn').addEventListener('click', () => {
            const current = document.getElementById('current-pw').value;
            const newPw = document.getElementById('new-pw').value;
            const confirm = document.getElementById('confirm-pw').value;

            if (current !== getPassword()) {
                showToast('Current password is wrong!');
                return;
            }
            if (newPw.length < 4) {
                showToast('Password must be at least 4 characters');
                return;
            }
            if (newPw !== confirm) {
                showToast('Passwords do not match!');
                return;
            }

            localStorage.setItem(PASSWORD_KEY, newPw);
            document.getElementById('current-pw').value = '';
            document.getElementById('new-pw').value = '';
            document.getElementById('confirm-pw').value = '';
            showToast('Password updated!');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            hideEditor();
            showToast('Logged out');
        });

        // Export
        document.getElementById('export-btn').addEventListener('click', () => {
            const data = {
                games: getGames(),
                videos: getVideos(),
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `giroshima-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data exported!');
        });

        // Import
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.games && Array.isArray(data.games)) {
                        saveGames(data.games);
                    }
                    if (data.videos && Array.isArray(data.videos)) {
                        saveVideos(data.videos);
                    }
                    renderGamesList();
                    renderVideosList();
                    showToast('Data imported successfully!');
                } catch {
                    showToast('Invalid file format!');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ---- Navbar ----
    function initNavbar() {
        const navbar = document.querySelector('.navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                menuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
        }
    }

    // ---- Init ----
    function init() {
        initNavbar();
        initLogin();
        initTabs();
        initSettings();

        document.getElementById('add-game-btn').addEventListener('click', addGame);
        document.getElementById('add-video-btn').addEventListener('click', addVideo);
        initImageUpload();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

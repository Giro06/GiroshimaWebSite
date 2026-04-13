// ========================================
// GIROSHIMA - Editor / Admin Panel
// ========================================

(function () {
    'use strict';

    // ---- Storage Keys ----
    const GAMES_KEY = 'giroshima_games';
    const APPS_KEY = 'giroshima_apps';
    const PASSWORD_KEY = 'giroshima_admin_pw';
    const SESSION_KEY = 'giroshima_session';
    const DEFAULT_PASSWORD = 'giroshima2026';
    const VIDEOS_KEY = 'giroshima_videos';

    // ---- Site data from repo (fallback) ----
    let siteData = null;
    let siteDataLoaded = false;

    async function loadSiteData() {
        if (siteDataLoaded) return;
        try {
            const resp = await fetch('data/site-data.json');
            if (resp.ok) {
                siteData = await resp.json();
            }
        } catch {}
        siteDataLoaded = true;
    }

    // ---- Helpers ----
    function getGames() {
        try {
            const stored = JSON.parse(localStorage.getItem(GAMES_KEY));
            if (stored && stored.length > 0) return stored;
        } catch {}
        if (siteData && siteData.games && siteData.games.length > 0) return siteData.games;
        return [];
    }

    function saveGames(games) {
        try {
            localStorage.setItem(GAMES_KEY, JSON.stringify(games));
            return true;
        } catch (e) {
            showToast('Storage full! Try using smaller images.');
            return false;
        }
    }

    function getApps() {
        try {
            const stored = JSON.parse(localStorage.getItem(APPS_KEY));
            if (stored && stored.length > 0) return stored;
        } catch {}
        if (siteData && siteData.apps && siteData.apps.length > 0) return siteData.apps;
        return [];
    }

    function saveApps(apps) {
        try {
            localStorage.setItem(APPS_KEY, JSON.stringify(apps));
            return true;
        } catch (e) {
            showToast('Storage full! Try using smaller images.');
            return false;
        }
    }

    function getVideos() {
        try {
            const stored = JSON.parse(localStorage.getItem(VIDEOS_KEY));
            if (stored && stored.length > 0) return stored;
        } catch {}
        if (siteData && siteData.videos && siteData.videos.length > 0) return siteData.videos;
        return [];
    }

    function saveVideos(videos) {
        try {
            localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
            return true;
        } catch (e) {
            showToast('Storage full! Try removing some items.');
            return false;
        }
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
    async function showEditor() {
        const loginSection = document.getElementById('login-section');
        const editorPanel = document.getElementById('editor-panel');
        if (loginSection) loginSection.style.display = 'none';
        if (editorPanel) editorPanel.classList.add('active');
        sessionStorage.setItem(SESSION_KEY, 'true');
        await loadSiteData();
        renderGamesList();
        renderAppsList();
        renderVideosList();
    }

    function hideEditor() {
        const loginSection = document.getElementById('login-section');
        const editorPanel = document.getElementById('editor-panel');
        if (loginSection) loginSection.style.display = '';
        if (editorPanel) editorPanel.classList.remove('active');
        sessionStorage.removeItem(SESSION_KEY);
    }

    // ---- Login ----
    function initLogin() {
        const loginBtn = document.getElementById('login-btn');
        const passwordInput = document.getElementById('admin-password');
        if (!loginBtn || !passwordInput) return;

        loginBtn.addEventListener('click', async () => {
            const pw = passwordInput.value;
            if (pw === getPassword()) {
                await showEditor();
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
                const target = document.getElementById(tab.dataset.tab);
                if (target) target.classList.add('active');
            });
        });
    }

    // ---- Games CRUD ----
    let editingIndex = -1;

    function renderGamesList() {
        const list = document.getElementById('games-list');
        if (!list) return;
        const games = getGames();

        if (games.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">No games yet. Add your first game above!</p>';
            return;
        }

        list.innerHTML = games.map((game, i) => `
            <div class="item-row${editingIndex === i ? ' editing' : ''}">
                ${game.image
                    ? `<img class="item-row-thumb" src="${escapeHtml(game.image)}" alt="${escapeHtml(game.title)}">`
                    : `<div class="item-row-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">&#127918;</div>`
                }
                <div class="item-row-info">
                    <div class="item-row-title">${escapeHtml(game.title)}</div>
                    <div class="item-row-subtitle">${game.link ? escapeHtml(game.link) : 'No link'}${game.video ? ' &bull; Video' : ''}</div>
                </div>
                <div class="item-row-actions">
                    <button class="btn-icon" onclick="editorEditGame(${i})" title="Edit">&#9998;</button>
                    <button class="btn-icon" onclick="editorMoveGame(${i}, -1)" title="Move up">&#8593;</button>
                    <button class="btn-icon" onclick="editorMoveGame(${i}, 1)" title="Move down">&#8595;</button>
                    <button class="btn-icon delete" onclick="editorDeleteGame(${i})" title="Delete">&#10005;</button>
                </div>
            </div>
        `).join('');
    }

    function setFormMode(mode) {
        const btn = document.getElementById('add-game-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const formTitle = document.querySelector('#games-tab .add-form h3');
        if (!btn || !cancelBtn || !formTitle) return;
        if (mode === 'edit') {
            btn.textContent = 'Update Game';
            cancelBtn.style.display = 'inline-block';
            formTitle.textContent = 'Edit Game';
        } else {
            btn.textContent = 'Add Game';
            cancelBtn.style.display = 'none';
            formTitle.textContent = 'Add New Game';
            editingIndex = -1;
        }
    }

    function clearForm() {
        document.getElementById('game-title').value = '';
        document.getElementById('game-link').value = '';
        document.getElementById('game-video').value = '';
        clearImageUpload();
        setFormMode('add');
    }

    window.editorEditGame = function (index) {
        const games = getGames();
        const game = games[index];
        if (!game) return;

        editingIndex = index;

        document.getElementById('game-title').value = game.title || '';
        document.getElementById('game-link').value = game.link || '';
        document.getElementById('game-video').value = game.video || '';

        // Set image preview if exists
        if (game.image) {
            uploadedImageData = game.image;
            const preview = document.getElementById('image-preview');
            const placeholder = document.getElementById('upload-placeholder');
            if (preview) {
                preview.src = game.image;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
        } else {
            clearImageUpload();
        }

        setFormMode('edit');
        renderGamesList();

        // Scroll to games form
        const gamesForm = document.querySelector('#games-tab .add-form');
        if (gamesForm) gamesForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ---- Image Upload ----
    let uploadedImageData = '';
    let imageReady = true;

    function compressImage(dataUrl, maxWidth, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    function initImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('game-image');
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('upload-placeholder');
        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be under 5MB');
                return;
            }

            imageReady = false;
            const reader = new FileReader();
            reader.onload = async (event) => {
                const compressed = await compressImage(event.target.result, 400, 0.7);
                uploadedImageData = compressed;
                imageReady = true;
                if (preview) {
                    preview.src = compressed;
                    preview.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    function clearImageUpload() {
        uploadedImageData = '';
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('upload-placeholder');
        const fileInput = document.getElementById('game-image');
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        if (placeholder) placeholder.style.display = '';
        if (fileInput) fileInput.value = '';
    }

    function addOrUpdateGame() {
        if (!imageReady) {
            showToast('Image is still processing, please wait...');
            return;
        }

        const title = document.getElementById('game-title').value.trim();
        const link = document.getElementById('game-link').value.trim();
        const video = document.getElementById('game-video').value.trim();

        if (!title) {
            showToast('Game title is required!');
            return;
        }

        const games = getGames();

        if (editingIndex >= 0 && editingIndex < games.length) {
            // Update existing game
            games[editingIndex].title = title;
            games[editingIndex].link = link;
            games[editingIndex].video = video;
            games[editingIndex].image = uploadedImageData || games[editingIndex].image;
            if (!saveGames(games)) return;
            clearForm();
            renderGamesList();
            showToast('Game updated!');
        } else {
            // Add new game
            games.push({ title, link, video, image: uploadedImageData, id: Date.now() });
            if (!saveGames(games)) return;
            clearForm();
            renderGamesList();
            showToast('Game added!');
        }
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

    // ---- Apps CRUD ----
    let editingAppIndex = -1;
    let uploadedAppImageData = '';
    let appImageReady = true;

    function renderAppsList() {
        const list = document.getElementById('apps-list');
        if (!list) return;
        const apps = getApps();

        if (apps.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">No apps yet. Add your first app above!</p>';
            return;
        }

        list.innerHTML = apps.map((app, i) => `
            <div class="item-row${editingAppIndex === i ? ' editing' : ''}">
                ${app.image
                    ? `<img class="item-row-thumb" src="${escapeHtml(app.image)}" alt="${escapeHtml(app.title)}">`
                    : `<div class="item-row-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">&#128241;</div>`
                }
                <div class="item-row-info">
                    <div class="item-row-title">${escapeHtml(app.title)}</div>
                    <div class="item-row-subtitle">${app.link ? escapeHtml(app.link) : 'No link'}${app.video ? ' &bull; Video' : ''}</div>
                </div>
                <div class="item-row-actions">
                    <button class="btn-icon" onclick="editorEditApp(${i})" title="Edit">&#9998;</button>
                    <button class="btn-icon" onclick="editorMoveApp(${i}, -1)" title="Move up">&#8593;</button>
                    <button class="btn-icon" onclick="editorMoveApp(${i}, 1)" title="Move down">&#8595;</button>
                    <button class="btn-icon delete" onclick="editorDeleteApp(${i})" title="Delete">&#10005;</button>
                </div>
            </div>
        `).join('');
    }

    function setAppFormMode(mode) {
        const btn = document.getElementById('add-app-btn');
        const cancelBtn = document.getElementById('cancel-app-edit-btn');
        const formTitle = document.querySelector('#apps-tab .add-form h3');
        if (!btn || !cancelBtn || !formTitle) return;
        if (mode === 'edit') {
            btn.textContent = 'Update App';
            cancelBtn.style.display = 'inline-block';
            formTitle.textContent = 'Edit App';
        } else {
            btn.textContent = 'Add App';
            cancelBtn.style.display = 'none';
            formTitle.textContent = 'Add New App';
            editingAppIndex = -1;
        }
    }

    function clearAppForm() {
        document.getElementById('app-title').value = '';
        document.getElementById('app-link').value = '';
        document.getElementById('app-video').value = '';
        clearAppImageUpload();
        setAppFormMode('add');
    }

    window.editorEditApp = function (index) {
        const apps = getApps();
        const app = apps[index];
        if (!app) return;

        editingAppIndex = index;

        document.getElementById('app-title').value = app.title || '';
        document.getElementById('app-link').value = app.link || '';
        document.getElementById('app-video').value = app.video || '';

        if (app.image) {
            uploadedAppImageData = app.image;
            const preview = document.getElementById('app-image-preview');
            const placeholder = document.getElementById('app-upload-placeholder');
            if (preview) {
                preview.src = app.image;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
        } else {
            clearAppImageUpload();
        }

        setAppFormMode('edit');
        renderAppsList();

        const appsForm = document.querySelector('#apps-tab .add-form');
        if (appsForm) appsForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    function initAppImageUpload() {
        const uploadArea = document.getElementById('app-image-upload-area');
        const fileInput = document.getElementById('app-image');
        const preview = document.getElementById('app-image-preview');
        const placeholder = document.getElementById('app-upload-placeholder');
        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be under 5MB');
                return;
            }

            appImageReady = false;
            const reader = new FileReader();
            reader.onload = async (event) => {
                const compressed = await compressImage(event.target.result, 400, 0.7);
                uploadedAppImageData = compressed;
                appImageReady = true;
                if (preview) {
                    preview.src = compressed;
                    preview.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    function clearAppImageUpload() {
        uploadedAppImageData = '';
        const preview = document.getElementById('app-image-preview');
        const placeholder = document.getElementById('app-upload-placeholder');
        const fileInput = document.getElementById('app-image');
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        if (placeholder) placeholder.style.display = '';
        if (fileInput) fileInput.value = '';
    }

    function addOrUpdateApp() {
        if (!appImageReady) {
            showToast('Image is still processing, please wait...');
            return;
        }

        const title = document.getElementById('app-title').value.trim();
        const link = document.getElementById('app-link').value.trim();
        const video = document.getElementById('app-video').value.trim();

        if (!title) {
            showToast('App title is required!');
            return;
        }

        const apps = getApps();

        if (editingAppIndex >= 0 && editingAppIndex < apps.length) {
            apps[editingAppIndex].title = title;
            apps[editingAppIndex].link = link;
            apps[editingAppIndex].video = video;
            apps[editingAppIndex].image = uploadedAppImageData || apps[editingAppIndex].image;
            if (!saveApps(apps)) return;
            clearAppForm();
            renderAppsList();
            showToast('App updated!');
        } else {
            apps.push({ title, link, video, image: uploadedAppImageData, id: Date.now() });
            if (!saveApps(apps)) return;
            clearAppForm();
            renderAppsList();
            showToast('App added!');
        }
    }

    window.editorDeleteApp = function (index) {
        if (!confirm('Delete this app?')) return;
        const apps = getApps();
        apps.splice(index, 1);
        saveApps(apps);
        renderAppsList();
        showToast('App deleted');
    };

    window.editorMoveApp = function (index, direction) {
        const apps = getApps();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= apps.length) return;
        [apps[index], apps[newIndex]] = [apps[newIndex], apps[index]];
        saveApps(apps);
        renderAppsList();
    };

    // ---- Videos CRUD ----
    function renderVideosList() {
        const list = document.getElementById('videos-list');
        if (!list) return;
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
        if (!saveVideos(videos)) return;

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
        const changePwBtn = document.getElementById('change-pw-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importFile = document.getElementById('import-file');

        if (changePwBtn) {
            changePwBtn.addEventListener('click', () => {
                const currentPw = document.getElementById('current-pw').value;
                const newPw = document.getElementById('new-pw').value;
                const confirmPw = document.getElementById('confirm-pw').value;

                if (currentPw !== getPassword()) {
                    showToast('Current password is wrong!');
                    return;
                }
                if (newPw.length < 4) {
                    showToast('Password must be at least 4 characters');
                    return;
                }
                if (newPw !== confirmPw) {
                    showToast('Passwords do not match!');
                    return;
                }

                localStorage.setItem(PASSWORD_KEY, newPw);
                document.getElementById('current-pw').value = '';
                document.getElementById('new-pw').value = '';
                document.getElementById('confirm-pw').value = '';
                showToast('Password updated!');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                hideEditor();
                showToast('Logged out');
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = {
                    games: getGames(),
                    apps: getApps(),
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
        }

        // ---- Publish to GitHub ----
        const GITHUB_TOKEN_KEY = 'giroshima_github_token';
        const GITHUB_REPO = 'Giro06/GiroshimaWebSite';
        const GITHUB_FILE_PATH = 'data/site-data.json';

        const githubTokenInput = document.getElementById('github-token');
        const publishBtn = document.getElementById('publish-btn');
        const downloadBtn = document.getElementById('download-site-data-btn');

        // Restore saved token
        if (githubTokenInput) {
            const savedToken = localStorage.getItem(GITHUB_TOKEN_KEY) || '';
            if (savedToken) githubTokenInput.value = savedToken;
        }

        function buildSiteData() {
            const games = getGames();
            const apps = getApps();
            const videos = getVideos();
            if (games.length === 0 && apps.length === 0 && videos.length === 0) return null;
            return { games, apps, videos, publishedAt: new Date().toISOString() };
        }

        // Download as file (fallback)
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const data = buildSiteData();
                if (!data) { showToast('Yayınlanacak içerik yok!'); return; }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'site-data.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('site-data.json indirildi!');
            });
        }

        // Publish directly to GitHub
        if (publishBtn) {
            publishBtn.addEventListener('click', async () => {
                const token = githubTokenInput ? githubTokenInput.value.trim() : '';
                if (!token) {
                    showToast('GitHub token gerekli!');
                    if (githubTokenInput) githubTokenInput.focus();
                    return;
                }

                const data = buildSiteData();
                if (!data) { showToast('Yayınlanacak içerik yok!'); return; }

                // Save token for next time
                localStorage.setItem(GITHUB_TOKEN_KEY, token);

                publishBtn.disabled = true;
                publishBtn.textContent = 'Yayınlanıyor...';

                try {
                    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

                    // Get current file SHA (needed for updates)
                    let sha = null;
                    try {
                        const getResp = await fetch(apiUrl, {
                            headers: { 'Authorization': `token ${token}` }
                        });
                        if (getResp.ok) {
                            const fileInfo = await getResp.json();
                            sha = fileInfo.sha;
                        }
                    } catch {}

                    // Commit the file
                    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
                    const body = {
                        message: 'Update site data from editor',
                        content: content
                    };
                    if (sha) body.sha = sha;

                    const putResp = await fetch(apiUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    });

                    if (putResp.ok) {
                        showToast('Yayınlandı! Site güncellendi.');
                    } else {
                        const err = await putResp.json().catch(() => ({}));
                        showToast(`Hata: ${err.message || putResp.status}`);
                    }
                } catch (e) {
                    showToast(`Bağlantı hatası: ${e.message}`);
                } finally {
                    publishBtn.disabled = false;
                    publishBtn.textContent = 'Yayınla';
                }
            });
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });

            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (data.games && Array.isArray(data.games)) {
                            saveGames(data.games);
                        }
                        if (data.apps && Array.isArray(data.apps)) {
                            saveApps(data.apps);
                        }
                        if (data.videos && Array.isArray(data.videos)) {
                            saveVideos(data.videos);
                        }
                        renderGamesList();
                        renderAppsList();
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
    }

    // ---- Navbar ----
    function initNavbar() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            });
        }

        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                menuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
        }
    }

    // ---- Migrate old uncompressed images ----
    async function migrateOldImages() {
        const games = getGames();
        let changed = false;

        for (let i = 0; i < games.length; i++) {
            const img = games[i].image;
            // Skip if no image or already small (compressed images are typically under 100KB)
            if (!img || img.length < 100000) continue;

            try {
                const compressed = await compressImage(img, 400, 0.7);
                if (compressed.length < img.length) {
                    games[i].image = compressed;
                    changed = true;
                }
            } catch {
                // Skip this image if compression fails
            }
        }

        if (changed) {
            saveGames(games);
        }
    }

    // ---- Init ----
    async function init() {
        // 1. Setup all event listeners first
        initNavbar();
        initTabs();
        initSettings();
        initImageUpload();
        initAppImageUpload();

        const addGameBtn = document.getElementById('add-game-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const addAppBtn = document.getElementById('add-app-btn');
        const cancelAppEditBtn = document.getElementById('cancel-app-edit-btn');
        const addVideoBtn = document.getElementById('add-video-btn');

        if (addGameBtn) addGameBtn.addEventListener('click', addOrUpdateGame);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', clearForm);
        if (addAppBtn) addAppBtn.addEventListener('click', addOrUpdateApp);
        if (cancelAppEditBtn) cancelAppEditBtn.addEventListener('click', clearAppForm);
        if (addVideoBtn) addVideoBtn.addEventListener('click', addVideo);

        // Sync from server buttons
        const syncGamesBtn = document.getElementById('sync-games-btn');
        const syncVideosBtn = document.getElementById('sync-videos-btn');

        if (syncGamesBtn) {
            syncGamesBtn.addEventListener('click', async () => {
                syncGamesBtn.disabled = true;
                syncGamesBtn.textContent = 'Syncing...';
                try {
                    const resp = await fetch('data/site-data.json?' + Date.now());
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.games && data.games.length > 0) {
                            saveGames(data.games);
                            renderGamesList();
                            showToast('Games synced from server! (' + data.games.length + ' games)');
                        } else {
                            showToast('No games found on server.');
                        }
                    } else {
                        showToast('Failed to fetch site-data.json');
                    }
                } catch (e) {
                    showToast('Sync error: ' + e.message);
                } finally {
                    syncGamesBtn.disabled = false;
                    syncGamesBtn.innerHTML = '&#8635; Sync from Server';
                }
            });
        }

        const syncAppsBtn = document.getElementById('sync-apps-btn');
        if (syncAppsBtn) {
            syncAppsBtn.addEventListener('click', async () => {
                syncAppsBtn.disabled = true;
                syncAppsBtn.textContent = 'Syncing...';
                try {
                    const resp = await fetch('data/site-data.json?' + Date.now());
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.apps && data.apps.length > 0) {
                            saveApps(data.apps);
                            renderAppsList();
                            showToast('Apps synced from server! (' + data.apps.length + ' apps)');
                        } else {
                            showToast('No apps found on server.');
                        }
                    } else {
                        showToast('Failed to fetch site-data.json');
                    }
                } catch (e) {
                    showToast('Sync error: ' + e.message);
                } finally {
                    syncAppsBtn.disabled = false;
                    syncAppsBtn.innerHTML = '&#8635; Sync from Server';
                }
            });
        }

        if (syncVideosBtn) {
            syncVideosBtn.addEventListener('click', async () => {
                syncVideosBtn.disabled = true;
                syncVideosBtn.textContent = 'Syncing...';
                try {
                    const resp = await fetch('data/site-data.json?' + Date.now());
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.videos && data.videos.length > 0) {
                            saveVideos(data.videos);
                            renderVideosList();
                            showToast('Videos synced from server! (' + data.videos.length + ' videos)');
                        } else {
                            showToast('No videos found on server.');
                        }
                    } else {
                        showToast('Failed to fetch site-data.json');
                    }
                } catch (e) {
                    showToast('Sync error: ' + e.message);
                } finally {
                    syncVideosBtn.disabled = false;
                    syncVideosBtn.innerHTML = '&#8635; Sync from Server';
                }
            });
        }

        // 2. Setup login (may trigger showEditor which renders lists)
        initLogin();

        // 3. Auto-login if session exists
        if (isLoggedIn()) {
            await showEditor();
        }

        // 4. Compress old uncompressed images in background
        migrateOldImages();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

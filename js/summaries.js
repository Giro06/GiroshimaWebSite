// ========================================
// GIROSHIMA - Store Scope Summary Editor
// Talks directly to the Store Scope Supabase backend.
// The anon key below is public by design (it ships in the
// Store Scope frontend); all writes are gated by Supabase RLS
// and require a signed-in account that RLS policies allow.
// ========================================

(function () {
    'use strict';

    const SB_URL = 'https://oeytzpqvqxyptyyszxzs.supabase.co';
    const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9leXR6cHF2cXh5cHR5eXN6eHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjAyMjIsImV4cCI6MjA4MjI5NjIyMn0.iOTyFxHQskFIDfcFZKXudGHu58uTy2x4h-qdDcllJ1s';
    const TOKEN_KEY = 'giroshima_ss_session';
    const PAGE_SIZE = 30;
    const FAIL_TYPES = ['unknown', 'none', 'move_limit', 'time_limit', 'lives', 'resource', 'other'];

    let session = null;          // { access_token, refresh_token, expires_at }
    let hasFailType = true;      // set false if the fail_type column doesn't exist yet
    let offset = 0;
    let currentQuery = '';
    let currentFilter = 'all';
    let searchTimer = null;

    // ---- Toast ----
    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Session handling ----
    function loadSession() {
        try { session = JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { session = null; }
    }

    function saveSession(s) {
        session = s;
        try {
            if (s) localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
            else localStorage.removeItem(TOKEN_KEY);
        } catch {}
    }

    async function login(email, password) {
        const resp = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': SB_ANON, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error_description || data.msg || 'Login failed');
        saveSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
        });
    }

    async function refreshSession() {
        if (!session || !session.refresh_token) return false;
        try {
            const resp = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: { 'apikey': SB_ANON, 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });
            const data = await resp.json();
            if (!resp.ok) { saveSession(null); return false; }
            saveSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
            });
            return true;
        } catch { return false; }
    }

    async function authToken() {
        if (!session) return null;
        // Refresh 60s before expiry
        if (session.expires_at && session.expires_at - 60 < Math.floor(Date.now() / 1000)) {
            const ok = await refreshSession();
            if (!ok) return null;
        }
        return session.access_token;
    }

    // ---- REST helpers ----
    async function rest(path, opts = {}, useAuth = false) {
        const headers = Object.assign({ 'apikey': SB_ANON }, opts.headers || {});
        let token = SB_ANON;
        if (useAuth) {
            const t = await authToken();
            if (!t) throw new Error('Session expired, please log in again.');
            token = t;
        }
        headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch(`${SB_URL}/rest/v1/${path}`, Object.assign({}, opts, { headers }));
        return resp;
    }

    async function countWhere(filter) {
        const resp = await rest(`tracked_apps?select=id&${filter}`, {
            headers: { 'Prefer': 'count=exact', 'Range': '0-0' }
        });
        const range = resp.headers.get('content-range') || '';
        const total = range.split('/')[1];
        return total ? parseInt(total, 10) : 0;
    }

    // ---- Data loading ----
    function buildFilterParams() {
        const params = [];
        if (currentQuery) params.push(`app_name=ilike.${encodeURIComponent('*' + currentQuery + '*')}`);
        if (currentFilter === 'has-summary') params.push('gameplay_summary=not.is.null');
        if (currentFilter === 'no-summary') params.push('gameplay_summary=is.null');
        if (currentFilter === 'unknown-fail' && hasFailType) params.push('fail_type=eq.unknown');
        if (currentFilter === 'notstated-fail') params.push(`fail_state=ilike.${encodeURIComponent('*not stated*')}`);
        return params;
    }

    async function fetchPage() {
        const cols = ['id', 'app_name', 'icon_url', 'platform', 'mechanic', 'gr_genre',
            'gameplay_summary', 'win_state', 'fail_state', 'summary_written_at'];
        if (hasFailType) cols.push('fail_type');
        const params = buildFilterParams();
        params.push(`select=${cols.join(',')}`);
        params.push('order=app_name.asc');
        params.push(`limit=${PAGE_SIZE}`);
        params.push(`offset=${offset}`);

        const resp = await rest(`tracked_apps?${params.join('&')}`);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            // fail_type column missing → retry without it
            if (hasFailType && err.message && err.message.includes('fail_type')) {
                hasFailType = false;
                return fetchPage();
            }
            throw new Error(err.message || `Request failed (${resp.status})`);
        }
        return resp.json();
    }

    async function loadStats() {
        const statsEl = document.getElementById('sum-stats');
        if (!statsEl) return;
        try {
            const [total, withSummary] = await Promise.all([
                countWhere(''),
                countWhere('gameplay_summary=not.is.null')
            ]);
            let extra = '';
            if (hasFailType) {
                const unknown = await countWhere('fail_type=eq.unknown');
                extra = ` &bull; fail_type unknown: <b>${unknown}</b>`;
            }
            statsEl.innerHTML = `Tracked games: <b>${total}</b> &bull; With summary: <b>${withSummary}</b>${extra}`;
        } catch {
            statsEl.textContent = '';
        }
    }

    // ---- Rendering ----
    function failTypeSelect(current) {
        const options = FAIL_TYPES.map(t =>
            `<option value="${t}"${t === (current || 'unknown') ? ' selected' : ''}>${t}</option>`
        ).join('');
        return `<select data-field="fail_type">${options}</select>`;
    }

    function renderCard(app) {
        const card = document.createElement('div');
        card.className = 'sum-card';
        card.dataset.id = app.id;
        const written = app.summary_written_at
            ? new Date(app.summary_written_at).toLocaleDateString()
            : 'never';
        card.innerHTML = `
            <div class="sum-card-head">
                ${app.icon_url ? `<img src="${escapeHtml(app.icon_url)}" alt="" loading="lazy">` : '<div style="width:44px;height:44px;border-radius:10px;background:var(--bg-secondary);"></div>'}
                <div>
                    <div class="sum-title">${escapeHtml(app.app_name)}</div>
                    <div class="sum-meta">${escapeHtml(app.platform || '')} &bull; ${escapeHtml(app.gr_genre || '-')} &bull; ${escapeHtml(app.mechanic || '-')} &bull; summary: ${written}</div>
                </div>
            </div>
            <div class="sum-field">
                <label>Gameplay Summary</label>
                <textarea data-field="gameplay_summary">${escapeHtml(app.gameplay_summary || '')}</textarea>
            </div>
            <div class="sum-field">
                <label>Win State</label>
                <textarea data-field="win_state">${escapeHtml(app.win_state || '')}</textarea>
            </div>
            <div class="sum-field">
                <label>Fail State (note)</label>
                <input type="text" data-field="fail_state" value="${escapeHtml(app.fail_state || '')}">
            </div>
            ${hasFailType ? `
            <div class="sum-field">
                <label>Fail Type</label>
                ${failTypeSelect(app.fail_type)}
            </div>` : ''}
            <div class="sum-card-actions">
                <button type="button" class="sum-save-btn">Save</button>
                <span class="sum-dirty">&bull; unsaved changes</span>
            </div>
        `;

        card.querySelectorAll('[data-field]').forEach(el => {
            el.addEventListener('input', () => card.classList.add('dirty'));
            el.addEventListener('change', () => card.classList.add('dirty'));
        });

        card.querySelector('.sum-save-btn').addEventListener('click', () => saveCard(card));
        return card;
    }

    async function saveCard(card) {
        const btn = card.querySelector('.sum-save-btn');
        const body = { summary_written_at: new Date().toISOString() };
        card.querySelectorAll('[data-field]').forEach(el => {
            body[el.dataset.field] = el.value.trim() || null;
        });

        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
            const resp = await rest(`tracked_apps?id=eq.${card.dataset.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                body: JSON.stringify(body)
            }, true);

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.message || `Save failed (${resp.status})`);
            }
            const rows = await resp.json();
            if (!rows || rows.length === 0) {
                throw new Error('Blocked by RLS: your account has no update permission on tracked_apps.');
            }
            card.classList.remove('dirty');
            showToast('Saved: ' + rows[0].app_name);
        } catch (e) {
            showToast(e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save';
        }
    }

    async function loadPage(reset) {
        const list = document.getElementById('sum-list');
        const moreBtn = document.getElementById('sum-load-more');
        if (reset) {
            offset = 0;
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">Loading...</p>';
        }
        try {
            const rows = await fetchPage();
            if (reset) list.innerHTML = '';
            if (rows.length === 0 && offset === 0) {
                list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">No games match.</p>';
            }
            rows.forEach(app => list.appendChild(renderCard(app)));
            offset += rows.length;
            moreBtn.style.display = rows.length === PAGE_SIZE ? 'block' : 'none';
        } catch (e) {
            if (reset) list.innerHTML = '';
            showToast(e.message);
        }
    }

    // ---- UI wiring ----
    function showEditorUI() {
        document.getElementById('sum-login').style.display = 'none';
        document.getElementById('sum-editor').style.display = 'block';
        loadStats();
        loadPage(true);
    }

    function showLoginUI() {
        document.getElementById('sum-login').style.display = '';
        document.getElementById('sum-editor').style.display = 'none';
    }

    function init() {
        loadSession();

        const loginBtn = document.getElementById('ss-login-btn');
        const emailInput = document.getElementById('ss-email');
        const pwInput = document.getElementById('ss-password');
        const logoutBtn = document.getElementById('ss-logout-btn');
        const searchInput = document.getElementById('sum-search');
        const filterSelect = document.getElementById('sum-filter');
        const moreBtn = document.getElementById('sum-load-more');

        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const pw = pwInput.value;
            if (!email || !pw) { showToast('Email and password required'); return; }
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            try {
                await login(email, pw);
                showToast('Welcome!');
                showEditorUI();
            } catch (e) {
                showToast(e.message);
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
        pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });

        logoutBtn.addEventListener('click', () => {
            saveSession(null);
            showLoginUI();
            showToast('Logged out');
        });

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                currentQuery = searchInput.value.trim();
                loadPage(true);
            }, 350);
        });

        filterSelect.addEventListener('change', () => {
            currentFilter = filterSelect.value;
            loadPage(true);
        });

        moreBtn.addEventListener('click', () => loadPage(false));

        if (session) showEditorUI();
        else showLoginUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

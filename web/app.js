// ===== Cineverse frontend logic =====
let all = [], group = 'All', limit = 120, hls = null, cur = null;
let favs = JSON.parse(localStorage.getItem('cv_favs') || '[]');
const $ = id => document.getElementById(id);
const TV = '\uD83D\uDCFA';

const DEFAULT_PLAYLISTS = [
  { id: 'pl_in', name: '\uD83C\uDDEE\uD83C\uDDF3 India', url: 'https://iptv-org.github.io/iptv/countries/in.m3u' },
  { id: 'pl_us', name: '\uD83C\uDDFA\uD83C\uDDF8 USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'pl_gb', name: '\uD83C\uDDEC\uD83C\uDDE7 UK', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { id: 'pl_news', name: '\uD83D\uDCF0 News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  { id: 'pl_sports', name: '\u26BD Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  { id: 'pl_music', name: '\uD83C\uDFB5 Music', url: 'https://iptv-org.github.io/iptv/categories/music.m3u' },
  { id: 'pl_movies', name: '\uD83C\uDFAC Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' }
];

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- theme toggle ----------
function initTheme() {
  const saved = localStorage.getItem('cv_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cv_theme', theme);
  const btn = $('themeToggle');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '&#9728;' : '&#9790;';
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function toggleTheme() {
  const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(curTheme === 'dark' ? 'light' : 'dark');
}

// ---------- multiple playlists management in browser ----------
function getPlaylists() {
  try {
    const raw = localStorage.getItem('cv_playlists');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem('cv_playlists', JSON.stringify(DEFAULT_PLAYLISTS));
  return [...DEFAULT_PLAYLISTS];
}

function savePlaylists(list) {
  try {
    localStorage.setItem('cv_playlists', JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save playlists list:', e);
  }
  renderHomePlaylistChips();
  renderPlaylistsPage();
  stats();
}

function getActivePlaylistId() {
  return localStorage.getItem('cv_active_pl') || '';
}

function setActivePlaylistId(id) {
  if (id) localStorage.setItem('cv_active_pl', id);
  else localStorage.removeItem('cv_active_pl');
  renderHomePlaylistChips();
  renderPlaylistsPage();
}

function addNewPlaylist() {
  const nameInput = $('newPlName');
  const urlInput = $('newPlUrl');
  const msgEl = $('plFormMsg');
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();

  if (!url) {
    if (msgEl) msgEl.innerHTML = '<span class="status-msg error">Please enter a playlist URL</span>';
    return;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (msgEl) msgEl.innerHTML = '<span class="status-msg error">URL must start with http:// or https://</span>';
    return;
  }

  const list = getPlaylists();
  const finalName = name || ('Playlist ' + (list.length + 1));
  const newPl = {
    id: 'pl_' + Date.now(),
    name: finalName,
    url: url
  };

  list.unshift(newPl);
  savePlaylists(list);

  nameInput.value = '';
  urlInput.value = '';
  if (msgEl) {
    msgEl.innerHTML = `<span class="status-msg success">&#10003; Added "${escapeHtml(finalName)}"! Click below to load it.</span>`;
    setTimeout(() => { if (msgEl) msgEl.innerHTML = ''; }, 4000);
  }
}

function deletePlaylist(id) {
  let list = getPlaylists();
  const pl = list.find(x => x.id === id);
  if (!pl) return;
  if (!confirm(`Delete playlist "${pl.name}" from browser?`)) return;

  list = list.filter(x => x.id !== id);
  if (getActivePlaylistId() === id) {
    setActivePlaylistId('');
  }
  savePlaylists(list);
}

async function switchPlaylist(id) {
  const list = getPlaylists();
  const pl = list.find(x => x.id === id);
  if (!pl) return;

  setActivePlaylistId(id);
  $('url').value = pl.url;
  const nameInput = $('plNameInput');
  if (nameInput) nameInput.value = pl.name;

  await load(pl.name);
}

function renderHomePlaylistChips() {
  const container = $('homePlaylistChips');
  if (!container) return;
  const list = getPlaylists();
  const activeId = getActivePlaylistId();
  const curUrl = ($('url') ? $('url').value.trim() : '');

  container.innerHTML = '';
  list.forEach(pl => {
    const s = document.createElement('span');
    const isActive = (pl.id === activeId) || (curUrl && pl.url === curUrl);
    s.className = 'chip' + (isActive ? ' on' : '');
    s.textContent = pl.name;
    s.title = pl.url;
    s.onclick = () => switchPlaylist(pl.id);
    container.appendChild(s);
  });
}

function renderPlaylistsPage() {
  const container = $('playlistsGrid');
  if (!container) return;
  const list = getPlaylists();
  const activeId = getActivePlaylistId();
  const curUrl = ($('url') ? $('url').value.trim() : '');

  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<div class="empty">No saved playlists yet. Add one above!</div>';
    return;
  }

  list.forEach(pl => {
    const isActive = (pl.id === activeId) || (curUrl && pl.url === curUrl);
    const card = document.createElement('div');
    card.className = 'pl-card' + (isActive ? ' active' : '');

    const channelText = pl.channelsCount ? `${pl.channelsCount.toLocaleString()} channels` : 'M3U Playlist';

    card.innerHTML = `
      <div class="pl-card-header">
        <div class="pl-meta">
          <div class="pl-name" title="${escapeHtml(pl.name)}">${escapeHtml(pl.name)}</div>
          <div class="pl-url" title="${escapeHtml(pl.url)}">${escapeHtml(pl.url)}</div>
        </div>
        <span class="pl-badge ${isActive ? 'active' : ''}">${isActive ? 'Active' : channelText}</span>
      </div>
      <div class="pl-card-actions">
        <button class="btn btn-sm" onclick="switchPlaylist('${pl.id}')">${isActive ? '&#8635; Reload' : '&#9654; Switch &amp; Load'}</button>
        <button class="btn ghost btn-sm pl-del-btn" onclick="deletePlaylist('${pl.id}')" title="Delete playlist">&#128465;</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ---------- playlist storage in browser (cached channels) ----------
function savePlaylist(url, channels) {
  try {
    localStorage.setItem('cv_last_url', url);
  } catch (_) {}
  try {
    localStorage.setItem('cv_channels', JSON.stringify(channels));
  } catch (e) {
    console.warn('Could not cache full channels list in localStorage (quota exceeded):', e);
  }
}

function restoreSavedPlaylist() {
  const savedUrl = localStorage.getItem('cv_last_url');
  if (savedUrl && $('url')) {
    $('url').value = savedUrl;
  }

  const savedChannels = localStorage.getItem('cv_channels');
  if (savedChannels) {
    try {
      const parsed = JSON.parse(savedChannels);
      if (Array.isArray(parsed) && parsed.length > 0) {
        all = parsed;
        group = 'All'; limit = 120;
        buildGroups();
        renderGrid();
        stats();
        const st = $('status');
        if (st) {
          st.innerHTML = `<span class="status-msg success">&#10003; Loaded ${all.length.toLocaleString()} channels from browser storage</span>`;
        }
        return true;
      }
    } catch (e) {
      console.warn('Failed parsing saved channels:', e);
    }
  }
  return false;
}

// ---------- stop player when leaving ----------
function stopPlayer() {
  const v = $('video');
  if (v) {
    v.pause();
    v.removeAttribute('src');
    try { v.load(); } catch (_) {}
  }
  if (hls) {
    try { hls.destroy(); } catch (_) {}
    hls = null;
  }
  hidePlayerSpinner();
  const msg = $('msg');
  if (msg) msg.textContent = '';
}

// ---------- navigation & browser history ----------
let previousPage = 'channels';

function go(p, isPlaying = false, pushHistory = true) {
  const currentActive = document.querySelector('.page.on');
  const currentPageId = currentActive ? currentActive.id.replace('p-', '') : 'home';
  if (currentPageId !== 'watch' && currentPageId !== p) {
    previousPage = currentPageId;
  }

  if (p !== 'watch') {
    stopPlayer();
  }

  document.querySelectorAll('.page').forEach(x => x.classList.toggle('on', x.id === 'p-' + p));
  document.querySelectorAll('.menu button').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  if (p === 'favs') renderFavs();
  if (p === 'playlists') renderPlaylistsPage();
  if (p === 'home') renderHomePlaylistChips();

  // Push history state so the Browser Back button navigates inside Cineverse
  if (pushHistory) {
    const curHash = location.hash.replace('#', '');
    if (curHash !== p) {
      history.pushState({ page: p }, '', '#' + p);
    }
  }

  if (p === 'watch' && cur && !hls && !isPlaying) {
    play(cur);
    return;
  }
  window.scrollTo(0, 0);
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    go(previousPage || 'channels');
  }
}

// Handle Browser Back and Forward buttons without exiting the site
window.addEventListener('popstate', event => {
  const target = (event.state && event.state.page) || location.hash.replace('#', '') || 'home';
  go(target, false, false);
});

// ---------- load playlist from Java backend ----------
function preset(u) {
  $('url').value = u;
  load();
}

async function load(optionalName = '') {
  const u = $('url').value.trim();
  if (!u) {
    $('status').innerHTML = '<span class="status-msg error">Please paste a playlist link first.</span>';
    return;
  }

  $('status').innerHTML = '<div class="spinner-box"><div class="spinner"></div><span class="spinner-text">Loading channels...</span></div>';
  const loadBtn = $('loadBtn');
  if (loadBtn) loadBtn.disabled = true;

  try {
    const r = await fetch('/api/channels?url=' + encodeURIComponent(u));
    if (!r.ok) {
      const err = await r.text();
      $('status').innerHTML = `<span class="status-msg error">${err || 'Could not load playlist'}</span>`;
      return;
    }
    all = await r.json();
    if (!all.length) {
      $('status').innerHTML = '<span class="status-msg error">No channels found in that link.</span>';
      return;
    }
    group = 'All'; limit = 120;
    savePlaylist(u, all);

    // Update or add in saved playlists list
    const nameInput = $('plNameInput');
    const customName = optionalName || (nameInput ? nameInput.value.trim() : '');
    const list = getPlaylists();
    const existing = list.find(x => x.url === u);
    if (existing) {
      if (customName) existing.name = customName;
      existing.channelsCount = all.length;
      setActivePlaylistId(existing.id);
    } else {
      const newId = 'pl_' + Date.now();
      const newEntry = {
        id: newId,
        name: customName || ('Playlist (' + all.length + ')'),
        url: u,
        channelsCount: all.length
      };
      list.unshift(newEntry);
      setActivePlaylistId(newId);
    }
    savePlaylists(list);

    $('status').innerHTML = `<span class="status-msg success">&#10003; ${all.length.toLocaleString()} channels loaded</span>`;
    buildGroups(); renderGrid(); stats();
    go('channels');
  } catch (e) {
    $('status').innerHTML = `<span class="status-msg error">Error: ${e.message}</span>`;
  } finally {
    if (loadBtn) loadBtn.disabled = false;
  }
}

function stats() {
  $('s1').textContent = all.length;
  $('s2').textContent = new Set(all.map(c => c.group)).size;
  $('s3').textContent = favs.length;
  const s4 = $('s4');
  if (s4) s4.textContent = getPlaylists().length;
}

// ---------- category chips ----------
function buildGroups() {
  const count = {};
  all.forEach(c => count[c.group] = (count[c.group] || 0) + 1);
  const names = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 25);
  const box = $('groups'); box.innerHTML = '';
  ['All', ...names].forEach(n => {
    const s = document.createElement('span');
    s.className = 'chip' + (n === group ? ' on' : '');
    s.textContent = n;
    s.onclick = () => { group = n; limit = 120; buildGroups(); renderGrid(); };
    box.appendChild(s);
  });
}

// ---------- channel card initials generator ----------
function getInitials(name) {
  if (!name) return 'TV';
  const clean = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  if (!clean) return 'TV';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
}

// ---------- channel cards & icons ----------
const HEART_OUTLINE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const HEART_FILL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

function heartIcon(c) { return isFav(c) ? HEART_FILL : HEART_OUTLINE; }
function heartText(c) { return isFav(c) ? '\u2665' : '\u2661'; }

function updateActiveCards() {
  document.querySelectorAll('.card').forEach(card => {
    const isPlaying = cur && card.dataset.url === cur.url;
    card.classList.toggle('playing', isPlaying);
    const overlay = card.querySelector('.card-play-overlay');
    if (overlay) {
      overlay.innerHTML = isPlaying
        ? '<span class="now-playing-badge"><span class="live-dot" style="width:6px;height:6px;"></span> PLAYING</span>'
        : '<span class="play-icon-badge">&#9654;</span>';
    }
  });
}

function makeCard(c) {
  const d = document.createElement('div');
  const isPlaying = cur && cur.url === c.url;
  d.className = 'card' + (isPlaying ? ' playing' : '');
  d.dataset.url = c.url;
  d.title = c.name + (c.group ? ' • ' + c.group : '');

  // Logo with fallback
  const lg = document.createElement('div');
  lg.className = 'lg';
  if (c.logo) {
    const img = document.createElement('img');
    img.src = c.logo;
    img.alt = c.name;
    img.loading = 'lazy';
    img.draggable = false;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      img.remove();
      lg.innerHTML = `<div class="card-fallback-logo"><span>${escapeHtml(getInitials(c.name))}</span></div>`;
    };
    lg.appendChild(img);
  } else {
    lg.innerHTML = `<div class="card-fallback-logo"><span>${escapeHtml(getInitials(c.name))}</span></div>`;
  }

  // Play / Playing overlay on hover
  const playOverlay = document.createElement('div');
  playOverlay.className = 'card-play-overlay';
  playOverlay.innerHTML = isPlaying
    ? '<span class="now-playing-badge"><span class="live-dot" style="width:6px;height:6px;"></span> PLAYING</span>'
    : '<span class="play-icon-badge">&#9654;</span>';
  lg.appendChild(playOverlay);

  // Meta
  const nm = document.createElement('div');
  nm.className = 'nm';
  nm.textContent = c.name;
  const gp = document.createElement('div');
  gp.className = 'gp';
  gp.textContent = c.group || 'General';

  // Heart Favorite Button
  const h = document.createElement('button');
  h.type = 'button';
  h.className = 'heart' + (isFav(c) ? ' on' : '');
  h.innerHTML = heartIcon(c);
  h.title = isFav(c) ? 'Remove from My List' : 'Add to My List';
  h.setAttribute('aria-label', h.title);
  h.onclick = ev => {
    ev.stopPropagation();
    toggleFav(c);
    const active = isFav(c);
    h.className = 'heart' + (active ? ' on' : '');
    h.innerHTML = heartIcon(c);
    h.title = active ? 'Remove from My List' : 'Add to My List';
    h.setAttribute('aria-label', h.title);
  };

  d.append(lg, nm, gp, h);
  d.onclick = () => play(c);
  return d;
}

function renderGrid() {
  const q = $('search').value.toLowerCase();
  const list = all.filter(c => (group === 'All' || c.group === group) && c.name.toLowerCase().includes(q));
  const g = $('grid'); g.innerHTML = '';
  if (!list.length) g.innerHTML = '<div class="empty">No channels to show. Load a playlist from Home.</div>';
  list.slice(0, limit).forEach(c => g.appendChild(makeCard(c)));
  $('more').style.display = list.length > limit ? 'block' : 'none';
}

// ---------- favourites (My List) ----------
function isFav(c) { return favs.some(f => f.url === c.url); }

function toggleFav(c) {
  if (!c) return;
  favs = isFav(c) ? favs.filter(f => f.url !== c.url) : [...favs, c];
  localStorage.setItem('cv_favs', JSON.stringify(favs));
  $('s3').textContent = favs.length;
  updateFavBtn();
  if ($('p-favs').classList.contains('on')) renderFavs();
}

function updateFavBtn() {
  const b = $('favBtn');
  if (b) b.textContent = cur && isFav(cur) ? '\u2665 In My List' : '\u2661 My List';
}

function renderFavs() {
  const g = $('favGrid'); g.innerHTML = '';
  if (!favs.length) g.innerHTML = '<div class="empty">Your list is empty. Tap the heart on any channel.</div>';
  favs.forEach(c => g.appendChild(makeCard(c)));
}

// ---------- player list & channel flipping ----------
function getActiveList() {
  if (all && all.length > 0) return all;
  if (favs && favs.length > 0) return favs;
  return [];
}

function nextChannel() {
  const list = getActiveList();
  if (!list.length) return;
  let idx = cur ? list.findIndex(c => c.url === cur.url) : -1;
  idx = idx === -1 ? 0 : (idx + 1) % list.length;
  play(list[idx]);
}

function prevChannel() {
  const list = getActiveList();
  if (!list.length) return;
  let idx = cur ? list.findIndex(c => c.url === cur.url) : -1;
  idx = idx === -1 ? 0 : (idx - 1 + list.length) % list.length;
  play(list[idx]);
}

// ---------- player spinner & status overlay ----------
function showPlayerSpinner(text = 'Connecting to live stream...') {
  const overlay = $('videoOverlay');
  const txt = $('playerSpinnerText');
  if (txt) txt.textContent = text;
  if (overlay) overlay.classList.add('on');
}

function hidePlayerSpinner() {
  const overlay = $('videoOverlay');
  if (overlay) overlay.classList.remove('on');
}

// ---------- player (with auto fallback & robust format handling) ----------
function play(c) {
  cur = c;
  go('watch', true);
  $('now').textContent = c.name;
  $('msg').innerHTML = '';
  updateFavBtn();
  updateActiveCards();

  const v = $('video');
  const directUrl = c.url;
  const proxyUrl = '/proxy?url=' + encodeURIComponent(c.url);

  // Attach video playback state listeners
  v.onplaying = () => {
    hidePlayerSpinner();
    $('msg').innerHTML = '';
  };
  v.onwaiting = () => {
    showPlayerSpinner('Buffering stream...');
  };
  v.oncanplay = () => {
    hidePlayerSpinner();
  };

  let retryCount = 0;

  function loadStream(streamUrl, isDirectFallback = false) {
    if (hls) {
      hls.destroy();
      hls = null;
    }

    showPlayerSpinner(isDirectFallback ? 'Connecting directly to stream...' : 'Connecting to live stream...');

    v.onerror = () => {
      if (!isDirectFallback) {
        console.warn('Proxy stream error, falling back to direct stream:', directUrl);
        $('msg').innerHTML = '<span>Relay stream slow, trying direct stream...</span>';
        loadStream(directUrl, true);
      } else {
        hidePlayerSpinner();
        $('msg').innerHTML = '<span>This stream is offline or blocked.</span> <button class="btn ghost btn-sm" onclick="play(cur)" style="margin-left:8px;">&#8635; Retry</button>';
      }
    };

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        manifestLoadingTimeOut: 12000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 12000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 4,
        xhrSetup: xhr => { xhr.withCredentials = false; }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        $('msg').innerHTML = '';
        v.play().catch(err => {
          if (err.name === 'NotAllowedError') {
            v.muted = true;
            v.play().then(() => {
              $('msg').innerHTML = '<span>Autoplay muted due to browser policy. Click video to unmute.</span>';
            }).catch(() => {});
          }
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              retryCount++;
              if (retryCount <= 2) {
                showPlayerSpinner(`Reconnecting stream (${retryCount}/2)...`);
                hls.startLoad();
              } else {
                if (!isDirectFallback) {
                  $('msg').innerHTML = '<span>Relay unavailable, switching to direct stream...</span>';
                  loadStream(directUrl, true);
                } else {
                  hidePlayerSpinner();
                  $('msg').innerHTML = '<span>Stream connection timed out.</span> <button class="btn ghost btn-sm" onclick="play(cur)" style="margin-left:8px;">&#8635; Retry</button>';
                }
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (!isDirectFallback) {
                $('msg').innerHTML = '<span>Switching to direct stream...</span>';
                loadStream(directUrl, true);
              } else {
                // If HLS failed, attempt direct native video (handles MP4/WebM/direct formats)
                hls.destroy();
                hls = null;
                v.src = streamUrl;
                v.play().catch(() => {
                  hidePlayerSpinner();
                  $('msg').innerHTML = '<span>Stream offline or blocked. Try another channel.</span> <button class="btn ghost btn-sm" onclick="play(cur)" style="margin-left:8px;">&#8635; Retry</button>';
                });
              }
              break;
          }
        }
      });
    } else {
      v.src = streamUrl;
      v.play().catch(err => {
        if (err.name === 'NotAllowedError') {
          v.muted = true;
          v.play().catch(() => {});
        }
      });
    }
  }

  loadStream(proxyUrl, false);
}

// ---------- fullscreen ----------
function toggleFullscreen() {
  const v = $('video');
  if (!v) return;
  const isFs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  if (isFs) {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } else {
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS
    else if (v.mozRequestFullScreen) v.mozRequestFullScreen();
    else if (v.msRequestFullscreen) v.msRequestFullscreen();
  }
}

function updateFsBtn() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  const btn = $('fsBtn');
  if (btn) {
    btn.innerHTML = isFs ? '&#x2922; Exit' : '&#x26F6; Fullscreen';
  }
}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
  document.addEventListener(ev, updateFsBtn);
});

// ---------- keyboard shortcuts ----------
document.addEventListener('keydown', e => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  if ($('p-watch') && $('p-watch').classList.contains('on')) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevChannel(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextChannel(); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
  }
});

// Stop player on tab / page unload
window.addEventListener('pagehide', stopPlayer);
window.addEventListener('beforeunload', stopPlayer);

// Initialize on page load
initTheme();
renderHomePlaylistChips();
renderPlaylistsPage();
const restored = restoreSavedPlaylist();
if (!restored) {
  stats();
}

// Setup initial history state & route
const initialPage = location.hash.replace('#', '') || 'home';
history.replaceState({ page: initialPage }, '', '#' + initialPage);
if (initialPage !== 'home') {
  go(initialPage, false, false);
}

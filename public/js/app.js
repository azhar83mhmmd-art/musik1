/* ── Hoktifyy App ───────────────────────────────────
   Professional Music Streaming PWA
   Features: YouTube Music API, LRCLIB Lyrics, PWA, Offline Support
*/

// ── State Management ─────────────────────────────
const state = {
  currentPage: 'home',
  currentSong: null,
  isPlaying: false,
  player: null,
  playerReady: false,
  ytApiLoaded: false,
  queue: [],
  queueIndex: 0,
  likedSongs: new Set(),
  recentlyPlayed: [],
  volume: 70,
  isShuffle: false,
  isRepeat: false,
  isLyricsOpen: false,
  isQueueOpen: false,
  isPlayerOpen: false,
  theme: localStorage.getItem('theme') || 'dark',
  searchQuery: '',
  searchTimeout: null,
  progressInterval: null,
  currentTime: 0,
  duration: 0,
  lyrics: [],
  lyricsSynced: false,
  installPrompt: null,
  isOffline: !navigator.onLine
};

// ── DOM Elements ─────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  app: $('#app'),
  sidebar: $('#sidebar'),
  sidebarOverlay: $('#sidebar-overlay'),
  menuToggle: $('#menu-toggle'),
  searchInput: $('#search-input'),
  searchClear: $('#search-clear'),
  searchBox: $('#search-box'),
  themeToggle: $('#theme-toggle'),
  installBtn: $('#install-btn'),
  contentWrapper: $('#content-wrapper'),
  views: $$('.view'),
  navLinks: $$('.nav-link'),
  miniPlayer: $('#mini-player'),
  miniImg: $('#mini-img'),
  miniName: $('#mini-name'),
  miniArtist: $('#mini-artist-name'),
  miniPlay: $('#mini-play'),
  miniPlayIcon: $('#mini-play-icon'),
  miniPauseIcon: $('#mini-pause-icon'),
  miniLike: $('#mini-like'),
  miniProgress: $('#mini-progress'),
  miniProgressFill: $('#mini-progress-fill'),
  playerOverlay: $('#player-overlay'),
  playerClose: $('#player-close'),
  playerArtwork: $('#player-artwork'),
  playerCoverImg: $('#player-cover-img'),
  playerTitle: $('#player-title'),
  playerArtist: $('#player-artist'),
  progressBar: $('#progress-bar'),
  progressFill: $('#progress-fill'),
  progressHandle: $('#progress-handle'),
  timeCurrent: $('#time-current'),
  timeTotal: $('#time-total'),
  btnPlay: $('#btn-play'),
  playIcon: $('#play-icon'),
  pauseIcon: $('#pause-icon'),
  btnPrev: $('#btn-prev'),
  btnNext: $('#btn-next'),
  btnShuffle: $('#btn-shuffle'),
  btnRepeat: $('#btn-repeat'),
  btnLike: $('#btn-like'),
  btnLyrics: $('#btn-lyrics'),
  btnQueue: $('#btn-queue'),
  lyricsPanel: $('#lyrics-panel'),
  lyricsContent: $('#lyrics-content'),
  lyricsClose: $('#lyrics-close'),
  queuePanel: $('#queue-panel'),
  queueList: $('#queue-list'),
  queueClose: $('#queue-close'),
  volumeSlider: $('#volume-slider'),
  volumeFill: $('#volume-fill'),
  toastContainer: $('#toast-container'),
  loadingOverlay: $('#loading-overlay'),
  miniCover: $('#mini-cover'),
  miniTitle: $('#mini-title'),
  miniArtist: $('#mini-artist'),
  likedCount: $('#liked-count'),
  likedCountText: $('#liked-count-text'),
  trendingGrid: $('#trending-grid'),
  moodGrid: $('#mood-grid'),
  moodCategories: $('#mood-categories'),
  searchResults: $('#search-results'),
  recentList: $('#recent-list'),
  recentViewList: $('#recent-view-list'),
  likedList: $('#liked-list'),
  trendingList: $('#trending-list'),
  libraryContent: $('#library-content')
};

// ── Mood Configurations ──────────────────────────
const MOODS = [
  { id: 'chill', name: 'Chill', color: '#8b5cf6', icon: '☁️', desc: 'Relax and unwind', query: 'chill relax music' },
  { id: 'focus', name: 'Focus', color: '#3b82f6', icon: '🎯', desc: 'Study & work beats', query: 'focus study lofi' },
  { id: 'workout', name: 'Workout', color: '#f97316', icon: '💪', desc: 'Pump up the energy', query: 'workout gym music' },
  { id: 'party', name: 'Party', color: '#ec4899', icon: '🎉', desc: 'Dance all night', query: 'party hits 2024' },
  { id: 'jazz', name: 'Jazz', color: '#f59e0b', icon: '🎷', desc: 'Smooth jazz vibes', query: 'jazz music relax' },
  { id: 'pop', name: 'Pop', color: '#10b981', icon: '🎤', desc: 'Top pop hits', query: 'pop hits 2024' },
  { id: 'kpop', name: 'K-Pop', color: '#ef4444', icon: '🇰🇷', desc: 'Korean pop hits', query: 'kpop 2024' },
  { id: 'rock', name: 'Rock', color: '#6366f1', icon: '🎸', desc: 'Rock anthems', query: 'rock hits' },
  { id: 'hiphop', name: 'Hip Hop', color: '#14b8a6', icon: '🎧', desc: 'Rap & hip hop', query: 'hip hop rap 2024' },
  { id: 'electronic', name: 'Electronic', color: '#06b6d4', icon: '⚡', desc: 'EDM & electronic', query: 'electronic dance music' },
  { id: 'classical', name: 'Classical', color: '#d946ef', icon: '🎼', desc: 'Timeless classics', query: 'classical music' },
  { id: 'gaming', name: 'Gaming', color: '#84cc16', icon: '🎮', desc: 'Game soundtracks', query: 'gaming music' }
];

// ── Utilities ────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';

  const icons = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    like: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
  };

  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  els.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// ── API Functions ────────────────────────────────
async function api(endpoint) {
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

async function searchMusic(query) {
  return api(`/api/smart-search?q=${encodeURIComponent(query)}`);
}

async function getTrending() {
  return api('/api/trending');
}

async function getMoodSongs(mood) {
  return api(`/api/mood/${mood}`);
}

async function getRelated(videoId) {
  return api(`/api/related/${videoId}`);
}

async function getLyrics(title, artist) {
  return api(`/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist || '')}`);
}

// ── YouTube Player ───────────────────────────────
function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.YT && window.YT.Player) {
      state.ytApiLoaded = true;
      resolve();
      return;
    }

    // Set up the global callback BEFORE loading the script
    window.onYouTubeIframeAPIReady = function() {
      state.ytApiLoaded = true;
      resolve();
    };

    // Create script element dynamically
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;

    // Handle load error
    tag.onerror = () => {
      console.warn('YouTube API failed to load');
      // Still resolve so app can function without player
      resolve();
    };

    // Fallback: if API doesn't load in 10 seconds, resolve anyway
    setTimeout(() => {
      if (!state.ytApiLoaded) {
        console.warn('YouTube API load timeout - app will work without audio');
        resolve();
      }
    }, 10000);

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });
}

function initYouTubePlayer() {
  if (!window.YT || !window.YT.Player) {
    console.warn('YT API not available, skipping player init');
    return;
  }

  try {
    state.player = new YT.Player('youtube-player', {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playsinline: 1
      },
      events: {
        onReady: () => { state.playerReady = true; },
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });
    console.log('YouTube player initialized');
  } catch (err) {
    console.error('Failed to init YouTube player:', err);
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    state.isPlaying = true;
    updatePlayButtons();
    startProgressUpdate();
    els.playerArtwork?.classList.add('playing');
  } else if (event.data === YT.PlayerState.PAUSED) {
    state.isPlaying = false;
    updatePlayButtons();
    stopProgressUpdate();
    els.playerArtwork?.classList.remove('playing');
  } else if (event.data === YT.PlayerState.ENDED) {
    handleSongEnd();
  }
}

function onPlayerError(event) {
  console.error('Player error:', event.data);
  showToast('Playback error. Skipping...', 'error');
  setTimeout(() => playNext(), 2000);
}

function startProgressUpdate() {
  stopProgressUpdate();
  state.progressInterval = setInterval(() => {
    if (!state.player || !state.player.getCurrentTime) return;
    state.currentTime = state.player.getCurrentTime() || 0;
    state.duration = state.player.getDuration() || 0;
    updateProgressUI();
    updateLyricsHighlight();
  }, 500);
}

function stopProgressUpdate() {
  if (state.progressInterval) {
    clearInterval(state.progressInterval);
    state.progressInterval = null;
  }
}

function updateProgressUI() {
  const pct = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  els.progressFill.style.width = `${pct}%`;
  els.miniProgressFill.style.width = `${pct}%`;
  els.timeCurrent.textContent = formatTime(state.currentTime);
  els.timeTotal.textContent = formatTime(state.duration);
}

function updatePlayButtons() {
  const isPlaying = state.isPlaying;

  if (isPlaying) {
    els.playIcon.style.display = 'none';
    els.pauseIcon.style.display = 'block';
    els.miniPlayIcon.style.display = 'none';
    els.miniPauseIcon.style.display = 'block';
  } else {
    els.playIcon.style.display = 'block';
    els.pauseIcon.style.display = 'none';
    els.miniPlayIcon.style.display = 'block';
    els.miniPauseIcon.style.display = 'none';
  }
}

// ── Playback Control ─────────────────────────────
function playSong(song, addToQueue = true) {
  if (!song || !song.id) return;

  state.currentSong = song;
  state.currentTime = 0;
  state.duration = 0;

  // Update UI
  updatePlayerUI(song);
  updateMiniPlayer(song);

  // Load in YouTube player
  if (state.playerReady && state.player?.loadVideoById) {
    state.player.loadVideoById(song.id);
    state.player.setVolume(state.volume);
  } else if (state.ytApiLoaded && state.player?.loadVideoById) {
    // Player exists but might not be fully ready
    state.player.loadVideoById(song.id);
    state.player.setVolume(state.volume);
  } else {
    console.warn('Player not ready, song queued for later playback');
  }

  // Add to recently played
  addToRecentlyPlayed(song);

  // Add to queue if not already there
  if (addToQueue) {
    const existingIndex = state.queue.findIndex(s => s.id === song.id);
    if (existingIndex === -1) {
      state.queue.push(song);
      state.queueIndex = state.queue.length - 1;
    } else {
      state.queueIndex = existingIndex;
    }
  }

  // Fetch lyrics
  fetchLyrics(song);

  // Show mini player
  els.miniPlayer.classList.remove('hidden');

  // Update like button
  updateLikeButton();

  showToast(`Now playing: ${song.title}`, 'info');
}

function togglePlay() {
  if (!state.playerReady || !state.currentSong) return;

  if (state.isPlaying) {
    state.player.pauseVideo();
  } else {
    state.player.playVideo();
  }
}

function playNext() {
  if (state.queue.length === 0) return;

  let nextIndex;
  if (state.isShuffle) {
    nextIndex = Math.floor(Math.random() * state.queue.length);
  } else {
    nextIndex = state.queueIndex + 1;
    if (nextIndex >= state.queue.length) {
      if (state.isRepeat) {
        nextIndex = 0;
      } else {
        return;
      }
    }
  }

  state.queueIndex = nextIndex;
  playSong(state.queue[nextIndex], false);
}

function playPrev() {
  if (state.queue.length === 0) return;

  let prevIndex = state.queueIndex - 1;
  if (prevIndex < 0) {
    if (state.isRepeat) {
      prevIndex = state.queue.length - 1;
    } else {
      return;
    }
  }

  state.queueIndex = prevIndex;
  playSong(state.queue[prevIndex], false);
}

function handleSongEnd() {
  if (state.isRepeat) {
    state.player.seekTo(0);
    state.player.playVideo();
  } else {
    playNext();
  }
}

function seekTo(percent) {
  if (!state.player || !state.duration) return;
  const time = (percent / 100) * state.duration;
  state.player.seekTo(time, true);
  state.currentTime = time;
  updateProgressUI();
}

function setVolume(percent) {
  state.volume = percent;
  if (state.playerReady) {
    state.player.setVolume(percent);
  }
  els.volumeFill.style.width = `${percent}%`;
}

// ── UI Updates ───────────────────────────────────
function updatePlayerUI(song) {
  els.playerTitle.textContent = song.title;
  els.playerArtist.textContent = song.artist;
  els.playerCoverImg.src = song.thumbnail || '';
  els.playerCoverImg.alt = song.title;

  // Update sidebar mini player
  els.miniCover.src = song.thumbnail || '';
  els.miniTitle.textContent = song.title;
  els.miniArtist.textContent = song.artist;
}

function updateMiniPlayer(song) {
  els.miniImg.src = song.thumbnail || '';
  els.miniName.textContent = song.title;
  els.miniArtist.textContent = song.artist;
}

function updateLikeButton() {
  const isLiked = state.currentSong && state.likedSongs.has(state.currentSong.id);

  if (isLiked) {
    els.btnLike.classList.add('active');
    els.miniLike.classList.add('liked');
  } else {
    els.btnLike.classList.remove('active');
    els.miniLike.classList.remove('liked');
  }
}

function toggleLike() {
  if (!state.currentSong) return;

  const song = state.currentSong;
  if (state.likedSongs.has(song.id)) {
    state.likedSongs.delete(song.id);
    showToast('Removed from liked songs', 'info');
  } else {
    state.likedSongs.add(song.id);
    showToast('Added to liked songs', 'like');
  }

  // Save to localStorage
  localStorage.setItem('likedSongs', JSON.stringify([...state.likedSongs]));

  updateLikeButton();
  updateLikedCount();
  renderLikedSongs();
}

function updateLikedCount() {
  const count = state.likedSongs.size;
  els.likedCount.textContent = count;
  els.likedCountText.textContent = `${count} song${count !== 1 ? 's' : ''}`;
}

function addToRecentlyPlayed(song) {
  // Remove if already exists
  state.recentlyPlayed = state.recentlyPlayed.filter(s => s.id !== song.id);
  // Add to front
  state.recentlyPlayed.unshift(song);
  // Keep only last 50
  if (state.recentlyPlayed.length > 50) {
    state.recentlyPlayed = state.recentlyPlayed.slice(0, 50);
  }
  // Save
  localStorage.setItem('recentlyPlayed', JSON.stringify(state.recentlyPlayed));
  // Render
  renderRecentlyPlayed();
}

// ── Lyrics ───────────────────────────────────────
async function fetchLyrics(song) {
  els.lyricsContent.innerHTML = '<div class="lyrics-loading"><div class="lyrics-loading-spinner"></div><p>Loading lyrics...</p></div>';

  try {
    const data = await getLyrics(song.title, song.artist);

    if (data.synced) {
      state.lyricsSynced = true;
      state.lyrics = parseSyncedLyrics(data.synced);
      renderSyncedLyrics();
    } else if (data.plain) {
      state.lyricsSynced = false;
      state.lyrics = [];
      renderPlainLyrics(data.plain);
    } else {
      state.lyrics = [];
      state.lyricsSynced = false;
      els.lyricsContent.innerHTML = '<p class="lyrics-empty">No lyrics available for this song</p>';
    }
  } catch (err) {
    els.lyricsContent.innerHTML = '<p class="lyrics-empty">No lyrics available for this song</p>';
  }
}

function parseSyncedLyrics(lrcText) {
  const lines = [];
  const regex = /\[(\d+):(\d+\.\d+)\](.*)/;

  lrcText.split('\n').forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      const text = match[3].trim();
      if (text) {
        lines.push({ time, text });
      }
    }
  });

  return lines.sort((a, b) => a.time - b.time);
}

function renderSyncedLyrics() {
  els.lyricsContent.innerHTML = '';

  state.lyrics.forEach((line, index) => {
    const div = document.createElement('div');
    div.className = 'lyrics-line';
    div.dataset.time = line.time;
    div.dataset.index = index;
    div.innerHTML = `<span class="lyrics-timestamp">${formatTime(line.time)}</span>${escapeHtml(line.text)}`;
    div.addEventListener('click', () => {
      seekTo((line.time / state.duration) * 100);
    });
    els.lyricsContent.appendChild(div);
  });
}

function renderPlainLyrics(text) {
  els.lyricsContent.innerHTML = `<div class="lyrics-plain">${escapeHtml(text)}</div>`;
}

function updateLyricsHighlight() {
  if (!state.lyricsSynced || state.lyrics.length === 0) return;

  const currentTime = state.currentTime;
  let activeIndex = -1;

  for (let i = 0; i < state.lyrics.length; i++) {
    if (state.lyrics[i].time <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  const lines = els.lyricsContent.querySelectorAll('.lyrics-line');
  lines.forEach((line, index) => {
    line.classList.remove('active', 'passed');
    if (index === activeIndex) {
      line.classList.add('active');
      line.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (index < activeIndex) {
      line.classList.add('passed');
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Rendering Functions ──────────────────────────
function createSongCard(song) {
  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <div class="card-image">
      <img src="${song.thumbnail || ''}" alt="${escapeHtml(song.title)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><rect fill=%22%23181818%22 width=%22400%22 height=%22400%22/><text fill=%22%23666%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>No Image</text></svg>'">
      <button class="card-play" data-id="${song.id}">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
    </div>
    <div class="card-title">${escapeHtml(song.title)}</div>
    <div class="card-artist">${escapeHtml(song.artist)}</div>
    ${song.duration ? `<div class="card-duration">${song.duration}</div>` : ''}
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-play')) {
      e.stopPropagation();
      playSong(song);
    } else {
      playSong(song);
    }
  });

  return card;
}

function createSongRow(song, index) {
  const row = document.createElement('div');
  row.className = 'song-row';
  row.innerHTML = `
    <div class="row-number">
      <span>${index + 1}</span>
      <button class="row-play">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
    </div>
    <div class="row-info">
      <img src="${song.thumbnail || ''}" alt="${escapeHtml(song.title)}" class="row-thumb" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22><rect fill=%22%23181818%22 width=%2244%22 height=%2244%22/></svg>'">
      <div class="row-text">
        <div class="row-title">${escapeHtml(song.title)}</div>
        <div class="row-artist">${escapeHtml(song.artist)}</div>
      </div>
    </div>
    <div class="row-album">${escapeHtml(song.album || '')}</div>
    <div class="row-duration">${song.duration || ''}</div>
    <div class="row-actions">
      <button class="row-action-btn ${state.likedSongs.has(song.id) ? 'liked' : ''}" data-action="like" data-id="${song.id}">
        <svg viewBox="0 0 24 24" fill="${state.likedSongs.has(song.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>
  `;

  row.addEventListener('click', (e) => {
    if (e.target.closest('.row-action-btn')) {
      const btn = e.target.closest('.row-action-btn');
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'like') {
        if (state.likedSongs.has(id)) {
          state.likedSongs.delete(id);
          btn.classList.remove('liked');
          btn.querySelector('svg').setAttribute('fill', 'none');
        } else {
          state.likedSongs.add(id);
          btn.classList.add('liked');
          btn.querySelector('svg').setAttribute('fill', 'currentColor');
        }
        localStorage.setItem('likedSongs', JSON.stringify([...state.likedSongs]));
        updateLikedCount();
      }
      return;
    }
    playSong(song);
  });

  return row;
}

function createMoodCard(mood) {
  const card = document.createElement('div');
  card.className = 'mood-card';
  card.style.background = `linear-gradient(135deg, ${mood.color}33, ${mood.color}11)`;
  card.innerHTML = `
    <div class="mood-overlay" style="background: linear-gradient(180deg, transparent 0%, ${mood.color}44 100%);">
      <span class="mood-name">${mood.icon} ${mood.name}</span>
    </div>
  `;

  card.addEventListener('click', () => {
    loadMoodSongs(mood.id);
  });

  return card;
}

function createMoodCategory(mood) {
  const card = document.createElement('div');
  card.className = 'mood-category';
  card.innerHTML = `
    <div class="mood-category-header" style="background: linear-gradient(135deg, ${mood.color}22, ${mood.color}44);">
      <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">${mood.icon}</div>
    </div>
    <div class="mood-category-body">
      <div class="mood-category-title">${mood.name}</div>
      <div class="mood-category-desc">${mood.desc}</div>
    </div>
  `;

  card.addEventListener('click', () => {
    loadMoodSongs(mood.id);
  });

  return card;
}

// ── Page Rendering ───────────────────────────────
async function renderHome() {
  // Load trending
  try {
    const data = await getTrending();
    els.trendingGrid.innerHTML = '';
    data.results.slice(0, 8).forEach(song => {
      els.trendingGrid.appendChild(createSongCard(song));
    });
  } catch (err) {
    console.error('Failed to load trending:', err);
  }

  // Load moods
  els.moodGrid.innerHTML = '';
  MOODS.slice(0, 6).forEach(mood => {
    els.moodGrid.appendChild(createMoodCard(mood));
  });

  // Load recently played
  renderRecentlyPlayed();
}

function renderRecentlyPlayed() {
  const recent = state.recentlyPlayed.slice(0, 10);

  els.recentList.innerHTML = '';
  els.recentViewList.innerHTML = '';

  if (recent.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.innerHTML = '<p style="color:var(--text-muted);padding:40px;">No recently played songs</p>';
    els.recentList.appendChild(empty.cloneNode(true));
    els.recentViewList.appendChild(empty);
    return;
  }

  recent.forEach((song, i) => {
    els.recentList.appendChild(createSongRow(song, i));
    els.recentViewList.appendChild(createSongRow(song, i));
  });
}

function renderLikedSongs() {
  const liked = [...state.likedSongs].map(id => {
    // Find song in recently played or queue
    return state.recentlyPlayed.find(s => s.id === id) || 
           state.queue.find(s => s.id === id) ||
           { id, title: 'Unknown', artist: 'Unknown', thumbnail: '' };
  }).filter(s => s);

  els.likedList.innerHTML = '';

  if (liked.length === 0) {
    els.likedList.innerHTML = '<div class="search-empty"><p style="color:var(--text-muted);padding:40px;">No liked songs yet</p></div>';
    return;
  }

  liked.forEach((song, i) => {
    els.likedList.appendChild(createSongRow(song, i));
  });
}

async function renderMoods() {
  els.moodCategories.innerHTML = '';
  MOODS.forEach(mood => {
    els.moodCategories.appendChild(createMoodCategory(mood));
  });
}

async function renderTrending() {
  try {
    els.trendingList.innerHTML = '<div class="search-empty"><div class="spinner" style="width:40px;height:40px;margin:0 auto 16px;"><div class="spinner-ring"></div></div><p>Loading trending...</p></div>';
    const data = await getTrending();
    els.trendingList.innerHTML = '';
    data.results.forEach((song, i) => {
      els.trendingList.appendChild(createSongRow(song, i));
    });
  } catch (err) {
    els.trendingList.innerHTML = '<div class="search-empty"><p style="color:var(--text-muted);padding:40px;">Failed to load trending songs</p></div>';
  }
}

async function loadMoodSongs(moodId) {
  const mood = MOODS.find(m => m.id === moodId);
  if (!mood) return;

  showToast(`Loading ${mood.name} playlist...`, 'info');

  try {
    const data = await getMoodSongs(moodId);

    // Create a temporary view for mood songs
    const viewId = `view-mood-${moodId}`;
    let view = $(`#${viewId}`);

    if (!view) {
      view = document.createElement('div');
      view.id = viewId;
      view.className = 'view';
      view.innerHTML = `
        <div class="view-header">
          <h1 class="view-title">${mood.icon} ${mood.name}</h1>
          <p class="view-subtitle">${mood.desc}</p>
        </div>
        <div class="song-list" id="mood-songs-${moodId}"></div>
      `;
      els.contentWrapper.appendChild(view);
    }

    // Switch to this view
    switchView(viewId.replace('view-', ''));

    const list = $(`#mood-songs-${moodId}`);
    list.innerHTML = '';
    data.results.forEach((song, i) => {
      list.appendChild(createSongRow(song, i));
    });

    // Add to queue
    state.queue = [...data.results];
    state.queueIndex = 0;

  } catch (err) {
    showToast('Failed to load mood playlist', 'error');
  }
}

// ── Search ───────────────────────────────────────
async function handleSearch(query) {
  if (!query.trim()) {
    els.searchResults.innerHTML = `
      <div class="search-empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h3>Search for Music</h3>
        <p>Find songs, artists, albums, or even lyrics</p>
      </div>
    `;
    return;
  }

  els.searchResults.innerHTML = '<div class="search-empty"><div class="spinner" style="width:40px;height:40px;margin:0 auto 16px;"><div class="spinner-ring"></div></div><p>Searching...</p></div>';

  try {
    const data = await searchMusic(query);

    if (data.results.length === 0) {
      els.searchResults.innerHTML = `
        <div class="search-empty">
          <h3>No results found</h3>
          <p>Try searching with different keywords</p>
        </div>
      `;
      return;
    }

    els.searchResults.innerHTML = '<div class="song-grid" id="search-results-grid"></div>';
    const grid = $('#search-results-grid');

    data.results.forEach(song => {
      grid.appendChild(createSongCard(song));
    });

    // Show lyric match indicator if applicable
    if (data.type === 'lyric' && data.lyricCount > 0) {
      showToast(`Found ${data.lyricCount} songs matching your lyrics`, 'success');
    }

  } catch (err) {
    els.searchResults.innerHTML = `
      <div class="search-empty">
        <h3>Search failed</h3>
        <p>Please check your connection and try again</p>
      </div>
    `;
  }
}

// ── Navigation ───────────────────────────────────
function switchView(page) {
  state.currentPage = page;

  // Update nav links
  els.navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Update views
  els.views.forEach(view => {
    view.classList.toggle('active', view.id === `view-${page}`);
  });

  // Close sidebar on mobile
  els.sidebar.classList.remove('open');
  els.sidebarOverlay.classList.remove('active');

  // Scroll to top
  els.contentWrapper.scrollTop = 0;

  // Load page data
  if (page === 'home') renderHome();
  if (page === 'moods') renderMoods();
  if (page === 'trending') renderTrending();
  if (page === 'liked') renderLikedSongs();
  if (page === 'library') renderLibrary();

  // Update URL without reload
  history.pushState({ page }, '', `#${page}`);
}

function renderLibrary() {
  els.libraryContent.innerHTML = '<div class="search-empty"><p style="color:var(--text-muted);padding:40px;">Library feature coming soon</p></div>';
}

// ── Theme ────────────────────────────────────────
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
  showToast(`Switched to ${state.theme} mode`, 'info');
}

// ── PWA Install ──────────────────────────────────
function handleInstallPrompt(e) {
  e.preventDefault();
  state.installPrompt = e;
  els.installBtn.style.display = 'flex';
}

async function installApp() {
  if (!state.installPrompt) return;
  state.installPrompt.prompt();
  const result = await state.installPrompt.userChoice;
  if (result.outcome === 'accepted') {
    showToast('Hoktifyy installed successfully!', 'success');
  }
  state.installPrompt = null;
  els.installBtn.style.display = 'none';
}

// ── Service Worker ───────────────────────────────
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  }
}

// ── Event Listeners ──────────────────────────────
function initEventListeners() {
  // Navigation
  els.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.page);
    });
  });

  // Mobile menu
  els.menuToggle.addEventListener('click', () => {
    els.sidebar.classList.toggle('open');
    els.sidebarOverlay.classList.toggle('active');
  });

  els.sidebarOverlay.addEventListener('click', () => {
    els.sidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('active');
  });

  // Search
  els.searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    els.searchClear.style.display = query ? 'flex' : 'none';

    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => {
      if (query) {
        switchView('search');
        handleSearch(query);
      }
    }, 400);
  });

  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    els.searchClear.style.display = 'none';
    els.searchResults.innerHTML = `
      <div class="search-empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h3>Search for Music</h3>
        <p>Find songs, artists, albums, or even lyrics</p>
      </div>
    `;
  });

  // Mobile search toggle
  $('#search-toggle')?.addEventListener('click', () => {
    els.searchBox.style.display = els.searchBox.style.display === 'none' ? 'flex' : 'none';
    if (els.searchBox.style.display !== 'none') {
      els.searchInput.focus();
    }
  });

  // Theme
  els.themeToggle.addEventListener('click', toggleTheme);

  // Install
  els.installBtn.addEventListener('click', installApp);
  window.addEventListener('beforeinstallprompt', handleInstallPrompt);

  // Player controls
  els.miniPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
  });

  els.miniSong.addEventListener('click', () => {
    if (state.currentSong) {
      els.playerOverlay.classList.add('active');
      state.isPlayerOpen = true;
    }
  });

  els.miniLike.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLike();
  });

  els.btnPlay.addEventListener('click', togglePlay);
  els.btnNext.addEventListener('click', playNext);
  els.btnPrev.addEventListener('click', playPrev);

  els.btnShuffle.addEventListener('click', () => {
    state.isShuffle = !state.isShuffle;
    els.btnShuffle.classList.toggle('active', state.isShuffle);
    showToast(state.isShuffle ? 'Shuffle on' : 'Shuffle off', 'info');
  });

  els.btnRepeat.addEventListener('click', () => {
    state.isRepeat = !state.isRepeat;
    els.btnRepeat.classList.toggle('active', state.isRepeat);
    showToast(state.isRepeat ? 'Repeat on' : 'Repeat off', 'info');
  });

  els.btnLike.addEventListener('click', toggleLike);

  // Player overlay
  els.playerClose.addEventListener('click', () => {
    els.playerOverlay.classList.remove('active');
    state.isPlayerOpen = false;
  });

  els.playerOverlay.addEventListener('click', (e) => {
    if (e.target === els.playerOverlay || e.target === els.playerBackdrop) {
      els.playerOverlay.classList.remove('active');
      state.isPlayerOpen = false;
    }
  });

  // Progress bar
  els.progressBar.addEventListener('click', (e) => {
    const rect = els.progressBar.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(percent);
  });

  els.miniProgress.addEventListener('click', (e) => {
    const rect = els.miniProgress.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(percent);
  });

  // Volume
  els.volumeSlider.addEventListener('click', (e) => {
    const rect = els.volumeSlider.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setVolume(Math.max(0, Math.min(100, percent)));
  });

  // Lyrics
  els.btnLyrics.addEventListener('click', () => {
    els.lyricsPanel.classList.toggle('active');
    state.isLyricsOpen = els.lyricsPanel.classList.contains('active');
  });

  els.lyricsClose.addEventListener('click', () => {
    els.lyricsPanel.classList.remove('active');
    state.isLyricsOpen = false;
  });

  // Queue
  els.btnQueue.addEventListener('click', () => {
    els.queuePanel.classList.toggle('active');
    state.isQueueOpen = els.queuePanel.classList.contains('active');
    renderQueue();
  });

  els.queueClose.addEventListener('click', () => {
    els.queuePanel.classList.remove('active');
    state.isQueueOpen = false;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        if (e.shiftKey) playNext();
        break;
      case 'ArrowLeft':
        if (e.shiftKey) playPrev();
        break;
      case 'KeyL':
        toggleLike();
        break;
      case 'KeyM':
        toggleTheme();
        break;
    }
  });

  // Online/Offline
  window.addEventListener('online', () => {
    state.isOffline = false;
    showToast('Back online', 'success');
  });

  window.addEventListener('offline', () => {
    state.isOffline = true;
    showToast('You are offline', 'error');
  });

  // Pop state
  window.addEventListener('popstate', (e) => {
    if (e.state?.page) {
      switchView(e.state.page);
    }
  });

  // Hero buttons
  $('#hero-play-btn')?.addEventListener('click', () => {
    switchView('trending');
  });

  $('#hero-mood-btn')?.addEventListener('click', () => {
    switchView('moods');
  });

  // Section links
  $$('.section-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.page);
    });
  });
}

function renderQueue() {
  els.queueList.innerHTML = '';

  if (state.queue.length === 0) {
    els.queueList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">Queue is empty</p>';
    return;
  }

  state.queue.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = `queue-item ${index === state.queueIndex ? 'active' : ''}`;
    item.innerHTML = `
      <img src="${song.thumbnail || ''}" alt="${escapeHtml(song.title)}" onerror="this.style.display='none'">
      <div class="queue-item-info">
        <div class="queue-item-title">${escapeHtml(song.title)}</div>
        <div class="queue-item-artist">${escapeHtml(song.artist)}</div>
      </div>
      <button class="queue-item-remove" data-index="${index}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.queue-item-remove')) {
        const idx = parseInt(e.target.closest('.queue-item-remove').dataset.index);
        state.queue.splice(idx, 1);
        if (state.queueIndex >= idx) state.queueIndex--;
        renderQueue();
        return;
      }
      state.queueIndex = index;
      playSong(song, false);
    });

    els.queueList.appendChild(item);
  });
}

// ── Initialization ───────────────────────────────
async function init() {
  console.log('🎵 Hoktifyy initializing...');

  // Load saved data
  try {
    const savedLiked = localStorage.getItem('likedSongs');
    if (savedLiked) {
      state.likedSongs = new Set(JSON.parse(savedLiked));
    }

    const savedRecent = localStorage.getItem('recentlyPlayed');
    if (savedRecent) {
      state.recentlyPlayed = JSON.parse(savedRecent);
    }

    const savedVolume = localStorage.getItem('volume');
    if (savedVolume) {
      state.volume = parseInt(savedVolume);
      els.volumeFill.style.width = `${state.volume}%`;
    }
  } catch (e) {
    console.warn('Failed to load localStorage data:', e);
  }

  // Apply theme
  document.documentElement.setAttribute('data-theme', state.theme);

  // Update liked count
  updateLikedCount();

  // Init event listeners
  initEventListeners();

  // Register service worker
  registerServiceWorker();

  // Load YouTube API in background (non-blocking)
  loadYouTubeAPI().then(() => {
    console.log('YouTube API loaded, initializing player...');
    initYouTubePlayer();
  }).catch(err => {
    console.warn('YouTube API load failed:', err);
  });

  // Handle initial route
  const hash = window.location.hash.slice(1);
  if (hash && $(`#view-${hash}`)) {
    switchView(hash);
  } else {
    renderHome();
  }

  // ALWAYS hide loading overlay after a short delay - never get stuck
  // This is the critical fix - the loading overlay must always hide
  setTimeout(() => {
    els.loadingOverlay.classList.add('hidden');
    console.log('🎵 Hoktifyy ready!');
  }, 800);

  // Backup: force hide after 3 seconds no matter what
  setTimeout(() => {
    if (!els.loadingOverlay.classList.contains('hidden')) {
      els.loadingOverlay.classList.add('hidden');
      console.warn('Loading overlay force-hidden after timeout');
    }
  }, 3000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

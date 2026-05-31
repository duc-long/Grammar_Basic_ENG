// ========================================================
// Grammar Master — app.js  v2.4
// IntelliJ IDE style | Navigation, Sidebar, Timer & Stats
// ========================================================

'use strict';

// ── Topic metadata ──
const TOPICS = [
  {
    id: 'cau-tao-tu',
    file: 'Cấu tạo từ.json',
    name: 'Cấu Tạo Từ',
    desc: 'Word Formation',
    icon: 'fa-puzzle-piece',
    color: '#4d9de0',
    bg:   'rgba(77,157,224,0.1)'
  },
  {
    id: 'danh-tu',
    file: 'Danh từ.json',
    name: 'Danh Từ',
    desc: 'Nouns',
    icon: 'fa-tag',
    color: '#57c97d',
    bg:   'rgba(87,201,125,0.1)'
  },
  {
    id: 'lien-tu',
    file: 'Liên từ.json',
    name: 'Liên Từ',
    desc: 'Conjunctions',
    icon: 'fa-link',
    color: '#e6b450',
    bg:   'rgba(230,180,80,0.1)'
  },
  {
    id: 'tu-chi-so-luong',
    file: 'Từ chỉ số lượng.json',
    name: 'Từ Chỉ Số Lượng',
    desc: 'Quantifiers',
    icon: 'fa-hashtag',
    color: '#f4524d',
    bg:   'rgba(244,82,77,0.1)'
  },
  {
    id: 'tu-loai',
    file: 'Từ loại.json',
    name: 'Từ Loại',
    desc: 'Parts of Speech',
    icon: 'fa-shapes',
    color: '#9876aa',
    bg:   'rgba(152,118,170,0.1)'
  },
  {
    id: 'dai-tu',
    file: 'Đại từ.json',
    name: 'Đại Từ',
    desc: 'Pronouns',
    icon: 'fa-user',
    color: '#29d7d7',
    bg:   'rgba(41,215,215,0.1)'
  },
  {
    id: 'dong-tu',
    file: 'Động từ.json',
    name: 'Động Từ',
    desc: 'Verbs',
    icon: 'fa-bolt',
    color: '#e6b450',
    bg:   'rgba(230,180,80,0.08)'
  }
];

// ── Learning Phases Metadata ──
const PHASES = [
  {
    title: 'Chặng 1: Nền Tảng Ngữ Pháp',
    desc: 'Tìm hiểu cách cấu tạo từ và nhận biết các loại từ loại cơ bản trong tiếng Anh.',
    topics: ['cau-tao-tu', 'tu-loai'],
    icon: 'fa-graduation-cap',
    color: '#4d9de0'
  },
  {
    title: 'Chặng 2: Thành Phần Cốt Lõi',
    desc: 'Làm quen với các thành phần cốt lõi tạo nên cụm danh từ, đại từ và số lượng.',
    topics: ['danh-tu', 'dai-tu', 'tu-chi-so-luong'],
    icon: 'fa-cubes',
    color: '#57c97d'
  },
  {
    title: 'Chặng 3: Động Từ & Kết Nối Câu',
    desc: 'Làm chủ động từ và liên từ để kết nối ý và xây dựng câu phức tạp hơn.',
    topics: ['dong-tu', 'lien-tu'],
    icon: 'fa-rocket',
    color: '#e6b450'
  }
];

// ── App State ──
const state = {
  allQuestions: {},
  quizQuestions: [],
  currentIdx: 0,
  score: 0,
  wrongAnswers: [],
  currentTopic: null,
  selectedCount: 20,
  shuffle: true,
  streak: 0,
  stats: loadStats(),
  timerInterval: null,
  timerDuration: 30,
  mode: 'practice', // 'practice', 'survival', 'bug_hunt'
  lives: 3,
  bugIndex: -1,
  bugText: '',
  sentenceWords: [],
  bugDetected: false,
  bugSolved: false,
  quizStartTime: 0
};

// ── LocalStorage helpers ──
function loadStats() {
  let stats = {
    totalCorrect: 0,
    totalAttempted: 0,
    progress: {},
    streakDays: 0,
    lastStudyDate: null,
    activityHistory: {},
    gems: 0,
    commits: {},
    unlockedThemes: ['darcula'],
    activeTheme: 'darcula',
    speedrecords: {}
  };
  try {
    const saved = JSON.parse(localStorage.getItem('toeicStats'));
    if (saved) {
      stats = { ...stats, ...saved };
      if (!stats.progress) stats.progress = {};
      if (!stats.activityHistory) stats.activityHistory = {};
      if (!stats.commits) stats.commits = {};
      if (!stats.unlockedThemes) stats.unlockedThemes = ['darcula'];
      if (!stats.speedrecords) stats.speedrecords = {};
    }
  } catch {
    // Ignore error
  }
  return stats;
}

function saveStats() {
  localStorage.setItem('toeicStats', JSON.stringify(state.stats));
}

function getTopicProgress(topicId) {
  const p = state.stats.progress[topicId];
  if (!p || !p.attempted) return 0;
  return Math.round((p.correct / p.attempted) * 100);
}

// ── Dynamic Theme Marketplace logic ──
function applyTheme(themeName) {
  document.body.classList.remove('theme-monokai', 'theme-github-light', 'theme-onedark');
  if (themeName && themeName !== 'darcula') {
    document.body.classList.add(`theme-${themeName}`);
  }
  state.stats.activeTheme = themeName;
  saveStats();
}

function buyTheme(themeId, cost) {
  const gems = state.stats.gems || 0;
  if (gems < cost) {
    Toast.error(`Bạn cần thêm <strong>${cost - gems} Gems</strong> để mở khóa theme này!`, 'Không đủ Gems');
    return;
  }
  state.stats.gems -= cost;
  if (!state.stats.unlockedThemes) {
    state.stats.unlockedThemes = ['darcula'];
  }
  state.stats.unlockedThemes.push(themeId);
  Toast.success(`Đã mở khóa thành công theme <strong>${themeId}</strong>!`, 'Thành công');
  applyTheme(themeId);
  buildHome();
  updateUIStats();
}

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
const Toast = (() => {
  const container = () => document.getElementById('toast-container');

  const ICONS = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info'
  };
  const TITLES = {
    success: 'Thành công',
    error:   'Lỗi',
    warning: 'Cảnh báo',
    info:    'Thông báo'
  };
  const DURATION = { success: 3000, info: 3500, warning: 4000, error: 5000 };

  function show(type, message, title, duration) {
    const dur   = duration || DURATION[type] || 3000;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
      <i class="fa-solid ${ICONS[type]} toast-icon"></i>
      <div class="toast-body">
        <div class="toast-title">${title || TITLES[type]}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" aria-label="Đóng">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="toast-timer" style="animation-duration: ${dur}ms"></div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));
    container().appendChild(toast);

    // Auto-dismiss
    setTimeout(() => dismiss(toast), dur);
    return toast;
  }

  function dismiss(toast) {
    if (!toast || toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 250);
  }

  return {
    success: (msg, title, dur) => show('success', msg, title, dur),
    error:   (msg, title, dur) => show('error',   msg, title, dur),
    warning: (msg, title, dur) => show('warning', msg, title, dur),
    info:    (msg, title, dur) => show('info',    msg, title, dur),
  };
})();

// ============================================================
// MODAL CONFIRM SYSTEM
// ============================================================
const Modal = (() => {
  let _resolve = null;

  function show({ title = 'Xác nhận', body = 'Bạn có chắc chắn?', confirmText = 'Xác nhận', cancelText = 'Huỷ', isDanger = true } = {}) {
    return new Promise(resolve => {
      _resolve = resolve;

      document.getElementById('modal-title').textContent  = title;
      document.getElementById('modal-body').innerHTML     = body;
      document.getElementById('modal-confirm').textContent = confirmText;
      document.getElementById('modal-cancel').textContent  = cancelText;

      const confirmBtn = document.getElementById('modal-confirm');
      confirmBtn.className = `mbtn ${isDanger ? 'confirm' : 'confirm-safe'}`;

      const overlay = document.getElementById('modal-overlay');
      overlay.style.display = 'flex';
      overlay.classList.remove('hiding');

      // Focus confirm button
      setTimeout(() => confirmBtn.focus(), 100);
    });
  }

  function close(result) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hiding');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
    if (_resolve) { _resolve(result); _resolve = null; }
  }

  return { show, close };
})();

// ── Screen/Panel navigation ──
function showPanel(panelId) {
  // Stop timer if switching away from the active quiz screen
  if (panelId !== 'quiz') {
    stopTimer();
  }

  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  // Show target panel
  const panel = document.getElementById(`panel-${panelId}`);
  if (panel) {
    panel.classList.add('active');
  }

  // Update header navigation active tab
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  let tabId = '';
  if (panelId === 'dashboard') tabId = 'ntab-dashboard';
  else if (panelId === 'roadmap') tabId = 'ntab-roadmap';
  else if (panelId === 'stats') tabId = 'ntab-stats';
  else if (['quiz', 'setup', 'results'].includes(panelId)) tabId = 'ntab-quiz';

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Resume timer if entering quiz panel and question is not yet answered
  if (panelId === 'quiz') {
    const nextBtn = document.getElementById('next-btn');
    const isAnswered = nextBtn && nextBtn.classList.contains('visible');
    const hasQuizInProgress = state.quizQuestions.length > 0 && state.currentIdx < state.quizQuestions.length;
    if (hasQuizInProgress && !isAnswered) {
      resumeTimer();
    }
  }

  // Scroll to top
  const panelScroll = panel ? panel.querySelector('.panel-scroll') : null;
  if (panelScroll) {
    panelScroll.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Refresh dynamic dashboard UI components if needed
  if (panelId === 'dashboard') {
    buildFeaturedTopics();
    buildHeatmap();
  }
}

// ── Sidebar toggling ──
function toggleSidebar() {
  const appLayout = document.getElementById('app-layout');
  if (!appLayout) return;

  const isOpen = appLayout.classList.contains('sidebar-open');
  if (isOpen) {
    appLayout.classList.remove('sidebar-open');
    appLayout.classList.add('sidebar-closed');
    localStorage.setItem('toeicSidebarOpen', 'false');
  } else {
    appLayout.classList.remove('sidebar-closed');
    appLayout.classList.add('sidebar-open');
    localStorage.setItem('toeicSidebarOpen', 'true');
  }
}

// ── Background canvas animation ──
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.15
    };
  }

  resize();
  for (let i = 0; i < 60; i++) particles.push(createParticle());
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,157,224,${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(77,157,224,${0.06 * (1 - dist / 90)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ── Load data from embedded window.TOEIC_DATA ──
async function loadAllTopics() {
  if (typeof window.TOEIC_DATA === 'undefined') {
    Toast.error('Không tìm thấy data.js. Vui lòng kiểm tra lại file.', 'Lỗi tải dữ liệu');
    TOPICS.forEach(t => { state.allQuestions[t.id] = []; });
    return;
  }
  TOPICS.forEach(topic => {
    state.allQuestions[topic.id] = window.TOEIC_DATA[topic.id] || [];
  });

  const total = Object.values(state.allQuestions).reduce((s, q) => s + q.length, 0);
  document.getElementById('sb-loaded').textContent = `${total} questions loaded`;
}

// ── Update statistics indicators in UI ──
function updateUIStats() {
  const attempted = state.stats.totalAttempted || 0;
  const correct = state.stats.totalCorrect || 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const streak = state.stats.streakDays || 0;
  const gems = state.stats.gems || 0;

  // Header stats
  const hdrStreak = document.getElementById('hdr-streak');
  if (hdrStreak) hdrStreak.textContent = streak;
  const hdrGems = document.getElementById('hdr-gems');
  if (hdrGems) hdrGems.textContent = gems;
  const hdrAcc = document.getElementById('hdr-accuracy');
  if (hdrAcc) hdrAcc.textContent = accuracy + '%';

  // Sidebar stats
  const sbCorrect = document.getElementById('sb-correct');
  if (sbCorrect) sbCorrect.textContent = correct;
  const sbPct = document.getElementById('sb-pct');
  if (sbPct) sbPct.textContent = accuracy + '%';
  const sbStreak = document.getElementById('sb-streak');
  if (sbStreak) sbStreak.textContent = streak;

  // Dashboard stats
  const dashAcc = document.getElementById('dash-accuracy');
  if (dashAcc) dashAcc.textContent = accuracy + '%';
  const dashCorrect = document.getElementById('dash-correct');
  if (dashCorrect) dashCorrect.textContent = correct;
  const dashAttempted = document.getElementById('dash-attempted');
  if (dashAttempted) dashAttempted.textContent = attempted;
  const dashStreak = document.getElementById('dash-streak');
  if (dashStreak) dashStreak.textContent = streak + ' ngày';
}

// ── Build Sidebar topics list ──
function buildSidebarTopics() {
  const container = document.getElementById('sb-topics');
  if (!container) return;
  container.innerHTML = '';

  TOPICS.forEach(topic => {
    const pct = getTopicProgress(topic.id);
    const item = document.createElement('div');
    item.className = 'sb-topic-item';
    if (state.currentTopic === topic.id) {
      item.classList.add('active-topic');
    }
    item.style.setProperty('--topic-color', topic.color);
    item.style.setProperty('--topic-bg', topic.bg);

    item.innerHTML = `
      <div class="sb-t-icon"><i class="fa-solid ${topic.icon}"></i></div>
      <div class="sb-t-body">
        <div class="sb-t-name">${topic.name}</div>
        <div class="sb-t-mini-bar">
          <div class="sb-t-mini-fill" style="width: ${pct}%"></div>
        </div>
      </div>
      <div class="sb-t-pct">${pct}%</div>
    `;
    item.addEventListener('click', async () => {
      await openSetup(topic.id);
    });
    container.appendChild(item);
  });
}

// ── Build Featured topics cards on Dashboard ──
function buildFeaturedTopics() {
  const container = document.getElementById('featured-topics');
  if (!container) return;
  container.innerHTML = '';

  // Use first 3 topics for featured section
  const featured = TOPICS.slice(0, 3);
  featured.forEach(topic => {
    const pct = getTopicProgress(topic.id);
    const card = document.createElement('div');
    card.className = 'feat-card';
    card.style.setProperty('--topic-color', topic.color);
    card.innerHTML = `
      <div class="feat-card-icon"><i class="fa-solid ${topic.icon}"></i></div>
      <div class="feat-card-name">${topic.name}</div>
      <div class="feat-card-bar">
        <div class="feat-card-fill" style="width: ${pct}%"></div>
      </div>
      <div class="feat-card-pct">${pct}% chính xác</div>
    `;
    card.addEventListener('click', async () => {
      await openSetup(topic.id);
    });
    container.appendChild(card);
  });
}

// ── Build Activity Heatmap on Dashboard ──
function buildHeatmap() {
  const wrap = document.getElementById('week-heatmap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const activity = state.stats.activityHistory || {};
  const today = new Date();

  // Draw 7 days ending today
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    const count = activity[dateString] || 0;

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = dayNames[d.getDay()];
    const dayNum = d.getDate();

    const isToday = i === 0;
    const isActive = count > 0;

    let dayClass = 'hm-day';
    if (isActive) dayClass += ' active';
    if (isToday) dayClass += ' today';

    const dayEl = document.createElement('div');
    dayEl.className = dayClass;
    dayEl.title = `${dateString}: ${count} câu đã luyện`;
    dayEl.innerHTML = `
      <div class="hm-day-name">${dayName}</div>
      <div class="hm-day-dot"></div>
      <div class="hm-day-n">${dayNum}</div>
    `;
    wrap.appendChild(dayEl);
  }
}

// ── Build Stats view ──
function buildStats() {
  const attempted = state.stats.totalAttempted || 0;
  const correct = state.stats.totalCorrect || 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const streak = state.stats.streakDays || 0;

  // Render stats summary cards
  const grid = document.getElementById('stats-big-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="sbg-card">
        <div class="sbg-val" style="color:var(--accent)">${accuracy}%</div>
        <div class="sbg-lbl">Độ chính xác</div>
      </div>
      <div class="sbg-card">
        <div class="sbg-val" style="color:var(--green)">${correct}</div>
        <div class="sbg-lbl">Câu đúng</div>
      </div>
      <div class="sbg-card">
        <div class="sbg-val" style="color:var(--yellow)">${attempted}</div>
        <div class="sbg-lbl">Câu đã luyện</div>
      </div>
      <div class="sbg-card">
        <div class="sbg-val" style="color:var(--purple)">${streak} ngày</div>
        <div class="sbg-lbl">Streak hiện tại</div>
      </div>
    `;
  }

  // Render topic detail breakdown
  const breakdown = document.getElementById('topic-breakdown');
  if (breakdown) {
    breakdown.innerHTML = '';
    TOPICS.forEach(topic => {
      const p = state.stats.progress[topic.id] || { correct: 0, attempted: 0 };
      const pct = p.attempted > 0 ? Math.round((p.correct / p.attempted) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'tb-row';
      row.innerHTML = `
        <div class="tb-top">
          <div class="tb-name" style="color:${topic.color}">
            <i class="fa-solid ${topic.icon}"></i> ${topic.name}
          </div>
          <div class="tb-nums">${p.correct}/${p.attempted} câu &bull; <strong style="color:${topic.color}">${pct}%</strong></div>
        </div>
        <div class="tb-bar">
          <div class="tb-fill" style="width:${pct}%; background:${topic.color}"></div>
        </div>
      `;
      breakdown.appendChild(row);
    });
  }
}

// ── Build Github-style contribution grid ──
function buildContributionGrid(container) {
  container.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'contrib-header';
  
  let totalCommits = 0;
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 125); // 18 weeks * 7 days - 1 = 125 days ago
  
  const commits = state.stats.commits || {};
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    totalCommits += commits[dateStr] || 0;
  }
  
  header.innerHTML = `
    <div class="contrib-title">
      <i class="fa-solid fa-code-commit"></i> Lịch sử Commit Ngữ pháp
    </div>
    <div class="contrib-subtitle">
      Tổng cộng: <strong>${totalCommits} commits</strong> (câu đúng) trong 18 tuần qua
    </div>
  `;
  container.appendChild(header);
  
  const gridWrapper = document.createElement('div');
  gridWrapper.className = 'contrib-grid-wrapper';
  
  const grid = document.createElement('div');
  grid.className = 'contrib-grid';
  
  const gridStart = new Date(startDate);
  const startDay = gridStart.getDay();
  gridStart.setDate(gridStart.getDate() - startDay); // Align grid to start on Sunday
  
  const totalCells = 18 * 7;
  
  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    
    const dateStr = cellDate.toISOString().split('T')[0];
    const count = commits[dateStr] || 0;
    
    let lvl = 0;
    if (count > 0 && count <= 5) lvl = 1;
    else if (count > 5 && count <= 10) lvl = 2;
    else if (count > 10 && count <= 20) lvl = 3;
    else if (count > 20) lvl = 4;
    
    const cell = document.createElement('div');
    cell.className = `contrib-cell lvl-${lvl}`;
    
    const dd = String(cellDate.getDate()).padStart(2, '0');
    const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
    const yyyy = cellDate.getFullYear();
    const viDate = `${dd}/${mm}/${yyyy}`;
    
    cell.setAttribute('data-tooltip', `${count} commit${count !== 1 ? 's' : ''} ngày ${viDate}`);
    grid.appendChild(cell);
  }
  
  gridWrapper.appendChild(grid);
  container.appendChild(gridWrapper);
}

// ── Build Theme Marketplace screen ──
function buildThemeMarket(container) {
  container.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'theme-market-hdr';
  header.innerHTML = `
    <div class="theme-market-title">
      <i class="fa-solid fa-store"></i> Cửa Hàng Theme IDE
    </div>
    <div class="theme-market-gems">
      <i class="fa-solid fa-gem" style="color:#29d7d7"></i>
      <span><strong>${state.stats.gems || 0}</strong> Gems</span>
    </div>
  `;
  container.appendChild(header);
  
  const grid = document.createElement('div');
  grid.className = 'theme-grid';
  
  const THEMES_LIST = [
    { id: 'darcula', name: 'Darcula', desc: 'Mặc định IntelliJ tối', cost: 0, preview: ['#1e1f22', '#2b2d30', '#4d9de0'] },
    { id: 'monokai', name: 'Monokai', desc: 'Đen neon cổ điển', cost: 200, preview: ['#1b1c18', '#272822', '#f92672'] },
    { id: 'github-light', name: 'GitHub Light', desc: 'Trắng sáng thanh lịch', cost: 300, preview: ['#f6f8fa', '#ffffff', '#0969da'] },
    { id: 'onedark', name: 'One Dark Pro', desc: 'Xanh xám hiện đại', cost: 400, preview: ['#1e2227', '#282c34', '#61afef'] }
  ];
  
  const unlocked = state.stats.unlockedThemes || ['darcula'];
  const active = state.stats.activeTheme || 'darcula';
  
  THEMES_LIST.forEach(t => {
    const card = document.createElement('div');
    card.className = 'theme-card';
    if (active === t.id) card.classList.add('active-theme');
    
    const isUnlocked = unlocked.includes(t.id);
    
    let buttonHtml = '';
    if (active === t.id) {
      buttonHtml = `<button class="theme-btn btn-active" disabled><i class="fa-solid fa-circle-check"></i> Đang dùng</button>`;
    } else if (isUnlocked) {
      buttonHtml = `<button class="theme-btn btn-apply" data-id="${t.id}"><i class="fa-solid fa-square-check"></i> Áp dụng</button>`;
    } else {
      buttonHtml = `<button class="theme-btn btn-buy" data-id="${t.id}" data-cost="${t.cost}"><i class="fa-solid fa-gem"></i> Mua ${t.cost}</button>`;
    }
    
    card.innerHTML = `
      <div class="theme-preview-box" style="background: ${t.preview[0]}">
        <span style="background: ${t.preview[1]}"></span>
        <span style="background: ${t.preview[2]}"></span>
      </div>
      <div class="theme-info">
        <div class="theme-name">${t.name}</div>
        <div class="theme-desc">${t.desc}</div>
      </div>
      ${buttonHtml}
    `;
    
    const applyBtn = card.querySelector('.btn-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        applyTheme(t.id);
        buildHome();
        Toast.success(`Đã đổi sang giao diện <strong>${t.name}</strong>!`, 'Đã áp dụng');
      });
    }
    
    const buyBtn = card.querySelector('.btn-buy');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        buyTheme(t.id, t.cost);
      });
    }
    
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
}

// ── Build Home (Roadmap) screen ──
function buildHome() {
  updateUIStats();

  // 1. Render Contribution Grid
  const contribSec = document.getElementById('contrib-section');
  if (contribSec) {
    buildContributionGrid(contribSec);
  }

  // 2. Render Theme Marketplace
  const themeMarketSec = document.getElementById('theme-market-section');
  if (themeMarketSec) {
    buildThemeMarket(themeMarketSec);
  }

  // 3. Render Alternating Path Timeline
  const timeline = document.getElementById('roadmap-timeline');
  if (!timeline) return;
  timeline.innerHTML = '';

  // Find the active step index (the first uncompleted step)
  let activeIndex = -1;
  for (let i = 0; i < TOPICS.length; i++) {
    const progress = getTopicProgress(TOPICS[i].id);
    if (progress < 80) {
      activeIndex = i;
      break;
    }
  }
  if (activeIndex === -1) {
    activeIndex = TOPICS.length - 1;
  }

  let topicSeq = 0;

  PHASES.forEach((phase, phaseIdx) => {
    // Calculate phase progress (completed topics / total topics)
    let completedInPhase = 0;
    phase.topics.forEach(topicId => {
      if (getTopicProgress(topicId) >= 80) {
        completedInPhase++;
      }
    });
    const phasePct = Math.round((completedInPhase / phase.topics.length) * 100);

    // Create Phase Header banner
    const phaseHeader = document.createElement('div');
    phaseHeader.className = 'roadmap-phase-header';
    phaseHeader.style.setProperty('--phase-color', phase.color);

    phaseHeader.innerHTML = `
      <div class="phase-badge-wrap">
        <div class="phase-icon-box" style="background: ${phase.color}15; color: ${phase.color}">
          <i class="fa-solid ${phase.icon}"></i>
        </div>
        <div class="phase-info">
          <span class="phase-step-num">CHẶNG ${phaseIdx + 1} / ${PHASES.length}</span>
          <h3 class="phase-title">${phase.title}</h3>
        </div>
      </div>
      <p class="phase-desc">${phase.desc}</p>
      <div class="phase-progress-section">
        <div class="phase-progress-info">
          <span>Tiến độ chặng:</span>
          <strong>${completedInPhase}/${phase.topics.length} hoàn thành</strong>
        </div>
        <div class="phase-progress-bar-wrap">
          <div class="phase-progress-bar-fill" style="width: ${phasePct}%; background: ${phase.color}"></div>
        </div>
      </div>
    `;
    timeline.appendChild(phaseHeader);

    // Render topics inside this phase
    phase.topics.forEach(topicId => {
      const topicIdx = TOPICS.findIndex(t => t.id === topicId);
      if (topicIdx === -1) return;
      const topic = TOPICS[topicIdx];

      const questions = state.allQuestions[topic.id] || [];
      const totalQ    = questions.length;
      const pct       = getTopicProgress(topic.id);
      const p         = state.stats.progress[topic.id] || {};
      const attempted = p.attempted || 0;

      let badgeClass = '';
      let badgeText  = 'Chưa học';
      const isCompleted = pct >= 80;

      if (isCompleted) {
        badgeClass = 'done';
        badgeText = '✓ Đã xong';
      } else if (attempted > 0) {
        badgeClass = 'learning';
        badgeText = 'Đang học';
      }

      const isActiveStep = topicIdx === activeIndex;

      let stepClass = 'roadmap-step';
      if (isCompleted) stepClass += ' completed';
      else if (isActiveStep) stepClass += ' active-step';

      const stepEl = document.createElement('div');
      const isOdd = topicSeq % 2 !== 0;
      stepEl.className = `${stepClass} ${isOdd ? 'odd' : 'even'}`;

      // Speed record display
      const record = state.stats.speedrecords ? state.stats.speedrecords[topic.id] : null;
      const speedHtml = record 
        ? `<div class="rm-speedrun"><i class="fa-solid fa-gauge-high"></i> Kỷ lục: ${record} câu/phút</div>`
        : `<div class="rm-speedrun" style="opacity:0.5"><i class="fa-solid fa-gauge-high"></i> Kỷ lục: --</div>`;

      stepEl.innerHTML = `
        <div class="roadmap-card" style="--topic-color: ${topic.color}; --topic-bg: ${topic.bg}">
          <div class="rm-card-hdr">
            <div class="rm-icon-title">
              <div class="rm-icon-box">
                <i class="fa-solid ${topic.icon}"></i>
              </div>
              <div class="rm-title-group">
                <span class="rm-name">${topic.name}</span>
                <span class="rm-desc">${topic.desc}</span>
              </div>
            </div>
            <span class="rm-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="rm-body">
            <div class="rm-pbar-row">
              <span>Độ chính xác</span>
              <span class="pct">${pct}%</span>
            </div>
            <div class="rm-pbar">
              <div class="rm-pfill" style="width: ${pct}%"></div>
            </div>
            ${speedHtml}
          </div>
          <div class="rm-footer">
            <button class="rm-start-btn">
              <i class="fa-solid fa-play"></i> Luyện tập (${totalQ} câu)
            </button>
          </div>
        </div>
        <div class="roadmap-node">
          <i class="fa-solid ${isCompleted ? 'fa-check' : topic.icon}"></i>
          <span class="roadmap-node-idx">${topicSeq + 1}</span>
        </div>
        <div class="roadmap-spacer"></div>
      `;

      const cardEl = stepEl.querySelector('.roadmap-card');
      cardEl.addEventListener('click', async () => {
        await openSetup(topic.id);
      });

      timeline.appendChild(stepEl);
      topicSeq++;
    });
  });
}

// ── Confirm dialog helper when leaving active quiz ──
async function confirmLeaveQuiz() {
  if (state.quizQuestions.length > 0 && state.currentIdx < state.quizQuestions.length) {
    stopTimer();
    const confirmed = await Modal.show({
      title: 'Thoát bài làm',
      body: '<strong>Bạn có chắc muốn thoát?</strong><br><br>Tiến độ bài làm hiện tại sẽ không được lưu.',
      confirmText: 'Thoát',
      cancelText: 'Tiếp tục làm',
      isDanger: true
    });
    if (!confirmed) {
      // Resume timer if active
      const toggleTimer = document.getElementById('toggle-timer');
      if (toggleTimer && toggleTimer.checked) {
        resumeTimer();
      }
    } else {
      if (state.botResponseTimer) {
        clearTimeout(state.botResponseTimer);
        state.botResponseTimer = null;
      }
    }
    return confirmed;
  }
  return true;
}

// ── Open Setup Screen ──
async function openSetup(topicId) {
  if (state.quizQuestions.length > 0 && state.currentIdx < state.quizQuestions.length) {
    const confirmed = await confirmLeaveQuiz();
    if (!confirmed) return;
  }

  // Clear active quiz questions list
  state.quizQuestions = [];
  updateQuizBadge();

  state.currentTopic = topicId;
  const topic = topicId ? TOPICS.find(t => t.id === topicId) : null;
  const totalAvail = topicId
    ? (state.allQuestions[topicId] || []).length
    : Object.values(state.allQuestions).flat().length;

  document.getElementById('setup-title').textContent = topic
    ? `Luyện: ${topic.name}`
    : 'Luyện Tất Cả Chủ Đề';
  document.getElementById('setup-subtitle').textContent =
    `${totalAvail} câu hỏi có sẵn`;

  buildCountChips(totalAvail);
  buildSidebarTopics();

  showPanel('setup');

  if (topic) {
    Toast.info(`Chủ đề: <strong>${topic.name}</strong> — ${totalAvail} câu`, 'Đã chọn');
  } else {
    Toast.info(`Luyện tổng hợp — <strong>${totalAvail}</strong> câu từ 7 chủ đề`, 'Luyện tất cả');
  }
}

function buildCountChips(total) {
  const wrap = document.getElementById('count-chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  const options = [10, 20, 30, 40, 50, total];
  const labels  = ['10', '20', '30', '40', '50', 'Full'];

  options.forEach((n, i) => {
    if (i < 5 && n > total) return;
    const btn = document.createElement('button');
    btn.className = 'count-chip' + (i === 5 ? ' full-chip' : '');
    btn.dataset.count = n;
    btn.textContent = labels[i];
    if (n === state.selectedCount || (i === 5 && state.selectedCount >= total)) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.count-chip').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedCount = n;
    });
    wrap.appendChild(btn);
  });

  const firstChip = wrap.querySelector('.count-chip');
  if (firstChip && !wrap.querySelector('.count-chip.selected')) {
    firstChip.classList.add('selected');
    state.selectedCount = parseInt(firstChip.dataset.count);
  }
}

// ── Update active quiz badge inside the header ──
function updateQuizBadge() {
  const badge = document.getElementById('quiz-badge');
  const quizTab = document.getElementById('ntab-quiz');

  if (state.quizQuestions.length > 0) {
    if (quizTab) quizTab.classList.remove('hidden');
    if (badge) {
      if (state.currentIdx >= state.quizQuestions.length) {
        badge.textContent = 'Done';
      } else {
        badge.textContent = `${state.currentIdx + 1}/${state.quizQuestions.length}`;
      }
    }
  } else {
    if (quizTab) quizTab.classList.add('hidden');
  }
}

// ── Shuffle helper ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Parse question ──
function parseQuestion(item) {
  const raw   = item.term;
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  const optStart   = lines.findIndex(l => /^[A-D][\.)]/.test(l));
  const questionText = optStart > 0 ? lines.slice(0, optStart).join('\n') : lines[0];
  const optionLines  = optStart >= 0 ? lines.slice(optStart) : [];

  const options = [];
  optionLines.forEach(line => {
    const match = line.match(/^([A-D])[\.)]?\s*(.*)/);
    if (match) options.push({ letter: match[1], text: match[2] });
  });

  if (options.length === 0) {
    ['A','B','C','D'].forEach(l => options.push({ letter: l, text: '—' }));
  }

  return {
    questionText,
    options,
    answer:  item.definition?.trim().toUpperCase(),
    explain: item.explain || '',
    topicId: item._topicId
  };
}

// ── Start Quiz ──
function startQuiz() {
  let pool = [];
  if (state.currentTopic) {
    pool = (state.allQuestions[state.currentTopic] || []).map(q => ({...q, _topicId: state.currentTopic}));
  } else {
    TOPICS.forEach(t => {
      (state.allQuestions[t.id] || []).forEach(q => pool.push({...q, _topicId: t.id}));
    });
  }

  if (pool.length === 0) {
    Toast.error('Không có câu hỏi nào. Vui lòng kiểm tra lại file data.', 'Lỗi dữ liệu');
    return;
  }

  const doShuffle = document.getElementById('toggle-shuffle').checked;
  let selected = doShuffle ? shuffle(pool) : [...pool];
  selected = selected.slice(0, state.selectedCount);

  // Set timer duration from select dropdown
  const durationSelect = document.getElementById('timer-duration-select');
  state.timerDuration = durationSelect ? parseInt(durationSelect.value) : 30;

  state.quizQuestions = selected.map(q => parseQuestion(q));
  state.currentIdx    = 0;
  state.score         = 0;
  state.wrongAnswers  = [];
  state.streak        = 0;
  state.quizStartTime = Date.now();

  // Configure mode elements visibility
  const livesBox = document.getElementById('quiz-lives-box');
  const scoreBox = document.getElementById('quiz-score-box');
  const showdownPanel = document.getElementById('showdown-panel');

  if (state.mode === 'survival') {
    state.lives = 3;
    if (livesBox) {
      livesBox.style.display = 'flex';
      renderLives();
    }
    if (scoreBox) scoreBox.style.display = 'none';
    if (showdownPanel) showdownPanel.style.display = 'none';
  } else if (state.mode === 'bug_hunt') {
    if (livesBox) livesBox.style.display = 'none';
    if (scoreBox) scoreBox.style.display = 'flex';
    if (showdownPanel) showdownPanel.style.display = 'none';
  } else {
    // practice mode
    if (livesBox) livesBox.style.display = 'none';
    if (scoreBox) scoreBox.style.display = 'flex';
    if (showdownPanel) showdownPanel.style.display = 'none';
  }

  updateQuizBadge();
  renderQuizQuestion();
  showPanel('quiz');
  
  let welcomeMsg = `Bắt đầu luyện tập với <strong>${selected.length}</strong> câu hỏi!`;
  if (state.mode === 'survival') welcomeMsg = `Bắt đầu chế độ <strong>Sinh tồn</strong>! Đừng để mất hết mạng!`;
  if (state.mode === 'bug_hunt') welcomeMsg = `Bắt đầu chế độ <strong>Sửa Bug</strong> 🐛! Tìm và sửa lỗi ngữ pháp.`;
  
  Toast.success(welcomeMsg, 'Quiz bắt đầu', 2500);
}

// ── Render lives for Survival Mode ──
function renderLives() {
  const livesBox = document.getElementById('quiz-lives-box');
  if (!livesBox) return;
  livesBox.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('i');
    if (i < state.lives) {
      heart.className = 'fa-solid fa-heart';
    } else {
      heart.className = 'fa-regular fa-heart';
      heart.style.opacity = '0.3';
    }
    livesBox.appendChild(heart);
  }
}

// ── Render quiz question ──
function renderQuizQuestion() {
  const q     = state.quizQuestions[state.currentIdx];
  const total = state.quizQuestions.length;

  updateQuizBadge();

  // Progress
  const pct = ((state.currentIdx) / total) * 100;
  document.getElementById('quiz-progress-fill').style.width = pct + '%';
  document.getElementById('quiz-q-counter').textContent = `${state.currentIdx + 1} / ${total}`;
  document.getElementById('quiz-score-correct').textContent = state.score;
  document.getElementById('quiz-score-total').textContent   = state.currentIdx;

  // IDE Gutter line numbers
  const gutter = document.getElementById('gutter-line');
  if (gutter) {
    const lines = (q.questionText.match(/\n/g) || []).length + 4;
    gutter.innerHTML = Array.from({ length: lines }, (_, i) =>
      `<div class="gutter-num">${String(state.currentIdx * 10 + i + 1).padStart(3, ' ')}</div>`
    ).join('');
  }

  // Topic tag
  const topic = TOPICS.find(t => t.id === q.topicId);
  const label = document.getElementById('quiz-topic-label');
  if (label && topic) {
    label.textContent = topic.name;
  }
  const tag   = document.getElementById('question-topic-tag');
  if (topic) {
    tag.innerHTML = `<i class="fa-solid ${topic.icon}"></i> ${topic.name}`;
    tag.style.color       = topic.color;
    tag.style.background  = topic.bg;
    tag.style.borderColor = topic.color + '44';
  }

  // Question number header
  const qNum = document.getElementById('qcard-num');
  if (qNum) {
    qNum.textContent = `#${state.currentIdx + 1}`;
    qNum.style.display = 'block';
  }

  // Render Question and Options based on Mode
  const optWrap = document.getElementById('options-grid');
  const qTextEl = document.getElementById('question-text');

  if (state.mode === 'bug_hunt') {
    state.bugDetected = false;
    state.bugSolved = false;

    const wrongOpts = q.options.filter(o => o.letter !== q.answer);
    
    // Choose one wrong option text as the bug
    const bugOpt = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
    const bugText = bugOpt ? bugOpt.text : 'wrong';
    state.bugText = bugText;

    // Split text by blank
    const blankRegex = /_{3,}|\.{3,}|…+|[\.＿_\-·\u2026]{3,}/g;
    const textParts = q.questionText.split(blankRegex);
    const part1 = textParts[0] || '';
    const part2 = textParts[1] || '';

    // Split parts into words
    const wordsBefore = part1.split(/\s+/).filter(Boolean);
    const wordsAfter = part2.split(/\s+/).filter(Boolean);

    // Full sentence words array
    state.sentenceWords = [...wordsBefore, bugText, ...wordsAfter];
    state.bugIndex = wordsBefore.length;

    // Render clickable words
    qTextEl.innerHTML = '';
    state.sentenceWords.forEach((word, idx) => {
      const span = document.createElement('span');
      span.className = 'clickable-word';
      span.textContent = word;
      span.dataset.idx = idx;
      span.addEventListener('click', () => handleWordClick(idx));
      qTextEl.appendChild(span);
      qTextEl.appendChild(document.createTextNode(' '));
    });

    // Render bug hint placeholder box
    optWrap.innerHTML = `
      <div class="bug-hint-box">
        <i class="fa-solid fa-bug" style="color:#f4524d"></i>
        <span>Hãy click vào từ viết sai ngữ pháp trong câu trên để dò lỗi...</span>
      </div>
    `;
  } else {
    // Normal mode (practice or survival)
    const rawText = q.questionText.replace(/_{3,}/g, '<mark>___</mark>');
    qTextEl.innerHTML = rawText;

    optWrap.innerHTML = '';
    const doShuffleOpts = document.getElementById('toggle-shuffle-opts')?.checked;
    let opts = [...q.options];
    if (doShuffleOpts) opts = shuffle(opts);

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.letter = opt.letter;
      btn.innerHTML = `
        <span class="option-letter">${opt.letter}</span>
        <span class="option-text">${opt.text}</span>
      `;
      btn.addEventListener('click', () => handleAnswer(opt.letter, q));
      optWrap.appendChild(btn);
    });
  }

  // Reset explanation and banner and card next button
  document.getElementById('feedback-banner').className = 'feedback-banner';
  document.getElementById('feedback-banner').innerHTML  = '';
  document.getElementById('next-btn').classList.remove('visible');
  document.getElementById('card-next-btn').classList.add('hidden');
  document.getElementById('btn-explain').classList.add('hidden');

  // Animate card entrance
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  requestAnimationFrame(() => { card.style.animation = ''; });

  // Start timer
  startTimer();
}

// ── Handle Click Word in Bug Hunting Mode ──
function handleWordClick(idx) {
  if (state.bugDetected || state.bugSolved) return;

  const q = state.quizQuestions[state.currentIdx];
  const qTextEl = document.getElementById('question-text');

  if (idx === state.bugIndex) {
    state.bugDetected = true;
    
    // Highlight the word with error styling
    const span = qTextEl.querySelector(`[data-idx="${idx}"]`);
    if (span) {
      span.className = 'clickable-word bug-highlight';
    }
    
    Toast.success('Đã phát hiện Bug! Hãy chọn đáp án đúng để Refactor câu.', 'Dò lỗi thành công', 2500);

    // Render refactor suggestion options
    const optWrap = document.getElementById('options-grid');
    optWrap.innerHTML = '';
    
    const doShuffleOpts = document.getElementById('toggle-shuffle-opts')?.checked;
    let opts = [...q.options];
    if (doShuffleOpts) opts = shuffle(opts);

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.letter = opt.letter;
      btn.innerHTML = `
        <span class="option-letter">${opt.letter}</span>
        <span class="option-text">${opt.text}</span>
      `;
      btn.addEventListener('click', () => handleRefactor(opt.letter, q));
      optWrap.appendChild(btn);
    });
  } else {
    // Play shake animation on the wrong word
    const span = qTextEl.querySelector(`[data-idx="${idx}"]`);
    if (span) {
      span.classList.add('shake');
      setTimeout(() => span.classList.remove('shake'), 450);
    }
  }
}

// ── Handle Refactor choice in Bug Hunting Mode ──
function handleRefactor(chosen, q) {
  stopTimer();
  state.bugSolved = true;

  const isCorrect = chosen === q.answer;
  const banner = document.getElementById('feedback-banner');
  const qTextEl = document.getElementById('question-text');

  // Disable all options
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const letter = btn.dataset.letter;
    if (letter === q.answer) btn.classList.add('correct');
    else if (letter === chosen) btn.classList.add('wrong');
  });

  // Get the buggy word span
  const span = qTextEl.querySelector(`[data-idx="${state.bugIndex}"]`);

  if (isCorrect) {
    state.score++;
    state.streak++;
    
    // Update word text to correct refactored text
    const correctOpt = q.options.find(o => o.letter === q.answer);
    if (span && correctOpt) {
      span.textContent = correctOpt.text;
      span.className = 'clickable-word fixed-highlight';
    }

    const streakMsg = state.streak >= 3
      ? `<strong>🔥 ${state.streak} liên tiếp!</strong>`
      : 'Tuyệt vời!';
    banner.className = 'feedback-banner correct';
    banner.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>Refactor thành công! ${streakMsg}</span>`;

    if (state.streak >= 3) spawnConfetti(10);
    else spawnConfetti(4);

    if (state.streak === 3)  Toast.success('🔥 Refactor 3 câu liên tiếp!', 'Streak');
    if (state.streak === 5)  Toast.success('🔥🔥 Refactor 5 câu liên tiếp!', 'Ấn tượng!');
    if (state.streak === 10) Toast.success('🔥🔥🔥 Refactor 10 câu liên tiếp!', 'Xuất sắc!');
  } else {
    state.streak = 0;
    state.wrongAnswers.push({ q, chosen });

    // Show correct text anyway but mark it
    const correctOpt = q.options.find(o => o.letter === q.answer);
    if (span && correctOpt) {
      span.textContent = correctOpt.text;
      span.className = 'clickable-word fixed-highlight';
    }

    banner.className = 'feedback-banner wrong';
    banner.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>
      <span>Refactor thất bại! Đáp án đúng: <strong>${q.answer}. ${correctOpt ? correctOpt.text : ''}</strong></span>`;

    const chosenBtn = Array.from(document.querySelectorAll('.option-btn')).find(btn => btn.dataset.letter === chosen);
    if (chosenBtn) {
      chosenBtn.classList.add('shake');
      setTimeout(() => chosenBtn.classList.remove('shake'), 450);
    }
  }

  updateTopicStats(q.topicId, isCorrect);

  // Show explanation button if explanation is present
  if (q.explain) {
    const expBtn = document.getElementById('btn-explain');
    expBtn.classList.remove('hidden');
  }

  const nextBtn = document.getElementById('next-btn');
  const cardNextBtn = document.getElementById('card-next-btn');
  const qNum = document.getElementById('qcard-num');
  if (qNum) qNum.style.display = 'none';

  const isLast  = state.currentIdx === state.quizQuestions.length - 1;
  const nextText = isLast
    ? `<i class="fa-solid fa-flag-checkered"></i> Xem Kết Quả`
    : `Câu Tiếp Theo <i class="fa-solid fa-arrow-right"></i>`;
  
  nextBtn.innerHTML = nextText;
  nextBtn.classList.add('visible');

  cardNextBtn.innerHTML = nextText;
  cardNextBtn.classList.remove('hidden');
}

// ── Countdown Timer logic ──
let timerSecsLeft = 30;

function startTimer() {
  stopTimer();
  const timerWrap = document.getElementById('timer-wrap');
  const timerNum = document.getElementById('timer-num');
  const timerCircle = document.getElementById('timer-circle');
  const toggleTimer = document.getElementById('toggle-timer');

  if (!toggleTimer || !toggleTimer.checked) {
    if (timerWrap) timerWrap.style.display = 'none';
    return;
  }

  if (timerWrap) timerWrap.style.display = 'flex';
  
  timerSecsLeft = state.timerDuration;
  if (timerNum) timerNum.textContent = timerSecsLeft;
  if (timerCircle) {
    timerCircle.style.strokeDashoffset = 0;
    timerCircle.style.stroke = 'var(--green)';
  }

  state.timerInterval = setInterval(() => {
    timerSecsLeft--;
    if (timerNum) timerNum.textContent = timerSecsLeft;

    if (timerCircle) {
      const offset = ((state.timerDuration - timerSecsLeft) / state.timerDuration) * 82;
      timerCircle.style.strokeDashoffset = offset;

      const warnTime = Math.max(3, Math.round(state.timerDuration / 3));
      if (timerSecsLeft <= warnTime) {
        timerCircle.style.stroke = 'var(--red)';
      }
    }

    if (timerSecsLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function resumeTimer() {
  stopTimer();
  const timerWrap = document.getElementById('timer-wrap');
  const timerNum = document.getElementById('timer-num');
  const timerCircle = document.getElementById('timer-circle');
  const toggleTimer = document.getElementById('toggle-timer');

  if (!toggleTimer || !toggleTimer.checked) return;
  if (timerWrap) timerWrap.style.display = 'flex';

  state.timerInterval = setInterval(() => {
    timerSecsLeft--;
    if (timerNum) timerNum.textContent = timerSecsLeft;

    if (timerCircle) {
      const offset = ((state.timerDuration - timerSecsLeft) / state.timerDuration) * 82;
      timerCircle.style.strokeDashoffset = offset;

      const warnTime = Math.max(3, Math.round(state.timerDuration / 3));
      if (timerSecsLeft <= warnTime) {
        timerCircle.style.stroke = 'var(--red)';
      }
    }

    if (timerSecsLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

// ── Handle when 30 seconds run out ──
function handleTimeout() {
  if (state.botResponseTimer) {
    clearTimeout(state.botResponseTimer);
    state.botResponseTimer = null;
  }

  const q = state.quizQuestions[state.currentIdx];
  const banner = document.getElementById('feedback-banner');
  const qTextEl = document.getElementById('question-text');

  if (state.mode === 'bug_hunt') {
    state.bugSolved = true;
    
    // Get buggy word and highlight it
    const span = qTextEl.querySelector(`[data-idx="${state.bugIndex}"]`);
    if (span) {
      span.className = 'clickable-word bug-highlight';
    }

    // Automatically fix it in the text
    const correctOpt = q.options.find(o => o.letter === q.answer);
    if (span && correctOpt) {
      span.textContent = correctOpt.text;
      span.className = 'clickable-word fixed-highlight';
    }

    // Render option buttons but disabled, highlighting the correct one
    const optWrap = document.getElementById('options-grid');
    optWrap.innerHTML = '';
    
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.letter = opt.letter;
      btn.disabled = true;
      if (opt.letter === q.answer) btn.classList.add('correct');
      btn.innerHTML = `
        <span class="option-letter">${opt.letter}</span>
        <span class="option-text">${opt.text}</span>
      `;
      optWrap.appendChild(btn);
    });

    banner.className = 'feedback-banner wrong';
    banner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>
      <span>Hết giờ Refactor! Đáp án đúng: <strong>${q.answer}. ${correctOpt ? correctOpt.text : ''}</strong></span>`;

  } else {
    // Normal mode (practice or survival)
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      const letter = btn.dataset.letter;
      if (letter === q.answer) btn.classList.add('correct');
    });

    if (state.mode === 'survival') {
      state.lives--;
      renderLives();
    }

    banner.className = 'feedback-banner wrong';
    const correctOpt = q.options.find(o => o.letter === q.answer);
    banner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>
      <span>Hết giờ làm bài! Đáp án đúng: <strong>${q.answer}. ${correctOpt ? correctOpt.text : ''}</strong></span>`;
  }

  state.streak = 0;
  state.wrongAnswers.push({ q, chosen: 'TIMEOUT' });
  updateTopicStats(q.topicId, false);

  // Play shake animation on the options grid
  const grid = document.getElementById('options-grid');
  if (grid) {
    grid.classList.add('shake');
    setTimeout(() => grid.classList.remove('shake'), 450);
  }

  // Show explanation button if explanation is present
  if (q.explain) {
    const expBtn = document.getElementById('btn-explain');
    expBtn.classList.remove('hidden');
  }

  const nextBtn = document.getElementById('next-btn');
  const cardNextBtn = document.getElementById('card-next-btn');
  const qNum = document.getElementById('qcard-num');
  if (qNum) qNum.style.display = 'none'; // Hide question number to make space for compact next button
  
  const isLast  = state.currentIdx === state.quizQuestions.length - 1;
  const isGameOver = state.mode === 'survival' && state.lives <= 0;
  
  let nextText = '';
  if (isGameOver) {
    nextText = `<i class="fa-solid fa-skull"></i> Game Over`;
  } else if (isLast) {
    nextText = `<i class="fa-solid fa-flag-checkered"></i> Xem Kết Quả`;
  } else {
    nextText = `Câu Tiếp Theo <i class="fa-solid fa-arrow-right"></i>`;
  }

  nextBtn.innerHTML = nextText;
  nextBtn.classList.add('visible');
  
  cardNextBtn.innerHTML = nextText;
  cardNextBtn.classList.remove('hidden');
}

// ── Handle answer selection ──
function handleAnswer(chosen, q) {
  stopTimer();

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const letter = btn.dataset.letter;
    if (letter === q.answer) btn.classList.add('correct');
    else if (letter === chosen) btn.classList.add('wrong');
  });

  const isCorrect = chosen === q.answer;
  const banner    = document.getElementById('feedback-banner');

  if (state.mode === 'survival') {
    if (isCorrect) {
      state.score++;
      state.streak++;
    } else {
      state.streak = 0;
      state.lives--;
      renderLives();
      state.wrongAnswers.push({ q, chosen });
    }
  } else {
    // practice mode
    if (isCorrect) {
      state.score++;
      state.streak++;
    } else {
      state.streak = 0;
      state.wrongAnswers.push({ q, chosen });
    }
  }

  updateTopicStats(q.topicId, isCorrect);

  if (isCorrect) {
    const streakMsg = state.streak >= 3
      ? `<strong>🔥 ${state.streak} liên tiếp!</strong>`
      : 'Tuyệt vời!';
    banner.className = 'feedback-banner correct';
    banner.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>Chính xác! ${streakMsg}</span>`;

    if (state.streak >= 3) spawnConfetti(10);
    else spawnConfetti(4);

    if (state.streak === 3)  Toast.success('🔥 3 câu liên tiếp!', 'Streak');
    if (state.streak === 5)  Toast.success('🔥🔥 5 câu liên tiếp!', 'Ấn tượng!');
    if (state.streak === 10) Toast.success('🔥🔥🔥 10 câu liên tiếp!', 'Xuất sắc!');
  } else {
    const correct = q.options.find(o => o.letter === q.answer);
    banner.className = 'feedback-banner wrong';
    banner.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>
      <span>Sai rồi! Đáp án đúng: <strong>${q.answer}. ${correct ? correct.text : ''}</strong></span>`;

    const chosenBtn = Array.from(document.querySelectorAll('.option-btn')).find(btn => btn.dataset.letter === chosen);
    if (chosenBtn) {
      chosenBtn.classList.add('shake');
      setTimeout(() => chosenBtn.classList.remove('shake'), 450);
    }
  }

  // Show explanation button if explanation is present
  if (q.explain) {
    const expBtn = document.getElementById('btn-explain');
    expBtn.classList.remove('hidden');
  }

  const nextBtn = document.getElementById('next-btn');
  const cardNextBtn = document.getElementById('card-next-btn');
  const qNum = document.getElementById('qcard-num');
  if (qNum) qNum.style.display = 'none'; // Hide question number to make space for compact next button
  
  const isLast  = state.currentIdx === state.quizQuestions.length - 1;
  const isGameOver = state.mode === 'survival' && state.lives <= 0;

  let nextText = '';
  if (isGameOver) {
    nextText = `<i class="fa-solid fa-skull"></i> Game Over`;
  } else if (isLast) {
    nextText = `<i class="fa-solid fa-flag-checkered"></i> Xem Kết Quả`;
  } else {
    nextText = `Câu Tiếp Theo <i class="fa-solid fa-arrow-right"></i>`;
  }

  nextBtn.innerHTML = nextText;
  nextBtn.classList.add('visible');

  cardNextBtn.innerHTML = nextText;
  cardNextBtn.classList.remove('hidden');
}

function updateTopicStats(topicId, isCorrect) {
  if (!state.stats.progress[topicId]) {
    state.stats.progress[topicId] = { correct: 0, attempted: 0 };
  }
  state.stats.progress[topicId].attempted++;
  if (isCorrect) state.stats.progress[topicId].correct++;

  state.stats.totalAttempted++;
  if (isCorrect) state.stats.totalCorrect++;

  // Record day activity history for heatmap
  const todayKey = new Date().toISOString().split('T')[0];
  if (!state.stats.activityHistory) {
    state.stats.activityHistory = {};
  }
  state.stats.activityHistory[todayKey] = (state.stats.activityHistory[todayKey] || 0) + 1;

  // Record commits (correct answers) for Github contribution grid
  if (isCorrect) {
    if (!state.stats.commits) state.stats.commits = {};
    state.stats.commits[todayKey] = (state.stats.commits[todayKey] || 0) + 1;
    // Earn Gems: +10 Gems for correct answer
    state.stats.gems = (state.stats.gems || 0) + 10;
  }

  // Streak logic
  const today = new Date().toDateString();
  if (state.stats.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.stats.streakDays = state.stats.lastStudyDate === yesterday
      ? state.stats.streakDays + 1
      : 1;
    state.stats.lastStudyDate = today;
    
    // Reward streak bonus: +50 Gems
    state.stats.gems = (state.stats.gems || 0) + 50;
    setTimeout(() => {
      Toast.success('🔥 +50 Gems vì đã duy trì học tập ngày hôm nay!', 'Bonus Streak!');
    }, 1000);
  }
  
  saveStats();

  // Update views
  updateUIStats();
  buildSidebarTopics();
}

// ── Next question ──
function nextQuestion() {
  if (state.mode === 'survival' && state.lives <= 0) {
    showResults();
    return;
  }
  state.currentIdx++;
  if (state.currentIdx >= state.quizQuestions.length) {
    showResults();
  } else {
    renderQuizQuestion();
  }
}

// ── Show Results ──
function showResults() {
  stopTimer();
  updateQuizBadge();

  const isSurvivalDead = state.mode === 'survival' && state.lives <= 0;
  const total = isSurvivalDead ? state.currentIdx : state.quizQuestions.length;
  const correct = state.score;
  const wrong = total - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Calculate speedrun speed (correct questions per minute)
  if (state.currentTopic && state.quizStartTime > 0) {
    const elapsedSeconds = Math.max(3, (Date.now() - state.quizStartTime) / 1000);
    const speed = Math.round((correct / (elapsedSeconds / 60)));
    if (correct >= 5) {
      if (!state.stats.speedrecords) state.stats.speedrecords = {};
      const prevRecord = state.stats.speedrecords[state.currentTopic] || 0;
      if (speed > prevRecord) {
        state.stats.speedrecords[state.currentTopic] = speed;
        saveStats();
        setTimeout(() => {
          Toast.success(`⏱️ Kỷ lục tốc độ mới: <strong>${speed} câu/phút</strong>!`, 'Chúc mừng!');
        }, 1200);
      }
    }
  }

  let trophy = '🏆', title = 'Xuất Sắc!', subtitle = 'Bạn đã hoàn thành bài thi rất tốt!';
  
  if (state.mode === 'survival') {
    if (state.lives <= 0) {
      trophy = '💀';
      title = 'GAME OVER!';
      subtitle = `Bạn đã thất bại trong chế độ Sinh tồn (Hết mạng ở câu ${state.currentIdx + 1}/${state.quizQuestions.length})!`;
    } else {
      trophy = '🩸';
      title = 'Sinh Tồn Thành Công!';
      subtitle = `Tuyệt vời! Bạn đã sống sót qua ${total} câu hỏi với ${state.lives} mạng còn lại!`;
    }
  } else if (state.mode === 'bug_hunt') {
    if (pct >= 90) {
      trophy = '🐛';
      title = 'Dũng Sĩ Diệt Bug!';
      subtitle = `Xuất sắc! Bạn đã refactor và tiêu diệt thành công ${correct}/${total} bug!`;
    } else if (pct >= 75) {
      trophy = '🛠️';
      title = 'QA Engineer Chuyên Nghiệp!';
      subtitle = `Khả năng bắt lỗi ngữ pháp của bạn rất tốt (${correct}/${total} bug đã dọn)!`;
    } else if (pct >= 50) {
      trophy = '🔍';
      title = 'Thực Tập Sinh QA!';
      subtitle = `Bạn đã phát hiện và refactor được ${correct}/${total} bug. Cố lên!`;
    } else {
      trophy = '👾';
      title = 'Hệ Thống Tràn Ngập Bug!';
      subtitle = `Vẫn còn nhiều lỗi ngữ pháp chưa được giải quyết. Hãy ôn luyện thêm nhé!`;
    }
  } else {
    if (pct < 50) {
      trophy = '📚'; title = 'Cần Cố Gắng Thêm!'; subtitle = 'Hãy ôn tập lại và thử sức lại nhé!';
    } else if (pct < 75) {
      trophy = '💪'; title = 'Khá Tốt!'; subtitle = 'Hãy tiếp tục cố gắng luyện tập!';
    } else if (pct < 90) {
      trophy = '⭐'; title = 'Tốt Lắm!'; subtitle = 'Kết quả rất ấn tượng!';
    }
  }

  document.getElementById('result-trophy').textContent   = trophy;
  document.getElementById('result-title').textContent    = title;
  document.getElementById('result-subtitle').textContent = subtitle;

  const rsRow = document.querySelector('.rs-row');
  if (state.mode === 'bug_hunt') {
    rsRow.innerHTML = `
      <div class="rs-item green">
        <div class="rs-val" id="rs-correct" style="color:var(--green)">${correct}</div>
        <div class="rs-lbl"><i class="fa-solid fa-screwdriver-wrench"></i> Refactor đúng</div>
      </div>
      <div class="rs-item red">
        <div class="rs-val" id="rs-wrong" style="color:var(--red)">${wrong}</div>
        <div class="rs-lbl"><i class="fa-solid fa-bug"></i> Lọt Bug</div>
      </div>
      <div class="rs-item yellow">
        <div class="rs-val" id="rs-pct" style="color:var(--yellow)">${pct}%</div>
        <div class="rs-lbl"><i class="fa-solid fa-circle-check"></i> Tỷ lệ dọn sạch</div>
      </div>
    `;
  } else {
    rsRow.innerHTML = `
      <div class="rs-item green">
        <div class="rs-val" id="rs-correct" style="color:var(--green)">${correct}</div>
        <div class="rs-lbl"><i class="fa-solid fa-check"></i> Câu đúng</div>
      </div>
      <div class="rs-item red">
        <div class="rs-val" id="rs-wrong" style="color:var(--red)">${wrong}</div>
        <div class="rs-lbl"><i class="fa-solid fa-xmark"></i> Câu sai</div>
      </div>
      <div class="rs-item yellow">
        <div class="rs-val" id="rs-pct" style="color:var(--yellow)">${pct}%</div>
        <div class="rs-lbl"><i class="fa-solid fa-star"></i> Tỷ lệ</div>
      </div>
    `;
  }

  // Circular Donut Progress
  const CIRC = 415;
  const donutFg = document.getElementById('donut-fg');
  const scoreEl = document.getElementById('donut-score');
  
  const color = pct >= 75 ? '#57c97d' : pct >= 50 ? '#e6b450' : '#f4524d';
  donutFg.style.stroke = color;
  donutFg.style.strokeDashoffset = CIRC - (CIRC * pct / 100);
  scoreEl.textContent = pct + '%';
  scoreEl.style.color = color;
  scoreEl.style.fontSize = '';

  // Review wrong answers list
  const reviewWrap = document.getElementById('review-list');
  reviewWrap.innerHTML = '';
  if (state.wrongAnswers.length === 0) {
    reviewWrap.innerHTML = `<div class="empty-state">
      <i class="fa-solid fa-face-smile" style="font-size:32px;margin-bottom:8px"></i>
      <p>Tuyệt vời! Không có câu nào sai! 🎉</p>
    </div>`;
  } else {
    state.wrongAnswers.forEach(({q, chosen}) => {
      const correctOpt = q.options.find(o => o.letter === q.answer);
      const chosenOpt  = q.options.find(o => o.letter === chosen);
      
      const div = document.createElement('div');
      div.className = 'review-item';
      
      let chosenText = chosen;
      if (chosen === 'TIMEOUT') {
        chosenText = 'HẾT GIỜ';
      } else if (chosenOpt) {
        chosenText = `${chosen}. ${chosenOpt.text}`;
      }

      div.innerHTML = `
        <div class="q-text">${q.questionText}</div>
        <div class="your-ans"><i class="fa-solid fa-xmark"></i> Lựa chọn: <strong>${chosenText}</strong></div>
        <div class="correct-ans"><i class="fa-solid fa-check"></i> Đáp án đúng: <strong>${q.answer}. ${correctOpt ? correctOpt.text : ''}</strong></div>
      `;
      reviewWrap.appendChild(div);
    });
  }

  showPanel('results');

  // Results confetti
  if (state.mode === 'bug_hunt') {
    if (pct >= 90) {
      spawnConfetti(35);
      Toast.success(`Xuất sắc! Bạn đã dọn sạch ${pct}% bug của hệ thống! 🎉`, 'Hoàn thành!', 5000);
    } else if (pct >= 75) {
      spawnConfetti(15);
      Toast.success(`Tốt lắm! Sửa được ${correct}/${total} bug.`, 'Kết quả', 4000);
    } else {
      Toast.warning(`Hệ thống còn khá nhiều bug (${pct}% dọn sạch). Cố gắng lên!`, 'Kết quả', 4000);
    }
  } else if (state.mode === 'survival') {
    if (state.lives <= 0) {
      Toast.error(`Game Over! Bạn đã hết mạng ở câu ${total}.`, 'Thất bại', 4000);
    } else {
      spawnConfetti(35);
      Toast.success(`Chúc mừng! Bạn đã hoàn thành chế độ Sinh Tồn với ${state.lives} mạng còn lại! 🎉`, 'Hoàn thành!', 5000);
    }
  } else {
    if (pct >= 90) {
      spawnConfetti(35);
      Toast.success(`Xuất sắc! ${pct}% — ${correct}/${total} câu đúng 🎉`, 'Hoàn thành!', 5000);
    } else if (pct >= 75) {
      spawnConfetti(15);
      Toast.success(`Tốt lắm! ${pct}% — ${correct}/${total} câu đúng`, 'Kết quả', 4000);
    } else if (pct >= 50) {
      Toast.warning(`${pct}% — ${correct}/${total} câu đúng. Cố lên!`, 'Kết quả', 4000);
    } else {
      Toast.info(`${pct}% — Hãy ôn tập kỹ lại nhé!`, 'Kết quả', 4000);
    }
  }
}

// ── Confetti Particle system ──
function spawnConfetti(count) {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  const colors = ['#4d9de0','#57c97d','#e6b450','#9876aa','#f4524d','#29d7d7'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * -10}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      width: ${5 + Math.random() * 7}px;
      height: ${5 + Math.random() * 7}px;
      animation-duration: ${0.9 + Math.random() * 1.3}s;
      animation-delay: ${Math.random() * 0.4}s;
    `;
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── StatusBar clock ──
function startClock() {
  function tick() {
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const el   = document.getElementById('sb-clock');
    if (el) el.textContent = `${h}:${m}`;
  }
  tick();
  setInterval(tick, 30000);
}

// ── Validate and reset daily streak ──
function updateDayStreak() {
  const today = new Date().toDateString();
  if (state.stats.lastStudyDate && state.stats.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.stats.lastStudyDate !== yesterday) {
      state.stats.streakDays = 0;
      saveStats();
    }
  }
}

// ============================================================
// INITIALIZATION AND EVENT BINDINGS
// ============================================================
async function init() {
  initCanvas();
  startClock();

  await loadAllTopics();
  updateDayStreak();

  // Restore and apply saved theme
  applyTheme(state.stats.activeTheme || 'darcula');

  // Game Mode Chip Selection
  document.querySelectorAll('.mode-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      state.mode = chip.dataset.mode;
    });
  });

  // Restore sidebar state from localstorage
  const appLayout = document.getElementById('app-layout');
  const savedSidebar = localStorage.getItem('toeicSidebarOpen');
  if (savedSidebar === 'false') {
    appLayout.classList.remove('sidebar-open');
    appLayout.classList.add('sidebar-closed');
  } else {
    appLayout.classList.remove('sidebar-closed');
    appLayout.classList.add('sidebar-open');
  }

  // Populate UI views
  buildHome();
  buildSidebarTopics();
  buildFeaturedTopics();
  buildHeatmap();
  updateUIStats();

  // Modal close trigger elements
  document.getElementById('modal-confirm').addEventListener('click', () => Modal.close(true));
  document.getElementById('modal-cancel').addEventListener('click',  () => Modal.close(false));
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) Modal.close(false);
  });

  // Sidebar toggling button event
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
  }
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', toggleSidebar);
  }

  // Header Nav Tab Click Handlers
  document.getElementById('ntab-dashboard').addEventListener('click', () => {
    showPanel('dashboard');
  });
  document.getElementById('ntab-roadmap').addEventListener('click', () => {
    buildHome();
    showPanel('roadmap');
  });
  document.getElementById('ntab-stats').addEventListener('click', () => {
    buildStats();
    showPanel('stats');
  });
  document.getElementById('ntab-quiz').addEventListener('click', () => {
    if (state.quizQuestions.length > 0) {
      if (state.currentIdx >= state.quizQuestions.length) {
        showPanel('results');
      } else {
        showPanel('quiz');
      }
    } else {
      if (state.currentTopic) {
        showPanel('setup');
      } else {
        showPanel('roadmap');
        Toast.info('Chọn một chủ đề để bắt đầu quiz.', 'Thông báo');
      }
    }
  });

  // Setup click triggers on Dashboard
  const quickStart = document.getElementById('btn-quick-start');
  if (quickStart) {
    quickStart.addEventListener('click', () => {
      openSetup(null);
    });
  }
  const seeAll = document.getElementById('dash-see-all');
  if (seeAll) {
    seeAll.addEventListener('click', () => {
      showPanel('roadmap');
    });
  }

  // Sidebar footer button (Luyện tất cả)
  document.getElementById('sb-practice-all').addEventListener('click', () => {
    openSetup(null);
  });

  // Navigation back / exit / start triggers
  document.getElementById('back-from-setup').addEventListener('click', () => {
    state.currentTopic = null;
    buildSidebarTopics();
    showPanel('dashboard');
  });

  document.getElementById('back-from-quiz').addEventListener('click', async () => {
    const confirmed = await confirmLeaveQuiz();
    if (confirmed) {
      state.quizQuestions = [];
      updateQuizBadge();
      buildHome();
      showPanel('dashboard');
      Toast.info('Đã thoát bài làm', 'Thông báo', 2000);
    }
  });

  document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  document.getElementById('card-next-btn').addEventListener('click', nextQuestion);

  // Explanation button click handler
  document.getElementById('btn-explain').addEventListener('click', () => {
    const q = state.quizQuestions[state.currentIdx];
    if (q && q.explain) {
      Modal.show({
        title: 'Giải thích đáp án',
        body: `<strong>Đáp án đúng: ${q.answer}</strong><br><br>${q.explain}`,
        confirmText: 'Đã hiểu',
        cancelText: 'Huỷ',
        isDanger: false
      });
    }
  });

  // Results Screen buttons
  document.getElementById('btn-retry').addEventListener('click', () => {
    openSetup(state.currentTopic);
  });
  document.getElementById('btn-home').addEventListener('click', () => {
    state.quizQuestions = [];
    updateQuizBadge();
    showPanel('dashboard');
  });
  document.getElementById('btn-roadmap').addEventListener('click', () => {
    state.quizQuestions = [];
    updateQuizBadge();
    buildHome();
    showPanel('roadmap');
  });

  // Stats reset button
  const resetBtn = document.getElementById('btn-reset-stats');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const confirmed = await Modal.show({
        title: 'Reset thống kê',
        body: '<strong>Bạn có chắc chắn muốn xoá toàn bộ lịch sử học tập?</strong><br><br>Hành động này không thể hoàn tác.',
        confirmText: 'Xoá tất cả',
        cancelText: 'Huỷ',
        isDanger: true
      });
      if (confirmed) {
        state.stats = {
          totalCorrect: 0,
          totalAttempted: 0,
          progress: {},
          streakDays: 0,
          lastStudyDate: null,
          activityHistory: {}
        };
        saveStats();
        updateUIStats();
        buildHome();
        buildStats();
        buildSidebarTopics();
        buildFeaturedTopics();
        buildHeatmap();
        Toast.success('Đã reset toàn bộ dữ liệu học tập', 'Thành công');
      }
    });
  }

  // Keyboard Event Handlers (Esc, S, A/B/C/D, Enter/Right)
  document.addEventListener('keydown', e => {
    // 1. ESC: Closes modal if open, else exits quiz panel if active
    if (e.key === 'Escape') {
      const overlay = document.getElementById('modal-overlay');
      if (overlay && overlay.style.display !== 'none') {
        Modal.close(false);
        return;
      }
      const quizPanel = document.getElementById('panel-quiz');
      if (quizPanel && quizPanel.classList.contains('active')) {
        document.getElementById('back-from-quiz').click();
      }
      return;
    }

    // 2. S: Toggles Sidebar collapse
    if (e.key.toLowerCase() === 's') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      toggleSidebar();
      return;
    }

    // 3. Quiz actions (Shortcuts enabled when quiz panel is active)
    const quizPanel = document.getElementById('panel-quiz');
    if (quizPanel && quizPanel.classList.contains('active')) {
      const toggleKeyboard = document.getElementById('toggle-keyboard');
      if (!toggleKeyboard || !toggleKeyboard.checked) return;

      const key = e.key.toUpperCase();

      // A, B, C, D to answer questions
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const btns = document.querySelectorAll('.option-btn:not(:disabled)');
        if (btns.length > 0) {
          const target = Array.from(btns).find(b => b.dataset.letter === key);
          if (target) target.click();
        }
      }

      // Enter / Right Arrow to trigger next question
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn && nextBtn.classList.contains('visible')) {
          nextBtn.click();
        }
      }
    }
  });

  // Welcome toast notification
  setTimeout(() => {
    Toast.info('Chào mừng! Chọn một chủ đề để bắt đầu ôn luyện.', 'Grammar Master', 4000);
  }, 600);
}

document.addEventListener('DOMContentLoaded', init);

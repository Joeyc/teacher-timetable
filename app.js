// ── Constants ────────────────────────────────────────────────
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const GROUPS = ['M', 'N', 'R', 'S'];
const DAY_FULL = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri' };
const GC = { M: '#6B8EC9', N: '#9B6BC9', R: '#C96B6B', S: '#C9A847' };
const SC = {
  IMA: '#6B8EC9',
  DRF: '#9B6BC9',
  CMS: '#C96B6B',
  PRO: '#C9A847',
  BEX: '#C9876B',
  TYP: '#5BAF7A',
  CAH: '#4FA8B8',
  LFS: '#A89070',
  SW1: '#5A8A7A',
  SW4: '#5A8A7A',
  PMG: '#7A9A6A',
  PPD: '#A87050',
  DEF: '#4A4A4A',
};
function sCol(s) {
  const k = (s || '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
  return SC[k] || SC.DEF;
}

// ── Time helpers ─────────────────────────────────────────────
const toMin = (t) => {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const nowMin = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};
const DNAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dayCode = (off = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return DNAMES[d.getDay()];
};
const fmtDate = (off = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};
function weekDates() {
  const today = new Date(),
    dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return DAYS.map((d, i) => {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + i);
    return {
      code: d,
      full: DAY_FULL[d],
      isToday: d === dayCode(),
      dateStr: dt.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
      }),
    };
  });
}

// ── State ────────────────────────────────────────────────────
let DATA = null;
let activeGroups = new Set(GROUPS);
let activeDay = DAYS.includes(dayCode()) ? dayCode() : 'MON';
let tickTimer = null;

// ── Render: TODAY ────────────────────────────────────────────
function cardHTML(cls, isToday) {
  const nowM = nowMin(),
    sM = toMin(cls.start || cls.startTime),
    eM = toMin(cls.end || cls.endTime) || sM + 90;
  const isNow = isToday && nowM >= sM && nowM < eM,
    isPast = isToday && nowM >= eM;
  const clr = sCol(cls.subject || cls.label);
  const label = cls.subject || cls.label || '';
  const grp = cls.class || '';
  const room = cls.room || '';
  const st = cls.start || cls.startTime || '';
  const en = cls.end || cls.endTime || '';
  const grpCol = grp
    ? { M: '#6B8EC9', N: '#9B6BC9', R: '#C96B6B', S: '#C9A847' }[grp] || '#888'
    : '';
  const nameHTML = grp
    ? `${label} <span style="font-size:11px;font-weight:700;padding:1px 6px;border-radius:5px;background:${grpCol}22;color:${grpCol};vertical-align:middle">(${grp})</span>`
    : label;
  return `<div class="class-card${isNow ? ' is-now' : ''}${isPast ? ' is-past' : ''}">
    <div class="c-bar" style="background:${clr}"></div>
    <div class="c-body">
      <div class="c-time"><span class="s">${st}</span>${en ? `<span class="e">${en}</span>` : ''}</div>
      <div class="c-sep"></div>
      <div class="c-info">
        <div class="c-name">${nameHTML}</div>
        ${room ? `<div class="c-meta">${room}</div>` : ''}
      </div>
      ${isNow ? `<div class="now-badge">Now</div>` : ''}
    </div>
  </div>`;
}

function updateBanner(classes) {
  const nowM = nowMin();
  const toS = (c) => c.start || c.startTime || '';
  const toE = (c) => c.end || c.endTime || '';
  const cur = classes.find((c) => {
    const s = toMin(toS(c)),
      e = toMin(toE(c)) || s + 90;
    return nowM >= s && nowM < e;
  });
  const nxt = classes.find((c) => toMin(toS(c)) > nowM);
  const banner = document.getElementById('next-banner'),
    dot = document.getElementById('pulse-dot');
  const nm = document.getElementById('next-name'),
    cd = document.getElementById('next-cd');
  const lbl = (c) =>
    (c.subject || c.label || '') + (c.class ? ` (${c.class})` : '');
  if (cur) {
    banner.classList.remove('inactive');
    dot.classList.remove('off');
    nm.textContent = `${lbl(cur)} — In Progress`;
    const rem = (toMin(toE(cur)) || toMin(toS(cur)) + 90) - nowM;
    cd.textContent = `Ends in ${rem} min`;
  } else if (nxt) {
    banner.classList.remove('inactive');
    dot.classList.remove('off');
    nm.textContent = `${lbl(nxt)} at ${toS(nxt)}`;
    const diff = toMin(toS(nxt)) - nowM;
    cd.textContent =
      diff < 60
        ? `In ${diff} min`
        : `In ${Math.floor(diff / 60)}h ${diff % 60}min`;
  } else {
    banner.classList.add('inactive');
    dot.classList.add('off');
    nm.textContent = 'No more classes today';
    cd.textContent = '';
  }
}

function renderToday() {
  const today = dayCode(),
    tmr = dayCode(1);
  const DOW = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  document.getElementById('today-title').textContent = DOW[new Date().getDay()];
  document.getElementById('today-sub').textContent = fmtDate(0);
  document.getElementById('tmr-lbl').textContent =
    `Tomorrow — ${DAY_FULL[tmr] || tmr}`;
  const tc = DATA.personal[today] || [],
    tr = DATA.personal[tmr] || [];
  document.getElementById('today-list').innerHTML = tc.length
    ? tc.map((c) => cardHTML(c, true)).join('')
    : `<div class="empty"><span class="ico">🎉</span>No classes today</div>`;
  document.getElementById('tomorrow-list').innerHTML = tr.length
    ? tr.map((c) => cardHTML(c, false)).join('')
    : `<div style="padding:4px 0 4px 4px"><span style="color:var(--sub);font-style:italic;font-size:13px">No classes tomorrow 🎉</span></div>`;
  updateBanner(tc);
}

// ── Render: MY TIMETABLE ─────────────────────────────────────
function renderMine() {
  document.getElementById('mine-term').textContent = DATA.term || '';
  document.getElementById('mine-week').innerHTML = weekDates()
    .map(({ code, full, isToday, dateStr }) => {
      const cls = DATA.personal[code] || [];
      return `<div class="day-block${isToday ? ' is-today' : ''}">
      <div class="day-hdr">
        <div><div class="dname">${full.toUpperCase()}</div><div class="ddate">${dateStr}</div></div>
        ${isToday ? `<div class="today-pill">Today</div>` : ''}
      </div>
      <div class="day-rows">${
        cls.length
          ? cls
              .map(
                (c) => `<div class="day-row">
            <div class="dot" style="background:${sCol(c.subject || c.label)}"></div>
            <div class="rtime">${c.start || c.startTime}${c.end || c.endTime ? '–' + (c.end || c.endTime) : ''}</div>
            <div class="rinfo">
              <div class="rname">${c.subject || c.label || ''}${c.class ? ` <span style="font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:${{ M: '#6B8EC9', N: '#9B6BC9', R: '#C96B6B', S: '#C9A847' }[c.class] || '#888'}22;color:${{ M: '#6B8EC9', N: '#9B6BC9', R: '#C96B6B', S: '#C9A847' }[c.class] || '#888'};vertical-align:middle">(${c.class})</span>` : ''}</div>
              ${c.room ? `<div class="rroom">${c.room}</div>` : ''}
            </div>
          </div>`,
              )
              .join('')
          : `<div class="day-empty">No classes</div>`
      }
      </div>
    </div>`;
    })
    .join('');
}

// ── Render: ALL CLASSES ──────────────────────────────────────
function renderOverview() {
  document.getElementById('ov-term').textContent = DATA.term || '';

  // Day selector
  document.getElementById('day-selector').innerHTML = DAYS.map(
    (d) =>
      `<div class="day-pill${d === activeDay ? ' active' : ''}" onclick="setDay('${d}')">${DAY_FULL[d]}</div>`,
  ).join('');

  // Group filter buttons
  const allSelected = activeGroups.size === GROUPS.length;
  document.getElementById('grp-toggle').innerHTML =
    `<button class="grp-btn" onclick="selectAll()"
      style="${allSelected ? 'background:rgba(212,168,67,.12);border-color:rgba(212,168,67,.5);color:var(--gold)' : ''}">
      All</button>` +
    GROUPS.map((g) => {
      const on = activeGroups.has(g) && !allSelected;
      const col = GC[g];
      return `<button class="grp-btn" onclick="toggleGroup('${g}')"
        style="${on ? `background:${col}22;border-color:${col}88;color:${col}` : ''}">
        ${g}</button>`;
    }).join('');

  // Collect all start times for active groups on this day
  const times = new Set();
  GROUPS.filter((g) => activeGroups.has(g)).forEach((g) => {
    ((DATA.overview[g] || {})[activeDay] || []).forEach((c) =>
      times.add(c.start),
    );
  });
  const sorted = [...times].sort((a, b) => toMin(a) - toMin(b));

  if (!sorted.length) {
    document.getElementById('ov-wrap').innerHTML =
      `<div class="empty"><span class="ico"></span>No classes on ${DAY_FULL[activeDay]}</div>`;
    return;
  }

  document.getElementById('ov-wrap').innerHTML = sorted
    .map((t) => {
      const entries = [];
      GROUPS.filter((g) => activeGroups.has(g)).forEach((g) => {
        ((DATA.overview[g] || {})[activeDay] || [])
          .filter((c) => c.start === t)
          .forEach((c) => entries.push({ ...c, group: g }));
      });
      if (!entries.length) return '';
      const latestEnd =
        [...entries.map((e) => e.end)]
          .filter(Boolean)
          .sort((a, b) => toMin(b) - toMin(a))[0] || '';
      const rows = entries
        .map(
          (e) => `
      <div class="ov-class-row">
        <div class="ov-bar" style="background:${GC[e.group]}"></div>
        <div class="ov-grp-badge" style="background:${GC[e.group]}22;color:${GC[e.group]}">${e.group}</div>
        <div class="ov-class-info">
          <div class="ov-class-name">${e.subject}<span class="ov-class-type">${e.type || ''}</span></div>
          <div class="ov-class-room">${e.room || '—'}</div>
        </div>
      </div>`,
        )
        .join('');
      return `<div class="ov-time-block">
      <div class="ov-time-hdr">
        <div class="ov-time-label">${t}</div>
        <div class="ov-time-end">${latestEnd ? 'until ' + latestEnd : ''}</div>
      </div>
      <div class="ov-classes">${rows}</div>
    </div>`;
    })
    .join('');
}

function setDay(d) {
  activeDay = d;
  renderOverview();
}
function toggleGroup(g) {
  // If this group is the ONLY one selected → show all (toggle off)
  // If all groups are shown OR another combo → isolate this group (solo mode)
  if (activeGroups.has(g) && activeGroups.size === 1) {
    // Already isolated — expand back to all
    GROUPS.forEach((x) => activeGroups.add(x));
  } else {
    // Isolate: show only this group
    activeGroups.clear();
    activeGroups.add(g);
  }
  renderOverview();
}
function selectAll() {
  GROUPS.forEach((g) => activeGroups.add(g));
  renderOverview();
}

// ── Tick ─────────────────────────────────────────────────────
function startTick() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (!DATA) return;
    const tc = DATA.personal[dayCode()] || [];
    updateBanner(tc);
    document.getElementById('today-list').innerHTML = tc.length
      ? tc.map((c) => cardHTML(c, true)).join('')
      : `<div class="empty"><span class="ico">🎉</span>No classes today</div>`;
  }, 30000);
}

// ── Tab switch ───────────────────────────────────────────────
function switchTab(tab) {
  document
    .querySelectorAll('.tab')
    .forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  document
    .querySelectorAll('.view')
    .forEach((v) => v.classList.toggle('active', v.id === `view-${tab}`));
}

// ── Boot ─────────────────────────────────────────────────────
// ── Cache & fetch ────────────────────────────────────────────
const CACHE_KEY = 'timetable_data';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null; // expired
    return data;
  } catch {
    return null;
  }
}

function saveToCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {}
}

function showFooterMeta(data) {
  const el = document.getElementById('footer-meta');
  if (!el) return;
  const cached = localStorage.getItem(CACHE_KEY);
  let fetchedAt = '';
  if (cached) {
    try {
      const { timestamp } = JSON.parse(cached);
      const d = new Date(timestamp);
      fetchedAt =
        d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }) +
        ' ' +
        d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
    } catch {}
  }
  el.textContent = `v${data.version || '—'}  ·  ${data.term || ''}  ·  Fetched ${fetchedAt}`;
}

async function fetchTimetable() {
  const r = await fetch('./timetable.json?t=' + Date.now());
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function boot() {
  // 1. Try cache first — render immediately if available
  const cached = loadFromCache();
  if (cached) {
    DATA = cached;
    render();
    // Use rAF so the loading screen gets at least one painted frame
    // before being hidden — prevents invisible flash on fast cache hits
    requestAnimationFrame(() => {
      document.getElementById('loading').classList.add('hidden');
    });
    showFooterMeta(DATA);
    startTick();
  }

  // 2. Always fetch fresh data in background
  try {
    const fresh = await fetchTimetable();
    saveToCache(fresh);
    // Only re-render if data actually changed
    if (JSON.stringify(fresh) !== JSON.stringify(DATA)) {
      DATA = fresh;
      render();
      showFooterMeta(DATA);
    } else {
      showFooterMeta(DATA);
    }
    if (!cached) {
      document.getElementById('loading').classList.add('hidden');
    }
  } catch (e) {
    console.warn('Fetch failed, using cache or fallback:', e.message);
    if (!cached) {
      document.getElementById('loading').innerHTML = `
        <div style="text-align:center;padding:32px 24px">
          <div style="font-size:36px;margin-bottom:12px">⚠️</div>
          <div style="font-size:15px;margin-bottom:6px">Could not load schedule</div>
          <div style="font-size:12px;color:var(--sub);margin-bottom:20px">${e.message}</div>
          <button onclick="location.reload()" style="background:var(--gold);color:#000;border:none;
            border-radius:20px;padding:10px 24px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer">
            Try Again
          </button>
        </div>`;
    }
  }
  startTick();
}

function render() {
  renderToday();
  renderMine();
  renderOverview();
}

// ── Pull to refresh ─────────────────────────────────────────
function initPullToRefresh() {
  if (document.getElementById('ptr-indicator')) return;

  const THRESHOLD = 65;
  let startY = 0,
    dy = 0,
    tracking = false,
    busy = false;

  // Indicator
  const ind = document.createElement('div');
  ind.id = 'ptr-indicator';
  ind.innerHTML =
    '<div id="ptr-spinner"></div><span id="ptr-label">Pull to refresh</span>';
  document.getElementById('views').appendChild(ind);
  const lbl = document.getElementById('ptr-label');

  function show(d) {
    const p = Math.min(d / THRESHOLD, 1);
    ind.style.transform = `translateY(${Math.min(d * 0.5, 50) - 40}px)`;
    ind.style.opacity = p + 0.1;
    ind.classList.toggle('ready', p >= 1);
    lbl.textContent = p >= 1 ? 'Release to refresh' : 'Pull to refresh';
  }

  function hide() {
    ind.style.transform = '';
    ind.style.opacity = '';
    ind.classList.remove('ready', 'loading');
    lbl.textContent = 'Pull to refresh';
  }

  async function doRefresh() {
    busy = true;
    ind.classList.remove('ready');
    ind.classList.add('loading');
    ind.style.transform = 'translateY(10px)';
    ind.style.opacity = '1';
    lbl.textContent = 'Refreshing…';
    try {
      const fresh = await fetchTimetable();
      saveToCache(fresh);
      DATA = fresh;
      render();
      showFooterMeta(DATA);
      lbl.textContent = 'Updated ✓';
    } catch {
      lbl.textContent = 'Could not refresh';
    }
    setTimeout(() => {
      hide();
      busy = false;
    }, 900);
  }

  // Use body — avoids fighting scroll containers
  document.body.addEventListener(
    'touchstart',
    (e) => {
      if (busy) return;
      const view = document.querySelector('.view.active');
      if (!view || view.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      tracking = true;
      dy = 0;
    },
    { passive: true },
  );

  document.body.addEventListener(
    'touchmove',
    (e) => {
      if (!tracking || busy) return;
      dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        tracking = false;
        hide();
        return;
      }
      if (e.cancelable) e.preventDefault();
      show(dy);
    },
    { passive: false },
  );

  document.body.addEventListener(
    'touchend',
    () => {
      if (!tracking) return;
      tracking = false;
      if (dy >= THRESHOLD) doRefresh();
      else hide();
      dy = 0;
    },
    { passive: true },
  );
}

boot().then(() => initPullToRefresh());

// ── iOS PWA height fix ───────────────────────────────────────
// visualViewport gives the true visible height in PWA mode,
// bypassing the broken vh/dvh calculation on first paint.
function syncHeight() {
  const h = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
  document.getElementById('app').style.height = h + 'px';
}
syncHeight();
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncHeight);
} else {
  window.addEventListener('resize', syncHeight);
}

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || '#f1f5f6';
}

const TOKEN_KEY = 'nv_admin_token';
const apiBase = new URL('.', window.location.href).pathname.replace(/\/miniapp\/?$/, '');

const $ = (sel) => document.querySelector(sel);
const screens = {
  login: $('#screen-login'),
  app: $('#screen-app'),
  settings: $('#screen-settings'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
}

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(value) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Ошибка запроса');
  return data;
}

const statusLabels = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Закрыта',
  archived: 'Архив',
};

function badge(status) {
  return `<span class="badge badge-${status}">${statusLabels[status] || status}</span>`;
}

function renderStats(items) {
  const counts = { new: 0, in_progress: 0, done: 0 };
  items.forEach((i) => { if (counts[i.status] !== undefined) counts[i.status] += 1; });
  $('#stats').innerHTML = `
    <div class="stat"><strong>${counts.new}</strong><span>Новые</span></div>
    <div class="stat"><strong>${counts.in_progress}</strong><span>В работе</span></div>
    <div class="stat"><strong>${counts.done}</strong><span>Закрыты</span></div>
  `;
}

function renderLeads(items) {
  const root = $('#leads');
  if (!items.length) {
    root.innerHTML = '<p class="empty">Заявок пока нет</p>';
    return;
  }
  root.innerHTML = items.map((lead) => `
    <button class="lead-card" data-id="${lead.id}" type="button">
      <div class="lead-card__top">
        <div>
          <div class="lead-card__name">${escapeHtml(lead.name)}</div>
          <div class="lead-card__phone">${escapeHtml(lead.phone)}</div>
        </div>
        ${badge(lead.status)}
      </div>
      <div class="lead-card__msg">${escapeHtml(lead.message || 'Без комментария')}</div>
    </button>
  `).join('');

  root.querySelectorAll('.lead-card').forEach((btn) => {
    btn.addEventListener('click', () => openLead(Number(btn.dataset.id)));
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function loadLeads() {
  const data = await api('/api/admin/leads');
  renderStats(data.items);
  renderLeads(data.items);
  return data.items;
}

async function openLead(id) {
  const lead = await api(`/api/admin/leads/${id}`);
  $('#lead-title').textContent = `Заявка #${lead.id}`;
  const suggestions = (lead.ai_suggestions || [])
    .map((s, idx) => `<button class="suggestion" data-text="${escapeHtml(s)}" type="button">${idx + 1}. ${escapeHtml(s)}</button>`)
    .join('');

  $('#lead-body').innerHTML = `
    <div class="block">
      <h4>Контакты</h4>
      <div><strong>${escapeHtml(lead.name)}</strong></div>
      <div>${escapeHtml(lead.phone)}</div>
      <div class="muted" style="margin-top:.5rem">${escapeHtml(lead.message || '—')}</div>
    </div>
    <div class="block">
      <h4>Статус</h4>
      <div class="status-row">
        ${Object.keys(statusLabels).map((s) => `
          <button class="status-btn ${lead.status === s ? 'active' : ''}" data-status="${s}" type="button">${statusLabels[s]}</button>
        `).join('')}
      </div>
    </div>
    <div class="block">
      <h4>AI-разбор</h4>
      <p>${escapeHtml(lead.ai_summary || 'Анализ ещё не готов. Обновите через минуту или запустите повторно в настройках.')}</p>
      ${suggestions}
      <button id="btn-reanalyze" class="btn btn-ghost" type="button" style="margin-top:.6rem">Повторить анализ</button>
    </div>
  `;

  $('#lead-body').querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/admin/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: btn.dataset.status }),
      });
      await loadLeads();
      openLead(id);
    });
  });

  $('#lead-body').querySelectorAll('.suggestion').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.text;
      try {
        await navigator.clipboard.writeText(text);
        tg?.showAlert?.('Текст скопирован');
      } catch {
        tg?.showAlert?.(text);
      }
    });
  });

  $('#btn-reanalyze')?.addEventListener('click', async () => {
    await api(`/api/admin/leads/${id}/reanalyze`, { method: 'POST' });
    tg?.showAlert?.('Анализ запущен');
    setTimeout(() => openLead(id), 2500);
  });

  $('#lead-dialog').showModal();
}

async function loadSettings() {
  const data = await api('/api/admin/settings');
  $('#ai-toggle').checked = data.ai_assistant_enabled;
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#login-error');
  err.classList.add('hidden');
  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: $('#password').value }),
    });
    setToken(data.token);
    showScreen('app');
    await loadLeads();
  } catch (error) {
    err.textContent = error.message;
    err.classList.remove('hidden');
  }
});

$('#btn-settings').addEventListener('click', async () => {
  await loadSettings();
  showScreen('settings');
});

$('#btn-back').addEventListener('click', () => showScreen('app'));

$('#ai-toggle').addEventListener('change', async (e) => {
  await api('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify({ ai_assistant_enabled: e.target.checked }),
  });
});

$('#btn-logout').addEventListener('click', () => {
  setToken('');
  showScreen('login');
});

(async function init() {
  if (token()) {
    try {
      await loadLeads();
      showScreen('app');
      return;
    } catch {
      setToken('');
    }
  }
  showScreen('login');
})();

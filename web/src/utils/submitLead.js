const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

function leadsUrl() {
  if (API_BASE) {
    return `${API_BASE}/api/leads`;
  }
  if (import.meta.env.DEV) {
    return '/api/leads';
  }
  throw new Error('Форма не настроена: задайте VITE_API_BASE при сборке сайта.');
}

export async function submitLead({ name, phone, message }) {
  const response = await fetch(leadsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, message }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || 'Не удалось отправить заявку');
  }
  return data;
}

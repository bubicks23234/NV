const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export async function submitLead({ name, phone, message }) {
  const response = await fetch(`${API_BASE}/api/leads`, {
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

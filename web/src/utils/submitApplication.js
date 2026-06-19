const API_URL = (
  import.meta.env.VITE_NV_BOT_API_URL || 'https://nv-bot-production.up.railway.app'
).replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_NV_BOT_API_KEY || 'nv-nt-donetsk-2026';

export async function submitApplication({ name, phone, message }) {
  if (!API_URL || !API_KEY) {
    throw new Error('Сервис заявок временно недоступен. Позвоните нам по телефону.');
  }

  const response = await fetch(`${API_URL}/api/applications/public`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
      source: 'nt-donetsk',
    }),
  });

  if (!response.ok) {
    throw new Error('Не удалось отправить заявку. Попробуйте позже или позвоните нам.');
  }

  return response.json();
}

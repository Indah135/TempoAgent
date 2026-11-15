const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendChatMessage(message) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export async function fetchSchedules() {
  const response = await fetch(`${API_BASE_URL}/api/schedules`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.schedules || [];
}

export async function fetchAllSchedules() {
  const response = await fetch(`${API_BASE_URL}/api/schedules/all`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.schedules || [];
}

export async function deleteSchedule(scheduleId) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  return await response.json();
}

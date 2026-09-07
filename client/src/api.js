const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Request failed");
    return payload;
}

export const getWorkers = (skill) => apiRequest(`/api/workers?skill=${encodeURIComponent(skill)}`);
export const register = (data) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
export const login = (data) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const createBooking = (data, token) => apiRequest("/api/bookings", { method: "POST", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
export const getBookings = (token) => apiRequest("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });

import { showToast } from "./toast";

export const API_URL = (
    import.meta.env.BACKEND_API_URL ||
    import.meta.env.BACKEND_URL ||
    import.meta.env.API_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_BACKEND_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    "http://localhost:4000"
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...options.headers },
            ...options,
        });
    } catch {
        const networkError = new Error(`Cannot reach the backend at ${API_URL}. Start the server or check VITE_API_URL.`);
        showToast(networkError.message);
        throw networkError;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || "Request failed");
        showToast(error.message);
        throw error;
    }
    return payload;
}

export const getWorkers = (skill, coordinates, sakhiOnly = false) => {
    const params = new URLSearchParams();
    if (skill) params.set("skill", skill);
    if (sakhiOnly) params.set("sakhiOnly", "true");
    if (coordinates) { params.set("lat", coordinates.lat); params.set("lng", coordinates.lng); params.set("radiusKm", "10"); }
    return apiRequest(`/api/workers?${params.toString()}`);
};
export const triggerSosAlert = (data, token) => apiRequest("/api/sos", { method: "POST", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
export const register = (data) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
export const login = (data) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const loginWithFirebase = (idToken) => apiRequest("/api/auth/firebase", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
export const sendPhoneOtp = (phone) => apiRequest("/api/auth/phone/send", { method: "POST", body: JSON.stringify({ phone }) });
export const verifyPhoneOtp = (phone, code) => apiRequest("/api/auth/phone/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
export const createBooking = (data, token) => apiRequest("/api/bookings", { method: "POST", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
export const getBookings = (token) => apiRequest("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
export const updateBookingStatus = (bookingId, status, token) => apiRequest(`/api/bookings/${bookingId}/status`, { method: "PATCH", body: JSON.stringify({ status }), headers: { Authorization: `Bearer ${token}` } });
export const getAdminOverview = (token) => apiRequest("/api/admin/overview", { headers: { Authorization: `Bearer ${token}` } });
export const updateWorkerVerification = (workerId, status, token) => apiRequest(`/api/workers/${workerId}/verification`, { method: "PATCH", body: JSON.stringify({ status }), headers: { Authorization: `Bearer ${token}` } });
export const extractAadhaar = (formData) => apiRequest("/api/worker/extract-aadhaar", { method: "POST", body: formData });
export const verifyWorkerFace = (data) => apiRequest("/api/worker/verify-face", { method: "POST", body: JSON.stringify(data) });
export const getPendingWorkers = (token) => apiRequest("/api/admin/workers/pending", { headers: { Authorization: `Bearer ${token}` } });
export const reviewWorker = (workerId, status, notes, token) => apiRequest(`/api/admin/workers/${workerId}/review`, { method: "PATCH", body: JSON.stringify({ status, notes }), headers: { Authorization: `Bearer ${token}` } });
export const submitRating = (data, token) => apiRequest("/api/ratings", { method: "POST", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
export const registerWorker = (data, token) => apiRequest("/api/workers", { method: "POST", body: data, headers: { Authorization: `Bearer ${token}` } });
export const updateMyWorkerProfile = (data, token) => apiRequest("/api/workers/me", { method: "PATCH", body: data, headers: { Authorization: `Bearer ${token}` } });
export const updateCustomerProfile = (data, token) => apiRequest("/api/auth/profile", { method: "PATCH", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
export const createPaymentOrder = (bookingId, token) => apiRequest("/api/payments/orders", { method: "POST", body: JSON.stringify({ bookingId }), headers: { Authorization: `Bearer ${token}` } });
export const verifyPayment = (data, token) => apiRequest("/api/payments/verify", { method: "POST", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
export const verifyBookingOtp = (bookingId, otp, token) => apiRequest(`/api/bookings/${bookingId}/verify-otp`, { method: "PATCH", body: JSON.stringify({ otp }), headers: { Authorization: `Bearer ${token}` } });
export const completeBooking = (bookingId, token) => apiRequest(`/api/bookings/${bookingId}/complete`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
export const updateWorkerLiveLocation = (data, token) => apiRequest("/api/workers/location", { method: "PATCH", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });

// Tool Bank APIs
export const getToolInventory = () => apiRequest("/api/toolbank/inventory");
export const rentToolItem = (toolId, token) => apiRequest("/api/toolbank/rent", { method: "POST", body: JSON.stringify({ toolId }), headers: { Authorization: `Bearer ${token}` } });
export const returnToolItem = (rentalId, token) => apiRequest("/api/toolbank/return", { method: "POST", body: JSON.stringify({ rentalId }), headers: { Authorization: `Bearer ${token}` } });
export const getMyToolRentals = (token) => apiRequest("/api/toolbank/my-rentals", { headers: { Authorization: `Bearer ${token}` } });

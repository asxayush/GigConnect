import { useState } from "react";
import { createBooking } from "../../api";
import { showToast } from "../../toast";

function BookingForm({ worker, onCreated, onCancel }) {
    const [form, setForm] = useState({ serviceCategory: worker?.role || "", address: "", scheduledAt: "", price: "" });
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem("gigconnect_token");
        if (!token) { showToast("Sign in before creating a booking."); setMessage("Sign in before creating a booking."); return; }
        setBusy(true);
        try {
            const result = await createBooking({
                serviceCategory: form.serviceCategory,
                address: form.address,
                scheduledAt: new Date(form.scheduledAt).toISOString(),
                price: form.price ? Number(form.price) : undefined,
                workerId: worker?.userId,
            }, token);
            onCreated(result.data);
        } catch (error) {
            showToast(error.message || "Unable to create booking.");
            setMessage(error.message || "Unable to create booking.");
        } finally { setBusy(false); }
    };

    return <form className="booking-form" onSubmit={submit}>
        <div className="booking-form-heading"><div><p className="section-kicker">New booking</p><h3>{worker ? `Request ${worker.name}` : "Request cooperative help"}</h3></div><button type="button" className="text-button" onClick={onCancel}>Cancel</button></div>
        <label>Service<input required value={form.serviceCategory} onChange={(event) => setForm({ ...form, serviceCategory: event.target.value })} /></label>
        <label>Address<input required placeholder="House number, street and area" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
        <label>Date and time<input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label>
        <label>Estimated price<input type="number" min="0" placeholder="Optional" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Creating booking..." : "Confirm booking"}</button>
        {message && <p className="error-message" role="alert">{message}</p>}
    </form>;
}

export default BookingForm;

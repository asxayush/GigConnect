import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { createBooking } from "../../api";
import { showToast } from "../../toast";

function BookingForm({ worker, prefilledDate, onCreated, onCancel }) {
    const { t } = useTranslation();
    const safeDate = (() => {
        if (!prefilledDate) return null;
        const d = new Date(prefilledDate);
        return isNaN(d.getTime()) ? null : d;
    })();

    const [form, setForm] = useState({
        serviceCategory: worker?.role || "",
        address: "",
        scheduledAt: safeDate,
        price: "",
    });
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem("gigconnect_token");
        if (!token) { showToast(t("booking.signInFirst")); setMessage(t("booking.signInFirst")); return; }
        if (!form.scheduledAt || form.scheduledAt < new Date()) {
            setMessage(t("hero.dateError")); return;
        }
        setBusy(true);
        try {
            const result = await createBooking({
                serviceCategory: form.serviceCategory,
                address: form.address,
                scheduledAt: form.scheduledAt.toISOString(),
                price: form.price ? Number(form.price) : undefined,
                workerId: worker?.userId,
            }, token);
            onCreated(result.data);
        } catch (error) {
            showToast(error.message || t("booking.unableToCreate"));
            setMessage(error.message || t("booking.unableToCreate"));
        } finally { setBusy(false); }
    };

    return (
        <form className="booking-form" onSubmit={submit}>
            <div className="booking-form-heading">
                <div>
                    <p className="section-kicker">{t("booking.newBooking")}</p>
                    <h3>{worker ? t("booking.requestWorker", { name: worker.name }) : t("booking.formHeading")}</h3>
                </div>
                <button type="button" className="text-button" onClick={onCancel}>{t("booking.cancel")}</button>
            </div>
            <label>
                {t("booking.service")}
                <input required value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} />
            </label>
            <label>
                {t("booking.address")}
                <input required placeholder={t("booking.addressPlaceholder")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <label>
                {t("booking.dateTime")}
                <DatePicker
                    selected={form.scheduledAt}
                    onChange={(date) => setForm({ ...form, scheduledAt: date })}
                    showTimeSelect
                    timeIntervals={60}
                    minDate={new Date()}
                    dateFormat="d MMM yyyy, h:mm aa"
                    placeholderText={t("booking.dateTime")}
                    className="booking-form-datepicker"
                    aria-label={t("booking.dateTime")}
                    required
                />
            </label>
            <label>
                {t("booking.estimatedPrice")}
                <input type="number" min="0" placeholder={t("booking.optional")} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <button className="button button-primary" type="submit" disabled={busy}>
                {busy ? t("booking.creating") : t("booking.confirmBooking")}
            </button>
            {message && <p className="error-message" role="alert">{message}</p>}
        </form>
    );
}

export default BookingForm;

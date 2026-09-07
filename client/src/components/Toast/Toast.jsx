import { useEffect, useState } from "react";

function Toast() {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleToast = (event) => {
            setToast(event.detail);
            window.clearTimeout(window.gigconnectToastTimer);
            window.gigconnectToastTimer = window.setTimeout(() => setToast(null), 5000);
        };
        window.addEventListener("gigconnect:toast", handleToast);
        return () => {
            window.removeEventListener("gigconnect:toast", handleToast);
            window.clearTimeout(window.gigconnectToastTimer);
        };
    }, []);

    if (!toast) return null;
    return <div className={`toast-popup toast-${toast.type}`} role="alert"><strong>{toast.type === "success" ? "Success" : "Attention"}</strong><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification">×</button></div>;
}

export default Toast;

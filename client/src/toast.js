export function showToast(message, type = "error") {
    window.dispatchEvent(new CustomEvent("gigconnect:toast", { detail: { message, type } }));
}

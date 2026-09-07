const steps = ["Requested", "Assigned", "In Progress", "Completed"];

function StatusTracker({ current = "Assigned" }) {
    const activeIndex = steps.indexOf(current);

    return (
        <div className="status-tracker" aria-label={`Booking status: ${current}`}>
            {steps.map((step, index) => (
                <div className={`status-step ${index <= activeIndex ? "is-active" : ""}`} key={step}>
                    <span className="status-marker">{index < activeIndex ? "✓" : index + 1}</span>
                    <span>{step}</span>
                </div>
            ))}
        </div>
    );
}

export default StatusTracker;

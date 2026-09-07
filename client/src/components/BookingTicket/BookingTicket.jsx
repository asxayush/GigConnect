import StatusTracker from "../StatusTracker/StatusTracker";

function BookingTicket({ booking, onOpen }) {
    return (
        <article className={`booking-ticket booking-${booking.status.toLowerCase().replace(" ", "-")}`}>
            <div className="ticket-content">
                <div className="ticket-heading">
                    <div>
                        <p className="ticket-id">{booking.id}</p>
                        <h3>{booking.service}</h3>
                    </div>
                    <span className="status-label">{booking.status}</span>
                </div>
                <p className="ticket-detail">{booking.date} at {booking.time} · {booking.address}</p>
                <StatusTracker current={booking.status} />
                <button className="button button-secondary" onClick={onOpen}>View booking</button>
            </div>
        </article>
    );
}

export default BookingTicket;

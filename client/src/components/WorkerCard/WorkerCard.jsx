function WorkerCard({ worker, onBook }) {
    return (
        <article className="worker-badge">
            <div className="worker-avatar" aria-hidden="true">{worker.initials}</div>
            <div className="worker-badge-content">
                <div className="badge-topline">
                    <span className="verified-badge">✓ VERIFIED</span>
                    <span className="worker-area">{worker.area}</span>
                </div>
                <h3>{worker.name}</h3>
                <p className="worker-role">{worker.role} · {worker.experience} years</p>
                <div className="skill-tags">
                    {worker.skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
                <div className="worker-meta">
                    <span className="rating">★ {worker.rating}</span>
                    <span>{worker.jobs} jobs completed</span>
                    <span>{worker.distance} km away</span>
                </div>
                <button className="button button-primary button-small" onClick={() => onBook(worker)}>
                    Book {worker.name.split(" ")[0]}
                </button>
            </div>
        </article>
    );
}

export default WorkerCard;

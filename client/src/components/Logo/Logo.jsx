/**
 * GigConnect SVG Logo Component
 * Geometric "GC" monogram — two interlocking arcs representing connection/cooperation.
 * Uses only --accent (#E8720C) and --white (#fffdf8). Scales perfectly at any size.
 */
export default function Logo({ size = 38, accent = "#E8720C", white = "#fffdf8" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="GigConnect"
            role="img"
        >
            {/* Background square */}
            <rect width="40" height="40" fill={accent} />

            {/* Left arc — represents "G" (large C-shape opening right) */}
            <path
                d="M 20 8 A 12 12 0 1 0 20 32 L 20 26 A 6 6 0 1 1 20 14 Z"
                fill={white}
            />

            {/* Right connector — small arc representing the second worker/link */}
            <path
                d="M 22 20 L 32 20 L 32 26 A 6 6 0 0 1 22 26 Z"
                fill={white}
            />

            {/* Accent dot — the cooperative "node" connection point */}
            <circle cx="28" cy="20" r="2.5" fill={accent} />
        </svg>
    );
}

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * HeroBackground — Slow, subtle animated background for the hero visual panel.
 * Uses GSAP to animate only transform (x/y) and opacity — no layout-triggering props.
 * Shapes are colored with site palette: accent (#E8720C), navy (#26415C), green (#2F6F4E).
 * Respects prefers-reduced-motion — animation paused if OS setting is enabled.
 */

const SHAPES = [
    { cx: "15%",  cy: "20%", r: 220, fill: "#E8720C", opacity: 0.28, delay: 0,    dur: 22 },
    { cx: "75%",  cy: "15%", r: 180, fill: "#26415C", opacity: 0.22, delay: 3,    dur: 26 },
    { cx: "50%",  cy: "60%", r: 260, fill: "#2F6F4E", opacity: 0.20, delay: 6,    dur: 30 },
    { cx: "85%",  cy: "75%", r: 150, fill: "#E8720C", opacity: 0.18, delay: 1.5,  dur: 20 },
    { cx: "20%",  cy: "80%", r: 200, fill: "#26415C", opacity: 0.16, delay: 9,    dur: 28 },
    { cx: "60%",  cy: "35%", r: 130, fill: "#2F6F4E", opacity: 0.14, delay: 4.5,  dur: 24 },
];

export default function HeroBackground() {
    const containerRef = useRef(null);

    useEffect(() => {
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        const circles = containerRef.current?.querySelectorAll(".hero-blob");
        if (!circles) return;

        const tweens = [];
        circles.forEach((el, i) => {
            const shape = SHAPES[i];
            // Drift values: gentle, organic movement
            const xRange = 28 + (i * 7) % 20;
            const yRange = 22 + (i * 5) % 18;

            const tween = gsap.to(el, {
                x: `+=${xRange}`,
                y: `+=${yRange}`,
                opacity: shape.opacity * 0.6,
                duration: shape.dur,
                delay: shape.delay,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            });
            tweens.push(tween);
        });

        return () => { tweens.forEach(t => t.kill()); };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
            aria-hidden="true"
        >
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <defs>
                    {/* Large blur filter for soft blob effect */}
                    <filter id="hero-blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="12" />
                    </filter>
                </defs>

                {SHAPES.map((s, i) => (
                    <circle
                        key={i}
                        className="hero-blob"
                        cx={s.cx}
                        cy={s.cy}
                        r={s.r}
                        fill={s.fill}
                        opacity={s.opacity}
                        filter="url(#hero-blur)"
                    />
                ))}
            </svg>

            {/* Subtle overlay to prevent blobs from overpowering the gradient */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(118deg, rgba(0,255,136,0.35) 0%, rgba(108,255,187,0.2) 25%, rgba(255,83,211,0.3) 72%, rgba(255,0,255,0.25) 100%)",
                }}
            />
        </div>
    );
}

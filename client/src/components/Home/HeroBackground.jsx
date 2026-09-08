import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * HeroBackground — Slow, subtle animated background for the hero visual panel.
 * Uses GSAP to animate only transform (x/y) and opacity — no layout-triggering props.
 * Shapes are colored with site palette: accent (#E8720C), navy (#26415C), green (#2F6F4E).
 * Respects prefers-reduced-motion — animation paused if OS setting is enabled.
 */

const SHAPES = [
    { cx: "15%",  cy: "20%", r: 220, fill: "#fd651e", opacity: 0.22, delay: 0,    dur: 22 },
    { cx: "75%",  cy: "15%", r: 180, fill: "#003548", opacity: 0.28, delay: 3,    dur: 26 },
    { cx: "50%",  cy: "60%", r: 260, fill: "#005321", opacity: 0.18, delay: 6,    dur: 30 },
    { cx: "85%",  cy: "75%", r: 150, fill: "#fd651e", opacity: 0.16, delay: 1.5,  dur: 20 },
    { cx: "20%",  cy: "80%", r: 200, fill: "#0e4d64", opacity: 0.24, delay: 9,    dur: 28 },
    { cx: "60%",  cy: "35%", r: 130, fill: "#003548", opacity: 0.18, delay: 4.5,  dur: 24 },
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

            {/* Subtle overlay using Stitch tokens */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(135deg, rgba(0,53,72,0.65) 0%, rgba(14,77,100,0.45) 60%, rgba(253,101,30,0.12) 100%)",
                }}
            />
        </div>
    );
}

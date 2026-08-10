"use client";

import { useEffect, useRef } from "react";

type Mote = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	phase: number;
	spin: number;
};

export default function AmbientBackground() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;

		if (!container || !canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const reduce = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		let w = 0;
		let h = 0;
		let dpr = 1;
		let motes: Mote[] = [];

		const seed = (count: number) => {
			motes = Array.from({ length: count }, () => ({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - 0.5) * 0.12,
				vy: -(0.12 + Math.random() * 0.28),
				size: Math.random() < 0.25 ? 8 : 6,
				phase: Math.random() * Math.PI * 2,
				spin: 0.6 + Math.random() * 0.8,
			}));
		};

		const resize = () => {
			const rect = container.getBoundingClientRect();

			dpr = Math.min(window.devicePixelRatio || 1, 2);

			w = rect.width;
			h = rect.height;

			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);

			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.imageSmoothingEnabled = false;

			seed(Math.round((w * h) / 42000) + 8);
		};

		resize();

		const observer = new ResizeObserver(resize);
		observer.observe(container);

		let raf = 0;
		let t = 0;

		const draw = () => {
			ctx.clearRect(0, 0, w, h);

			/* -------- 細格線 -------- */

			const drift = (t * 0.12) % 24;

			ctx.strokeStyle = "rgba(0,0,0,0.05)";
			ctx.lineWidth = 1;

			ctx.beginPath();

			for (let x = -24 + drift; x < w + 24; x += 24) {
				ctx.moveTo(Math.round(x) + 0.5, 0);
				ctx.lineTo(Math.round(x) + 0.5, h);
			}

			for (let y = -24 + drift; y < h + 24; y += 24) {
				ctx.moveTo(0, Math.round(y) + 0.5);
				ctx.lineTo(w, Math.round(y) + 0.5);
			}

			ctx.stroke();

			/* -------- 粗格線 -------- */

			const drift2 = (t * 0.04) % 96;

			ctx.strokeStyle = "rgba(0,0,0,0.08)";
			ctx.beginPath();

			for (let x = -96 + drift2; x < w + 96; x += 96) {
				ctx.moveTo(Math.round(x) + 0.5, 0);
				ctx.lineTo(Math.round(x) + 0.5, h);
			}

			for (let y = -96 + drift2; y < h + 96; y += 96) {
				ctx.moveTo(0, Math.round(y) + 0.5);
				ctx.lineTo(w, Math.round(y) + 0.5);
			}

			ctx.stroke();

			/* -------- 金幣 -------- */

			for (const p of motes) {
				p.y += p.vy;
				p.x += p.vx + Math.sin(t * 0.008 + p.phase) * 0.18;

				if (p.y < -16) p.y = h + 16;
				if (p.y > h + 16) p.y = -16;

				if (p.x < -16) p.x = w + 16;
				if (p.x > w + 16) p.x = -16;

				const step = Math.floor((((t * 0.02 * p.spin) % 4) + 4) % 4);
				const squash = [1, 0.5, 0.15, 0.5][step];

				const wpx = Math.max(2, Math.round(p.size * squash));

				const x = Math.round(p.x - wpx / 2);
				const y = Math.round(p.y);

				ctx.globalAlpha = 0.5;
				ctx.fillStyle = "#000";
				ctx.fillRect(x - 1, y - 1, wpx + 2, p.size + 2);

				ctx.fillStyle = "#FFD45C";
				ctx.fillRect(x, y, wpx, p.size);
			}

			ctx.globalAlpha = 1;

			if (!reduce) {
				t++;
				raf = requestAnimationFrame(draw);
			}
		};

		draw();

		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
		};
	}, []);

	const sky = {
		top: "#FFFFFF",
		mid: "#FFFFFF",
		low: "#FFFFFF",
	};

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 overflow-hidden pointer-events-none"
			aria-hidden
		>
			<div className="absolute inset-0 -z-20" style={{ background: sky.low }} />

			<div
				className="dither absolute inset-x-0 top-0 h-[38%] -z-20"
				style={
					{
						"--dither-a": sky.top,
						"--dither-b": sky.mid,
					} as React.CSSProperties
				}
			/>

			<div
				className="dither dither-sparse absolute inset-x-0 top-[38%] h-[22%] -z-20"
				style={
					{
						"--dither-a": sky.mid,
						"--dither-b": sky.low,
					} as React.CSSProperties
				}
			/>

			<canvas ref={canvasRef} className="absolute inset-0 -z-10" />

			<div className="absolute inset-0 -z-10 crt-lines" />
		</div>
	);
}

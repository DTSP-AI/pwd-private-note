"use client";

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

export interface SignatureCanvasHandle {
  hasMark: () => boolean;
  clear: () => void;
  toDataURL: () => string;
  drawTo: (dest: HTMLCanvasElement) => void;
}

interface Props {
  label: string;
  id: string;
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(
  ({ label, id }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasMarkRef = useRef(false);
    const drawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    const init = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const w = c.offsetWidth || 380;
      const dpr = window.devicePixelRatio || 1;
      c.width = w * dpr;
      c.height = 130 * dpr;
      c.style.height = "130px";
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = "#d0c8b0";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, []);

    useEffect(() => {
      const timer = setTimeout(init, 80);
      window.addEventListener("resize", init);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", init);
      };
    }, [init]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
      const c = canvasRef.current!;
      const r = c.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
      drawingRef.current = true;
      const pos = getPos(e);
      lastPosRef.current = pos;
    };

    const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawingRef.current) return;
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPosRef.current = pos;
      hasMarkRef.current = true;
    };

    const endDraw = () => {
      drawingRef.current = false;
    };

    useImperativeHandle(ref, () => ({
      hasMark: () => hasMarkRef.current,
      clear: () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, c.width, c.height);
        hasMarkRef.current = false;
      },
      toDataURL: () => canvasRef.current?.toDataURL("image/png") || "",
      drawTo: (dest: HTMLCanvasElement) => {
        const src = canvasRef.current;
        if (!src || !dest) return;
        const dpr = window.devicePixelRatio || 1;
        dest.width = dest.offsetWidth * dpr;
        dest.height = 50 * dpr;
        dest.style.height = "50px";
        const ctx = dest.getContext("2d");
        if (ctx) ctx.drawImage(src, 0, 0, dest.offsetWidth, 50);
      },
    }));

    return (
      <div className="mb-5">
        <span className="block text-[11px] font-medium tracking-[0.06em] uppercase text-text2 mb-2">
          {label}
        </span>
        <canvas
          ref={canvasRef}
          id={id}
          className="sig w-full rounded-xl border border-border bg-bg2 hover:border-gold transition-colors"
          style={{ height: 130 }}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={(e) => {
            e.preventDefault();
            startDraw(e);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            moveDraw(e);
          }}
          onTouchEnd={endDraw}
        />
        <div className="flex justify-between items-center mt-1.5">
          <button
            type="button"
            className="text-xs text-text3 hover:text-text2 cursor-pointer"
            onClick={() => {
              const c = canvasRef.current;
              if (!c) return;
              const ctx = c.getContext("2d");
              if (ctx) ctx.clearRect(0, 0, c.width, c.height);
              hasMarkRef.current = false;
            }}
          >
            ✕ Clear
          </button>
          {hasMarkRef.current && (
            <span className="text-[11px] text-success flex items-center gap-1">
              ✓ Signed
            </span>
          )}
        </div>
      </div>
    );
  }
);

SignatureCanvas.displayName = "SignatureCanvas";
export default SignatureCanvas;

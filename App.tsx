import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eraser, Moon, Paintbrush, RotateCcw, Trash2 } from 'lucide-react';
import './App.css';

const STORAGE_KEY = 'dream-doodle-canvas';
const BG_COLOR = '#08070c';
const MAX_HISTORY = 25;

const PALETTE = [
  '#f5f0e6', // moonlight cream
  '#f5a742', // warm amber
  '#f2a6c9', // soft pink
  '#b8a6f2', // lavender
  '#7fb8f0', // dusty sky
  '#8fe3c0', // mint
];

const BRUSH_SIZES = [
  { label: 'Fine', value: 3 },
  { label: 'Medium', value: 6 },
  { label: 'Bold', value: 14 },
];

type Tool = 'pen' | 'eraser';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<string[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [color, setColor] = useState(PALETTE[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
  const [tool, setTool] = useState<Tool>('pen');
  const [dimness, setDimness] = useState(0.35);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [canUndo, setCanUndo] = useState(false);

  const fillBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const getCssSize = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const setupCanvas = useCallback((restoreDataUrl?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = getCssSize();

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;

    fillBackground(ctx, width, height);

    if (restoreDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = restoreDataUrl;
    }
  }, [fillBackground]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setupCanvas(saved || undefined);

    const handleResize = () => {
      const canvas = canvasRef.current;
      const dataUrl = canvas ? canvas.toDataURL('image/png') : undefined;
      setupCanvas(dataUrl);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      localStorage.setItem(STORAGE_KEY, canvas.toDataURL('image/png'));
    }, 400);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL('image/png');
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 0);
  }, []);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    pushHistory();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    const point = getPoint(e);

    ctx.strokeStyle = tool === 'eraser' ? BG_COLOR : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    persist();
  };

  const handleClear = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    pushHistory();
    const { width, height } = getCssSize();
    fillBackground(ctx, width, height);
    persist();
  };

  const handleUndo = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const previous = historyRef.current.pop();
    setCanUndo(historyRef.current.length > 0);
    if (!previous) return;
    const { width, height } = getCssSize();
    const img = new Image();
    img.onload = () => {
      fillBackground(ctx, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      persist();
    };
    img.src = previous;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `dream-doodle-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="app">
      <canvas
        ref={canvasRef}
        className="doodle-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Night dimmer overlay — darkens the screen without affecting drawing */}
      <div className="dimmer-overlay" style={{ opacity: dimness }} />

      {/* Toggle tab for the toolbar */}
      <button
        onClick={() => setToolbarVisible((v) => !v)}
        className="toolbar-toggle"
        aria-label={toolbarVisible ? 'Hide toolbar' : 'Show toolbar'}
      >
        <Paintbrush size={18} />
      </button>

      {toolbarVisible && (
        <div className="toolbar-wrap">
          <div className="toolbar">
            <div className="row">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`swatch ${tool === 'pen' && color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setTool('pen');
                }}
                className="swatch-color"
                aria-label="Custom color"
              />
              <button
                onClick={() => setTool('eraser')}
                className={`icon-btn ${tool === 'eraser' ? 'active' : ''}`}
                aria-label="Eraser"
              >
                <Eraser size={16} />
              </button>
            </div>

            <div className="row">
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBrushSize(b.value)}
                  className={`size-btn ${brushSize === b.value ? 'active' : ''}`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="dim-row">
              <Moon size={14} />
              <input
                type="range"
                min={0}
                max={0.85}
                step={0.01}
                value={dimness}
                onChange={(e) => setDimness(parseFloat(e.target.value))}
                aria-label="Dim screen"
              />
            </div>

            <div className="row">
              <button onClick={handleUndo} disabled={!canUndo} className="action-btn">
                <RotateCcw size={14} /> Undo
              </button>
              <button onClick={handleClear} className="action-btn danger">
                <Trash2 size={14} /> Clear
              </button>
              <button onClick={handleDownload} className="action-btn">
                <Download size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

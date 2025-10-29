"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const BackgroundRippleEffect = ({
  cellSize = 56,
}: {
  cellSize?: number;
}) => {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate responsive values based on screen size
  const responsiveCellSize = useMemo(() => {
    if (dimensions.width < 640) return 40;
    if (dimensions.width < 1024) return 48;
    return cellSize;
  }, [dimensions.width, cellSize]);

  const responsiveCols = useMemo(() => {
    return Math.ceil(dimensions.width / responsiveCellSize) + 4; // Increased padding for full coverage
  }, [dimensions.width, responsiveCellSize]);

  const responsiveRows = useMemo(() => {
    return Math.ceil(dimensions.height / responsiveCellSize) + 4; // Increased padding for full coverage
  }, [dimensions.height, responsiveCellSize]);

  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<any>(null);

  return (
    <div
      ref={ref}
      className="fixed inset-0 h-screen w-screen overflow-hidden"
      style={{
        '--cell-border-color': '#6B7280',
        '--cell-fill-color': 'rgba(249, 250, 251, 0.5)',
        '--cell-shadow-color': 'rgba(0, 0, 0, 0.02)',
      } as React.CSSProperties}
    >
      <DivGrid
        key={`base-${rippleKey}`}
        className="opacity-60"
        rows={responsiveRows}
        cols={responsiveCols}
        cellSize={responsiveCellSize}
        borderColor="#6B7280"
        fillColor="rgba(249, 250, 251, 0.5)"
        clickedCell={clickedCell}
        onCellClick={(row, col) => {
          setClickedCell({ row, col });
          setRippleKey((k) => k + 1);
        }}
        interactive={true}
      />
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number; // in pixels
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "#6B7280",
  fillColor = "rgba(249,250,251,0.5)",
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols],
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: "100vw",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <div className={cn("relative z-3", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0; // ms
        const duration = 200 + distance * 80; // ms

        const style: CellStyle = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-50 transition-opacity duration-150 will-change-transform hover:opacity-80",
              clickedCell && "animate-cell-ripple [animation-fill-mode:none]",
              !interactive && "pointer-events-none",
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              ...style,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};


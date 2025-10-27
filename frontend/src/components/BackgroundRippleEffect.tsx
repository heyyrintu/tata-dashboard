import React, { useMemo, useRef, useState, useEffect } from "react";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface BackgroundRippleEffectProps {
  cellSize?: number;
}

export const BackgroundRippleEffect = ({
  cellSize = 56,
}: BackgroundRippleEffectProps) => {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate responsive values based on screen size to cover full background
  const responsiveCellSize = useMemo(() => {
    if (dimensions.width < 640) return 40;
    if (dimensions.width < 1024) return 48;
    return cellSize;
  }, [dimensions.width, cellSize]);

  const responsiveCols = useMemo(() => {
    // Calculate number of columns to cover full width
    return Math.ceil(dimensions.width / responsiveCellSize) + 2; // +2 to ensure full coverage
  }, [dimensions.width, responsiveCellSize]);

  const responsiveRows = useMemo(() => {
    // Calculate number of rows to cover full height
    return Math.ceil(dimensions.height / responsiveCellSize) + 2; // +2 to ensure full coverage
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
      className={cn(
        "fixed inset-0 h-full w-full pointer-events-none overflow-hidden",
        "[--cell-border-color:#1e3a8a] [--cell-fill-color:rgba(15,23,42,0.4)] [--cell-shadow-color:#0f172a]",
      )}
    >
      <DivGrid
        key={`base-${rippleKey}`}
        className="opacity-20"
        rows={responsiveRows}
        cols={responsiveCols}
        cellSize={responsiveCellSize}
        borderColor="#1e3a8a"
        fillColor="rgba(15, 23, 42, 0.4)"
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
  cellSize: number;
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
  borderColor = "#1f2937",
  fillColor = "rgba(0, 0, 0, 0.3)",
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
  };

  return (
    <div className={cn("relative z-3", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0;
        const duration = 200 + distance * 80;

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
            "cell relative border-[0.5px] opacity-30 transition-opacity duration-150 will-change-transform pointer-events-auto",
            "hover:opacity-60 hover:bg-opacity-50 transition-all duration-200",
            clickedCell && "animate-cell-ripple [animation-fill-mode:forwards]",
          )}
          style={{
            backgroundColor: fillColor,
            borderColor: borderColor,
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


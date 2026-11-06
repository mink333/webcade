"use client";

import { useEffect, useRef } from "react";

export default function Client() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldConfig = useRef({ col: 10, row: 10, mine: 10 });
  const fieldData = useRef<Uint8Array>(null);
  const fieldCount = useRef<Uint8Array>(null);
  const coord2Index = (col: number, row: number) =>
    row * fieldConfig.current.col + col;
  const index2Col = (index: number) => index % fieldConfig.current.col;
  const index2Row = (index: number) =>
    Math.floor(index / fieldConfig.current.col);
  const neighbor = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];
  const isMine = (n: number) => (n & 1) !== 0;
  const isFlagged = (n: number) => (n & 2) !== 0;
  const isRevealed = (n: number) => (n & 4) !== 0;
  const toggleFlag = (fd: Uint8Array, col: number, row: number) => {
    fd[coord2Index(col, row)] ^= 2;
  };
  const reveal = (fd: Uint8Array, col: number, row: number) => {
    fd[coord2Index(col, row)] |= 4;
    if (!fieldCount.current || fieldCount.current[coord2Index(col, row)] !== 0)
      return;
    neighbor.forEach((coord) => {
      const tx = col + coord[0];
      const ty = row + coord[1];
      if (
        tx >= 0 &&
        tx < fieldConfig.current.col &&
        ty >= 0 &&
        ty < fieldConfig.current.row
      ) {
        const index = coord2Index(tx, ty);
        console.log(tx, ty, index, isRevealed(index));
        if (fieldCount.current && !isRevealed(fd[index]) && !isMine(fd[index]))
          reveal(fd, tx, ty);
      }
    });
  };
  const viewerConfig = useRef({
    width: 0,
    height: 0,
    pos: {
      x: 0,
      y: 0,
    },
    ratio: 100,
    upscale: 1.25,
  });
  const MINE_SIZE = 50;
  const MINE_GAP = 10;

  const drawViewer = (ctx: CanvasRenderingContext2D | null) => {
    console.log("drawing");
    const vc = viewerConfig.current;
    const fd = fieldData.current;
    const fc = fieldCount.current;
    if (!ctx || !vc || !fd || !fc) return;
    ctx.clearRect(0, 0, vc.width, vc.height);
    // ctx.fillStyle = "#f0f";
    // ctx.fillRect(vc.pos.x, vc.pos.y, (fieldConfig.current.col * (MINE_SIZE + MINE_GAP) + MINE_GAP) * vc.ratio / 100, (fieldConfig.current.row * (MINE_SIZE + MINE_GAP) + MINE_GAP) * vc.ratio / 100);
    fd.forEach((cel, index) => {
      const x = index2Col(index);
      const y = index2Row(index);
      const startPoint = {
        x:
          (((x * (MINE_SIZE + MINE_GAP) + MINE_GAP) * vc.ratio) / 100) *
            vc.upscale +
          vc.pos.x,
        y:
          (((y * (MINE_SIZE + MINE_GAP) + MINE_GAP) * vc.ratio) / 100) *
            vc.upscale +
          vc.pos.y,
      };
      const size = {
        w: ((MINE_SIZE * vc.ratio) / 100) * vc.upscale,
        h: ((MINE_SIZE * vc.ratio) / 100) * vc.upscale,
      };
      ctx.fillStyle = "#00f";
      if (isRevealed(cel)) {
        if (isMine(cel)) ctx.fillStyle = "#f00";
        else ctx.fillStyle = "#ccf";
      } else if (isFlagged(cel)) {
        ctx.fillStyle = "#0f0";
      }
      ctx.beginPath();
      ctx.roundRect(
        startPoint.x,
        startPoint.y,
        size.w,
        size.h,
        ((8 * vc.ratio) / 100) * vc.upscale,
      );
      ctx.fill();
      ctx.closePath();
      if (isRevealed(cel) && !isMine(cel) && fc[index] !== 0) {
        const fontsize = ((24 * vc.ratio) / 100) * vc.upscale;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${fontsize}px san-serif`;
        ctx.fillText(
          fc[index].toString(),
          startPoint.x + (((MINE_SIZE / 2) * vc.ratio) / 100) * vc.upscale,
          startPoint.y + (((MINE_SIZE / 2 + 3) * vc.ratio) / 100) * vc.upscale,
        );
      }
    });
  };
  const handleTileClick = (
    ctx: CanvasRenderingContext2D | null,
    x: number,
    y: number,
    button: number,
    pointerType: string,
  ) => {
    const vc = viewerConfig.current;
    const fc = fieldConfig.current;
    const fd = fieldData.current;
    if (!vc || !fc || !fd) return;
    const localX =
      x / (vc.ratio / 100) - vc.pos.x / vc.upscale / (vc.ratio / 100);
    const localY =
      y / (vc.ratio / 100) - vc.pos.y / vc.upscale / (vc.ratio / 100);
    const isOnTile =
      localX % (MINE_SIZE + MINE_GAP) >= MINE_GAP &&
      localY % (MINE_SIZE + MINE_GAP) >= MINE_GAP;
    const col = Math.floor(localX / (MINE_SIZE + MINE_GAP));
    const row = Math.floor(localY / (MINE_SIZE + MINE_GAP));
    if (col > fc.col || row > fc.row || !isOnTile) return;
    if (pointerType === "mouse") {
      switch (button) {
        case 0:
          reveal(fd, col, row);
          break;
        case 2:
          toggleFlag(fd, col, row);
          break;
      }
    }
    drawViewer(ctx);
  };

  const makeNewGame = (col: number, row: number, mine: number) => {
    const fieldData = new Uint8Array(col * row);
    const fieldCount = new Uint8Array(col * row);
    let count = 0;
    while (count < mine) {
      const rand = Math.floor(Math.random() * col * row);
      if (fieldData[rand] !== 0) continue;
      fieldData[rand] = 1;
      count++;
    }
    fieldData.forEach((cel, index) => {
      const x = index2Col(index);
      const y = index2Row(index);
      let count = 0;
      neighbor.forEach((coord) => {
        const tx = x + coord[0];
        const ty = y + coord[1];
        if (tx >= 0 && tx < col && ty >= 0 && ty < row) {
          if (isMine(fieldData[coord2Index(tx, ty)])) count++;
        }
      });
      fieldCount[index] = count;
      count = 0;
    });
    return { fieldData, fieldCount };
  };

  useEffect(() => {
    console.log("initializing...");
    const initData = makeNewGame(
      fieldConfig.current.col,
      fieldConfig.current.row,
      fieldConfig.current.mine,
    );
    fieldData.current = initData.fieldData;
    fieldCount.current = initData.fieldCount;
    console.log(fieldData.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = canvas.clientWidth * viewerConfig.current.upscale;
      canvas.height = canvas.clientHeight * viewerConfig.current.upscale;
      viewerConfig.current.width =
        canvas.clientWidth * viewerConfig.current.upscale;
      viewerConfig.current.height =
        canvas.clientHeight * viewerConfig.current.upscale;
      drawViewer(ctx);
    };
    resize();
    const centering = () => {
      const vc = viewerConfig.current;
      const fc = fieldConfig.current;
      const mine_width = fc.col * (MINE_SIZE + MINE_GAP) + MINE_GAP;
      const mine_height = fc.row * (MINE_SIZE + MINE_GAP) + MINE_GAP;
      const width_ratio = mine_width > vc.width ? vc.width / mine_width : 1;
      const height_ratio =
        mine_height > vc.height ? vc.height / mine_height : 1;
      vc.ratio = Math.min(width_ratio, height_ratio) * 100;
      vc.pos.x =
        vc.width / 2 -
        (((fc.col * (MINE_SIZE + MINE_GAP) + MINE_GAP) * vc.ratio) / 200) *
          vc.upscale;
      vc.pos.y =
        vc.height / 2 -
        (((fc.row * (MINE_SIZE + MINE_GAP) + MINE_GAP) * vc.ratio) / 200) *
          vc.upscale;
    };
    centering();
    const activePointers = new Map<number, PointerEvent>();
    let lastPanPoint = { x: 0, y: 0 };
    let lastCenterPoint: { x: number; y: number } | null = null;
    let lastPinchDistance = 0;
    let dragDistance = 0;
    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, e);

      if (activePointers.size === 1) {
        lastPanPoint = { x: e.offsetX, y: e.offsetY };
        dragDistance = 0;
      } else if (activePointers.size === 2) {
        const [p1, p2] = Array.from(activePointers.values());
        lastPinchDistance = Math.hypot(
          p1.offsetX - p2.offsetX,
          p1.offsetY - p2.offsetY,
        );
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, e);
      if (activePointers.size === 1) {
        const dx = e.offsetX - lastPanPoint.x;
        const dy = e.offsetY - lastPanPoint.y;

        viewerConfig.current.pos.x += dx * viewerConfig.current.upscale;
        viewerConfig.current.pos.y += dy * viewerConfig.current.upscale;

        dragDistance += Math.hypot(dx, dy);

        lastPanPoint = { x: e.offsetX, y: e.offsetY };
        drawViewer(ctx);
      }

      if (activePointers.size === 2) {
        const [p1, p2] = Array.from(activePointers.values());
        const currentDist = Math.hypot(
          p1.offsetX - p2.offsetX,
          p1.offsetY - p2.offsetY,
        );
        const centerX = (p1.offsetX + p2.offsetX) / 2;
        const centerY = (p1.offsetY + p2.offsetY) / 2;

        if (!lastCenterPoint) lastCenterPoint = { x: centerX, y: centerY };
        const dx = centerX - lastCenterPoint.x;
        const dy = centerY - lastCenterPoint.y;
        viewerConfig.current.pos.x += dx;
        viewerConfig.current.pos.y += dy;

        if (lastPinchDistance > 0) {
          const zoomFactor = currentDist / lastPinchDistance;
          applyZoomAtPoint(centerX, centerY, zoomFactor);
        }
        lastPinchDistance = currentDist;
        lastCenterPoint = { x: centerX, y: centerY };
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);
      activePointers.delete(e.pointerId);

      if (dragDistance < 5 && activePointers.size === 0) {
        handleTileClick(ctx, e.offsetX, e.offsetY, e.button, e.pointerType);
      }

      if (activePointers.size < 2) {
        lastPinchDistance = 0;
      }
      if (activePointers.size === 1) {
        const remaining = activePointers.values().next().value;
        if (!remaining) return;
        lastPanPoint = { x: remaining.offsetX, y: remaining.offsetY };
        lastCenterPoint = null;
      }
    };
    const applyZoomAtPoint = (
      targetX: number,
      targetY: number,
      zoomFactor: number,
    ) => {
      const vc = viewerConfig.current;
      const prevLocalX = (targetX * vc.upscale - vc.pos.x) / (vc.ratio / 100);
      const prevLocalY = (targetY * vc.upscale - vc.pos.y) / (vc.ratio / 100);
      vc.ratio *= zoomFactor;
      const localX = (targetX * vc.upscale - vc.pos.x) / (vc.ratio / 100);
      const localY = (targetY * vc.upscale - vc.pos.y) / (vc.ratio / 100);
      vc.pos.x += (localX - prevLocalX) * (vc.ratio / 100);
      vc.pos.y += (localY - prevLocalY) * (vc.ratio / 100);
      console.log("local: ", localX, localY);
      drawViewer(ctx);
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      drawViewer(ctx);
      applyZoomAtPoint(e.offsetX, e.offsetY, zoomFactor);
    };
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("wheel", handleWheel);
    window.addEventListener("resize", resize);
    console.log("initialized");
    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);
  return (
    <div className="bg-blue-100 w-full flex-1 flex flex-col">
      <canvas
        className="w-full flex-1 touch-none select-none"
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        ref={canvasRef}
      ></canvas>
      <div>
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-1/2 bg-white p-4 rounded-lg shadow-2xl space-y-4">
          <h2 className="text-xl font-semibold">설정</h2>
          <div className="flex flex-col gap-2">
            <label>가로</label>
            <input type="number" className="bg-gray-200 border-2 border-gray-300 focus:border-blue-400 rounded-md focus:rounded-md"/>
          </div>
          <div className="flex flex-col gap-2">
            <label>세로</label>
            <input type="number" className="bg-gray-200 border-2 border-gray-300 focus:border-blue-400 rounded-md focus:rounded-md" />
          </div>
          <div className="flex flex-col gap-2">
            <label>지뢰 개수</label>
            <input type="number" className="bg-gray-200 border-2 border-gray-300 focus:border-blue-400 rounded-md focus:rounded-md" />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 h-12 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-md">취소</button>
            <button className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-md text-white">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

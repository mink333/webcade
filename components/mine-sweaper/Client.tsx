"use client";

import { GameManager } from "@/engine/mine-sweaper/GameManager";
import { RefObject, useEffect, useRef, useState } from "react";

export default function Client() {
  const INITIAL_CONFIG = { width: 10, height: 10, mines: 10 };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameConfig = useRef({
    width: INITIAL_CONFIG.width,
    height: INITIAL_CONFIG.height,
    mines: INITIAL_CONFIG.mines,
  });
  const game = useRef<GameManager | null>(null);
  const [gamePhase, setGamePhase] = useState<"ready" | "playing" | "finished">("ready");
  const [modalVisible, setModalVisible] = useState(false);
  const applyAction = (width: number, height: number, mines: number) => {
    gameConfig.current = { width, height, mines }
    if (!canvasRef.current) return;
    game.current = new GameManager(canvasRef.current, width, height, mines, setGamePhase);
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    game.current = new GameManager(
      canvas,
      gameConfig.current.width,
      gameConfig.current.height,
      gameConfig.current.mines,
      setGamePhase,
    );
  }, []);
  useEffect(() => {

  }, [gamePhase]);
  return (
    <div className="w-full flex-1 bg-blue-100 flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 bg-slate-200"></canvas>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-50 flex">
        <h1>[{gamePhase}]지뢰찾기</h1>
        <button onClick={() => setModalVisible(true)}>설정</button>
      </div>
      {modalVisible && (
        <ConfigModal
          config={gameConfig}
          applyAction={applyAction}
          onCloseAction={() => setModalVisible(false)}
        />
      )}
    </div>
  );
}

function ConfigModal({
  config,
  applyAction,
  onCloseAction,
}: {
    config: RefObject<{ width: number; height: number; mines: number }>;
    applyAction: (width: number, height: number, mines: number) => void;
  onCloseAction: () => void;
}) {
  const [width, setWidth] = useState(config.current.width);
  const [height, setHeight] = useState(config.current.height);
  const [mines, setMines] = useState(config.current.mines);
  const handleCancel = () => {
    onCloseAction();
  };
  const handleApply = () => {
    applyAction(width, height, mines);
    onCloseAction();
  };
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div
        className="absolute top-0 left-0 w-full h-full bg-black opacity-40"
        onClick={onCloseAction}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-1/2 bg-white p-4 rounded-lg shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold">설정</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="col">가로</label>
          <input
            id="col"
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="px-2 py-1.5 bg-gray-200 border-2 border-gray-300 focus:border-blue-400 rounded-md focus:rounded-md"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="row">세로</label>
          <input
            id="row"
            type="number"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value))}
            className="px-2 py-1.5 bg-gray-200 border-2 border-gray-300 focus:border-blue-400 rounded-md focus:rounded-md"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="mine">지뢰 개수</label>
          <input
            id="mine"
            type="number"
            value={mines}
            onChange={(e) => setMines(parseInt(e.target.value))}
            className="px-2 py-1.5 bg-gray-200 border-2 border-gray-300 focus:border-blue-400 rounded-md focus:rounded-md"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 h-12 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-md" onClick={handleCancel}>
            취소
          </button>
          <button className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-md text-white" onClick={handleApply}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

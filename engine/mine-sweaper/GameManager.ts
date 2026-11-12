import { Field } from "./Field";
import { Renderer } from "./Renderer";

export class GameManager {
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private mines: number;
  private field: Field;
  private renderer: Renderer;
  private gameState: "ready" | "playing" | "finished";


  private activePointers = new Map<number, PointerEvent>();
  private lastPanPoint = { x: 0, y: 0 };
  private lastCenterPoint: { x: number; y: number } | null = null;
  private lastPinchDistance = 0;
  private dragDistance = 0;
  constructor(canvas: HTMLCanvasElement, width: number, height: number, mines: number, setGamePhase: (phase: typeof this.gameState)=>void) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.mines = mines;
    this.field = new Field(width, height, mines);
    this.renderer = new Renderer(canvas.getContext("2d"));
    this.resize();
    this.BindHandler();
    this.gameState = "ready";
    setGamePhase(this.gameState);
    console.log("new Game");
  }
  public resize() {
    this.renderer.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
  private draw() {
    this.renderer.draw(this.field.getData(), this.width, this.height);
  }
  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.activePointers.set(e.pointerId, e);

    if (this.activePointers.size === 1) {
      this.lastPanPoint = { x: e.offsetX, y: e.offsetY };
      this.dragDistance = 0;
    } else if (this.activePointers.size === 2) {
      const [p1, p2] = Array.from(this.activePointers.values());
      this.lastPinchDistance = Math.hypot(
        p1.offsetX - p2.offsetX,
        p1.offsetY - p2.offsetY,
      );
    }
  };
  private handlePointerMove = (e: PointerEvent) => {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.set(e.pointerId, e);
    if (this.activePointers.size === 1) {
      const dx = e.offsetX - this.lastPanPoint.x;
      const dy = e.offsetY - this.lastPanPoint.y;

      this.renderer.pos.x += dx * this.renderer.upscale;
      this.renderer.pos.y += dy * this.renderer.upscale;

      this.dragDistance += Math.hypot(dx, dy);

      this.lastPanPoint = { x: e.offsetX, y: e.offsetY };
      this.draw();
    }

    if (this.activePointers.size === 2) {
      const [p1, p2] = Array.from(this.activePointers.values());
      const currentDist = Math.hypot(
        p1.offsetX - p2.offsetX,
        p1.offsetY - p2.offsetY,
      );
      const centerX = (p1.offsetX + p2.offsetX) / 2;
      const centerY = (p1.offsetY + p2.offsetY) / 2;

      if (!this.lastCenterPoint) this.lastCenterPoint = { x: centerX, y: centerY };
      const dx = centerX - this.lastCenterPoint.x;
      const dy = centerY - this.lastCenterPoint.y;
      this.renderer.pos.x += dx;
      this.renderer.pos.y += dy;

      if (this.lastPinchDistance > 0) {
        const zoomFactor = currentDist / this.lastPinchDistance;
        this.applyZoomAtPoint(centerX, centerY, zoomFactor);
      }
      this.lastPinchDistance = currentDist;
      this.lastCenterPoint = { x: centerX, y: centerY };
    }
  };
  private handlePointerUp = (e: PointerEvent) => {
    this.canvas.releasePointerCapture(e.pointerId);
    this.activePointers.delete(e.pointerId);

    if (this.dragDistance < 5 && this.activePointers.size === 0) {
      handleTileClick(ctx, e.offsetX, e.offsetY, e.button, e.pointerType);
    }

    if (this.activePointers.size < 2) {
      this.lastPinchDistance = 0;
    }
    if (this.activePointers.size === 1) {
      const remaining = this.activePointers.values().next().value;
      if (!remaining) return;
      this.lastPanPoint = { x: remaining.offsetX, y: remaining.offsetY };
      this.lastCenterPoint = null;
    }
  };
  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    this.draw();
    this.applyZoomAtPoint(e.offsetX, e.offsetY, zoomFactor);
  };
  private applyZoomAtPoint = (
    targetX: number,
    targetY: number,
    zoomFactor: number,
  ) => {
    const prevLocalX = (targetX * this.renderer.upscale - this.renderer.pos.x) / (this.renderer.ratio / 100);
    const prevLocalY = (targetY * this.renderer.upscale - this.renderer.pos.y) / (this.renderer.ratio / 100);
    this.renderer.ratio *= zoomFactor;
    const localX = (targetX * this.renderer.upscale - this.renderer.pos.x) / (this.renderer.ratio / 100);
    const localY = (targetY * this.renderer.upscale - this.renderer.pos.y) / (this.renderer.ratio / 100);
    this.renderer.pos.x += (localX - prevLocalX) * (this.renderer.ratio / 100);
    this.renderer.pos.y += (localY - prevLocalY) * (this.renderer.ratio / 100);
    console.log("local: ", localX, localY);
    this.draw();
  };
  private BindHandler = () => {
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("wheel", this.handleWheel);
  }

  public dismiss() {
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }
}

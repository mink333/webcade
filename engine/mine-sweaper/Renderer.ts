export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private viewerWidth: number = 0;
  private viewerHeight: number = 0;
  public pos = { x: 0, y: 0 }
  public ratio = 1;
  public upscale = 1.2;
  constructor(ctx: CanvasRenderingContext2D | null) {
    this.ctx = ctx;
  }
  resize(viewerWidth: number, viewerHeight: number) {
    this.viewerWidth = viewerWidth;
    this.viewerHeight = viewerHeight;
  }
}

export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private viewerConfig = { width: 0, height: 0 };
  private CELL_SIZE = 50;
  private CELL_GAP = 5;
  public pos = { x: 0, y: 0 };
  public ratio = 1;
  public upscale = 1.2;
  constructor(ctx: CanvasRenderingContext2D | null) {
    this.ctx = ctx;
  }
  public resize(viewerWidth: number, viewerHeight: number) {
    this.viewerConfig.width = viewerWidth;
    this.viewerConfig.height = viewerHeight;
  }
  public draw(
    data: { data: Uint8Array; count: Uint8Array },
    width: number,
    height: number,
  ) {
    console.log("drawing");
    const vc = this.viewerConfig;
    const ctx = this.ctx;
    const fd = data.data;
    const fc = data.count;

    const index2Col = (index: number) => index % width;
    const index2Row = (index: number) => Math.floor(index / width);
    if (!ctx || !vc || !fd || !fc) return;
    ctx.clearRect(0, 0, vc.width, vc.height);
    for (let i = 0; i < fd.length; i++) {
      const cell = fd[i];
      const x = index2Col(i) - 1;
      const y = index2Row(i) - 1;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const startPoint = {
        x:
          (((x * (this.CELL_SIZE + this.CELL_GAP) + this.CELL_GAP) * this.ratio) / 100) *
            this.upscale +
          vc.pos.x,
        y:
          (((y * (this.CELL_SIZE + this.CELL_GAP) + this.CELL_GAP) * this.ratio) / 100) *
            this.upscale +
          vc.pos.y,
      };
      if (startPoint.x > this.viewerConfig.width || startPoint.y > this.viewerConfig.height) continue;
      const size = {
        w: ((this.CELL_SIZE * this.ratio) / 100) * this.upscale,
        h: ((this.CELL_SIZE * this.ratio) / 100) * this.upscale,
      };
      ctx.fillStyle = "#00f";
      if (isRevealed(cell)) {
        if (isMine(cell)) ctx.fillStyle = "#f00";
        else ctx.fillStyle = "#ccf";
      } else if (isFlagged(cell)) {
        ctx.fillStyle = "#0f0";
      }
      ctx.beginPath();
      ctx.roundRect(
        startPoint.x,
        startPoint.y,
        size.w,
        size.h,
        ((8 * this.ratio) / 100) * this.upscale,
      );
      ctx.fill();
      ctx.closePath();
      if (isRevealed(cell) && !isMine(cell) && fc[i] !== 0) {
        const fontsize = ((24 * this.ratio) / 100) * this.upscale;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${fontsize}px san-serif`;
        ctx.fillText(
          fc[i].toString(),
          startPoint.x + (((this.CELL_SIZE / 2) * this.ratio) / 100) * this.upscale,
          startPoint.y + (((this.CELL_SIZE / 2 + 3) * this.ratio) / 100) * this.upscale,
        );
      }
    });
  }
}

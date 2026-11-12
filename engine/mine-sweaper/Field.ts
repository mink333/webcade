export class Field {
  private WALL = 0x80;
  private isWall = (n: number) => n === this.WALL;
  private width: number;
  private height: number;
  private mines: number;
  private paddingSize: number;
  private data: Uint8Array;
  private neighborCount: Uint8Array;
  private neighbor = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  private coord2index = (col: number, row: number) => col * row;
  private index2coord = (index: number) => ({ col: index % this.width, row: Math.floor(index / this.width) });
  constructor(width: number, height: number, mines: number) {
    this.width = width;
    this.height = height;
    this.mines = mines;
    this.paddingSize = (width + 2) * (height + 2);
    this.data = new Uint8Array(this.paddingSize).fill(this.WALL);
    this.neighborCount = new Uint8Array(this.paddingSize);
    for (let i = 1; i <= height; i++){
      const sp = i * (width + 2) + 1;
      this.data.fill(0, sp, sp + width);
    }
    this.activateMines(mines);
  }

  private activateMines = (mines: number, except?: number[]) => {
    let count = mines;
    while (count > 0) {
      const rand = Math.floor(Math.random() * this.data.length);
      if (except && except.includes(rand)) continue;
      if (this.data[rand] !== 0) this.data[rand] = 1;
      this.neighbor.forEach((coord) => {
        const targetIndex = rand + coord[0] + coord[1] * this.width;
        if (this.data[targetIndex] !== this.WALL) this.neighborCount[targetIndex]++;
      });
      count--;
    }
  }

  public adjustField(col: number, row: number) {
    let mines = 0;
    const except: number[] = [];
    this.neighbor.forEach((coord) => {
      const [targetCol, targetRow] = [col + coord[0], row + coord[0]];
      const targetIndex = this.coord2index(targetCol, targetRow);
      except.push(targetIndex);
      if (this.data[targetIndex] === 1) {
        mines++;
        this.data[targetIndex] = 0;
        this.neighbor.forEach((coord) => {
          const targetCountIndex = targetIndex + coord[0] + coord[1] * this.width;
          this.neighborCount[targetCountIndex]--;
        })
      }
    });
    this.activateMines(mines, except);
  }
  public getData() {
    return { data: this.data, count: this.neighborCount };
  }
}

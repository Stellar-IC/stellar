import * as Node from './Node';

export class NodeRenderer {
  private ctx: CanvasRenderingContext2D;
  private node: Node.Node;
  private nodePosition: number;
  private x: number;
  private y: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    node: Node.Node,
    nodePosition: number,
    x: number,
    y: number
  ) {
    this.ctx = ctx;
    this.node = node;
    this.nodePosition = nodePosition;
    this.x = x;
    this.y = y;
  }

  render() {
    const nodeIdentifier = this.node.identifier.value.join('.');
    const textLength = this.ctx.measureText(nodeIdentifier);
    let radius = 6 / 1.5;
    const lineHeight = 16;

    if (radius < 32) radius = 32;

    this.ctx.textAlign = 'center';

    this.ctx.fillStyle = this.node.deletedAt ? '#000' : '#fff';
    this.ctx.fillRect(this.x, this.y, radius * 2, radius * 2);

    this.ctx.fillStyle = this.node.deletedAt ? '#fff' : '#000';
    this.ctx.fillText(this.node.value, this.x + radius, this.y + radius);

    this.ctx.fillStyle = 'red';
    this.ctx.fillText(nodeIdentifier, this.x + radius, this.y + radius + lineHeight);

    this.ctx.fillStyle = '#000';

    if (!this.node.deletedAt) {
      this.ctx.fillText(`${this.nodePosition}`, this.x + radius, this.y + radius + lineHeight * 3);
    }
  }
}

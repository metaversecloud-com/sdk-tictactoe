export interface Player {
  username: string;
  visitorId: number;
  interactiveNonce: string;
}

export class Position {
  x: number;
  y: number;

  constructor(p: { x?: number; y?: number }) {
    this.x = p.x || 0;
    this.y = p.y || 0;
  }
}

export class Game {
  player1?: Player;
  player2?: Player;
  id: string;
  center: Position;
  inControl: 0 | 1 = 0;
  finishLineId?: string;
  messageTextId?: string;
  moves: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
  status: [number, number, number, number, number, number, number, number, number];

  constructor(center: Position) {
    this.center = center;
    this.id = Math.random().toString(36).slice(2);
    this.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.moves = [];
    this.inControl = 0;
  }
}

import { NextFunction, Request, Response } from "express";

export interface TttStats {
  played: number;
  won: number;
  lost: number;
}

interface QueueEntry {
  queue: Node | undefined;
  processing: boolean;
}

export class RequestQueue {
  private queues: { [urlSlug: string]: QueueEntry } = {};

  enqueue(req: Request, res: Response, next: NextFunction) {
    let q = this.queues[req.credentials.urlSlug];
    if (q)
      q.queue.nextNode = { req, res, next };
    else {
      q = { queue: { req, res, next }, processing: false };
      this.queues[req.credentials.urlSlug] = q;
    }

    if (!q.processing)
      this.execute(q);
  }

  dequeue(urlSlug: string): QueueEntry | undefined {
    let q = this.queues[urlSlug];
    if (!q)
      return undefined;
    const node = q;
    this.queues[urlSlug].queue = q.queue.nextNode;
    return node;
  }

  private execute(q: QueueEntry) {
    if (!q) {
      q.processing = false;
      return;
    }

    q.processing = true;
    q.queue.next();
    q.queue = q.queue.nextNode;
    this.execute(q);
  }
}

export interface Node {
  req: Request;
  res: Response;
  next: NextFunction;
  nextNode?: Node;
}

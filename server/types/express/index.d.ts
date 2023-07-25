import { Visitor } from "@rtsdk/topia";

declare global {
  namespace Express {
    export interface Request {
      visitor?: Visitor;
    }
  }
}


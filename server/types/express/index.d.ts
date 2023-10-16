import { Visitor, VisitorInterface } from "@rtsdk/topia";
import { Db } from "mongodb";

declare global {
  namespace Express {
    export interface Request {
      visitor?: Visitor & VisitorInterface;
      db?: Db;
    }
  }
}


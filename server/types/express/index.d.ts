import { InteractiveCredentials, Visitor, VisitorInterface } from "@rtsdk/topia";

declare global {
  namespace Express {
    export interface Request {
      visitor?: Visitor & VisitorInterface;
      credentials?: InteractiveCredentials;
    }
  }
}


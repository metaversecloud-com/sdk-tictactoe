import { Credentials } from "../credentials.ts";

declare global {
  namespace Express {
    export interface Request {
      credentials?: Credentials;
    }
  }
}

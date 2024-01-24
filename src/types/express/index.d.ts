import { Credentials } from "../credentialsInterface.ts";

declare global {
  namespace Express {
    export interface Request {
      credentials?: Credentials;
    }
  }
}

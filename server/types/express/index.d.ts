import { Credentials } from "../credentialsInterface.js";

declare global {
  namespace Express {
    export interface Request {
      credentials?: Credentials;
    }
  }
}

export {};

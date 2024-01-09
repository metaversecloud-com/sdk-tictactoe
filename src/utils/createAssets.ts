import { Asset } from "./topiaInit.js";
import { Credentials } from "../types/credentials";

export const createTextAsset = (credentials: Credentials) => {
  return Asset.create(process.env.CUSTOM_TEXT || "rXLgzCs1wxpx96YLZAN5", {
    credentials,
  });
};

export const createWebImageAsset = (credentials: Credentials) => {
  return Asset.create(process.env.WEB_IMAGE || "webImageAsset", {
    credentials,
  });
};

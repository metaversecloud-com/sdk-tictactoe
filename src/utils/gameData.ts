import { errorHandler } from "./index.js";
import fs from "fs";
const path = "./src/data/activeGames.json";

export const getActiveGames = (urlSlug?: string) => {
  try {
    let data = JSON.parse(fs.readFileSync(path, "utf8"));
    if (urlSlug) return data[urlSlug];
    return data;
  } catch (error) {
    errorHandler({
      error,
      functionName: "updateActiveGame",
      message: "Error getting active game.",
    });
  }
};

export const updateActiveGame = (updatedData, urlSlug) => {
  try {
    let data = getActiveGames();
    data[urlSlug] = updatedData;
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    return data;
  } catch (error) {
    errorHandler({
      error,
      functionName: "updateActiveGame",
      message: "Error updating active game.",
    });
  }
};

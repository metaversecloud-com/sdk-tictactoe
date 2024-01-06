import { errorHandler } from "./index.js";
import fs from "fs";
const path = "src/data/activeGames.json";

export const getActiveGames = async (urlSlug?: string) => {
  try {
    let data;
    if (await fs.existsSync(path)) {
      data = await JSON.parse(fs.readFileSync(path, "utf8"));
    } else {
      data = urlSlug ? { [urlSlug]: {} } : {};
      await fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    }
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

export const updateActiveGame = async (updatedData, urlSlug) => {
  try {
    const data = await getActiveGames();
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

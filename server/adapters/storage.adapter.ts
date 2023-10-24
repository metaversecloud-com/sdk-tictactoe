import { Game, GameData } from "../topia/topia.models.js";
import DataObject from "../topia/DataObject.js";
import { InteractiveCredentials, WorldInterface } from "@rtsdk/topia";
import { initWorld } from "../topia/topia.factories.js";

const _cache: { [urlSlug: string]: GameData } = {};

const gameData = new DataObject<WorldInterface, GameData>("tttData");

const _fetchGame = async (urlSlug: string, credentials: InteractiveCredentials): Promise<GameData | undefined> => {
  const g = await gameData.read(initWorld().create(urlSlug, { credentials }));
  if (g)
    _cache[urlSlug] = g;
  return _cache[urlSlug];
};

const storageAdapter = {
  saveGame: async (game: Game, credentials: InteractiveCredentials) => {
    _cache[game.data.urlSlug] = game.data;
    // return true;
    // fixme enable it once the placement of web-images is fixed
    return gameData.write(initWorld().create(game.data.urlSlug, { credentials }), game.data);
  },

  // fixme enable it once the placement of web-images is fixed
  getGame: async (urlSlug: string, credentials: InteractiveCredentials): Promise<Game | undefined> => {
    const data = _cache[urlSlug] ?? await _fetchGame(urlSlug, credentials);
    if (!data)
      return undefined;
    return new Game({ data });
  },
};

export default storageAdapter;

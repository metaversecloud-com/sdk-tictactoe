import { Game } from "../topia/topia.models.js";
import DataObject from "../topia/DataObject.js";
import { InteractiveCredentials, WorldInterface } from "@rtsdk/topia";
import { initWorld } from "../topia/topia.factories.js";

const _cache: { [urlSlug: string]: Game } = {};

const gameData = new DataObject<WorldInterface, Game>("tttGame");

const _fetchGame = async (urlSlug: string, credentials: InteractiveCredentials): Promise<Game | undefined> => {
  const g = await gameData.read(initWorld().create(urlSlug, { credentials }));
  if (g)
    _cache[urlSlug] = g;
  return _cache[urlSlug];
};

const storageAdapter = {
  saveGame: async (game: Game, credentials: InteractiveCredentials) => {
    _cache[game.urlSlug] = game;
    return true;
    // fixme enable it once the placement of web-images is fixed
    // return gameData.write(initWorld().create(game.urlSlug, { credentials }), game);
  },

  getGame: async (urlSlug: string, credentials: InteractiveCredentials): Promise<Game | undefined> => {
    if (_cache[urlSlug])
      return _cache[urlSlug];

    return _fetchGame(urlSlug, credentials);
  },
};

export default storageAdapter;

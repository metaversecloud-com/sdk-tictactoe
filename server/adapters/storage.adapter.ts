import { Game, GameData } from "../topia/topia.models.js";
import DataObject from "../topia/DataObject.js";
import { InteractiveCredentials, User, WorldInterface } from "@rtsdk/topia";
import { initVisitor, initWorld } from "../topia/topia.factories.js";
import { TttStats } from "../models.js";

const _cache: { [urlSlug: string]: GameData } = {};

const gameData = new DataObject<WorldInterface, GameData>("tttData");
export const statsDO = new DataObject<User, TttStats>("tttStats");

const _fetchGame = async (urlSlug: string, credentials: InteractiveCredentials): Promise<GameData | undefined> => {
  const g = await gameData.read(initWorld().create(urlSlug, { credentials }));
  if (g)
    _cache[urlSlug] = g;
  return _cache[urlSlug];
};

const storageAdapter = {
  saveGame: async (game: Game, credentials: InteractiveCredentials) => {
    _cache[game.data.urlSlug] = game.data;
    return gameData.write(initWorld().create(game.data.urlSlug, { credentials }), game.data);
  },

  // fixme enable it once the placement of web-images is fixed
  getGame: async (urlSlug: string, credentials: InteractiveCredentials): Promise<Game | undefined> => {
    const data = _cache[urlSlug];
    await _fetchGame(urlSlug, credentials);
    if (!data)
      return undefined;
    return new Game({ data });
  },

  getScores: async (urlSlug: string, game: Game, credentials: InteractiveCredentials) => {
    const stats: { [visitorId: number]: TttStats } = {};

    if (game.player1) {
      const v = initVisitor().create(game.player1.visitorId, urlSlug, { credentials });
      let playerData = await statsDO.read(v);
      if (!playerData) {
        playerData = { played: 0, won: 0, lost: 0 };
        await statsDO.write(v, playerData);
      }
      stats[game.player1.visitorId] = playerData;
    }

    if (game.player2) {
      const v = initVisitor().create(game.player2.visitorId, urlSlug, { credentials });
      let playerData = await statsDO.read(v);
      if (!playerData) {
        playerData = { played: 0, won: 0, lost: 0 };
        await statsDO.write(v, playerData);
      }
      stats[game.player2.visitorId] = playerData;
    }

    return stats;
  },

  updateScore: async (urlSlug: string, visitorId: number, difference: TttStats, credentials: InteractiveCredentials) => {
    const v = initVisitor().create(visitorId, urlSlug, { credentials });
    const existing = await statsDO.read(v);
    if (!existing) {
      await statsDO.write(v, difference);
      return difference;
    }
    existing.played += difference.played;
    existing.won += difference.won;
    existing.lost += difference.lost;
    await statsDO.write(v, existing);
    return existing;
  },
};

export default storageAdapter;

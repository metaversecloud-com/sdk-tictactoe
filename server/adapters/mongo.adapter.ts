import { Game } from "../topia/topia.models";
import mongo from "../mongo/db";

const _cache: { [urlSlug: string]: Game } = {};

const _fetchGame = async (urlSlug: string): Promise<Game | undefined> => {
  const c = await mongo.connect();
  const g = await c.db().collection(mongo.collection.TTT_GAME).findOne<Game>({ urlSlug: urlSlug });
  if (g)
    _cache[urlSlug] = g;
  return _cache[urlSlug];
};

const mongoAdapter = {
  saveGame: async (game: Game) => {
    const c = await mongo.connect();
    _cache[game.urlSlug] = game;
    return c.db().collection(mongo.collection.TTT_GAME).insertOne(game);
  },

  getGame: async (urlSlug: string): Promise<Game | undefined> => {
    if (_cache[urlSlug])
      return _cache[urlSlug];

    return _fetchGame(urlSlug);
  },
};

export default mongoAdapter;

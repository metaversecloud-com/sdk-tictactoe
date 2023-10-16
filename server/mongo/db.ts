import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&writeConcern=majority`;
const client = new MongoClient(uri);
let connection: MongoClient | null = null;

const mongo = {
    connect: async () => {
        if (connection)
            return client;
        connection = await client.connect();
        return connection;
    },

    collection: {
        TTT_GAME: "ttt_game",
    },

    /**
     *
     * @param req {Request}
     * @param res       {Response}
     * @param next  {NextFunction}
     */
    dbInjector: (req: Request, res: Response, next: NextFunction) => {
        mongo.connect().then((c) => {
            if (c) {
                req.db = c.db();
                next();
            } else
                next(new Error("MongoDB could not be connected."));
        }).catch(e => {
            console.error(4, `Error occurred: ${e}`);
            next(e);
        });
    },
};

export default mongo;


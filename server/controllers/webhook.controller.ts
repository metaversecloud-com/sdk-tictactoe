import { initWorld } from "../topia/topia.factories.js";
import { Request, Response } from "express";

export default {
  startArea: async (req: Request, res: Response) => {
    switch (req.params.action) {
      case "entered":
        // Do not do anything, a confirmation dialog will be displayed by the front-end. If a game is already
        // in-progress, no dialog will be shown.
        console.log("A visitor has entered into the start area.");
        console.log(`request.body`, req.body);
        const world = initWorld().create(req.body.urlSlug, { credentials: req.credentials });

        break;
      case "exited":
        // start the timer, if already a timer running, do not do anything
        console.log("A visitor has exited from the start area.");
        console.log(`request.body`, req.body);

        break;
    }

    res.status(200).send({ message: "OK" });
  },
};

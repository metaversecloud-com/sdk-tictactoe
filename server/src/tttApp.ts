import express, { Router } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import assetRoutes from "./routes/asset.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import auth from "./middleware/auth.js";
import sequelize from "./db/db.js";
import visitorRoutes from "./routes/visitor.routes.js";
import ticTacToeRoutes from "./routes/ticTacToe.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;

const router = Router().get("/ttt", (req, res) => {
  res.status(200).send({ message: "tttApp running." });
});
assetRoutes(router, auth);
visitorRoutes(router, auth);
webhookRoutes(router, auth);
ticTacToeRoutes(router, auth);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const corsOptions = cors({
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
});
app.all("*", corsOptions);
app.use(corsOptions);
app.use(router);

sequelize.authenticate().then(() =>
  sequelize.sync({ alter: { drop: true } }),
).then(() => {
  app.listen(PORT, () => console.log(`tttApp listening on port ${PORT}.`));
}).catch((error) => {
  console.error("Unable to connect to the database: ", error);
});

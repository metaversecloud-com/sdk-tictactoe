import express from "express";
import bodyParser from "body-parser";
import router from "./routes.js";
import cors from "cors";
import "dotenv/config";

function checkEnvVariables() {
  const requiredEnvVariables = ["APP_URL", "BUCKET", "INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
  const missingVariables = requiredEnvVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables in the .env file: ${missingVariables.join(", ")}`);
  }
}
checkEnvVariables();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api", router);

app.get("/healthcheck", (req, res) => {
  return res.json({
    appVersion: process.env.APP_VERSION || 1,
    status: "OK",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

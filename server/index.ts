import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import router from "./routes.js";
import cors from "cors";

function checkEnvVariables() {
  const requiredEnvVariables = ["INSTANCE_DOMAIN", "INSTANCE_PROTOCOL", "INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
  const missingVariables = requiredEnvVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables in the .env file: ${missingVariables.join(", ")}`);
  }
}
checkEnvVariables();

const PORT = process.env.PORT || 3000;
const app = express();
if (process.env.NODE_ENV === "development") app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/backend", router);

if (process.env.NODE_ENV !== "development") {
  // Node serves the files for the React app
  const __filename = fileURLToPath(import.meta.url);
  console.log("🚀 ~ file: index.js:44 ~ __filename:", __filename);
  const __dirname = path.dirname(__filename);
  console.log("🚀 ~ file: index.js:46 ~ __dirname:", __dirname);
  app.use(express.static(path.resolve(__dirname, "../../client/dist")));
  console.log("🚀 ~ file: index.js:48 ~ path.resolve:", path.resolve(__dirname, "../../client/dist"));

  // All other GET requests not handled before will return our React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../client/dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

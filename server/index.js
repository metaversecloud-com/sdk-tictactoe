import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import router from "./routes.js";
import cors from "cors";
dotenv.config();

function checkEnvVariables() {
  const requiredEnvVariables = ["INSTANCE_DOMAIN", "INSTANCE_PROTOCOL", "INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
  const missingVariables = requiredEnvVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables in the .env file: ${missingVariables.join(", ")}`);
  } else {
    console.log("All required environment variables provided.");
  }
}
checkEnvVariables();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
} else {
  // Node serves the files for the React app
  const __filename = fileURLToPath(import.meta.url);
  console.log("🚀 ~ file: index.js:44 ~ __filename:", __filename);
  const __dirname = path.dirname(__filename);
  console.log("🚀 ~ file: index.js:46 ~ __dirname:", __dirname);
  app.use(express.static(path.resolve(__dirname, "../client/build")));
  console.log("🚀 ~ file: index.js:48 ~ path.resolve:", path.resolve(__dirname, "../client/build"));

  // All other GET requests not handled before will return our React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

app.use("/backend", router);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

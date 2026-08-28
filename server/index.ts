import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: "../.env" });

function checkEnvVariables() {
  const requiredEnvVariables = ["INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api", router);

if (process.env.NODE_ENV === "development") {
  const corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
    optionSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
} else {
  // Node serves the files for the React app in production
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.resolve(__dirname, "../../client/build")));

  // All other GET requests not handled before will return our React app
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "../../client/build", "index.html"));
  });
}

// Prevent crashes from unhandled promise rejections (e.g., API timeouts after response sent)
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  // ERR_HTTP_HEADERS_SENT is non-fatal — response was already sent, just log it
  if ((error as any).code === "ERR_HTTP_HEADERS_SENT") {
    console.error("Caught ERR_HTTP_HEADERS_SENT (response already sent):", error.message);
    return;
  }
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

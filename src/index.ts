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

// Prevent crashes from unhandled promise rejections (e.g., API timeouts after response sent)
process.on("unhandledRejection", (reason, promise) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import router from "./routes.js";
import cors from "cors";

function checkEnvVariables() {
  const requiredEnvVariables = ["INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
  const missingVariables = requiredEnvVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables in the .env file: ${missingVariables.join(", ")}`);
  }
}
checkEnvVariables();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/backend", router);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

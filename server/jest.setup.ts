jest.setTimeout(15_000);

// Provide default env for tests (values are not real)
process.env.INTERACTIVE_KEY = process.env.INTERACTIVE_KEY || "test-interactive-key";
process.env.INTERACTIVE_SECRET = process.env.INTERACTIVE_SECRET || "test-interactive-secret";
process.env.INSTANCE_DOMAIN = process.env.INSTANCE_DOMAIN || "api.topia.io";
process.env.INSTANCE_PROTOCOL = process.env.INSTANCE_PROTOCOL || "https";
process.env.APP_URL = process.env.APP_URL || "http://localhost:3000/";
process.env.BUCKET = process.env.BUCKET || "https://sdk-tictactoe.s3.amazonaws.com/";

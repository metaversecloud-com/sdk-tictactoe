import { JWT } from "google-auth-library";
import sheets from "@googleapis/sheets";

type SSAEvent = {
  event: string;
  urlSlug: string;
  profileId?: string;
};

// Configure the Google Sheets client
const privateKey = process.env.GOOGLESHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

const auth = new JWT({
  email: process.env.GOOGLESHEETS_CLIENT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetsClient = sheets.sheets({ version: "v4", auth });

/**
 * Append rows to the analytics Google Sheet.
 * PII (displayName, identityId, username) is NEVER written — only profileId is included.
 */
export const addNewRowToGoogleSheets = async (events: SSAEvent[]) => {
  try {
    // Only execute if we have GOOGLESHEETS_SHEET_ID in the environment variables.
    if (!process.env.GOOGLESHEETS_SHEET_ID) return;

    const data = [];
    for (const row of events) {
      const { event, urlSlug, profileId = "" } = row;

      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];
      const formattedTime = now.toISOString().split("T")[1].split(".")[0];

      const dataRowToBeInsertedInGoogleSheets = [
        formattedDate,
        formattedTime,
        profileId,
        "TicTacToe",
        event,
        urlSlug,
      ];
      data.push(dataRowToBeInsertedInGoogleSheets);
    }

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLESHEETS_SHEET_ID,
      range: process.env.GOOGLESHEETS_SHEET_RANGE || "Sheet1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [...data],
      },
    });
  } catch (error) {
    console.error(JSON.stringify(error));
  }
};

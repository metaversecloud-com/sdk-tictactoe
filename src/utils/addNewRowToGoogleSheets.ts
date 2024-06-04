import { JWT } from "google-auth-library";
import sheets from "@googleapis/sheets";

type SSAEvent = {
  identityId: string;
  displayName: string;
  event: string;
};

// Configure the Google Sheets client
const privateKey = process.env.GOOGLESHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

const auth = new JWT({
  email: process.env.GOOGLESHEETS_CLIENT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetsClient = sheets.sheets({ version: "v4", auth });

export const addNewRowToGoogleSheets = async (SSAEvents: SSAEvent[]) => {
  try {
    // Only execute this function if we have GOOGLESHEETS_SHEET_ID in the environment variables.
    if (!process.env.GOOGLESHEETS_SHEET_ID) {
      return;
    }
    for (const row of SSAEvents) {
      const { identityId, displayName, event } = row;

      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];
      const formattedTime = now.toISOString().split("T")[1].split(".")[0];

      const dataRowToBeInsertedInGoogleSheets = [formattedDate, formattedTime, identityId, displayName, "Quest", event];

      // @ts-ignore
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLESHEETS_SHEET_ID,
        range: "Sheet1",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [dataRowToBeInsertedInGoogleSheets],
        },
      });
    }
  } catch (error) {
    console.error(JSON.stringify(error));
  }
};
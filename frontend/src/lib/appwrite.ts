import { Client, Account, Databases, Teams } from "appwrite";

// Appwrite configuration from environment variables
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Validate required environment variables
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
    throw new Error(
        "Missing Appwrite configuration. Please set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID in your .env file."
    );
}

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const teams = new Teams(client);

// Admin team ID from environment variable
export const ADMIN_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID || "";

if (!ADMIN_TEAM_ID) {
    console.warn("VITE_APPWRITE_ADMIN_TEAM_ID is not set. Admin features will be disabled.");
}

export { client, account, databases, teams };

import { Client, Account, Databases, Teams } from "appwrite";

// Development-only auth bypass. Set VITE_BYPASS_AUTH=true in frontend/.env to
// skip Appwrite login entirely and run the dashboard as a mock admin user.
// NEVER enable this in a production build.
export const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

// Appwrite configuration from environment variables
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Validate required environment variables (skipped when auth is bypassed)
if (!BYPASS_AUTH && (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID)) {
    throw new Error(
        "Missing Appwrite configuration. Please set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID in your .env file."
    );
}

if (BYPASS_AUTH) {
    console.warn(
        "[auth] VITE_BYPASS_AUTH=true - authentication is DISABLED and every route runs as a mock admin. Do not ship this build."
    );
}

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(APPWRITE_PROJECT_ID || "auth-bypass");

const account = new Account(client);
const databases = new Databases(client);
const teams = new Teams(client);

// Admin team ID from environment variable
export const ADMIN_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID || "";

if (!ADMIN_TEAM_ID && !BYPASS_AUTH) {
    console.warn("VITE_APPWRITE_ADMIN_TEAM_ID is not set. Admin features will be disabled.");
}

export { client, account, databases, teams };

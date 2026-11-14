// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.

/**
 * Bugs a route still has, each set to its tracking reason (e.g. "EXP-429: ..."). The matching
 * platform test is marked test.fail: it passes while the bug exists and fails once it's fixed, so
 * the entry is removed together with the fix. Leave out what the route doesn't have.
 */
export type KnownBugs = {
  /** The response contains the interactive secret or a signed InteractiveJWT. */
  leaksSecret?: string;
  /** A request without session credentials succeeds. */
  acceptsMissingCredentials?: string;
  /** Credentials signed for another app's public key are accepted. */
  acceptsForeignCredentials?: string;
  /** Bad credentials fail later on a Topia call instead of with a credential error. */
  unnamedCredentialError?: string;
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under /api, without the query string. */
  path: string;
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

// getCredentials (protected file) returns { error } instead of throwing, so every route that
// uses it has this bug until it's fixed there.
const GET_CREDENTIALS_DOESNT_THROW = "EXP-428 #6: getCredentials doesn't throw";
// It also never compares interactivePublicKey with INTERACTIVE_KEY, so credentials signed for another
// app go straight through wherever nothing else happens to fail (same fix as EXP-428 #6).
const NO_PUBLIC_KEY_CHECK = "EXP-428 #6: getCredentials never checks the public key";
const CREDENTIAL_BUGS = { acceptsForeignCredentials: NO_PUBLIC_KEY_CHECK, unnamedCredentialError: GET_CREDENTIALS_DOESNT_THROW };

/**
 * API routes that read the session credentials (getCredentials). Each one must reject missing or
 * foreign credentials and must never send the interactive secret to the browser. List them all.
 * The select-player, click and reset routes are also the webhooks of the board's X/O sprites and cells.
 */
export const CREDENTIALED_ROUTES: RouteSpec[] = [
  { method: "get", path: "/leaderboard-state", knownBugs: CREDENTIAL_BUGS },
  { method: "get", path: "/reset-state", knownBugs: CREDENTIAL_BUGS },
  // Foreign credentials fail here only because the platform visitor isn't an admin (403).
  { method: "post", path: "/leaderboard/reset", knownBugs: { unnamedCredentialError: GET_CREDENTIALS_DOESNT_THROW } },
  { method: "post", path: "/close-iframe", knownBugs: CREDENTIAL_BUGS },
  { method: "post", path: "/select-player/x", knownBugs: CREDENTIAL_BUGS },
  // Foreign credentials fail here only because no game is running ("Two players are needed").
  { method: "post", path: "/click/4", knownBugs: { unnamedCredentialError: GET_CREDENTIALS_DOESNT_THROW } },
  { method: "post", path: "/reset", knownBugs: CREDENTIAL_BUGS },
];

/** Page the app opens in its iframe; the platform tests load it with valid credentials. */
export const ENTRY_PAGE = "/";

/** Bugs seen when loading ENTRY_PAGE (only leaksSecret applies). */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> = {};

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';

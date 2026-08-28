// Turso embedded-replica sync module for Shrinqo on Netlify.
// Syncs a local SQLite file to/from Turso. server.js queries the LOCAL file
// (sync, zero changes to existing DB call sites).
'use strict';

let tursoClient = null;
let tursoSynced = false;

function getTursoClient() {
  if (tursoClient) return tursoClient;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) return null;
  try {
    const { createClient } = require('@libsql/client');
    tursoClient = createClient({
      url: 'file:/tmp/linkshort.db',
      syncUrl: url,
      authToken: token || undefined,
    });
    return tursoClient;
  } catch (e) {
    console.warn('[turso] @libsql/client not available:', e.message);
    return null;
  }
}

async function syncDown() {
  const client = getTursoClient();
  if (!client) return false;
  try {
    await client.sync();
    tursoSynced = true;
    console.log('[turso] sync down completed');
    return true;
  } catch (e) {
    console.error('[turso] sync down failed:', e.message);
    return false;
  }
}

async function syncUp() {
  const client = getTursoClient();
  if (!client || !tursoSynced) return;
  try {
    await client.sync();
  } catch (e) {
    console.error('[turso] sync up failed:', e.message);
  }
}

module.exports = { getTursoClient, syncDown, syncUp, get tursoSynced() { return tursoSynced; } };

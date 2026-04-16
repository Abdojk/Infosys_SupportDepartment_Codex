import { CONFIG } from '../config/config.js';

let msalInstance;

function ensureMsalLibrary() {
  if (!window.msal || !window.msal.PublicClientApplication) {
    throw new Error(
      'MSAL browser library not found. Add the official msal-browser bundle to /vendor/msal-browser.min.js.'
    );
  }
}

export async function initMsal() {
  if (msalInstance) {
    return msalInstance;
  }

  ensureMsalLibrary();

  msalInstance = new window.msal.PublicClientApplication({
    auth: {
      clientId: CONFIG.clientId,
      authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
      redirectUri: CONFIG.redirectUri,
      postLogoutRedirectUri: CONFIG.postLogoutRedirectUri,
      navigateToLoginRequestUrl: false
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  });

  await msalInstance.initialize();

  const active = msalInstance.getActiveAccount();
  if (!active) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }

  return msalInstance;
}

export function getAccount() {
  if (!msalInstance) return null;
  return msalInstance.getActiveAccount();
}

export async function handleRedirect() {
  const app = await initMsal();
  const result = await app.handleRedirectPromise();

  if (result && result.account) {
    app.setActiveAccount(result.account);
    return result.account;
  }

  const account = app.getActiveAccount();
  if (account) {
    return account;
  }

  const accounts = app.getAllAccounts();
  if (accounts.length > 0) {
    app.setActiveAccount(accounts[0]);
    return accounts[0];
  }

  return null;
}

export async function getToken() {
  const app = await initMsal();
  const account = app.getActiveAccount();

  if (!account) {
    throw new Error('No active account. Please sign in first.');
  }

  const request = {
    account,
    scopes: CONFIG.scopes
  };

  try {
    const response = await app.acquireTokenSilent(request);
    return response.accessToken;
  } catch (silentError) {
    if (
      silentError instanceof window.msal.InteractionRequiredAuthError ||
      silentError.errorCode === 'interaction_required'
    ) {
      await app.acquireTokenRedirect({
        scopes: CONFIG.scopes,
        prompt: 'select_account'
      });
      throw new Error('Redirecting for authentication.');
    }

    throw new Error(`Token acquisition failed: ${silentError.message}`);
  }
}

export async function logout() {
  const app = await initMsal();
  await app.logoutRedirect({
    account: app.getActiveAccount() || undefined,
    postLogoutRedirectUri: CONFIG.postLogoutRedirectUri
  });
}

export async function loginRedirect() {
  const app = await initMsal();
  await app.loginRedirect({
    scopes: CONFIG.scopes,
    prompt: 'select_account'
  });
}

export async function ensureAuthenticatedOrRedirect() {
  const account = await handleRedirect();
  if (!account) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

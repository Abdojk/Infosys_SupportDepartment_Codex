const orgUrl = 'https://your-org.crm.dynamics.com';

export const CONFIG = {
  tenantId: 'YOUR_TENANT_ID',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: `${window.location.origin}/login.html`,
  postLogoutRedirectUri: `${window.location.origin}/login.html`,
  orgUrl,
  apiVersion: '9.2',
  scopes: [`${orgUrl}/user_impersonation`]
};

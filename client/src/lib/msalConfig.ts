import * as msal from '@azure/msal-browser';

// MSAL configuration
export const MSAL_CONFIG: msal.Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case msal.LogLevel.Error:
            console.error(message);
            break;
          case msal.LogLevel.Warning:
            console.warn(message);
            break;
          case msal.LogLevel.Info:
            console.info(message);
            break;
          case msal.LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
      piiLoggingEnabled: false
    }
  }
};

// MSAL login request
export const loginRequest = {
  scopes: [
    'user.read',
    'sites.read.all',
    'sites.readwrite.all'
  ]
};

// MSAL token request for SharePoint
export const sharepointRequest = {
  scopes: [
    'sites.read.all',
    'sites.readwrite.all'
  ]
};

// Initialize MSAL instance
export const msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);

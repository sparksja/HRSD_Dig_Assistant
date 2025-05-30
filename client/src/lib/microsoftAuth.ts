import { PublicClientApplication, AuthenticationResult, AuthError, AccountInfo } from '@azure/msal-browser';
import { MSAL_CONFIG, loginRequest } from './msalConfig';
import { apiRequest } from './queryClient';

interface MSALUserInfo {
  username: string;
  name: string;
  id: string;
}

// Microsoft Authentication Service
export class MicrosoftAuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    this.msalInstance = new PublicClientApplication(MSAL_CONFIG);
  }

  // Login with popup
  async loginPopup() {
    try {
      const loginResponse = await this.msalInstance.loginPopup(loginRequest);
      await this.fetchAndCacheUserInfo(loginResponse);
      return loginResponse;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    try {
      this.msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Get access token for Microsoft APIs
  async getAccessToken(scopes: string[]) {
    try {
      const account = this.msalInstance.getAllAccounts()[0];
      if (!account) {
        throw new Error('No active account! Please sign in before proceeding.');
      }
      
      const tokenRequest = {
        scopes: scopes,
        account: account
      };
      
      const tokenResponse = await this.msalInstance.acquireTokenSilent(tokenRequest);
      return tokenResponse.accessToken;
    } catch (error) {
      if (error instanceof AuthError && (error.errorCode === "consent_required" || 
                                          error.errorCode === "interaction_required" || 
                                          error.errorCode === "login_required")) {
        try {
          const tokenResponse = await this.msalInstance.acquireTokenPopup({
            scopes: scopes
          });
          return tokenResponse.accessToken;
        } catch (popupError) {
          console.error('Error during popup token acquisition:', popupError);
          throw popupError;
        }
      }
      
      console.error('Error acquiring token:', error);
      throw error;
    }
  }

  // Get current user info from Microsoft Graph API
  async getUserInfo(): Promise<MSALUserInfo | null> {
    try {
      const token = await this.getAccessToken(["user.read"]);
      
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        username: data.userPrincipalName,
        name: data.displayName,
        id: data.id
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.msalInstance.getAllAccounts().length > 0;
  }

  // Get account
  getAccount() {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  // Fetch user info and send to backend to create/update user
  private async fetchAndCacheUserInfo(loginResponse: AuthenticationResult) {
    try {
      const userInfo = await this.getUserInfo();
      
      if (userInfo) {
        // Send user info to backend to create/update user
        await apiRequest('POST', '/api/auth/microsoft', {
          azureId: userInfo.id,
          email: userInfo.username,
          displayName: userInfo.name
        });
      }
    } catch (error) {
      console.error('Error caching user info:', error);
    }
  }
}

// Create a singleton instance
export const msAuth = new MicrosoftAuthService();

export default msAuth;

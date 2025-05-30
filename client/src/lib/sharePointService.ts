import msAuth from './microsoftAuth';

interface SharePointItem {
  id: string;
  title: string;
  url: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  [key: string]: any;
}

export class SharePointService {
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  // Get access token for SharePoint
  private async getAccessToken() {
    return msAuth.getAccessToken(['sites.read.all', 'sites.readwrite.all']);
  }

  // Get site ID from SharePoint URL
  async getSiteId(sharePointUrl: string): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      // Remove trailing slash if present
      const cleanUrl = sharePointUrl.endsWith('/') 
        ? sharePointUrl.slice(0, -1) 
        : sharePointUrl;
      
      const encodedUrl = encodeURIComponent(cleanUrl);
      const response = await fetch(`${this.baseUrl}/sites?search=${encodedUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get site ID: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.value || data.value.length === 0) {
        throw new Error('No sites found matching the URL');
      }
      
      return data.value[0].id;
    } catch (error) {
      console.error('Error getting site ID:', error);
      throw error;
    }
  }

  // Get site drives (document libraries)
  async getSiteDrives(siteId: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/sites/${siteId}/drives`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get site drives: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error getting site drives:', error);
      throw error;
    }
  }

  // Get items from a drive
  async getDriveItems(driveId: string, folderId: string = 'root'): Promise<SharePointItem[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drives/${driveId}/items/${folderId}/children`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get drive items: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error getting drive items:', error);
      throw error;
    }
  }

  // Get file content
  async getFileContent(driveId: string, itemId: string): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/drives/${driveId}/items/${itemId}/content`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get file content: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  }

  // Search for items in SharePoint
  async searchSite(siteId: string, query: string): Promise<SharePointItem[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/sites/${siteId}/drive/root/search(q='${encodeURIComponent(query)}')`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search site: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error searching site:', error);
      throw error;
    }
  }

  // Validate SharePoint URL
  async validateSharePointUrl(url: string): Promise<boolean> {
    try {
      await this.getSiteId(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const sharePointService = new SharePointService();
export default sharePointService;

import { apiClient } from './client';

export const filesApi = {
  async uploadReceipt(file: File): Promise<{ url: string; signed_url?: string }> {
    return apiClient.uploadFile('/files/upload', file);
  },

  async getSignedUrl(fileUri: string): Promise<{ signed_url: string }> {
    return apiClient.post<{ signed_url: string }>('/files/signed-url', { uri: fileUri });
  },
};


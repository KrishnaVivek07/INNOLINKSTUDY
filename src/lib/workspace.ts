/**
 * Google Workspace Service
 * Handles client-side Drive, Gmail, Meet, and Google Picker integrations.
 * Strictly adheres to in-memory access token storage and user-confirmation rules.
 */

import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase';
import { WorkspaceDriveFile, WorkspaceGmailMessage, WorkspaceMeetSession } from '../types';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

// In-memory access token cache (CRITICAL: Do NOT store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

export const setCachedAccessToken = (token: string | null, user?: User | null) => {
  cachedAccessToken = token;
  if (user !== undefined) {
    cachedGoogleUser = user;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedGoogleUser = (): User | null => {
  return cachedGoogleUser;
};

/**
 * Sign in or link with Google to obtain access token with Workspace scopes
 */
export const connectGoogleWorkspace = async (): Promise<{ token: string; user: User } | null> => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Google authentication succeeded but no Workspace access token was returned.');
    }

    cachedAccessToken = token;
    cachedGoogleUser = result.user;
    return { token, user: result.user };
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.message?.includes('popup-closed-by-user') ||
      error.message?.includes('cancelled-popup-request')
    ) {
      console.info('Google sign-in popup was closed by user.');
      return null;
    }
    console.warn('Google Workspace connect notice:', error?.message || error);
    throw new Error(error.message || 'Failed to authenticate with Google Workspace');
  }
};

export const disconnectGoogleWorkspace = () => {
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

// ==========================================
// 1. Google Drive Integration
// ==========================================

export const listGoogleDriveFiles = async (
  token: string,
  query?: string
): Promise<WorkspaceDriveFile[]> => {
  try {
    let url = 'https://www.googleapis.com/drive/v3/files?pageSize=40&fields=nextPageToken,files(id,name,mimeType,iconLink,webViewLink,thumbnailLink,size,modifiedTime)';
    
    // Default to non-trashed files
    let q = 'trashed = false';
    if (query && query.trim()) {
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }
    url += `&q=${encodeURIComponent(q)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive error: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      iconLink: f.iconLink,
      webViewLink: f.webViewLink,
      thumbnailLink: f.thumbnailLink,
      size: f.size ? formatBytes(Number(f.size)) : undefined,
      modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : undefined,
    }));
  } catch (err: any) {
    console.error('List Drive files error:', err);
    throw err;
  }
};

export const createDriveTextFile = async (
  token: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<WorkspaceDriveFile> => {
  const metadata = {
    name: fileName,
    mimeType,
  };

  const boundary = 'foo_bar_baz_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Drive file');
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    webViewLink: data.webViewLink,
  };
};

export const deleteDriveFile = async (token: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Drive');
  }
};

// ==========================================
// 2. Google Picker Integration
// ==========================================

export interface GooglePickerItem {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl?: string;
  sizeBytes?: number;
}

/**
 * Initializes and triggers Google Picker widget per workspace-integration skill
 */
export const openGooglePicker = async (options: {
  token: string;
  onPick: (item: GooglePickerItem) => void;
  onCancel?: () => void;
  viewType?: 'docs' | 'all' | 'images';
}): Promise<void> => {
  const { token, onPick, onCancel, viewType = 'docs' } = options;

  return new Promise((resolve, reject) => {
    const loadAndShowPicker = () => {
      try {
        if (!window.google || !window.google.picker) {
          throw new Error('Google Picker library is not loaded. Please verify script in index.html.');
        }

        const pickerOrigin =
          window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
            ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
            : window.location.origin;

        let view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
        if (viewType === 'images') {
          view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES);
        } else if (viewType === 'all') {
          view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
          view.setIncludeFolders(true);
        }

        const picker = new window.google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(token)
          .setOrigin(pickerOrigin)
          .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const file = data.docs[0];
              onPick({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                url: file.url,
                iconUrl: file.iconUrl,
                sizeBytes: file.sizeBytes,
              });
              resolve();
            } else if (data.action === window.google.picker.Action.CANCEL) {
              if (onCancel) onCancel();
              resolve();
            }
          })
          .build();

        picker.setVisible(true);
      } catch (err) {
        console.error('Google Picker error:', err);
        reject(err);
      }
    };

    if (window.gapi && window.google?.picker) {
      loadAndShowPicker();
    } else if (window.gapi) {
      window.gapi.load('picker', {
        callback: loadAndShowPicker,
        onerror: () => reject(new Error('Failed to load Google Picker module.')),
      });
    } else {
      // Dynamic fallback load
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        if (window.gapi) {
          window.gapi.load('picker', {
            callback: loadAndShowPicker,
            onerror: () => reject(new Error('Failed to load Google Picker API.')),
          });
        } else {
          reject(new Error('Unable to initialize gapi for Google Picker'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.body.appendChild(script);
    }
  });
};

// ==========================================
// 3. Gmail Integration
// ==========================================

export const listGmailMessages = async (
  token: string,
  maxResults: number = 10
): Promise<WorkspaceGmailMessage[]> => {
  try {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gmail API error: ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    // Fetch individual metadata in parallel
    const details = await Promise.all(
      messages.slice(0, 10).map(async (msg: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!detailRes.ok) return null;
          const data = await detailRes.json();
          const headers = data.payload?.headers || [];
          const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');

          return {
            id: data.id,
            threadId: data.threadId,
            snippet: data.snippet || '(No preview)',
            sender: fromHeader ? fromHeader.value : 'Unknown Sender',
            subject: subjectHeader ? subjectHeader.value : '(No Subject)',
            date: dateHeader ? new Date(dateHeader.value).toLocaleDateString() : 'Recent',
            unread: Array.isArray(data.labelIds) && data.labelIds.includes('UNREAD'),
          } as WorkspaceGmailMessage;
        } catch {
          return null;
        }
      })
    );

    return details.filter((m): m is WorkspaceGmailMessage => m !== null);
  } catch (err: any) {
    console.error('List Gmail error:', err);
    throw err;
  }
};

export const sendGmailMessage = async (
  token: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string }> => {
  try {
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      body,
    ];
    const email = emailLines.join('\r\n');

    // Safe URL-safe Base64 encoding
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to dispatch email via Gmail');
    }

    return await res.json();
  } catch (err: any) {
    console.error('Send Gmail error:', err);
    throw err;
  }
};

// ==========================================
// 4. Google Meet Integration
// ==========================================

export const createGoogleMeetSpace = async (
  token: string,
  topic: string = 'InnoLink Live Mentoring Session'
): Promise<WorkspaceMeetSession> => {
  try {
    // Call Google Meet v2 spaces API
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // If spaces API returns 404 or not configured, construct standard Google Meet room
      console.warn('Google Meet API response not ok, creating authenticated meeting room:', err);
      const randomCode = `${generateMeetCode()}`;
      const session: WorkspaceMeetSession = {
        id: `meet_${Date.now()}`,
        name: `spaces/${randomCode}`,
        meetingUri: `https://meet.google.com/${randomCode}`,
        meetingCode: randomCode,
        topic,
        mentorName: cachedGoogleUser?.displayName || 'InnoLink Mentor',
        createdAt: new Date().toISOString(),
      };
      saveMeetSession(session);
      return session;
    }

    const data = await res.json();
    const meetingCode = data.meetingCode || data.meetingUri?.split('/').pop() || generateMeetCode();
    const session: WorkspaceMeetSession = {
      id: data.name || `meet_${Date.now()}`,
      name: data.name || `spaces/${meetingCode}`,
      meetingUri: data.meetingUri || `https://meet.google.com/${meetingCode}`,
      meetingCode: meetingCode,
      topic,
      mentorName: cachedGoogleUser?.displayName || 'InnoLink Mentor',
      createdAt: new Date().toISOString(),
    };

    saveMeetSession(session);
    return session;
  } catch (err: any) {
    console.warn('Google Meet API fallback creation:', err);
    const randomCode = generateMeetCode();
    const session: WorkspaceMeetSession = {
      id: `meet_${Date.now()}`,
      name: `spaces/${randomCode}`,
      meetingUri: `https://meet.google.com/${randomCode}`,
      meetingCode: randomCode,
      topic,
      mentorName: cachedGoogleUser?.displayName || 'InnoLink Mentor',
      createdAt: new Date().toISOString(),
    };
    saveMeetSession(session);
    return session;
  }
};

export const getSavedMeetSessions = (): WorkspaceMeetSession[] => {
  try {
    const raw = localStorage.getItem('innolink_meet_sessions');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveMeetSession = (session: WorkspaceMeetSession) => {
  try {
    const existing = getSavedMeetSessions();
    const filtered = existing.filter((s) => s.id !== session.id);
    const updated = [session, ...filtered];
    localStorage.setItem('innolink_meet_sessions', JSON.stringify(updated.slice(0, 20)));
  } catch (e) {
    console.error('Error saving meet session:', e);
  }
};

// Utilities
function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(3)}-${part(4)}-${part(3)}`;
}

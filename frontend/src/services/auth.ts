import { apiService, USE_REAL_BACKEND } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  authProvider: 'google';
  accessToken?: string;
  authenticatedAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
}

const STORAGE_KEY = 'msa_auth_session';

class AuthService {
  private googleClientId: string;

  constructor() {
    this.googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  getGoogleClientId(): string {
    return this.googleClientId;
  }

  isConfigured(): boolean {
    return (
      Boolean(this.googleClientId) &&
      !this.googleClientId.includes('your-google-client-id') &&
      this.googleClientId.endsWith('.apps.googleusercontent.com')
    );
  }

  getCurrentUser(): AuthUser | null {
    if (USE_REAL_BACKEND) {
      return null;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read auth state from storage', e);
    }
    return null;
  }

  async restoreSession(): Promise<AuthUser | null> {
    if (!USE_REAL_BACKEND) {
      return this.getCurrentUser();
    }
    try {
      return (await apiService.currentUser()) as AuthUser;
    } catch {
      return null;
    }
  }

  async loadGoogleScript(): Promise<void> {
    if (typeof window === 'undefined') return;
    if ((window as any).google?.accounts?.id) return;

    return new Promise((resolve, reject) => {
      const existing = document.getElementById('google-gsi-client');
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
      document.head.appendChild(script);
    });
  }

  async signInWithGoogle(): Promise<AuthUser> {
    if (!this.isConfigured()) {
      throw new Error(
        'Google OAuth Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in frontend/.env.local'
      );
    }

    await this.loadGoogleScript();

    return new Promise<AuthUser>((resolve, reject) => {
      const google = (window as any).google;
      if (!google?.accounts?.id && !google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services SDK failed to initialize.'));
        return;
      }

      const finishBackend = async (credential: string) => {
        if (USE_REAL_BACKEND) {
          const data = await apiService.loginWithGoogle(credential);
          resolve(data.user as AuthUser);
          return;
        }
        throw new Error('Backend API is disabled; cannot verify Google token server-side.');
      };

      try {
        if (USE_REAL_BACKEND && google.accounts.id) {
          google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: async (response: { credential: string }) => {
              try {
                await finishBackend(response.credential);
              } catch (err: any) {
                reject(err);
              }
            },
          });
          google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
              this._accessTokenFallback(google, resolve, reject);
            }
          });
          return;
        }

        this._accessTokenFallback(google, resolve, reject);
      } catch (err: any) {
        reject(err);
      }
    });
  }

  private _accessTokenFallback(
    google: any,
    resolve: (user: AuthUser) => void,
    reject: (err: Error) => void
  ) {
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google OAuth token client is unavailable'));
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: this.googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        try {
          if (USE_REAL_BACKEND) {
            const data = await apiService.loginWithGoogle(tokenResponse.access_token);
            resolve(data.user as AuthUser);
            return;
          }
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          if (!userInfoRes.ok) {
            throw new Error('Failed to fetch user profile from Google');
          }
          const userInfo = await userInfoRes.json();
          const authUser: AuthUser = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            picture: userInfo.picture,
            authProvider: 'google',
            accessToken: tokenResponse.access_token,
            authenticatedAt: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          resolve(authUser);
        } catch (err: any) {
          reject(err);
        }
      },
      error_callback: (err: any) => {
        reject(new Error(err.message || 'Google OAuth popup was closed or cancelled'));
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  }

  async signInWithDeveloperSandbox(email = 'operator@marketscout.ai'): Promise<AuthUser> {
    if (USE_REAL_BACKEND) {
      const data = await apiService.loginWithSandbox(email);
      const authUser = data.user as AuthUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      return authUser;
    }
    const sandboxUser: AuthUser = {
      id: `dev-user-${Date.now()}`,
      email,
      name: 'Evaluation Operator',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      authProvider: 'google',
      accessToken: 'sandbox-eval-token',
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sandboxUser));
    return sandboxUser;
  }

  async signOut(): Promise<void> {
    try {
      if (USE_REAL_BACKEND) {
        await apiService.logout();
      }
      localStorage.removeItem(STORAGE_KEY);
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.error('Error during sign out', e);
    }
  }
}

export const authService = new AuthService();

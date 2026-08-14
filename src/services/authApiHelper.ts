import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * Waits for Firebase Auth to be initialized and returns the current user (or null if not logged in).
 * Prevents race conditions where API calls happen before onAuthStateChanged fires.
 */
export async function waitForAuthUser(timeoutMs: number = 8000): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  // If authStateReady is supported by Firebase JS SDK
  if (typeof (auth as any).authStateReady === 'function') {
    try {
      await (auth as any).authStateReady();
      if (auth.currentUser) return auth.currentUser;
    } catch (e) {
      console.warn('[PADEIA AUTH] authStateReady warning:', e);
    }
  }

  // Fallback: wait on onAuthStateChanged listener with timeout
  return new Promise<User | null>((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`[PADEIA AUTH] Auth resolution reached timeout (${timeoutMs}ms). Current user:`, !!auth.currentUser);
        resolve(auth.currentUser);
      }
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(user);
      }
    });
  });
}

/**
 * Safely acquires a fresh Firebase ID Token.
 * NEVER stores the token in localStorage, sessionStorage, or custom cookies.
 * @param forceRefresh If true, forces Firebase Auth to request a new token from Google/Firebase backend.
 */
export async function getFreshFirebaseToken(forceRefresh: boolean = false): Promise<string> {
  const user = await waitForAuthUser();

  console.log(`[PADEIA AUTH] User exists: ${!!user}`);

  if (!user) {
    throw new Error('Usuário não autenticado no Firebase Authentication. Faça login para acessar.');
  }

  const token = await user.getIdToken(forceRefresh);

  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Falha ao obter token de autenticação do Firebase.');
  }

  console.log(`[PADEIA AUTH] Token acquired: true (length: ${token.length}, forceRefresh: ${forceRefresh})`);
  return token;
}

/**
 * Builds HTTP headers containing a valid Bearer token.
 */
export async function getAuthenticatedHeaders(forceRefresh: boolean = false): Promise<Record<string, string>> {
  const token = await getFreshFirebaseToken(forceRefresh);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export interface AuthenticatedFetchOptions extends RequestInit {
  retryOn401?: boolean;
}

/**
 * Centralized authenticated fetch client with automatic token acquisition and 401 single-retry recovery.
 *
 * Implements strict Anti-Loop logic:
 * Attempt 1: getFreshFirebaseToken(false) -> Request -> If 401:
 * Attempt 2: getFreshFirebaseToken(true) -> Retry Request -> If 401: Throw clear error without looping.
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { retryOn401 = true, headers: customHeaders, ...restOptions } = options;

  // 1. Initial attempt with fresh token
  let token: string;
  try {
    token = await getFreshFirebaseToken(false);
  } catch (err: any) {
    console.error('[PADEIA AUTH] Erro ao obter token inicial:', err.message);
    throw err;
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> || {}),
    'Authorization': `Bearer ${token}`
  };

  console.log(`[PADEIA AUTH] Request sent to ${url} with Authorization header: true`);
  let response = await fetch(url, {
    ...restOptions,
    headers: reqHeaders
  });

  // 2. If 401 Unauthorized, perform EXACTLY ONE retry with forced refreshed token
  if (response.status === 401 && retryOn401) {
    console.warn(`[PADEIA AUTH] HTTP 401 recebido de ${url}. Executando tentativa única de renovação forçada (getIdToken(true))...`);

    try {
      const refreshedToken = await getFreshFirebaseToken(true);
      reqHeaders['Authorization'] = `Bearer ${refreshedToken}`;

      console.log(`[PADEIA AUTH] Repetindo requisição para ${url} com token renovado (tentativa 2/2)...`);
      response = await fetch(url, {
        ...restOptions,
        headers: reqHeaders
      });

      if (response.status === 401) {
        console.error(`[PADEIA AUTH] HTTP 401 persistiu após renovação de token em ${url}. Sessão expirada ou sem permissão.`);
      } else {
        console.log(`[PADEIA AUTH] Recuperação de token bem-sucedida! Status recebido: ${response.status}`);
      }
    } catch (refreshErr: any) {
      console.error('[PADEIA AUTH] Falha ao renovar token após 401:', refreshErr.message);
      throw new Error('Sessão de autenticação expirada. Por favor, faça login novamente no Padariaio.');
    }
  }

  return response;
}

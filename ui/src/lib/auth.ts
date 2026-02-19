/**
 * Keycloak ROPC authentication helper.
 * Calls the Keycloak token endpoint with username/password
 * and returns user info extracted from the JWT.
 */

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8082';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'harmonia';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'harmonia-app';

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

export interface AuthUser {
  sub: string;
  username: string;
  name: string;
  email: string;
}

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64url').toString());
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ user: AuthUser; accessToken: string; expiresIn: number } | null> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username,
    password,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as KeycloakTokenResponse;
  const claims = decodeJwtPayload(data.access_token);

  const user: AuthUser = {
    sub: claims.sub as string,
    username: (claims.preferred_username as string) || username,
    name: (claims.name as string) || username,
    email: (claims.email as string) || '',
  };

  return {
    user,
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

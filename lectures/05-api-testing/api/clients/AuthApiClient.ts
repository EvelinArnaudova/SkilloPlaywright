// TESTING: Wraps authentication endpoints for API and UI setup tests.
//
// Like a page object, but for the backend: tests call `auth.login(...)` instead of knowing
// the URL, the HTTP method and the body shape. Methods return the raw `APIResponse`, so a
// test can still check the status code, headers and error body (important for negative tests).
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Credentials } from '../types';

export class AuthApiClient {
	// `request` already knows the baseURL from playwright.config.ts, so paths start with '/'.
	constructor(private readonly request: APIRequestContext) {}

	login(credentials: Credentials): Promise<APIResponse> {
		return this.request.post('/api/login', { data: credentials });
	}

	me(): Promise<APIResponse> {
		return this.request.get('/api/me');
	}
}

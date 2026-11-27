// TESTING: Wraps post endpoints for API tests, UI setup, and test-data cleanup.
//
// The client does NOT decide who is signed in. It uses whatever `APIRequestContext` it is
// given: the built-in `request` (anonymous) or a context that sends a Bearer token (see
// fixtures/api.fixture.ts). The same class therefore works for positive and negative tests.
//
// Methods return `APIResponse` (not parsed JSON) so tests can assert the status code first.
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { CreatePostInput, ReplacePostInput, UpdatePostInput } from '../types';

// Query parameters supported by GET /api/posts. Playwright adds them to the URL for us.
export interface PostQuery {
	published?: boolean;
	authorId?: number;
	_limit?: number;
}

export class PostsApiClient {
	constructor(private readonly request: APIRequestContext) {}

	list(query: PostQuery = {}): Promise<APIResponse> {
		return this.request.get('/api/posts', { params: { ...query } });
	}

	get(id: number): Promise<APIResponse> {
		return this.request.get(`/api/posts/${id}`);
	}

	create(input: CreatePostInput): Promise<APIResponse> {
		return this.request.post('/api/posts', { data: input });
	}

	update(id: number, changes: UpdatePostInput): Promise<APIResponse> {
		return this.request.patch(`/api/posts/${id}`, { data: changes });
	}

	replace(id: number, post: ReplacePostInput): Promise<APIResponse> {
		return this.request.put(`/api/posts/${id}`, { data: post });
	}

	delete(id: number): Promise<APIResponse> {
		return this.request.delete(`/api/posts/${id}`);
	}
}

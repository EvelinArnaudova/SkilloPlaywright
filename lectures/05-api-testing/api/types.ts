// DEVELOPMENT + TESTING: Shared API request and response types used by clients, fixtures, and tests.
//
// One place that describes what the server sends and accepts. Tests, clients and fixtures
// all import from here, so a change in the API is fixed in one file and the compiler shows
// every test that is affected.

export type Role = 'admin' | 'qa';

export interface User {
	id: number;
	name: string;
	email: string;
	role: Role;
}

export interface Post {
	id: number;
	title: string;
	body: string;
	published: boolean;
	authorId: number;
}

// What a client sends to create a post. The server sets `id` and `authorId`.
export interface CreatePostInput {
	title: string;
	body?: string;
	published?: boolean;
}

// PATCH accepts any subset of the fields; PUT needs all of them.
export type UpdatePostInput = Partial<CreatePostInput>;
export type ReplacePostInput = Required<CreatePostInput>;

export interface Credentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: User;
}

// Every error response has this shape, for example { error: 'Validation failed', details: [...] }.
export interface ApiError {
	error: string;
	details?: string[];
}

// DEVELOPMENT: Runs the local Team Blog API and UI used as the system under test.
//
// A small REST API plus a tiny web UI, written with Node's built-in `http` module:
// no dependencies, no database, no internet. Data lives in memory and is reset on restart.
//
// Start it by hand:    node lectures/05-api-testing/server/server.mjs
// Or let Playwright start it before the tests (see `webServer` in ../playwright.config.ts).
//
// API (JSON):
//   GET    /api/health        public   200 { status: 'ok' }
//   POST   /api/login         public   200 { token, user } + session cookie | 400 | 401
//   POST   /api/logout        public   204, ends the session
//   GET    /api/me            auth     200 User | 401
//   GET    /api/users         public   200 User[]
//   GET    /api/users/:id     public   200 User | 404
//   GET    /api/posts         public   200 Post[]   query: ?published=true|false&authorId=2&_limit=5
//   GET    /api/posts/:id     public   200 Post | 404
//   POST   /api/posts         auth     201 Post | 400 | 401
//   PUT    /api/posts/:id     author   200 Post | 400 | 401 | 403 | 404   (full replacement)
//   PATCH  /api/posts/:id     author   200 Post | 400 | 401 | 403 | 404   (partial update)
//   DELETE /api/posts/:id     author   204      | 401 | 403 | 404
//
// Auth: send `Authorization: Bearer <token>` (API clients), or the `session` cookie that
// /api/login sets (the browser UI). "author" means the post's author, or any admin.
// Errors always have the shape { error: string, details?: string[] }.
//
// UI (static files in ./public):  /login.html  and  /posts.html

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = Number(process.env.PORT ?? 3001);
const PUBLIC_DIR = join(import.meta.dirname, 'public');

// ---------------------------------------------------------------------------------------
// 1. IN-MEMORY DATA (seed). Demo credentials only: never store real passwords like this.
// ---------------------------------------------------------------------------------------
const users = [
	{ id: 1, name: 'Ada Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
	{ id: 2, name: 'Dev QA', email: 'dev@example.com', password: 'secret123', role: 'qa' },
];

const posts = [
	{ id: 1, title: 'Welcome to the team blog', body: 'Read this first.', published: true, authorId: 1 },
	{ id: 2, title: 'Release plan', body: 'Not ready yet.', published: false, authorId: 1 },
	{ id: 3, title: 'How we test our API', body: 'Fast checks, every commit.', published: true, authorId: 2 },
];
let nextPostId = posts.length + 1;

// token -> userId. A real server would use signed tokens (JWT) or a session store.
const sessions = new Map();

// ---------------------------------------------------------------------------------------
// 2. HELPERS
// ---------------------------------------------------------------------------------------
class HttpError extends Error {
	constructor(status, message, details) {
		super(message);
		this.status = status;
		this.details = details;
	}
}

const publicUser = ({ password, ...user }) => user;
const sessionCookie = (req) => req.headers.cookie?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];

function send(res, status, body, headers = {}) {
	if (body === undefined) return res.writeHead(status, headers).end();
	res.writeHead(status, { 'Content-Type': 'application/json', ...headers }).end(JSON.stringify(body));
}

async function readJson(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	const text = Buffer.concat(chunks).toString('utf8');
	if (!text) return {};
	try {
		return JSON.parse(text);
	} catch {
		throw new HttpError(400, 'Body must be valid JSON');
	}
}

function requireUser(req) {
	const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
	const user = users.find((u) => u.id === sessions.get(bearer ?? sessionCookie(req)));
	if (!user) throw new HttpError(401, 'Authentication required');
	return user;
}

function findPost(id) {
	const post = posts.find((p) => p.id === Number(id));
	if (!post) throw new HttpError(404, `Post ${id} not found`);
	return post;
}

// Order matters: 401 (who are you?) -> 404 (does it exist?) -> 403 (may you change it?).
function requireAuthor(user, post) {
	if (post.authorId !== user.id && user.role !== 'admin') {
		throw new HttpError(403, 'Only the author or an admin can change this post');
	}
}

// Checks the fields that are present. `full: true` (PUT) requires all of them.
function validatePost(input, { full }) {
	const errors = [];
	if (full || 'title' in input) {
		if (typeof input.title !== 'string' || !input.title.trim()) errors.push('title must be a non-empty string');
		else if (input.title.length > 100) errors.push('title must be at most 100 characters');
	}
	if ((full || 'body' in input) && typeof input.body !== 'string') errors.push('body must be a string');
	if ((full || 'published' in input) && typeof input.published !== 'boolean') errors.push('published must be a boolean');
	if (errors.length) throw new HttpError(400, 'Validation failed', errors);
	// Unknown fields (for example `id` or `authorId`) are ignored, so clients can't overwrite them.
	const { title, body, published } = input;
	return Object.fromEntries(Object.entries({ title, body, published }).filter(([, v]) => v !== undefined));
}

// ---------------------------------------------------------------------------------------
// 3. ROUTES: [method, path, handler]. `:id` becomes `params.id`.
//    A handler returns [status, body?, headers?] or throws an HttpError.
// ---------------------------------------------------------------------------------------
const routes = [
	['GET', '/api/health', () => [200, { status: 'ok' }]],

	['POST', '/api/login', async ({ req }) => {
		const { email, password } = await readJson(req);
		if (typeof email !== 'string' || typeof password !== 'string') {
			throw new HttpError(400, 'email and password are required');
		}
		const user = users.find((u) => u.email === email && u.password === password);
		if (!user) throw new HttpError(401, 'Invalid email or password');
		const token = randomUUID();
		sessions.set(token, user.id);
		// The same token is also set as a cookie, so a browser is signed in too.
		return [200, { token, user: publicUser(user) }, { 'Set-Cookie': `session=${token}; HttpOnly; Path=/; SameSite=Lax` }];
	}],

	['POST', '/api/logout', ({ req }) => {
		sessions.delete(sessionCookie(req));
		return [204, undefined, { 'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0' }];
	}],

	['GET', '/api/me', ({ req }) => [200, publicUser(requireUser(req))]],

	['GET', '/api/users', () => [200, users.map(publicUser)]],

	['GET', '/api/users/:id', ({ params }) => {
		const user = users.find((u) => u.id === Number(params.id));
		if (!user) throw new HttpError(404, `User ${params.id} not found`);
		return [200, publicUser(user)];
	}],

	['GET', '/api/posts', ({ query }) => {
		let result = posts;
		if (query.has('published')) result = result.filter((p) => String(p.published) === query.get('published'));
		if (query.has('authorId')) result = result.filter((p) => p.authorId === Number(query.get('authorId')));
		if (query.has('_limit')) result = result.slice(0, Number(query.get('_limit')));
		return [200, result];
	}],

	['GET', '/api/posts/:id', ({ params }) => [200, findPost(params.id)]],

	['POST', '/api/posts', async ({ req }) => {
		const user = requireUser(req);
		const fields = validatePost(await readJson(req), { full: false });
		if (fields.title === undefined) throw new HttpError(400, 'Validation failed', ['title is required']);
		const post = { id: nextPostId++, body: '', published: false, ...fields, authorId: user.id };
		posts.push(post);
		return [201, post, { Location: `/api/posts/${post.id}` }];
	}],

	['PUT', '/api/posts/:id', async ({ req, params }) => {
		const user = requireUser(req);
		const post = findPost(params.id);
		requireAuthor(user, post);
		Object.assign(post, validatePost(await readJson(req), { full: true }));
		return [200, post];
	}],

	['PATCH', '/api/posts/:id', async ({ req, params }) => {
		const user = requireUser(req);
		const post = findPost(params.id);
		requireAuthor(user, post);
		Object.assign(post, validatePost(await readJson(req), { full: false }));
		return [200, post];
	}],

	['DELETE', '/api/posts/:id', ({ req, params }) => {
		const user = requireUser(req);
		const post = findPost(params.id);
		requireAuthor(user, post);
		posts.splice(posts.indexOf(post), 1);
		return [204];
	}],
];

function matchRoute(method, pathname) {
	for (const [m, pattern, handler] of routes) {
		if (m !== method) continue;
		const names = [];
		const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, name) => (names.push(name), '([^/]+)'))}$`);
		const match = pathname.match(re);
		if (match) return { handler, params: Object.fromEntries(names.map((n, i) => [n, match[i + 1]])) };
	}
	return undefined;
}

// ---------------------------------------------------------------------------------------
// 4. STATIC UI FILES
// ---------------------------------------------------------------------------------------
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

async function serveStatic(res, pathname) {
	const file = pathname === '/' ? 'posts.html' : pathname.slice(1);
	if (file.includes('..') || !TYPES[extname(file)]) return false;
	try {
		const content = await readFile(join(PUBLIC_DIR, file));
		res.writeHead(200, { 'Content-Type': TYPES[extname(file)] }).end(content);
		return true;
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------------------
// 5. SERVER
// ---------------------------------------------------------------------------------------
const server = createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	try {
		const route = matchRoute(req.method, url.pathname);
		if (route) {
			const [status, body, headers] = await route.handler({ req, params: route.params, query: url.searchParams });
			return send(res, status, body, headers);
		}
		if (req.method === 'GET' && (await serveStatic(res, url.pathname))) return;
		throw new HttpError(404, `No route for ${req.method} ${url.pathname}`);
	} catch (error) {
		if (error instanceof HttpError) {
			return send(res, error.status, { error: error.message, ...(error.details && { details: error.details }) });
		}
		console.error(error);
		send(res, 500, { error: 'Internal server error' });
	}
});

server.listen(PORT, () => console.log(`Lecture 5 API listening on http://localhost:${PORT}`));

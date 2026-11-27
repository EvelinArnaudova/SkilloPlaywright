<!-- TESTING: Lecture overview, setup instructions, and architecture for API and UI tests. -->

# Lecture 5: Automation API Testing with Playwright

This lecture tests an application **behind the browser**. A small local server provides a REST
API and two web pages. There are two groups of tests:

- **`api-tests/`**: API tests only. No browser is launched.
- **`ui-tests/`**: browser tests that use the API to **sign in**, to **create test data** and to
  **clean it up**.

The focus is architecture, not test count. Every file has one job, and the same layers are used
in a real project.

**See it run:** open [api-flow.html](api-flow.html) in a browser (no server needed). It is an animated,
step-by-step walkthrough of three flows: a raw `request` call, the fixture chain with CRUD and cleanup,
and the API login that UI tests reuse through `storageState`. Press `I` for a short theory panel and `A` for a
Swagger-style API reference (every endpoint with parameters, responses, curl and Playwright examples).

## Start the local API server

From the repository root:

```bash
npm run start:api            # same as: node lectures/05-api-testing/server/server.mjs
```

It prints `Lecture 5 API listening on http://localhost:3001` and runs until you press `Ctrl+C`.
Use another port with `PORT=4000 npm run start:api` (the tests expect 3001).

Then open the UI or call the API by hand:

```bash
# UI:  http://localhost:3001/login.html   (dev@example.com / secret123)
curl http://localhost:3001/api/health
curl http://localhost:3001/api/posts
curl -X POST http://localhost:3001/api/login -H "Content-Type: application/json" \
     -d '{"email":"dev@example.com","password":"secret123"}'
```

To explore every endpoint in Postman (auth, CRUD and error cases), import the ready collection
[postman/Lecture5-TeamBlog.postman_collection.json](postman/Lecture5-TeamBlog.postman_collection.json)
or follow the step-by-step guide in [POSTMAN.md](POSTMAN.md).

## Run the tests

You do **not** need to start the server first: the `webServer` option in
[playwright.config.ts](playwright.config.ts) starts it before the tests and stops it after.
If the server is already running (`npm run start:api`), the tests reuse it.

```bash
npm run test:api                                               # everything
npx playwright test -c lectures/05-api-testing --project=api   # API tests only
npx playwright test -c lectures/05-api-testing --project=ui-chrome --headed
```

The server has no dependencies and no database. Data lives in memory, so **restarting resets it**.
Lecture 5 has its own config because it needs the server. The root config skips this folder with `testIgnore`.

## Folder structure

```text
05-api-testing/
├── api-flow.html               animated walkthrough: how the API and UI tests run
├── POSTMAN.md                  how to explore the API by hand in Postman
├── postman/                    importable Postman collection (28 requests with checks)
├── playwright.config.ts        webServer + baseURL + projects (api, setup, ui-chrome, ui-firefox)
├── server/
│   ├── server.mjs              the local REST API (Node built-in http, ~250 lines)
│   └── public/                 login.html, posts.html: the UI that calls the same API
├── api/                        reusable API layer (no tests here)
│   ├── types.ts                User, Post, CreatePostInput, LoginResponse, ApiError
│   ├── clients/
│   │   ├── AuthApiClient.ts    POST /api/login, GET /api/me
│   │   └── PostsApiClient.ts   list / get / create / update / replace / delete
│   └── data/
│       ├── users.ts            demo credentials
│       └── postFactory.ts      buildPost(overrides): valid data with a unique title
├── fixtures/
│   ├── api.fixture.ts          user → apiToken → authedRequest → postsApi → posts (auto cleanup)
│   └── ui.fixture.ts           everything above + postsPage
├── pages/
│   └── PostsPage.ts            page object for the UI (Lecture 3)
├── api-tests/                  ← API ONLY
│   ├── request-basics.spec.ts  raw `request` fixture, same style as the slides
│   ├── posts-crud.spec.ts      POST → GET → PATCH → PUT → DELETE → 404, plus 400 validation
│   └── auth.spec.ts            200 / 400 / 401 / 403
└── ui-tests/                   ← UI + API
    ├── auth.setup.ts           sign in through the API once, save the session (storageState)
    └── posts.spec.ts           API seeds → UI shows; UI creates → API confirms
```

## The architecture in layers

```text
 spec files          what to test: short, readable, only assertions and intent
     │  ask for
 fixtures            how to get ready: sign in, build clients, create data, CLEAN UP
     │  use
 API clients /       where things are: URLs, HTTP methods, locators
 page objects        (PostsApiClient is to the API what PostsPage is to the UI)
     │  call
 types + data        what the data looks like: interfaces, factories, test users
     │
 local server        the system under test
```

Rules that keep this architecture clean:

1. **Specs never contain URLs, tokens or cleanup code.** Those live in clients and fixtures.
2. **Clients return `APIResponse`, not parsed JSON.** The test decides what to assert, so the same
   client works for positive tests (`201`) and negative tests (`400`, `401`, `403`).
3. **A client does not choose who is signed in.** It uses the `APIRequestContext` it is given:
   `new PostsApiClient(request)` is anonymous, and the `postsApi` fixture is signed in.
4. **Every test creates its own data** with a unique title (`buildPost()`) and **never changes the
   seed data**. Tests can then run in parallel, in any order, in two browsers at once.
5. **Cleanup happens in fixture teardown**, so it also runs when a test fails.

## API reference

| Method & path            | Auth           | Success           | Errors                    |
| ------------------------ | -------------- | ----------------- | ------------------------- |
| `GET /api/health`        | -              | `200`             |                           |
| `POST /api/login`        | -              | `200 {token,user}`| `400` missing fields, `401` wrong password |
| `POST /api/logout`       | -              | `204`             |                           |
| `GET /api/me`            | yes            | `200 User`        | `401`                     |
| `GET /api/users[/:id]`   | -              | `200`             | `404`                     |
| `GET /api/posts`         | -              | `200 Post[]`      | query: `published`, `authorId`, `_limit` |
| `GET /api/posts/:id`     | -              | `200 Post`        | `404`                     |
| `POST /api/posts`        | yes            | `201` + `Location`| `400`, `401`              |
| `PUT /api/posts/:id`     | author / admin | `200`             | `400`, `401`, `403`, `404`|
| `PATCH /api/posts/:id`   | author / admin | `200`             | `400`, `401`, `403`, `404`|
| `DELETE /api/posts/:id`  | author / admin | `204`             | `401`, `403`, `404`       |

Auth means `Authorization: Bearer <token>` (API clients) **or** the `session` cookie that
`/api/login` sets (browser). Errors always look like `{ "error": "...", "details": ["..."] }`.

Seed users: `admin@example.com` / `admin123` (admin) and `dev@example.com` / `secret123` (qa).

## How the UI tests sign in without the login form

```text
 setup project                                   ui-chrome / ui-firefox projects
 ─────────────                                   ───────────────────────────────
 auth.setup.ts                                   every UI test
   request.post('/api/login')  ──►  Set-Cookie       browser context starts with
   request.storageState({ path })  ──►  .auth/qa.json  ──►  storageState: .auth/qa.json
                                                     page.goto('/posts.html')  → signed in ✔
```

1. The `setup` project runs first (`dependencies: ['setup']` in the config).
2. It signs in with **one API call**. The server answers with a `session` cookie.
3. `request.storageState({ path })` saves the cookie in the format a browser context uses.
4. The UI projects load that file with `storageState`, so every new browser context starts
   signed in. If one test needs a signed-out browser, it overrides the state:
   `test.use({ storageState: { cookies: [], origins: [] } })`.

This is the "authenticate with API request" approach from the
[Playwright authentication docs](https://playwright.dev/docs/auth). The `.auth/` folder holds a
live session, so it is git-ignored.

The API fixtures sign in differently. They send the token in an `Authorization: Bearer` header
(`authedRequest`), which is the usual way for API clients. The next lecture builds on both
approaches with auth fixtures and `page.route`.

## Slides → code

| Slide                                    | Where to look                                              |
| ---------------------------------------- | ---------------------------------------------------------- |
| Playwright's `request` fixture + baseURL | `playwright.config.ts` (`use.baseURL`), `request-basics.spec.ts` |
| First GET & typed assertions             | `request-basics.spec.ts` → "GET a single user…", `api/types.ts` |
| Validating arrays & 404                  | `request-basics.spec.ts` → "GET a collection…"             |
| Creating data with POST                  | `posts-crud.spec.ts` → step "POST creates the post"        |
| PUT / PATCH / DELETE                     | `posts-crud.spec.ts` → the remaining steps                 |
| Query parameters & headers               | `request-basics.spec.ts` → "query parameters…"             |
| Status codes 200/201/204/400/401/403/404 | `posts-crud.spec.ts`, `auth.spec.ts`, API reference above  |
| Combining API & UI tests                 | `ui-tests/posts.spec.ts` + the `posts` fixture             |
| API client classes                       | `api/clients/PostsApiClient.ts`, `AuthApiClient.ts`        |
| Local API service                        | `server/server.mjs` + `webServer` in the config            |

Differences from the slides, on purpose:

- **Paths start with `/api`** (`/api/posts`, not `/posts`), because the same server also serves the
  web pages. Keep `baseURL` as the origin only (`http://localhost:3001`). With
  `baseURL: 'http://localhost:3001/api'`, `request.get('/posts')` would call
  `http://localhost:3001/posts`: a leading `/` means "from the root" and drops `/api`.
- **Writes need a token.** The slides' `request.post(...)` without auth would get `401` here.
  That is realistic, and it is why the `postsApi` fixture exists.
- **`try/finally` cleanup is replaced by a fixture.** The slide version works, but every test has
  to repeat it. The `posts` fixture does it once, for every test.

## Lab exercises

1. **Step 1:** Start the server by hand, sign in at `/login.html`, then call the API with `curl`.
   Get a `201`, a `400`, a `401`, a `403` and a `404`.
2. **Step 2:** In `posts-crud.spec.ts`, add a test that `GET /api/posts?authorId=2` returns only
   QA posts, using `postsApi.list({ authorId: 2 })`.
3. **Step 3:** Add an admin test. In a `test.describe`, call `test.use({ user: 'admin' })` and
   show that the admin **can** `PATCH` a post created by the QA user. Tip: you need two users
   in one test, so create the post with `new PostsApiClient(...)` and a second context.
4. **Stretch:** Add a `/api/posts/:id/comments` endpoint to the server, a `CommentsApiClient`,
   a `comments` data fixture with cleanup, and one UI test that shows a seeded comment.

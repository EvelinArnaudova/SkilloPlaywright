<!-- TESTING: Instructions for importing and exercising the Lecture 5 API in Postman. -->

# Testing the Lecture 5 API in Postman

Before writing Playwright tests, explore the API by hand in Postman. You will learn which
requests the API accepts, what it returns and which status codes it uses. Later you check
the same things in code.

## 1. Start the server

From the repository root:

```bash
npm run start:api
```

Wait for `Lecture 5 API listening on http://localhost:3001`. Keep this terminal open and press
`Ctrl+C` to stop the server.

> Data is kept in memory. Restarting the server resets it to the 3 starting posts.

## Quick start: import the ready collection

1. In Postman click **Import** and choose
   [postman/Lecture5-TeamBlog.postman_collection.json](postman/Lecture5-TeamBlog.postman_collection.json).
2. Open the collection and click **Run** (Collection Runner) to send all 28 requests in order.
   Every request has checks, and all of them should pass.

No environment is needed: `baseUrl`, the test users, `token` and `postId` are **collection
variables** (collection → **Variables** tab). The collection has 3 folders:

| Folder                  | What it shows                                                        |
| ----------------------- | -------------------------------------------------------------------- |
| 1. Happy path (QA user) | login, reads, query params, create → PATCH → PUT → DELETE → 404      |
| 2. Negative cases       | every 400, 401, 403 and 404 from section 5                           |
| 3. Roles (QA vs admin)  | the admin may change a post the QA user wrote, then logout           |

Folder 1 signs in and saves the token. You can also send any single request on its own: a
collection **pre-request script** signs in as the QA user automatically when `token` is empty
(for example after **Logout**, which clears it). The runs clean up after themselves, so you can
repeat them without restarting the server.

> Still getting `401` on a protected request? The server keeps tokens in memory, so restarting
> it makes the saved token invalid. Clear `token` in the collection's **Variables** tab (or send
> **Login as QA**) and try again.

You can also run it from the terminal with Newman, Postman's command-line runner:

```bash
npx newman run lectures/05-api-testing/postman/Lecture5-TeamBlog.postman_collection.json
```

The rest of this guide builds the same collection **by hand**, step by step. Use it in class
so students learn what each part does.

## 2. Prepare Postman

### Create a collection

1. Click **New → Collection** and name it `Lecture 5 - Team Blog API`.
2. Every request below goes into this collection.

### Create an environment

1. Click **Environments → +** and name it `Lecture 5 - Local`.
2. Add two variables:

   | Variable  | Initial value           |
   | --------- | ----------------------- |
   | `baseUrl` | `http://localhost:3001` |
   | `token`   | *(leave empty)*         |

3. Save it and select it in the environment drop-down (top right).

### Use the token for the whole collection

1. Open the collection, then the **Authorization** tab.
2. Set **Auth Type** to `Bearer Token` and **Token** to `{{token}}`.
3. Save. Every request now uses **Auth Type: Inherit auth from parent** by default.

For requests with a body, choose **Body → raw → JSON**.

> **Cookies:** `/api/login` also sets a `session` cookie (for the browser UI), and Postman keeps
> it like a browser does. Then even a request with **No Auth** is still signed in. To test
> with the token only, open each request's **Settings** and turn on **Disable cookie jar**
> (the imported collection already does this), or delete the cookie under **Cookies**.

## 3. Sign in and save the token automatically

Create the request **Login**:

- **Method / URL:** `POST {{baseUrl}}/api/login`
- **Body:**

  ```json
  { "email": "dev@example.com", "password": "secret123" }
  ```

- **Scripts → Post-response:**

  ```js
  pm.test('status is 200', () => pm.response.to.have.status(200));
  pm.environment.set('token', pm.response.json().token);
  ```

Click **Send**. The response looks like this:

```json
{
  "token": "bb3d2d3b-8a1b-4c69-8d46-bec3321043ba",
  "user": { "id": 2, "name": "Dev QA", "email": "dev@example.com", "role": "qa" }
}
```

The `token` variable is now filled in, and every protected request sends it as
`Authorization: Bearer <token>`.

**Test users**

| Email               | Password    | Role  | Can change                 |
| ------------------- | ----------- | ----- | -------------------------- |
| `dev@example.com`   | `secret123` | qa    | only their own posts       |
| `admin@example.com` | `admin123`  | admin | every post                 |

## 4. Requests (happy path)

🔒 means the request needs the token. Send them in this order.

| #  | Name              | Method   | URL                                               | Body                                                           | Expected                |
| -- | ----------------- | -------- | ------------------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| 1  | Health            | `GET`    | `{{baseUrl}}/api/health`                          | –                                                              | `200 {"status":"ok"}`   |
| 2  | Login             | `POST`   | `{{baseUrl}}/api/login`                           | see section 3                                                  | `200 {token, user}`     |
| 3  | Who am I 🔒       | `GET`    | `{{baseUrl}}/api/me`                              | –                                                              | `200` the signed-in user|
| 4  | All users         | `GET`    | `{{baseUrl}}/api/users`                           | –                                                              | `200` array, no passwords |
| 5  | One user          | `GET`    | `{{baseUrl}}/api/users/1`                         | –                                                              | `200`                   |
| 6  | All posts         | `GET`    | `{{baseUrl}}/api/posts`                           | –                                                              | `200` array             |
| 7  | Filtered posts    | `GET`    | `{{baseUrl}}/api/posts?published=true&_limit=2`   | –                                                              | `200` max 2, published  |
| 8  | One post          | `GET`    | `{{baseUrl}}/api/posts/1`                         | –                                                              | `200`                   |
| 9  | Create post 🔒    | `POST`   | `{{baseUrl}}/api/posts`                           | `{"title":"From Postman","body":"Hello","published":false}`   | `201` + `Location` header |
| 10 | Update post 🔒    | `PATCH`  | `{{baseUrl}}/api/posts/{{postId}}`                | `{"published":true}`                                           | `200` only `published` changed |
| 11 | Replace post 🔒   | `PUT`    | `{{baseUrl}}/api/posts/{{postId}}`                | `{"title":"Replaced","body":"New body","published":true}`     | `200` all fields replaced |
| 12 | Delete post 🔒    | `DELETE` | `{{baseUrl}}/api/posts/{{postId}}`                | –                                                              | `204` empty body        |
| 13 | Deleted post      | `GET`    | `{{baseUrl}}/api/posts/{{postId}}`                | –                                                              | `404`                   |
| 14 | Logout            | `POST`   | `{{baseUrl}}/api/logout`                          | –                                                              | `204`                   |

**Query parameters:** in request 7, open the **Params** tab. Postman shows `published` and
`_limit` as rows, the same thing Playwright's `params: { published: true, _limit: 2 }` does.
The API also supports `authorId`, for example `?authorId=2`.

### Save the new post id

Requests 10-13 use `{{postId}}`. Add this to **Scripts → Post-response** of request 9:

```js
pm.test('status is 201', () => pm.response.to.have.status(201));
pm.environment.set('postId', pm.response.json().id);
```

## 5. Negative cases

A good tester checks the errors too. Every error has the same shape:

```json
{ "error": "Validation failed", "details": ["title must be a non-empty string"] }
```

| Status | What it means                         | How to get it                                                                 |
| ------ | ------------------------------------- | ----------------------------------------------------------------------------- |
| `400`  | Bad request: your data is wrong       | Request 9 with `{"title":""}`                                                 |
| `400`  | PUT needs all fields                  | Request 11 with only `{"title":"x"}`                                          |
| `400`  | Login fields missing                  | Request 2 with `{}`                                                           |
| `400`  | Body is not valid JSON                | Request 9 with `{bad`                                                         |
| `401`  | "I don't know who you are"            | Request 2 with a wrong password                                               |
| `401`  | No token                              | Request 9 with **Authorization → No Auth**                                    |
| `403`  | "I know you, but you may not do this" | Signed in as `dev@example.com`: `DELETE {{baseUrl}}/api/posts/1` (admin's post) |
| `404`  | Not found                             | `GET {{baseUrl}}/api/posts/999` or `GET {{baseUrl}}/api/users/99`             |
| `404`  | Unknown route                         | `GET {{baseUrl}}/api/unknown`                                                 |

**Try the admin:** sign in with `admin@example.com` / `admin123` and send the same `DELETE`
for post 1. Now it returns `204`. The request is the same, but a different user gets a
different result.

> Deleting seed posts 1-3 changes the data for everyone using this server. Restart the server
> to get them back.

## 6. Add checks (Postman tests)

Postman can assert the response, like `expect(...)` in Playwright. Example for request 6:

```js
pm.test('status is 200', () => pm.response.to.have.status(200));

pm.test('returns an array of posts', () => {
  const posts = pm.response.json();
  pm.expect(posts).to.be.an('array').that.is.not.empty;
  posts.forEach((post) => pm.expect(post).to.have.keys('id', 'title', 'body', 'published', 'authorId'));
});

pm.test('responds fast', () => pm.expect(pm.response.responseTime).to.be.below(500));
```

Run all requests in order with **Collection → Run** (the Collection Runner).

## 7. From Postman to Playwright

Everything you clicked in Postman has a direct equivalent in the Playwright tests:

| Postman                               | Playwright                                                     |
| ------------------------------------- | -------------------------------------------------------------- |
| Environment variable `baseUrl`        | `use.baseURL` in [playwright.config.ts](playwright.config.ts)   |
| **Params** tab                        | `request.get('/api/posts', { params: { ... } })`               |
| **Body → raw → JSON**                 | `request.post('/api/posts', { data: { ... } })`                |
| **Headers** tab                       | `request.get(url, { headers: { ... } })`                       |
| Collection auth `Bearer {{token}}`    | `authedRequest` fixture in [fixtures/api.fixture.ts](fixtures/api.fixture.ts) |
| Login post-response script            | `apiToken` fixture                                             |
| Saving `postId` for later requests    | `posts.track(id)` and the `posts` fixture cleanup              |
| `pm.test(...)` / `pm.expect(...)`     | `expect(response.status()).toBe(200)`                          |
| Collection Runner                     | `npm run test:api`                                             |
| A saved request in the collection     | A method in [PostsApiClient.ts](api/clients/PostsApiClient.ts)  |

Postman is great for **exploring** an API. Playwright is for **repeatable, automated** checks
that run on every commit, together with the UI tests.

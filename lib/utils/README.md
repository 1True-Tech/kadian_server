# Express Route Helpers: `withErrorHandling` & `routeHandler`

Hey hey 👋

You ever find yourself wiring up an Express route and repeating the same stuff over and over? Like checking if your app's online, writing the same try/catch blocks, and making sure your JSON responses all look the same?

That’s exactly what `withErrorHandling` and `routeHandler` are for. They’re little helpers to keep your route code clean and chill.

---

## So what is this thing?

You’ve got two tools:

* `withErrorHandling`: This wraps your route logic and makes sure you handle errors, check if you’re online, and return a nice clean response shape.
* `routeHandler`: This registers your route with Express and takes care of sending whatever your logic returns back to the client—whether it’s JSON, a stream, or a file.

Together? You write less boilerplate and your routes stay clean.

---

## Okay but… how does it work?

### `withErrorHandling`

You give it your async route logic, and it gives you back a wrapped version that:

* Runs a quick online check using your `ping.js`
* Sets `res.locals.isOnline` to `'online'` or `'offline'`
* Catches any thrown errors and turns them into a standardized response object (so you don’t have to)

It **doesn’t** send the response itself. It just preps the data nicely. Think of it as the guy who packs your lunch, but doesn’t deliver it.

### `routeHandler`

This is the actual Express connector. You give it:

* your `app` or a `Router`
* method (`get`, `post`, etc.)
* path (`/users`, `/health`)
* optional middleware
* your wrapped handler

Then it:

* Builds a `req/res/next/params/query/body` event object for you
* Awaits your handler
* Sends the result as JSON, unless it’s a stream or buffer
* Handles or forwards errors cleanly

---

## What kind of magic can it do?

* Standard success & error responses
* Internet connectivity check (you can skip it if you don’t need it)
* It supports streaming or buffer responses
* Automatically adds `res.locals.isOnline` so you know if the app was online during the request

You can tweak almost all of this.

---

## Cool, now how do I actually use it?

### Step 1: Write your core logic

```js
async function getUser({ params }) {
  const user = await db.users.findById(params.id);
  if (!user) throw { message: 'User not found', statusCode: 404 };
  return { user };
}
```

### Step 2: Wrap it with `withErrorHandling`

```js
import withErrorHandling from '../lib/utils/withErrorHandling.js';

const safeGetUser = withErrorHandling(getUser);
```

You can also skip the ping like this:

```js
const safeGetUser = withErrorHandling(getUser, {
  skipProcesses: ['connectionActivity']
});
```

### Step 3: Register the route with `routeHandler`

```js
import routeHandler from '../lib/utils/routeHandler.js';

routeHandler({
  app,
  method: 'get',
  path: '/users/:id',
  handler: safeGetUser
});
```

Need middleware? Add it:

```js
routeHandler({
  app,
  method: 'post',
  path: '/signup',
  middleware: [validateSignupBody],
  handler: withErrorHandling(signupLogic)
});
```

---

## Putting it all together (a full example)

```js
import express from 'express';
import routeHandler from '../lib/utils/routeHandler.js';
import withErrorHandling from '../lib/utils/withErrorHandling.js';

const app = express();
app.use(express.json());

async function healthLogic({ res }) {
  return { status: 'ok', message: 'Server is healthy' };
}

routeHandler({
  app,
  method: 'get',
  path: '/health',
  handler: withErrorHandling(healthLogic)
});

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Unhandled error' });
});

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});
```

---

## Pro tips & gotchas

* Want to return a custom status? Just include `statusCode` in your return.
* Streaming? Write to `res` yourself and return `undefined`.
* Skipping ping? Use `{ skipProcesses: ['connectionActivity'] }`.
* Throwing errors? Do it like this: `throw { message: 'Nope', statusCode: 400 }`

### Heads up:

* If `res.locals` is empty, make sure you’re using `withErrorHandling()` *inside* `routeHandler()`.
* Node ESM likes `.js` extensions on imports.
* And yeah, don’t forget to `await` your async stuff—hanging promises cause weird bugs.

---

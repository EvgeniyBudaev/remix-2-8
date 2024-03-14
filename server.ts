import express from "express";
import path from "path";
import { createRequestHandler } from "@remix-run/express";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import {registerAccessTokenRefresh} from "~/shared/http/registerAccessTokenRefresh";

installGlobals();

const BUILD_DIR = path.join(process.cwd(), "build");
const MODE = "development"; //process.env.NODE_ENV;
const isProduction = MODE === "production";

const app = express();

// Remix fingerprints its assets so we can cache forever.
app.use("/build", express.static("public/build", { immutable: true, maxAge: "1y" }));

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

function loadBuild() {
  let build = require(BUILD_DIR);
  build = registerAccessTokenRefresh(
    build,
    {},
    ["routes/"],
  );

  return build;
}

app.all(
  "*",
  isProduction
    ? createRequestHandler({
      build: loadBuild(),
    })
    : (...args) => {
      purgeRequireCache();
      const requestHandler = createRequestHandler({
        build: loadBuild(),
        mode: MODE,
      });
      return requestHandler(...args);
    },
);

const port = 3000;

app.listen(port, async () => {
  console.log(`Express server listening on port ${port}`);
  broadcastDevReady(await import(BUILD_DIR));
});

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (let key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
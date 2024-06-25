const CACHE_STATIC_NAME = "static-v1";
const CACHE_DYNAMIC_NAME = "dynamic-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/index.html",
  "/account.html",
  "/add-expense.html",
  "/add-income.html",
  "/add-subscription.html",
  "/addsavings.html",
  "/admin-db.html",
  "/budget.html",
  "/changebalance.html",
  "/gerir-2.html",
  "/gerir.html",
  "/home.html",
  "/login.html",
  "/parati.html",
  "/savings.html",
  "/signup.html",
  "/subscriptions.html",
  "/updateuser.html",
  "/app.js",
  OFFLINE_URL
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      console.log("[Service Worker] Pre-caching offline page and static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Service Worker...");
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          return response;
        })
        .catch(function () {
          return caches.open(CACHE_STATIC_NAME).then(function (cache) {
            return cache.match(OFFLINE_URL);
          });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function () {
              return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                return cache.match(OFFLINE_URL);
              });
            });
        }
      })
    );
  }
});
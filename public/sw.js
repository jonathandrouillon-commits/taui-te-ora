const CACHE_VERSION = "v2";
const STATIC_CACHE = `taui-te-ora-static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("taui-te-ora-") &&
                cacheName !== STATIC_CACHE
            )
            .map((cacheName) =>
              caches.delete(cacheName)
            )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    try {
      data = {
        body: event.data
          ? event.data.text()
          : "",
      };
    } catch {
      data = {};
    }
  }

  const title =
    data.title ||
    "Taui Te Ora";

  const body =
    data.body ||
    data.message ||
    "Nouvelle alerte animal.";

  const url =
    data.url ||
    data.link ||
    "/signalement";

  const options = {
    body,

    icon: "/icon-192.png",
    badge: "/icon-192.png",

    tag:
      data.tag ||
      "taui-te-ora-alert",

    renotify: true,
    requireInteraction: false,

    data: {
      url,

      animalId:
        data.animalId ||
        data.animal_id ||
        null,

      signalementId:
        data.signalementId ||
        data.signalement_id ||
        null,
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawTarget =
    event.notification.data?.url ||
    "/";

  let targetUrl = "/";

  try {
    const parsedUrl =
      new URL(rawTarget, self.location.origin);

    /*
     * Sécurité :
     * une notification Taui Te Ora ne peut ouvrir
     * qu'une URL appartenant à Taui Te Ora.
     */
    if (parsedUrl.origin === self.location.origin) {
      targetUrl =
        parsedUrl.pathname +
        parsedUrl.search +
        parsedUrl.hash;
    }
  } catch {
    targetUrl = "/";
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (
            "navigate" in client &&
            "focus" in client
          ) {
            await client.navigate(targetUrl);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      })
  );
});

self.addEventListener("notificationclose", () => {
  // Aucune action nécessaire.
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  let url;

  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  /*
   * Jamais de cache pour une origine externe.
   */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * IMPORTANT :
   * aucune API ni donnée authentifiée n'est mise
   * en cache par le Service Worker.
   */
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/login")
  ) {
    return;
  }

  /*
   * On limite volontairement le cache runtime
   * aux ressources statiques.
   */
  const isStaticAsset =
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script";

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached =
        await cache.match(request);

      const networkRequest =
        fetch(request)
          .then((response) => {
            if (
              response.ok &&
              response.type === "basic"
            ) {
              cache.put(
                request,
                response.clone()
              );
            }

            return response;
          })
          .catch(() => cached);

      return cached || networkRequest;
    })
  );
});
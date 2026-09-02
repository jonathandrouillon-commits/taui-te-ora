const CACHE_VERSION = "v3";
const STATIC_CACHE = `taui-te-ora-static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(STATIC_ASSETS)
      )
      .then(() =>
        self.skipWaiting()
      )
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
                cacheName.startsWith(
                  "taui-te-ora-"
                ) &&
                cacheName !==
                  STATIC_CACHE
            )
            .map((cacheName) =>
              caches.delete(
                cacheName
              )
            )
        )
      )
      .then(() =>
        self.clients.claim()
      )
  );
});

/*
 * =========================================================
 * BADGE APPLICATION
 * =========================================================
 */

async function setApplicationBadge(
  count
) {
  try {
    const badgeCount =
      Number(count);

    if (
      !Number.isFinite(
        badgeCount
      ) ||
      badgeCount <= 0
    ) {
      if (
        self.navigator &&
        "clearAppBadge" in
          self.navigator
      ) {
        await self.navigator
          .clearAppBadge();
      }

      return;
    }

    if (
      self.navigator &&
      "setAppBadge" in
        self.navigator
    ) {
      await self.navigator
        .setAppBadge(
          Math.floor(
            badgeCount
          )
        );
    }
  } catch (error) {
    console.error(
      "Erreur badge application :",
      error
    );
  }
}

/*
 * Permet à l'application ouverte
 * de synchroniser le badge.
 */

self.addEventListener(
  "message",
  (event) => {
    const data =
      event.data || {};

    if (
      data.type ===
      "SET_APP_BADGE"
    ) {
      event.waitUntil(
        setApplicationBadge(
          data.count
        )
      );
    }

    if (
      data.type ===
      "CLEAR_APP_BADGE"
    ) {
      event.waitUntil(
        setApplicationBadge(
          0
        )
      );
    }
  }
);

/*
 * =========================================================
 * PUSH
 * =========================================================
 */

self.addEventListener(
  "push",
  (event) => {
    let data = {};

    try {
      if (
        event.data
      ) {
        data =
          event.data.json();
      }
    } catch {
      try {
        data = {
          body:
            event.data
              ? event.data.text()
              : "",
        };
      } catch {
        data = {};
      }
    }

    const title =
      data.title ||
      "TAUI TE ORA";

    const body =
      data.body ||
      data.message ||
      "Nouvelle alerte animal.";

    const url =
      data.url ||
      data.link ||
      "/notifications";

    /*
     * Si l'API push nous donne
     * directement le nombre total
     * de notifications non lues,
     * on l'utilise.
     *
     * Sinon on met au minimum
     * un badge générique 1.
     */

    const badgeCount =
      Number(
        data.unreadCount ??
          data.unread_count ??
          data.badgeCount ??
          data.badge_count ??
          1
      );

    const options = {
      body,

      icon:
        "/icon-192.png",

      /*
       * ATTENTION :
       * "badge" ici est l'icône
       * monochrome de notification
       * Android.
       *
       * Ce n'est PAS le compteur
       * rouge de l'icône PWA.
       */

      badge:
        "/icon-192.png",

      tag:
        data.tag ||
        `taui-te-ora-${Date.now()}`,

      renotify:
        true,

      requireInteraction:
        false,

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

        unreadCount:
          badgeCount,
      },
    };

    const tasks = [
      self.registration
        .showNotification(
          title,
          options
        ),
    ];

    /*
     * Mise à jour du badge
     * de l'application installée.
     */

    tasks.push(
      setApplicationBadge(
        badgeCount
      )
    );

    event.waitUntil(
      Promise.all(
        tasks
      )
    );
  }
);

/*
 * =========================================================
 * CLIC NOTIFICATION
 * =========================================================
 */

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification
      .close();

    const rawTarget =
      event.notification
        .data?.url ||
      "/notifications";

    let targetUrl =
      "/notifications";

    try {
      const parsedUrl =
        new URL(
          rawTarget,
          self.location.origin
        );

      /*
       * Une notification TAUI TE ORA
       * ne peut ouvrir qu'une URL
       * du même domaine.
       */

      if (
        parsedUrl.origin ===
        self.location.origin
      ) {
        targetUrl =
          parsedUrl.pathname +
          parsedUrl.search +
          parsedUrl.hash;
      }
    } catch {
      targetUrl =
        "/notifications";
    }

    event.waitUntil(
      self.clients
        .matchAll({
          type:
            "window",

          includeUncontrolled:
            true,
        })
        .then(
          async (
            clientList
          ) => {
            for (
              const client
              of clientList
            ) {
              if (
                "navigate" in
                  client &&
                "focus" in
                  client
              ) {
                await client
                  .navigate(
                    targetUrl
                  );

                return client
                  .focus();
              }
            }

            if (
              self.clients
                .openWindow
            ) {
              return self.clients
                .openWindow(
                  targetUrl
                );
            }

            return undefined;
          }
        )
    );
  }
);

self.addEventListener(
  "notificationclose",
  () => {
    // Rien à faire.
  }
);

/*
 * =========================================================
 * CACHE
 * =========================================================
 */

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    let url;

    try {
      url =
        new URL(
          request.url
        );
    } catch {
      return;
    }

    /*
     * Jamais de cache
     * pour origine externe.
     */

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
     * Jamais de cache
     * pour API / auth.
     */

    if (
      url.pathname
        .startsWith(
          "/api/"
        ) ||
      url.pathname
        .startsWith(
          "/auth/"
        ) ||
      url.pathname
        .startsWith(
          "/login"
        )
    ) {
      return;
    }

    const isStaticAsset =
      request.destination ===
        "image" ||
      request.destination ===
        "font" ||
      request.destination ===
        "style" ||
      request.destination ===
        "script";

    if (
      !isStaticAsset
    ) {
      return;
    }

    event.respondWith(
      caches
        .open(
          STATIC_CACHE
        )
        .then(
          async (
            cache
          ) => {
            const cached =
              await cache
                .match(
                  request
                );

            const networkRequest =
              fetch(
                request
              )
                .then(
                  (
                    response
                  ) => {
                    if (
                      response.ok &&
                      response.type ===
                        "basic"
                    ) {
                      void cache
                        .put(
                          request,
                          response.clone()
                        );
                    }

                    return response;
                  }
                )
                .catch(
                  () =>
                    cached
                );

            return (
              cached ||
              networkRequest
            );
          }
        )
    );
  }
);
const CACHE_VERSION = "v4";
const STATIC_CACHE = `taui-te-ora-static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
];

/* =========================================================
   INSTALLATION
========================================================= */

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

/* =========================================================
   ACTIVATION
========================================================= */

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

/* =========================================================
   BADGE APPLICATION
========================================================= */

async function setApplicationBadge(count) {
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
 * L'application ouverte peut demander
 * une synchronisation directe du badge.
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

      return;
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

/* =========================================================
   PUSH
========================================================= */

self.addEventListener(
  "push",
  (event) => {
    let data = {};

    try {
      if (event.data) {
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
      "Nouvelle notification Taui Te Ora.";

    const url =
      data.url ||
      data.link ||
      "/notifications";

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

        type:
          data.type ||
          "notification",

        notificationId:
          data.notificationId ||
          data.notification_id ||
          null,

        conversationId:
          data.conversationId ||
          data.conversation_id ||
          null,

        animalId:
          data.animalId ||
          data.animal_id ||
          null,

        signalementId:
          data.signalementId ||
          data.signalement_id ||
          null,

        adoptionRequestId:
          data.adoptionRequestId ||
          data.adoption_request_id ||
          null,

        sosId:
          data.sosId ||
          data.sos_id ||
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
      setApplicationBadge(
        badgeCount
      ),
    ];

    event.waitUntil(
      Promise.all(tasks)
    );
  }
);

/* =========================================================
   CLIC SUR UNE NOTIFICATION
========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

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
      (async () => {
        const clientList =
          await self.clients
            .matchAll({
              type: "window",
              includeUncontrolled:
                true,
            });

        for (
          const client
          of clientList
        ) {
          if (
            "navigate" in client &&
            "focus" in client
          ) {
            await client.navigate(
              targetUrl
            );

            await client.focus();

            return;
          }
        }

        if (
          self.clients.openWindow
        ) {
          await self.clients
            .openWindow(
              targetUrl
            );
        }
      })()
    );
  }
);

self.addEventListener(
  "notificationclose",
  () => {
    /*
     * Fermer visuellement une notification
     * ne la marque pas comme lue.
     */
  }
);

/* =========================================================
   CACHE
========================================================= */

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

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    if (
      url.pathname.startsWith(
        "/api/"
      ) ||
      url.pathname.startsWith(
        "/auth/"
      ) ||
      url.pathname.startsWith(
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
              await cache.match(
                request
              );

            const networkRequest =
              fetch(request)
                .then(
                  (
                    response
                  ) => {
                    if (
                      response.ok &&
                      response.type ===
                        "basic"
                    ) {
                      void cache.put(
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
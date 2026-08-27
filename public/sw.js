const CACHE_NAME = "taui-te-ora-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
self.addEventListener(
  "push",
  (event) => {
    let payload = {};

    try {
      payload =
        event.data
          ? event.data.json()
          : {};
    } catch {
      payload = {
        title:
          "Taui Te Ora",

        body:
          event.data
            ? event.data.text()
            : "Nouvelle alerte animale",
      };
    }

    const title =
      payload.title ||
      "Taui Te Ora";

    const url =
      payload.url ||
      "/signalement";

    const signalementId =
      payload.signalementId ||
      "";

    event.waitUntil(
      self.registration.showNotification(
        title,
        {
          body:
            payload.body ||
            "Une nouvelle alerte animale vient d'être publiée.",

          icon:
            "/icon-192.png",

          badge:
            "/icon-192.png",

          tag:
            signalementId
              ? `taui-signalement-${signalementId}`
              : "taui-signalement",

          renotify:
            true,

          data: {
            url,
            signalementId,
          },
        }
      )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const url =
      event.notification
        ?.data?.url ||
      "/signalement";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled:
            true,
        })
        .then(
          (
            clientList
          ) => {
            for (
              const client
              of clientList
            ) {
              if (
                "focus" in
                client
              ) {
                client.navigate(
                  url
                );

                return client.focus();
              }
            }

            if (
              clients.openWindow
            ) {
              return clients.openWindow(
                url
              );
            }

            return undefined;
          }
        )
    );
  }
);
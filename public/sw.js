const CACHE_NAME =
  "taui-te-ora-v1";

self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim()
    );
  }
);

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

      icon:
        "/logo.png",

      badge:
        "/logo.png",

      tag:
        data.tag ||
        "taui-te-ora-alert",

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
      },
    };

    event.waitUntil(
      self.registration
        .showNotification(
          title,
          options
        )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification
      .close();

    const targetUrl =
      event.notification
        .data?.url ||
      "/";

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
              const client of
              clientList
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

self.addEventListener(
  "fetch",
  () => {
    /*
     * On laisse Next.js gérer
     * normalement les requêtes.
     *
     * Aucun cache forcé ici.
     */
  }
);
// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "새로운 기록을 작성할 시간이에요!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-96x96.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
        albumId: data.albumId,
      },
      actions: [
        {
          action: "open",
          title: "기록하기",
        },
        {
          action: "close",
          title: "닫기",
        },
      ],
      tag: data.tag || "routine-memo-notification",
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "꾸모리", options)
    );
  } catch (error) {
    console.error("Push event error:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // 알림 클릭 시 해당 앨범 페이지로 이동
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

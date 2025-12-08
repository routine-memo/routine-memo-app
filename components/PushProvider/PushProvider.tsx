"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface PushContextType {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

const PushContext = createContext<PushContextType | null>(null);

export function usePush() {
  const context = useContext(PushContext);
  if (!context) {
    throw new Error("usePush must be used within PushProvider");
  }
  return context;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function PushProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Service Worker 등록 및 기존 구독 확인
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSupport = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window;
      setIsSupported(supported);

      if (!supported) return;

      // 알림 권한 상태 확인
      setPermission(Notification.permission);

      try {
        // Service Worker 등록
        const reg = await navigator.serviceWorker.register("/sw.js");
        setRegistration(reg);

        // 기존 구독 확인
        const subscription = await reg.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    checkSupport();
  }, []);

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "denied";

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  // 푸시 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log("Push notifications not supported");
      return false;
    }

    try {
      // registration이 없으면 직접 등록 시도
      let reg = registration;
      if (!reg) {
        console.log("Registering service worker...");
        reg = await navigator.serviceWorker.register("/sw.js");
        setRegistration(reg);
      }

      // 권한 확인
      if (Notification.permission !== "granted") {
        console.log("Requesting notification permission...");
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          console.log("Notification permission denied");
          return false;
        }
      }

      // 기존 구독 확인
      let subscription = await reg.pushManager.getSubscription();

      // 새 구독 생성
      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not found");
          return false;
        }

        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // 서버에 구독 정보 전송
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))
            ),
            auth: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
            ),
          },
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return false;
    }
  }, [isSupported, registration]);

  // 푸시 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) return false;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      // 서버에서 구독 삭제
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // 로컬 구독 해제
      await subscription.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error("Push unsubscription failed:", error);
      return false;
    }
  }, [isSupported, registration]);

  return (
    <PushContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe,
        requestPermission,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

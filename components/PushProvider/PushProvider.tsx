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

        // 기존 구독 확인 - 브라우저와 서버 모두 확인
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          // 서버에도 구독이 있는지 확인
          try {
            const response = await fetch("/api/push/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ endpoint: subscription.endpoint }),
            });
            const data = await response.json();
            setIsSubscribed(data.subscribed);
          } catch {
            // 서버 확인 실패 시 브라우저 구독 기준으로
            setIsSubscribed(true);
          }
        } else {
          setIsSubscribed(false);
        }
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
      // Service Worker 등록 (항상 최신 상태 확인)
      console.log("Getting service worker registration...");
      let reg: ServiceWorkerRegistration;
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        // Service Worker가 활성화될 때까지 대기
        await navigator.serviceWorker.ready;
        setRegistration(reg);
      } catch (swError) {
        console.error("Service worker registration failed:", swError);
        return false;
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

      // 기존 구독 확인 및 삭제 (VAPID 키 불일치 문제 해결)
      let subscription = await reg.pushManager.getSubscription();

      // 기존 구독이 있으면 삭제 후 새로 생성 (VAPID 키 변경 대응)
      if (subscription) {
        try {
          await subscription.unsubscribe();
          console.log("Old subscription removed");
        } catch (e) {
          console.log("Failed to remove old subscription:", e);
        }
      }

      // 새 구독 생성
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not found");
        return false;
      }

      console.log("Creating new push subscription...");
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log("Push subscription created:", subscription.endpoint.slice(0, 50) + "...");

      // 서버에 구독 정보 전송
      console.log("Sending subscription to server...");
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // PWA에서 세션 쿠키 전달을 위해 필요
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
        console.log("Subscription saved to server");
        setIsSubscribed(true);
        return true;
      }

      const errorData = await response.json().catch(() => ({}));
      console.error("Server subscription failed:", response.status, errorData);

      // 401이면 세션 문제일 수 있음 - 페이지 새로고침 권유
      if (response.status === 401) {
        console.error("Authentication failed - user may need to re-login");
      }

      return false;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return false;
    }
  }, [isSupported]);

  // 푸시 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      // registration이 없으면 다시 가져오기
      let reg = registration;
      if (!reg) {
        try {
          reg = await navigator.serviceWorker.ready;
        } catch {
          // Service Worker가 없으면 이미 구독 해제된 상태로 간주
          setIsSubscribed(false);
          return true;
        }
      }

      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      // 서버에서 구독 삭제
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

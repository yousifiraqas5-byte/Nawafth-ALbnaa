// ============================================================
// شركة نوافذ البناء
// Firebase Messaging Service Worker
// مسؤول عن استقبال الإشعارات عندما يكون التطبيق في الخلفية
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBFvj67nyPbUgze8WJ4MxEMA4Ncj8tQ-z8",
    authDomain: "nawafth-albnaa.firebaseapp.com",
    projectId: "nawafth-albnaa",
    storageBucket: "nawafth-albnaa.firebasestorage.app",
    messagingSenderId: "627282438766",
    appId: "1:627282438766:web:d9ac1f126b9b2252aa547f",
    measurementId: "G-QC9ZTEQHGH"
});

const messaging = firebase.messaging();

// استقبال الإشعار في الخلفية وعرضه
messaging.onBackgroundMessage(function (payload) {
    console.log("تم استلام إشعار في الخلفية:", payload);

    const title = payload.notification && payload.notification.title
        ? payload.notification.title
        : "شركة نوافذ البناء";

    const body = payload.notification && payload.notification.body
        ? payload.notification.body
        : "تحديث جديد في تطبيق الشركة";

    // بيانات إضافية (مثل faultId للأجهزة الطبية) تُحفظ مع الإشعار
    // لاستخدامها عند الضغط عليه لفتح العنصر الصحيح مباشرة.
    const options = {
        body: body,
        icon: "icon.png",
        badge: "icon.png",
        vibrate: [200, 100, 200],
        dir: "rtl",
        lang: "ar",
        tag: "nawafth-notification",
        renotify: true,
        data: payload.data || {}
    };

    self.registration.showNotification(title, options);
});

// عند الضغط على الإشعار: فتح التطبيق، وإن كان مرتبطًا بعطل جهاز طبي
// (faultId ضمن data) يُفتح العطل الصحيح مباشرة — إما عبر رسالة إلى
// تبويب مفتوح أصلاً، أو عبر رابط يحمل faultId عند فتح تبويب جديد.
self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const data = event.notification.data || {};
    const faultId = data.faultId || null;

    const targetPath = faultId
        ? "index.html?openMedical=1&faultId=" + encodeURIComponent(faultId)
        : "index.html";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ("focus" in client) {
                    if (faultId && "postMessage" in client) {
                        client.postMessage({ type: "OPEN_MEDICAL_FAULT", faultId: faultId });
                    }
                    return client.focus();
                }
            }
            return clients.openWindow(targetPath);
        })
    );
});
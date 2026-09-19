// ============================================================
// شركة نوافذ البناء - Cloud Functions
// مسؤولة عن إرسال الإشعارات (Push) إلى أجهزة الموبايل
// عندما يتم إنشاء إشعار جديد في مجموعة notifications
//
// لرفع هذه الدوال إلى Firebase:
//   1) firebase login
//   2) firebase init functions  (اختر المشروع nawafth-albnaa)
//   3) cd functions && npm install
//   4) npm run deploy
// ============================================================

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const MAX_TOKENS_PER_REQUEST = 500;

function getStringValue(value, fallback) {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
}

function getRegisteredTokens(snapshot) {
    const seen = new Set();

    return snapshot.docs.flatMap((document) => {
        const data = document.data() || {};
        const token = getStringValue(data.token, document.id).trim();

        if (
            !token ||
            token.length <= 20 ||
            token.length > 1000 ||
            seen.has(token)
        ) {
            return [];
        }

        seen.add(token);
        return [{ id: document.id, token }];
    });
}

function getChunks(items, size) {
    const chunks = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
}

exports.sendNotificationToDevices = onDocumentCreated(
    "notifications/{notificationId}",
    async (event) => {
        if (!event.data) {
            console.warn("تم تجاهل حدث إشعار بدون بيانات");
            return;
        }

        const data = event.data.data() || {};
        const title = getStringValue(data.title, "إشعار جديد");
        const body = getStringValue(data.body, "تحديث جديد في تطبيق شركة نوافذ البناء");
        const notificationType = getStringValue(data.type, "general");
        const notificationId = event.params?.notificationId || "";

        const tokensSnapshot = await db
            .collection("notificationTokens")
            .get();

        const registrations = getRegisteredTokens(tokensSnapshot);

        if (registrations.length === 0) {
            console.log("لا توجد أجهزة مسجلة للاشعارات حالياً");
            return;
        }

        let successCount = 0;
        let failureCount = 0;
        const invalidDocumentIds = [];

        const batches = getChunks(registrations, MAX_TOKENS_PER_REQUEST);

        for (const batch of batches) {
            const response = await messaging.sendEachForMulticast({
                notification: {
                    title: title,
                    body: body
                },
                data: {
                    title: title,
                    body: body,
                    type: notificationType,
                    notificationId: notificationId
                },
                tokens: batch.map((registration) => registration.token)
            });

            successCount += response.successCount || 0;
            failureCount += response.failureCount || 0;

            if (response.responses && response.responses.length) {
                response.responses.forEach((result, index) => {
                    if (result.success) {
                        return;
                    }

                    const reason = result.error && result.error.code;

                    if (
                        reason === "messaging/registration-token-not-registered" ||
                        reason === "messaging/invalid-registration-token"
                    ) {
                        const registration = batch[index];

                        if (registration) {
                            invalidDocumentIds.push(registration.id);
                        }
                    }
                });
            }
        }

        if (invalidDocumentIds.length) {
            await Promise.all(
                invalidDocumentIds.map((documentId) =>
                    db.collection("notificationTokens")
                        .doc(documentId)
                        .delete()
                )
            );
        }

        console.log(
            "تم إرسال الإشعارات:",
            JSON.stringify({
                notificationId: notificationId,
                registeredDevices: registrations.length,
                successCount: successCount,
                failureCount: failureCount,
                removedInvalidTokens: invalidDocumentIds.length
            })
        );
    }
);

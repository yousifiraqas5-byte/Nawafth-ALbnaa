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

exports.sendNotificationToDevices = onDocumentCreated(
    "notifications/{notificationId}",
    async (event) => {
        const data = event.data.data();

        const title = data.title || "إشعار جديد";
        const body = data.body || "تحديث جديد في تطبيق شركة نوافذ البناء";

        // جلب جميع الرموز المسجلة للأجهزة
        const tokensSnapshot = await getFirestore()
            .collection("notificationTokens")
            .get();

        const tokens = tokensSnapshot.docs
            .map((doc) => String(doc.id).trim())
            .filter((token) => token && token.length > 20);

        if (tokens.length === 0) {
            console.log("لا توجد أجهزة مسجلة للاشعارات حالياً");
            return;
        }

        try {
            const response = await getMessaging().sendEachForMulticast({
                notification: {
                    title: title,
                    body: body
                },
                data: {
                    title: title,
                    body: body
                },
                tokens: tokens
            });

            console.log("تم إرسال الإشعارات بنجاح:", response.successCount);

            // حذف الرموز المنتهية أو الخاطئة
            if (response.responses && response.responses.length) {
                response.responses.forEach((resp, index) => {
                    const reason = resp.error && resp.error.code;
                    if (reason === "messaging/registration-token-not-registered" || reason === "messaging/invalid-registration-token") {
                        getFirestore()
                            .collection("notificationTokens")
                            .doc(tokens[index])
                            .delete()
                            .catch(() => {});
                    }
                });
            }
        } catch (error) {
            console.error("خطأ إرسال الإشعارات:", error);
        }
    }
);
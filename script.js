// ============================================================
// شركة نوافذ البناء - script.js
// المشتريات + التقارير اليومية + المهام
// ============================================================

const PURCHASES_COLLECTION = "purchases";
const REPORTS_COLLECTION = "reports";
const TASKS_COLLECTION = "tasks";
const MATERIALS_COLLECTION = "materials";
const NOTIFICATIONS_COLLECTION = "notifications";
const TOKENS_COLLECTION = "notificationTokens";

// مهم: ضع هنا مفتاح VAPID العام من
// Firebase Console > Project settings > Cloud Messaging > Web push certificates
const VAPID_KEY = "BHbv8qWWjW8vpXgOUwauTqEev2HCJSAtpXsOiR9_YRKNWY2LwBXbiZwn_SnIpRNNL0vkvIFM0yVHkBoD-DsCfp4";

// ============================================================
// المتغيرات
// ============================================================

let purchasesCache = [];
let reportsCache = [];
let tasksCache = [];
let materialsCache = [];
let notificationsCache = [];

let currentLocation = "";
let currentMaterialAction = "add";
let notificationsUnsubscribe = null;
let localNotifiedIds = new Set();
let toastTimer = null;

let currentEngineer = "";

// ============================================================
// أسماء المهندسين
// ============================================================

const ENGINEERS = [
    "م. يوسف",
    "م. محمد",
    "م. أحمد",
    "م. بلال",
    "م. حسين",
    "د. إبراهيم",
    "م. نور"
];

// ============================================================
// مواقع الجرد (المخازن + المطبخ)
// ============================================================

const INVENTORY_LOCATIONS = {
    containers: { name: "الحاويات", icon: "🚢", sub: "مخزن الحاويات" },
    hall: { name: "القاعة", icon: "🏭", sub: "مخزن القاعة" },
    building6: { name: "مخزن بناية 6", icon: "🏢", sub: "مخزن بناية 6" },
    kitchen: { name: "المطبخ", icon: "🍽️", sub: "إدارة ومتابعة المطبخ" }
};

// ============================================================
// الحصول على Firebase
// ============================================================

function getFirestoreDB() {

    if (!window.firebaseDb) {

        console.error(
            "Firebase Firestore غير متوفر"
        );

        showMessage(
            "حدث خطأ في الاتصال بقاعدة البيانات",
            "error"
        );

        return null;
    }

    return window.firebaseDb;
}

// ============================================================
// التنقل بين الصفحات
// ============================================================

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(page => {

        page.style.display = "none";

    });

    const page =
        document.getElementById(pageId);

    if (page) {

        page.style.display = "block";

        window.scrollTo(
            0,
            0
        );

    } else {

        console.error(
            "الصفحة غير موجودة:",
            pageId
        );

    }

}

// ============================================================
// الصفحة الرئيسية
// ============================================================

function goHome() {

    showPage("homePage");

}

function openStorage() {

    showPage("storagePage");

}

function openReports() {

    showPage("reportsPage");

    getReports();

}

function openPurchases() {

    showPage("purchasesPage");

    getPurchases();

}

// ============================================================
// رسائل
// ============================================================

function showMessage(
    message,
    type = "success"
) {

    const oldMessage =
        document.getElementById(
            "companyMessage"
        );

    if (oldMessage) {

        oldMessage.remove();

    }

    const messageBox =
        document.createElement(
            "div"
        );

    messageBox.id =
        "companyMessage";

    messageBox.textContent =
        message;

    messageBox.style.position =
        "fixed";

    messageBox.style.top =
        "20px";

    messageBox.style.left =
        "50%";

    messageBox.style.transform =
        "translateX(-50%)";

    messageBox.style.zIndex =
        "99999";

    messageBox.style.padding =
        "14px 24px";

    messageBox.style.borderRadius =
        "12px";

    messageBox.style.color =
        "#fff";

    messageBox.style.fontWeight =
        "bold";

    messageBox.style.fontSize =
        "16px";

    messageBox.style.boxShadow =
        "0 5px 20px rgba(0,0,0,0.25)";

    messageBox.style.direction =
        "rtl";

    messageBox.style.maxWidth =
        "90%";

    messageBox.style.textAlign =
        "center";

    if (type === "error") {

        messageBox.style.background =
            "#d32f2f";

    } else {

        messageBox.style.background =
            "#2e7d32";

    }

    document.body.appendChild(
        messageBox
    );

    setTimeout(
        () => {

            if (
                messageBox &&
                messageBox.parentNode
            ) {

                messageBox.remove();

            }

        },
        4000
    );

}

// ============================================================
// ========================= المشتريات ========================
// ============================================================

function openPurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );

    if (form) {

        form.style.display =
            "block";

    }

}

function closePurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );

    if (form) {

        form.style.display =
            "none";

    }

}

async function getPurchases() {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            getDocs,
            query,
            orderBy
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const q =
            query(
                collection(
                    db,
                    PURCHASES_COLLECTION
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(q);

        purchasesCache = [];

        snapshot.forEach(
            doc => {

                purchasesCache.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );

        renderPurchases();

    } catch (error) {

        console.error(
            "خطأ تحميل المشتريات:",
            error
        );

        try {

            const {
                collection,
                getDocs
            } = await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        PURCHASES_COLLECTION
                    )
                );

            purchasesCache = [];

            snapshot.forEach(
                doc => {

                    purchasesCache.push({

                        id: doc.id,

                        ...doc.data()

                    });

                }
            );

            purchasesCache.sort(
                (a, b) => {

                    const dateA =
                        a.createdAt?.seconds || 0;

                    const dateB =
                        b.createdAt?.seconds || 0;

                    return dateB - dateA;

                }
            );

            renderPurchases();

        } catch (secondError) {

            console.error(
                "خطأ التحميل الثاني:",
                secondError
            );

            showMessage(
                "تعذر تحميل المشتريات",
                "error"
            );

        }

    }

}

async function addPurchase() {

    const itemInput =
        document.getElementById(
            "purchaseItem"
        );

    const unitInput =
        document.getElementById(
            "purchaseUnit"
        );

    const quantityInput =
        document.getElementById(
            "purchaseQuantity"
        );

    if (
        !itemInput ||
        !unitInput ||
        !quantityInput
    ) {

        showMessage(
            "حقول المشتريات غير موجودة",
            "error"
        );

        return;

    }

    const item =
        itemInput.value.trim();

    const unit =
        unitInput.value.trim();

    const quantity =
        quantityInput.value.trim();

    if (
        !item ||
        !unit ||
        !quantity
    ) {

        showMessage(
            "يرجى ملء جميع الحقول",
            "error"
        );

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await addDoc(
            collection(
                db,
                PURCHASES_COLLECTION
            ),
            {

                item: item,

                unit: unit,

                quantity: quantity,

                status: "pending",

                createdAt:
                    serverTimestamp(),

                completedAt: null

            }
        );

        itemInput.value = "";

        unitInput.value = "";

        quantityInput.value = "";

        closePurchaseForm();

        showMessage(
            "تمت إضافة الطلب بنجاح"
        );

        notify(
            "طلب شراء جديد",
            item + " - " + quantity + " " + unit,
            "purchase"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "خطأ إضافة الطلب:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إضافة الطلب: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

function renderPurchases() {

    const pendingContainer =
        document.getElementById(
            "pendingPurchases"
        );

    const completedContainer =
        document.getElementById(
            "completedPurchases"
        );

    const pendingCount =
        document.getElementById(
            "pendingPurchaseCount"
        );

    const completedCount =
        document.getElementById(
            "completedPurchaseCount"
        );

    const pending =
        purchasesCache.filter(
            purchase =>
                purchase.status !==
                "completed"
        );

    const completed =
        purchasesCache.filter(
            purchase =>
                purchase.status ===
                "completed"
        );

    if (pendingCount) {

        pendingCount.textContent =
            pending.length;

    }

    if (completedCount) {

        completedCount.textContent =
            completed.length;

    }

    if (pendingContainer) {

        if (pending.length === 0) {

            pendingContainer.innerHTML = `

                <div class="empty-purchases">

                    <div class="empty-purchases-icon">
                        🛒
                    </div>

                    <strong>
                        لا توجد طلبات شراء
                    </strong>

                    <span>
                        اضغط على "طلب شراء"
                        لإضافة مادة جديدة
                    </span>

                </div>

            `;

        } else {

            pendingContainer.innerHTML =
                pending
                    .map(
                        purchase =>
                            createPurchaseHTML(
                                purchase
                            )
                    )
                    .join("");

        }

    }

    if (completedContainer) {

        if (completed.length === 0) {

            completedContainer.innerHTML = `

                <div class="empty-purchases completed-empty">

                    <div class="empty-purchases-icon">
                        📦
                    </div>

                    <strong>
                        لا توجد مواد مجهزة
                    </strong>

                    <span>
                        الطلبات التي يتم شراؤها
                        ستظهر هنا
                    </span>

                </div>

            `;

        } else {

            completedContainer.innerHTML =
                completed
                    .map(
                        purchase =>
                            createCompletedPurchaseHTML(
                                purchase
                            )
                    )
                    .join("");

        }

    }

}

function createPurchaseHTML(
    purchase
) {

    return `

        <div style="
            background:white;
            border-radius:14px;
            padding:18px;
            margin-bottom:14px;
            box-shadow:0 3px 12px rgba(0,0,0,0.10);
            direction:rtl;
        ">

            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                ${escapeHTML(
                    purchase.item
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                الوحدة:
                ${escapeHTML(
                    purchase.unit
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                العدد:
                ${escapeHTML(
                    purchase.quantity
                )}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:12px;
            ">
                تاريخ الطلب:
                ${formatPurchaseDate(
                    purchase.createdAt
                )}
            </div>

            <button
                onclick="completePurchase('${purchase.id}')"
                style="
                    width:100%;
                    padding:12px;
                    border:0;
                    border-radius:10px;
                    background:#2e7d32;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                تم التجهيز
            </button>

        </div>

    `;

}

function createCompletedPurchaseHTML(
    purchase
) {

    return `

        <div style="
            background:#f1f8f1;
            border-radius:14px;
            padding:18px;
            margin-bottom:14px;
            border:1px solid #c8e6c9;
            direction:rtl;
        ">

            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                ${escapeHTML(
                    purchase.item
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                الوحدة:
                ${escapeHTML(
                    purchase.unit
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                العدد:
                ${escapeHTML(
                    purchase.quantity
                )}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:6px;
            ">
                تاريخ الطلب:
                ${formatPurchaseDate(
                    purchase.createdAt
                )}
            </div>

            <div style="
                color:#2e7d32;
                font-size:13px;
                margin-bottom:12px;
            ">
                تاريخ التجهيز:
                ${formatPurchaseDate(
                    purchase.completedAt
                )}
            </div>

            <button
                onclick="returnPurchase('${purchase.id}')"
                style="
                    width:100%;
                    padding:10px;
                    border:0;
                    border-radius:10px;
                    background:#777;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                إرجاع للطلبات
            </button>

        </div>

    `;

}

async function completePurchase(id) {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                PURCHASES_COLLECTION,
                id
            ),
            {

                status: "completed",

                completedAt:
                    serverTimestamp()

            }
        );

        const purchase = purchasesCache.find(p => p.id === id);

        notify(
            "تم تجهيز طلب",
            "تم شراء وتجهيز: " + (purchase ? purchase.item : ""),
            "purchase"
        );

        showMessage(
            "تم نقل الطلب إلى تم تجهيزه"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "خطأ تحديث الطلب:",
            error
        );

        showMessage(
            "حدث خطأ أثناء تحديث الطلب",
            "error"
        );

    }

}

async function returnPurchase(id) {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                PURCHASES_COLLECTION,
                id
            ),
            {

                status: "pending",

                completedAt: null

            }
        );

        showMessage(
            "تم إرجاع الطلب"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "خطأ إرجاع الطلب:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إرجاع الطلب",
            "error"
        );

    }

}

function formatPurchaseDate(
    timestamp
) {

    if (!timestamp) {

        return "-";

    }

    try {

        let date;

        if (
            timestamp.toDate
        ) {

            date =
                timestamp.toDate();

        } else if (
            timestamp.seconds
        ) {

            date =
                new Date(
                    timestamp.seconds * 1000
                );

        } else {

            date =
                new Date(timestamp);

        }

        return date.toLocaleString(
            "ar-IQ",
            {

                year: "numeric",

                month: "2-digit",

                day: "2-digit",

                hour: "2-digit",

                minute: "2-digit"

            }
        );

    } catch (error) {

        return "-";

    }

}

// ============================================================
// ==================== المخازن والمطبخ (الجرد) ===============
// ============================================================

function openWarehouse(locationKey) {
    showInventory(locationKey);
}

function openKitchen() {
    showInventory("kitchen");
}

function showInventory(locationKey) {
    if (!INVENTORY_LOCATIONS[locationKey]) {
        showMessage("المكان غير موجود", "error");
        return;
    }

    currentLocation = locationKey;
    currentMaterialAction = "add";

    const location = INVENTORY_LOCATIONS[locationKey];

    showPage("inventoryPage");

    const title = document.getElementById("inventoryPageTitle");
    if (title) title.textContent = location.name;

    const sub = document.getElementById("inventoryPageSub");
    if (sub) sub.textContent = location.sub;

    const icon = document.getElementById("inventoryPageIcon");
    if (icon) icon.textContent = location.icon;

    const backButton = document.getElementById("inventoryBackButton");
    if (backButton) {
        if (locationKey === "kitchen") {
            backButton.textContent = "→ الرئيسية";
            backButton.setAttribute("onclick", "goHome()");
        } else {
            backButton.textContent = "→ المخازن";
            backButton.setAttribute("onclick", "openStorage()");
        }
    }

    closeMaterialForm();

    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("materialDate");
    if (dateInput) dateInput.value = today;

    getMaterials();
}

function openMaterialForm(actionType) {
    if (!currentLocation) {
        showMessage("اختر المخزن أو المطبخ أولاً", "error");
        return;
    }

    currentMaterialAction = actionType === "withdraw" ? "withdraw" : "add";

    const form = document.getElementById("materialForm");
    if (form) form.style.display = "block";

    const title = document.getElementById("materialFormTitle");
    if (title) {
        title.textContent = currentMaterialAction === "withdraw" ? "سحب مادة" : "إضافة مادة";
    }

    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("materialDate");
    if (dateInput) dateInput.value = today;

    const itemInput = document.getElementById("materialItem");
    if (itemInput) itemInput.focus();
}

function closeMaterialForm() {
    const form = document.getElementById("materialForm");
    if (form) form.style.display = "none";
}

async function getMaterials() {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const snapshot = await getDocs(collection(db, MATERIALS_COLLECTION));

        materialsCache = [];

        snapshot.forEach(doc => {
            materialsCache.push({
                id: doc.id,
                ...doc.data()
            });
        });

        materialsCache.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        renderInventory();

    } catch (error) {
        console.error("خطأ تحميل المواد:", error);
        showMessage("تعذر تحميل المواد", "error");
    }
}

async function saveMaterial() {
    const itemInput = document.getElementById("materialItem");
    const unitInput = document.getElementById("materialUnit");
    const quantityInput = document.getElementById("materialQuantity");
    const dateInput = document.getElementById("materialDate");
    const notesInput = document.getElementById("materialNotes");

    if (!itemInput || !unitInput || !quantityInput || !dateInput || !notesInput) {
        showMessage("حقول المواد غير موجودة", "error");
        return;
    }

    const item = itemInput.value.trim();
    const unit = unitInput.value.trim();
    const quantity = quantityInput.value.trim();
    const actionDate = dateInput.value;
    const notes = notesInput.value.trim();

    if (!item || !unit || !quantity || !actionDate) {
        showMessage("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    if (parseFloat(quantity) <= 0) {
        showMessage("الكمية يجب أن تكون أكبر من صفر", "error");
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        await addDoc(collection(db, MATERIALS_COLLECTION), {
            location: currentLocation,
            item: item,
            unit: unit,
            quantity: quantity,
            actionType: currentMaterialAction,
            actionDate: actionDate,
            notes: notes,
            createdAt: serverTimestamp()
        });

        const locationName = INVENTORY_LOCATIONS[currentLocation]?.name || "المكان";
        const isWithdraw = currentMaterialAction === "withdraw";

        notify(
            isWithdraw ? "سحب مادة" : "إضافة مادة",
            locationName + ": " + item + " - " + (isWithdraw ? "-" : "+") + quantity + " " + unit,
            "material"
        );

        itemInput.value = "";
        unitInput.value = "";
        quantityInput.value = "";
        notesInput.value = "";

        closeMaterialForm();

        showMessage("تم حفظ العملية بنجاح");

        await getMaterials();

    } catch (error) {
        console.error("خطأ حفظ المادة:", error);
        showMessage("حدث خطأ أثناء حفظ العملية: " + (error.code || error.message || "خطأ غير معروف"), "error");
    }
}

async function deleteMaterial(id) {
    if (!confirm("هل تريد حذف هذه الحركة؟")) {
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        await deleteDoc(doc(db, MATERIALS_COLLECTION, id));

        showMessage("تم حذف الحركة");

        await getMaterials();

    } catch (error) {
        console.error("خطأ حذف المادة:", error);
        showMessage("حدث خطأ أثناء حذف الحركة", "error");
    }
}

function renderInventory() {
    const movements = materialsCache.filter(m => m.location === currentLocation);

    renderStockSummary(movements);
    renderMaterialsTable(movements);
}

function formatQuantity(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return "-";
    return String(Math.round(num * 100) / 100);
}

function renderStockSummary(movements) {
    const container = document.getElementById("stockSummary");
    if (!container) return;

    const stockMap = {};

    movements.forEach(m => {
        const key = (m.item || "").trim() + "|" + (m.unit || "").trim();
        if (!stockMap[key]) {
            stockMap[key] = { item: m.item, unit: m.unit, added: 0, withdrawn: 0 };
        }
        const qty = parseFloat(m.quantity) || 0;
        if (m.actionType === "withdraw") {
            stockMap[key].withdrawn += qty;
        } else {
            stockMap[key].added += qty;
        }
    });

    const entries = Object.values(stockMap);

    if (entries.length === 0) {
        container.innerHTML = "";
        return;
    }

    let rows = "";

    entries.forEach(item => {
        const balance = item.added - item.withdrawn;
        const balanceClass = balance > 0 ? "balance-positive" : (balance === 0 ? "balance-zero" : "balance-negative");
        rows += `
            <tr>
                <td class="td-item">${escapeHTML(item.item)}</td>
                <td>${escapeHTML(item.unit)}</td>
                <td>${formatQuantity(item.added)}</td>
                <td>${formatQuantity(item.withdrawn)}</td>
                <td class="${balanceClass}">${formatQuantity(balance)}</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="stock-summary-card">
            <div class="stock-summary-header">
                <h3>📦 الرصيد الحالي</h3>
                <span class="stock-badge">${entries.length}</span>
            </div>
            <div class="materials-table-wrap">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>المادة</th>
                            <th>الوحدة</th>
                            <th>المضاف</th>
                            <th>المسحوب</th>
                            <th>الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function formatMaterialDate(timestamp) {
    if (!timestamp) return "-";
    try {
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    } catch (error) {
        return "-";
    }
}

function renderMaterialsTable(movements) {
    const container = document.getElementById("materialsTableWrap");
    if (!container) return;

    if (movements.length === 0) {
        container.innerHTML = `
            <div class="empty-materials">
                <div class="empty-materials-icon">📦</div>
                <strong>لا توجد حركات بعد</strong>
                <span>استخدم "إضافة مادة" أو "سحب مادة" لتسجيل أول حركة</span>
            </div>
        `;
        return;
    }

    let rows = "";

    movements.forEach(m => {
        const isWithdraw = m.actionType === "withdraw";
        const badgeClass = isWithdraw ? "operation-withdraw" : "operation-add";
        const badgeText = isWithdraw ? "سحب" : "إضافة";
        const qtyClass = isWithdraw ? "qty-withdraw" : "qty-add";
        const qtySign = isWithdraw ? "-" : "+";

        rows += `
            <tr>
                <td class="td-item">${escapeHTML(m.item)}</td>
                <td>${escapeHTML(m.unit)}</td>
                <td><span class="operation-badge ${badgeClass}">${badgeText}</span></td>
                <td class="${qtyClass}">${qtySign}${formatQuantity(m.quantity)}</td>
                <td>${escapeHTML(m.actionDate || formatMaterialDate(m.createdAt))}</td>
                <td>
                    <button
                        type="button"
                        class="delete-material-button"
                        onclick="deleteMaterial('${m.id}')"
                    >حذف</button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>المادة</th>
                    <th>الوحدة</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th>تاريخ العملية</th>
                    <th>خيارات</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// ============================================================
// ========================= التقارير =========================
// ============================================================

async function getReports() {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    REPORTS_COLLECTION
                )
            );

        reportsCache = [];

        snapshot.forEach(
            doc => {

                reportsCache.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );

        reportsCache.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds || 0;

                const dateB =
                    b.createdAt?.seconds || 0;

                return dateB - dateA;

            }
        );

        renderReports();

    } catch (error) {

        console.error(
            "خطأ تحميل التقارير:",
            error
        );

        showMessage(
            "تعذر تحميل التقارير",
            "error"
        );

    }

}

function openAddReport() {

    showPage(
        "addReportPage"
    );

    prepareReportForm();

}

function prepareReportForm() {

    const dateInput =
        document.getElementById(
            "reportDate"
        );

    if (!dateInput) return;

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    dateInput.value =
        today;

    updateDayFromDate();

}

function updateDayFromDate() {

    const dateInput =
        document.getElementById(
            "reportDate"
        );

    const dayInput =
        document.getElementById(
            "reportDay"
        );

    if (
        !dateInput ||
        !dayInput
    ) return;

    if (!dateInput.value) {

        dayInput.value = "";

        return;

    }

    const date =
        new Date(
            dateInput.value +
            "T00:00:00"
        );

    const days = [

        "الأحد",

        "الاثنين",

        "الثلاثاء",

        "الأربعاء",

        "الخميس",

        "الجمعة",

        "السبت"

    ];

    dayInput.value =
        days[
            date.getDay()
        ];

}

async function saveReport() {

    const dateInput =
        document.getElementById(
            "reportDate"
        );

    const dayInput =
        document.getElementById(
            "reportDay"
        );

    const textInput =
        document.getElementById(
            "reportText"
        );

    if (
        !dateInput ||
        !dayInput ||
        !textInput
    ) {

        showMessage(
            "حقول التقرير غير موجودة",
            "error"
        );

        return;

    }

    const date =
        dateInput.value;

    const day =
        dayInput.value;

    const text =
        textInput.value.trim();

    if (
        !date ||
        !day ||
        !text
    ) {

        showMessage(
            "يرجى ملء جميع بيانات التقرير",
            "error"
        );

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await addDoc(
            collection(
                db,
                REPORTS_COLLECTION
            ),
            {

                date: date,

                day: day,

                text: text,

                createdAt:
                    serverTimestamp()

            }
        );

        textInput.value = "";

        showMessage(
            "تم حفظ التقرير بنجاح"
        );

        notify(
            "تقرير يومي جديد",
            "تم تسجيل تقرير يوم " + day + " - " + date,
            "report"
        );

        openReports();

    } catch (error) {

        console.error(
            "خطأ حفظ التقرير:",
            error
        );

        showMessage(
            "حدث خطأ أثناء حفظ التقرير: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

function renderReports() {
    const container = document.getElementById("reportsList");
    if (!container) return;

    renderReportSummary();

    if (reportsCache.length === 0) {
        container.innerHTML = `
            <div class="empty-reports">
                <div class="empty-reports-icon">📋</div>
                <strong>لا توجد تقارير حالياً</strong>
                <span>اضغط على "إضافة تقرير" لإنشاء أول تقرير</span>
            </div>
        `;
        return;
    }

    let html = "";

    reportsCache.forEach((report, index) => {
        html += createReportHTML(report, index);
    });

    container.innerHTML = html;
}

function renderReportSummary() {
    const container = document.getElementById("reportsList");
    if (!container) return;

    const existing = container.querySelector(".report-summary");
    if (existing) existing.remove();

    const today = new Date().toISOString().split("T")[0];
    const todayCount = reportsCache.filter(r => r.date === today).length;

    const summary = document.createElement("div");
    summary.className = "report-summary";
    summary.innerHTML = `
        <div class="report-stat-box">
            <div class="report-stat-icon">📋</div>
            <div class="report-stat-text">
                <strong>${reportsCache.length}</strong>
                <span>إجمالي التقارير</span>
            </div>
        </div>
        <div class="report-stat-box">
            <div class="report-stat-icon">📅</div>
            <div class="report-stat-text">
                <strong>${todayCount}</strong>
                <span>تقارير اليوم</span>
            </div>
        </div>
    `;

    container.prepend(summary);
}

function createReportHTML(report, index) {
    const reportNumber = reportsCache.length - index;

    return `
        <div class="report-card">
            <div class="report-card-header">
                <div class="report-date-box">
                    <div class="report-date-icon">📋</div>
                    <div class="report-date-text">
                        <strong>${escapeHTML(report.day)}</strong>
                        <span>${escapeHTML(report.date)}</span>
                    </div>
                </div>
                <button
                    type="button"
                    class="delete-report-button"
                    onclick="deleteReport('${report.id}')"
                    aria-label="حذف التقرير"
                >حذف</button>
            </div>
            <div class="report-body">
                <div class="report-body-title">تفاصيل التقرير</div>
                <div class="report-body-text">${escapeHTML(report.text)}</div>
            </div>
            <div class="report-card-footer">
                <span class="report-time">⏰ ${formatPurchaseDate(report.createdAt)}</span>
                <span class="report-time">رقم التقرير ${reportNumber}</span>
            </div>
        </div>
    `;
}

function formatDate(timestamp) {

    return formatPurchaseDate(
        timestamp
    );

}

async function deleteReport(id) {

    if (
        !confirm(
            "هل تريد حذف التقرير؟"
        )
    ) {

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            deleteDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await deleteDoc(
            doc(
                db,
                REPORTS_COLLECTION,
                id
            )
        );

        showMessage(
            "تم حذف التقرير"
        );

        await getReports();

    } catch (error) {

        console.error(
            "خطأ حذف التقرير:",
            error
        );

        showMessage(
            "حدث خطأ أثناء حذف التقرير",
            "error"
        );

    }

}

// ============================================================
// ========================= الإشعارات ========================
// ============================================================

function openNotifications() {
    showPage("notificationsPage");
    getNotifications();
}

async function getNotifications() {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, getDocs, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const snapshot = await getDocs(q);

        notificationsCache = [];

        snapshot.forEach(doc => {
            notificationsCache.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderNotifications();
        updateNotificationBadge();

    } catch (error) {
        console.error("خطأ تحميل الإشعارات:", error);
    }
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (notificationsCache.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-notifications-icon">🔔</div>
                <strong>لا توجد إشعارات بعد</strong>
                <span>ستظهر هنا التحديثات فور حدوثها</span>
            </div>
        `;
        return;
    }

    let html = "";

    notificationsCache.forEach(n => {
        const icon = getNotificationIcon(n.type);
        html += `
            <div class="notification-card">
                <div class="notification-icon">${icon}</div>
                <div class="notification-info">
                    <h4>${escapeHTML(n.title)}</h4>
                    <p>${escapeHTML(n.body)}</p>
                    <span class="notification-time">${formatNotificationTime(n.createdAt)}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getNotificationIcon(type) {
    if (type === "report") return "📋";
    if (type === "task") return "✅";
    if (type === "purchase") return "🛒";
    if (type === "material") return "📦";
    return "🔔";
}

function formatNotificationTime(timestamp) {
    if (!timestamp) return "";
    try {
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleString("ar-IQ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (error) {
        return "";
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    const count = notificationsCache.length;
    badge.textContent = count > 99 ? "99+" : count;
}
async function notify(title, body, type = "general") {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        // حفظ الإشعار داخل Firestore
        const ref = await addDoc(
            collection(db, NOTIFICATIONS_COLLECTION),
            {
                title: title,
                body: body,
                type: type,
                createdAt: serverTimestamp()
            }
        );

        localNotifiedIds.add(ref.id);

        // إظهار الإشعار داخل التطبيق
        showToast(title, body);

        if (notificationsCache.length > 0) {
            notificationsCache.unshift({
                id: ref.id,
                title: title,
                body: body,
                type: type
            });

            updateNotificationBadge();
        }

        // إرسال Push فقط لإشعارات المهام

      if (type === "task") {
    console.log("🔥 TASK PUSH START:", {
        title: title,
        body: body,
        type: type
    });

    try {
        console.log("📡 CALLING WORKER...");

        const response = await fetch(
            "https://nawafth-notifications.yousifiraqas5.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    body: body
                })
            }
        );

        console.log("📡 WORKER HTTP STATUS:", response.status);

        const result = await response.json();

        console.log("📦 WORKER RESULT:", result);

        if (!response.ok || !result.ok) {
            console.error(
                "❌ فشل إرسال Push:",
                result
            );
        } else {
            console.log(
                "✅ تم إرسال Push:",
                result
            );
        }

    } catch (pushError) {
        console.error(
            "❌ خطأ الاتصال بـ Cloudflare Worker:",
            pushError
        );
    }
}
        return ref.id;

    } catch (error) {
        console.error(
            "خطأ إرسال الإشعار:",
            error
        );

        return null;
    }
}
function showToast(title, body) {
    const oldToasts = document.querySelectorAll(".toast-message");
    oldToasts.forEach(t => t.remove());

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    const toast = document.createElement("div");
    toast.className = "toast-message";

    toast.innerHTML = `
        <div class="toast-icon">🔔</div>
        <div class="toast-content">
            <h4 class="toast-title">${escapeHTML(title)}</h4>
            <p class="toast-body">${escapeHTML(body)}</p>
        </div>
        <button type="button" class="toast-close" aria-label="إغلاق">×</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.remove();
    });

    document.body.appendChild(toast);

    toastTimer = setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 6000);
}

function startNotificationsListener() {
    const db = getFirestoreDB();
    if (!db) return;

    if (notificationsUnsubscribe) {
        return;
    }

    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js")
        .then(({ collection, query, orderBy, limit, onSnapshot }) => {
            const q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                orderBy("createdAt", "desc"),
                limit(50)
            );

            notificationsUnsubscribe = onSnapshot(q, snapshot => {
                const docs = [];

                snapshot.forEach(doc => {
                    docs.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                const newItems = docs.filter(d => !notificationsCache.some(c => c.id === d.id));

                notificationsCache = docs;

                renderNotifications();
                updateNotificationBadge();

                newItems.forEach(d => {
                    if (!localNotifiedIds.has(d.id)) {
                        showToast(d.title || "إشعار جديد", d.body || "");
                    }
                });
            });
        })
        .catch(error => {
            console.error("خطأ بدء مستمع الإشعارات:", error);
        });
}

async function setupMessagingForeground() {
    if (!window.firebaseApp) return;

    try {
        const { getMessaging, onMessage } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js");

        const messaging = getMessaging(window.firebaseApp);
        window.firebaseMessaging = messaging;

        onMessage(messaging, payload => {
            const title = payload.notification?.title || payload.data?.title || "إشعار جديد";
            const body = payload.notification?.body || payload.data?.body || "تحديث جديد من شركة نوافذ البناء";
            showToast(title, body);
        });

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("firebase-messaging-sw.js").catch(() => {});
        }
    } catch (error) {
        console.error("خطأ إعداد استقبال الإشعارات:", error);
    }
}

async function enablePushNotifications() {
    if (!("Notification" in window)) {
        showMessage("المتصفح لا يدعم الإشعارات", "error");
        return;
    }

    if (Notification.permission === "denied") {
        showMessage("تم رفض إذن الإشعارات، قم بالسماح من إعدادات الموقع", "error");
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            showMessage("يرجى السماح بالإشعارات من إعدادات الموقع", "error");
            return;
        }
    } catch (error) {
        console.error("طلب إذن الإشعارات:", error);
        showMessage("يرجى السماح بالإشعارات من إعدادات الموقع", "error");
        return;
    }

    if (VAPID_KEY === "YOUR_VAPID_PUBLIC_KEY") {
        showMessage("يرجى إضافة مفتاح VAPID في ملف script.js أولاً", "error");
        return;
    }

    try {
        const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js");
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const messaging = getMessaging(window.firebaseApp);
        window.firebaseMessaging = messaging;

        const registration = await navigator.serviceWorker.register("firebase-messaging-sw.js");

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (!token) {
            showMessage("تعذر الحصول على رمز الإشعار", "error");
            return;
        }

        const db = getFirestoreDB();
        if (!db) return;

        await setDoc(doc(db, TOKENS_COLLECTION, token), {
            token: token,
            createdAt: serverTimestamp(),
            userAgent: navigator.userAgent
        });

        showMessage("تم تفعيل الإشعارات بنجاح 🔔");

    } catch (error) {
        console.error("خطأ تفعيل الإشعارات:", error);
        showMessage("حدث خطأ أثناء تفعيل الإشعارات: " + (error.message || "خطأ غير معروف"), "error");
    }
}

// ============================================================
// =========================== المهام ==========================
// ============================================================

// مهم:
// واجهة المهام موجودة مسبقاً في index.html.
// لا ننشئ نسخة ثانية من المهام هنا.

function createTasksInterface() {

    // لا شيء
    // صفحات المهام موجودة أصلاً في index.html.

}

// ============================================================
// فتح صفحة المهام
// ============================================================

async function openTasks() {

    showPage(
        "tasksPage"
    );

    renderEngineers();

    await loadTasksCache();

    updateEngineerStats();

}

// ============================================================
// عرض المهندسين
// ============================================================

function renderEngineers() {

    const container =
        document.querySelector(
            "#tasksPage .engineers-grid"
        );

    if (!container) {

        console.error(
            "قسم المهندسين غير موجود في index.html"
        );

        return;

    }

    // المهندسون موجودون أصلاً في index.html
    // لذلك لا نضيف بطاقات جديدة.

}

// ============================================================
// إحصائيات المهام لكل مهندس
// ============================================================

function updateEngineerStats() {

    const cards =
        document.querySelectorAll(
            ".engineer-card[data-engineer]"
        );

    cards.forEach(
        card => {

            const engineer =
                card.getAttribute(
                    "data-engineer"
                );

            const added =
                tasksCache.filter(
                    task =>
                        task.engineer ===
                        engineer
                ).length;

            const done =
                tasksCache.filter(
                    task =>
                        task.engineer ===
                        engineer &&
                        task.status ===
                        "completed"
                ).length;

            const addedEl =
                card.querySelector(
                    ".engineer-added-count"
                );

            if (addedEl) {
                addedEl.textContent =
                    added;
            }

            const doneEl =
                card.querySelector(
                    ".engineer-done-count"
                );

            if (doneEl) {
                doneEl.textContent =
                    done;
            }

        }
    );

}

// ============================================================
// فتح مهام المهندس
// ============================================================

async function openEngineerTasks(
    engineerName
) {

    currentEngineer =
        engineerName;

    showPage(
        "engineerTasksPage"
    );

    const title =
        document.getElementById(
            "selectedEngineerName"
        );

    if (title) {

        title.textContent =
            engineerName;

    }

    const formEngineer =
        document.getElementById(
            "taskFormEngineer"
        );

    if (formEngineer) {

        formEngineer.textContent =
            "المهمة للمهندس: " +
            engineerName;

    }

    closeTaskForm();

    await getTasks();

}

// ============================================================
// فتح نموذج المهمة
// ============================================================

function openTaskForm() {

    if (!currentEngineer) {

        showMessage(
            "يرجى اختيار المهندس أولاً",
            "error"
        );

        return;

    }

    const form =
        document.getElementById(
            "taskForm"
        );

    if (form) {

        form.style.display =
            "block";

    }

    const input =
        document.getElementById(
            "taskText"
        );

    if (input) {

        input.focus();

    }

}

// ============================================================
// إغلاق نموذج المهمة
// ============================================================

function closeTaskForm() {

    const form =
        document.getElementById(
            "taskForm"
        );

    if (form) {

        form.style.display =
            "none";

    }

}

// ============================================================
// جلب المهام من Firebase
// ============================================================

async function loadTasksCache() {

    const db =
        getFirestoreDB();

    if (!db) return false;

    try {

        const {
            collection,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    TASKS_COLLECTION
                )
            );

        tasksCache = [];

        snapshot.forEach(
            doc => {

                tasksCache.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );

        tasksCache.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds || 0;

                const dateB =
                    b.createdAt?.seconds || 0;

                return dateB - dateA;

            }
        );

        return true;

    } catch (error) {

        console.error(
            "خطأ تحميل المهام:",
            error
        );

        showMessage(
            "تعذر تحميل المهام: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

        return false;

    }

}

async function getTasks() {

    const ok =
        await loadTasksCache();

    if (!ok) return;

    renderEngineerTasks();

}

// ============================================================
// إضافة مهمة
// ============================================================

async function addTask() {

    const input =
        document.getElementById(
            "taskText"
        );

    if (!input) {

        showMessage(
            "حقل المهمة غير موجود",
            "error"
        );

        return;

    }

    const text =
        input.value.trim();

    if (!text) {

        showMessage(
            "اكتب المهمة أولاً",
            "error"
        );

        return;

    }

    if (!currentEngineer) {

        showMessage(
            "لم يتم تحديد المهندس",
            "error"
        );

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await addDoc(
            collection(
                db,
                TASKS_COLLECTION
            ),
            {

                engineer:
                    currentEngineer,

                text:
                    text,

                status:
                    "pending",

                createdAt:
                    serverTimestamp(),

                completedAt:
                    null

            }
        );

        input.value = "";

        closeTaskForm();

        showMessage(
            "تمت إضافة المهمة بنجاح"
        );

        notify(
            "مهمة جديدة",
            "تمت إضافة مهمة للمهندس " + currentEngineer + ": " + text,
            "task"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إضافة المهمة:",
            error
        );

        console.error(
            "Firebase error code:",
            error.code
        );

        console.error(
            "Firebase error message:",
            error.message
        );

        let errorMessage =
            "حدث خطأ أثناء إضافة المهمة";

        if (
            error.code ===
            "permission-denied"
        ) {

            errorMessage =
                "Firebase رفض حفظ المهمة بسبب الصلاحيات";

        } else if (
            error.code ===
            "unauthenticated"
        ) {

            errorMessage =
                "يجب تسجيل الدخول إلى Firebase";

        } else if (
            error.code ===
            "failed-precondition"
        ) {

            errorMessage =
                "Firebase يحتاج إلى إعداد إضافي";

        } else if (
            error.message
        ) {

            errorMessage =
                "فشل حفظ المهمة: " +
                error.message;

        }

        showMessage(
            errorMessage,
            "error"
        );

    }

}

// ============================================================
// عرض مهام المهندس
// ============================================================

function renderEngineerTasks() {

    const pendingContainer =
        document.getElementById(
            "pendingTasks"
        );

    const completedContainer =
        document.getElementById(
            "completedTasks"
        );

    if (
        !pendingContainer ||
        !completedContainer
    ) {

        console.error(
            "عناصر المهام غير موجودة في index.html"
        );

        return;

    }

    const engineerTasks =
        tasksCache.filter(
            task =>
                task.engineer ===
                currentEngineer
        );

    const pending =
        engineerTasks.filter(
            task =>
                task.status !==
                "completed"
        );

    const completed =
        engineerTasks.filter(
            task =>
                task.status ===
                "completed"
        );

    // ========================================================
    // المهام الحالية
    // ========================================================

    if (
        pending.length === 0
    ) {

        pendingContainer.innerHTML = `

            <div class="empty-tasks">

                <div class="empty-tasks-icon">
                    📋
                </div>

                <strong>
                    لا توجد مهام حالياً
                </strong>

                <p>
                    اضغط على إضافة مهمة
                    لإنشاء مهمة جديدة
                </p>

            </div>

        `;

    } else {

        pendingContainer.innerHTML =
            pending
                .map(
                    task =>
                        createTaskHTML(
                            task
                        )
                )
                .join("");

    }

    const pendingCount =
        document.getElementById(
            "pendingTaskCount"
        );

    if (pendingCount) {

        pendingCount.textContent =
            pending.length;

    }

    // ========================================================
    // المهام المنجزة
    // ========================================================

    if (
        completed.length === 0
    ) {

        completedContainer.innerHTML = `

            <div class="empty-tasks">

                <div class="empty-tasks-icon">
                    ✅
                </div>

                <strong>
                    لا توجد مهام منجزة
                </strong>

                <p>
                    المهام المكتملة ستظهر هنا
                </p>

            </div>

        `;

    } else {

        completedContainer.innerHTML =
            completed
                .map(
                    task =>
                        createCompletedTaskHTML(
                            task
                        )
                )
                .join("");

    }

    const completedCount =
        document.getElementById(
            "completedTaskCount"
        );

    if (completedCount) {

        completedCount.textContent =
            completed.length;

    }

}

// ============================================================
// شكل المهمة الحالية
// ============================================================

function createTaskHTML(
    task
) {

    return `

        <div class="task-card">

            <div class="task-card-main">

                <div class="task-card-icon">
                    📋
                </div>

                <div class="task-card-info">

                    <h4>
                        ${escapeHTML(
                            task.text
                        )}
                    </h4>

                    <div class="task-date">

                        تاريخ الإضافة:
                        ${formatPurchaseDate(
                            task.createdAt
                        )}

                    </div>

                </div>

            </div>

            <button
                type="button"
                class="complete-task-button"
                onclick="completeTask('${task.id}')"
            >
                ✓ تم الإنجاز
            </button>

        </div>

    `;

}

// ============================================================
// شكل المهمة المنجزة
// ============================================================

function createCompletedTaskHTML(
    task
) {

    return `

        <div class="task-card completed-task">

            <div class="task-card-main">

                <div class="task-card-icon">
                    ✅
                </div>

                <div class="task-card-info">

                    <h4>
                        ${escapeHTML(
                            task.text
                        )}
                    </h4>

                    <div class="task-date">

                        تم الإنجاز:
                        ${formatPurchaseDate(
                            task.completedAt
                        )}

                    </div>

                </div>

            </div>

            <button
                type="button"
                class="return-task-button"
                onclick="returnTask('${task.id}')"
            >
                إرجاع للمهمات
            </button>

        </div>

    `;

}

// ============================================================
// إنجاز المهمة
// ============================================================

async function completeTask(
    id
) {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                TASKS_COLLECTION,
                id
            ),
            {

                status:
                    "completed",

                completedAt:
                    serverTimestamp()

            }
        );

        const task = tasksCache.find(t => t.id === id);

        notify(
            "تم إنجاز مهمة",
            "أنجز " + (task ? task.engineer : "") + ": " + (task ? task.text : ""),
            "task"
        );

        showMessage(
            "تم نقل المهمة إلى المنجزة"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إنجاز المهمة:",
            error
        );

        showMessage(
            "حدث خطأ أثناء تحديث المهمة: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

// ============================================================
// إرجاع المهمة من المنجزة
// ============================================================

async function returnTask(
    id
) {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                TASKS_COLLECTION,
                id
            ),
            {

                status:
                    "pending",

                completedAt:
                    null

            }
        );

        showMessage(
            "تم إرجاع المهمة"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إرجاع المهمة:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إرجاع المهمة: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

// ============================================================
// حماية HTML
// ============================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

// ============================================================
// تهيئة التطبيق
// ============================================================

function initializeCompanyApp() {

    console.log(
        "script.js loaded successfully"
    );

    console.log(
        "شركة نوافذ البناء - التطبيق بدأ"
    );

    startNotificationsListener();

    setupMessagingForeground();

    getNotifications();

}

// ============================================================
// منع بعض مشاكل اللمس
// ============================================================

document.addEventListener(
    "touchstart",
    function () {},
    {
        passive: true
    }
);

// ============================================================
// بدء التطبيق
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCompanyApp
    );

} else {

    initializeCompanyApp();

}

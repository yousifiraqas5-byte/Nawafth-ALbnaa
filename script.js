// ============================================================
// شركة نوافذ البناء - script.js
// المشتريات + التقارير اليومية + المهام
// ============================================================

const PURCHASES_COLLECTION = "purchases";
const REPORTS_COLLECTION = "reports";
const TASKS_COLLECTION = "tasks";

// ============================================================
// المتغيرات
// ============================================================

let purchasesCache = [];
let reportsCache = [];
let tasksCache = [];

let currentEngineer = "";

// ============================================================
// أسماء المهندسين
// ============================================================

const ENGINEERS = [
    "م.يوسف",
    "م.محمد",
    "م.احمد",
    "م.بلال",
    "م.حسين",
    "د.ابراهيم",
    "م.نور"
];

// ============================================================
// الحصول على Firebase
// ============================================================

function getFirestoreDB() {
    if (!window.firebaseDb) {
        console.error("Firebase Firestore غير متوفر");
        alert("حدث خطأ في الاتصال بقاعدة البيانات");
        return null;
    }

    return window.firebaseDb;
}

// ============================================================
// التنقل بين الصفحات
// ============================================================

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.style.display = "none";
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.style.display = "block";
        window.scrollTo(0, 0);
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

function showMessage(message, type = "success") {

    const oldMessage = document.getElementById("companyMessage");

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox = document.createElement("div");

    messageBox.id = "companyMessage";

    messageBox.innerHTML = message;

    messageBox.style.position = "fixed";
    messageBox.style.top = "20px";
    messageBox.style.left = "50%";
    messageBox.style.transform = "translateX(-50%)";
    messageBox.style.zIndex = "99999";
    messageBox.style.padding = "14px 24px";
    messageBox.style.borderRadius = "12px";
    messageBox.style.color = "#fff";
    messageBox.style.fontWeight = "bold";
    messageBox.style.fontSize = "16px";
    messageBox.style.boxShadow = "0 5px 20px rgba(0,0,0,0.25)";
    messageBox.style.direction = "rtl";

    if (type === "error") {
        messageBox.style.background = "#d32f2f";
    } else {
        messageBox.style.background = "#2e7d32";
    }

    document.body.appendChild(messageBox);

    setTimeout(() => {

        if (messageBox) {
            messageBox.remove();
        }

    }, 3000);
}

// ============================================================
// ========================= المشتريات ========================
// ============================================================

function openPurchaseForm() {

    const form = document.getElementById("purchaseForm");

    if (form) {
        form.style.display = "block";
    }

}

function closePurchaseForm() {

    const form = document.getElementById("purchaseForm");

    if (form) {
        form.style.display = "none";
    }

}

async function getPurchases() {

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { collection, getDocs, query, orderBy } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        const q = query(
            collection(db, PURCHASES_COLLECTION),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        purchasesCache = [];

        snapshot.forEach(doc => {

            purchasesCache.push({
                id: doc.id,
                ...doc.data()
            });

        });

        renderPurchases();

    } catch (error) {

        console.error("خطأ تحميل المشتريات:", error);

        try {

            const { collection, getDocs } =
                await import(
                    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
                );

            const snapshot = await getDocs(
                collection(db, PURCHASES_COLLECTION)
            );

            purchasesCache = [];

            snapshot.forEach(doc => {

                purchasesCache.push({
                    id: doc.id,
                    ...doc.data()
                });

            });

            purchasesCache.sort((a, b) => {

                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;

                return dateB - dateA;

            });

            renderPurchases();

        } catch (secondError) {

            console.error(secondError);

            showMessage(
                "تعذر تحميل المشتريات",
                "error"
            );

        }

    }

}

async function addPurchase() {

    const itemInput = document.getElementById("purchaseItem");
    const unitInput = document.getElementById("purchaseUnit");
    const quantityInput = document.getElementById("purchaseQuantity");

    if (!itemInput || !unitInput || !quantityInput) {

        showMessage(
            "حقول المشتريات غير موجودة",
            "error"
        );

        return;
    }

    const item = itemInput.value.trim();
    const unit = unitInput.value.trim();
    const quantity = quantityInput.value.trim();

    if (!item || !unit || !quantity) {

        showMessage(
            "يرجى ملء جميع الحقول",
            "error"
        );

        return;
    }

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { collection, addDoc, serverTimestamp } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        await addDoc(
            collection(db, PURCHASES_COLLECTION),
            {
                item: item,
                unit: unit,
                quantity: quantity,
                status: "pending",
                createdAt: serverTimestamp(),
                completedAt: null
            }
        );

        itemInput.value = "";
        unitInput.value = "";
        quantityInput.value = "";

        closePurchaseForm();

        showMessage("تمت إضافة الطلب بنجاح");

        await getPurchases();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ أثناء إضافة الطلب",
            "error"
        );

    }

}

function renderPurchases() {

    const container =
        document.getElementById("purchasesList");

    if (!container) return;

    const pending = purchasesCache.filter(
        purchase => purchase.status !== "completed"
    );

    const completed = purchasesCache.filter(
        purchase => purchase.status === "completed"
    );

    let html = "";

    html += `
        <div style="
            direction:rtl;
            margin-bottom:25px;
        ">

            <h2 style="
                margin-bottom:15px;
            ">
                طلبات الشراء
            </h2>
    `;

    if (pending.length === 0) {

        html += `
            <div style="
                padding:20px;
                background:#f5f5f5;
                border-radius:12px;
                text-align:center;
                margin-bottom:20px;
            ">
                لا توجد طلبات حالياً
            </div>
        `;

    } else {

        pending.forEach(purchase => {

            html += createPurchaseHTML(purchase);

        });

    }

    html += `
        </div>

        <div style="
            direction:rtl;
            margin-top:30px;
        ">

            <h2 style="
                margin-bottom:15px;
            ">
                تم تجهيزه
            </h2>
    `;

    if (completed.length === 0) {

        html += `
            <div style="
                padding:20px;
                background:#f5f5f5;
                border-radius:12px;
                text-align:center;
            ">
                لا توجد طلبات مجهزة
            </div>
        `;

    } else {

        completed.forEach(purchase => {

            html += createCompletedPurchaseHTML(purchase);

        });

    }

    html += `</div>`;

    container.innerHTML = html;
}

function createPurchaseHTML(purchase) {

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
                ${escapeHTML(purchase.item)}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                الوحدة: ${escapeHTML(purchase.unit)}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                العدد: ${escapeHTML(purchase.quantity)}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:12px;
            ">
                تاريخ الطلب:
                ${formatPurchaseDate(purchase.createdAt)}
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

function createCompletedPurchaseHTML(purchase) {

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
                ${escapeHTML(purchase.item)}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                الوحدة: ${escapeHTML(purchase.unit)}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                العدد: ${escapeHTML(purchase.quantity)}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:6px;
            ">
                تاريخ الطلب:
                ${formatPurchaseDate(purchase.createdAt)}
            </div>

            <div style="
                color:#2e7d32;
                font-size:13px;
                margin-bottom:12px;
            ">
                تاريخ التجهيز:
                ${formatPurchaseDate(purchase.completedAt)}
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

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { doc, updateDoc, serverTimestamp } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        await updateDoc(
            doc(db, PURCHASES_COLLECTION, id),
            {
                status: "completed",
                completedAt: serverTimestamp()
            }
        );

        showMessage("تم نقل الطلب إلى تم تجهيزه");

        await getPurchases();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ أثناء تحديث الطلب",
            "error"
        );

    }

}

async function returnPurchase(id) {

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { doc, updateDoc } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        await updateDoc(
            doc(db, PURCHASES_COLLECTION, id),
            {
                status: "pending",
                completedAt: null
            }
        );

        showMessage("تم إرجاع الطلب");

        await getPurchases();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ",
            "error"
        );

    }

}

function formatPurchaseDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    try {

        let date;

        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
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
// ========================= التقارير =========================
// ============================================================

async function getReports() {

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { collection, getDocs } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        const snapshot = await getDocs(
            collection(db, REPORTS_COLLECTION)
        );

        reportsCache = [];

        snapshot.forEach(doc => {

            reportsCache.push({
                id: doc.id,
                ...doc.data()
            });

        });

        reportsCache.sort((a, b) => {

            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;

            return dateB - dateA;

        });

        renderReports();

    } catch (error) {

        console.error(error);

        showMessage(
            "تعذر تحميل التقارير",
            "error"
        );

    }

}

function openAddReport() {

    showPage("addReportPage");

    prepareReportForm();

}

function prepareReportForm() {

    const dateInput =
        document.getElementById("reportDate");

    if (!dateInput) return;

    const today =
        new Date().toISOString().split("T")[0];

    dateInput.value = today;

    updateDayFromDate();

}

function updateDayFromDate() {

    const dateInput =
        document.getElementById("reportDate");

    const dayInput =
        document.getElementById("reportDay");

    if (!dateInput || !dayInput) return;

    if (!dateInput.value) {

        dayInput.value = "";

        return;

    }

    const date =
        new Date(dateInput.value + "T00:00:00");

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
        days[date.getDay()];

}

async function saveReport() {

    const dateInput =
        document.getElementById("reportDate");

    const dayInput =
        document.getElementById("reportDay");

    const textInput =
        document.getElementById("reportText");

    if (!dateInput || !dayInput || !textInput) {

        showMessage(
            "حقول التقرير غير موجودة",
            "error"
        );

        return;

    }

    const date = dateInput.value;
    const day = dayInput.value;
    const text = textInput.value.trim();

    if (!date || !day || !text) {

        showMessage(
            "يرجى ملء جميع بيانات التقرير",
            "error"
        );

        return;

    }

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { collection, addDoc, serverTimestamp } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        await addDoc(
            collection(db, REPORTS_COLLECTION),
            {
                date: date,
                day: day,
                text: text,
                createdAt: serverTimestamp()
            }
        );

        textInput.value = "";

        showMessage("تم حفظ التقرير بنجاح");

        openReports();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ أثناء حفظ التقرير",
            "error"
        );

    }

}

function renderReports() {

    const container =
        document.getElementById("reportsList");

    if (!container) return;

    if (reportsCache.length === 0) {

        container.innerHTML = `
            <div style="
                padding:25px;
                text-align:center;
                background:#f5f5f5;
                border-radius:12px;
                direction:rtl;
            ">
                لا توجد تقارير
            </div>
        `;

        return;

    }

    let html = "";

    reportsCache.forEach(report => {

        html += createReportHTML(report);

    });

    container.innerHTML = html;

}

function createReportHTML(report) {

    return `
        <div style="
            background:white;
            padding:18px;
            margin-bottom:15px;
            border-radius:14px;
            box-shadow:0 3px 12px rgba(0,0,0,0.10);
            direction:rtl;
        ">

            <div style="
                font-weight:bold;
                font-size:17px;
                margin-bottom:8px;
            ">
                ${escapeHTML(report.day)}
            </div>

            <div style="
                color:#555;
                margin-bottom:8px;
            ">
                التاريخ:
                ${escapeHTML(report.date)}
            </div>

            <div style="
                white-space:pre-wrap;
                line-height:1.8;
                margin-bottom:15px;
            ">
                ${escapeHTML(report.text)}
            </div>

            <button
                onclick="deleteReport('${report.id}')"
                style="
                    background:#d32f2f;
                    color:white;
                    border:0;
                    border-radius:9px;
                    padding:10px 18px;
                    cursor:pointer;
                    font-weight:bold;
                "
            >
                حذف التقرير
            </button>

        </div>
    `;

}

function formatDate(timestamp) {

    return formatPurchaseDate(timestamp);

}

async function deleteReport(id) {

    if (!confirm("هل تريد حذف التقرير؟")) {
        return;
    }

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const { doc, deleteDoc } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

        await deleteDoc(
            doc(db, REPORTS_COLLECTION, id)
        );

        showMessage("تم حذف التقرير");

        await getReports();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ أثناء حذف التقرير",
            "error"
        );

    }

}

// ============================================================
// =========================== المهام ==========================
// ============================================================

function createTasksInterface() {

    // --------------------------------------------------------
    // إضافة بطاقة المهام إلى الصفحة الرئيسية
    // --------------------------------------------------------

    const mainGrid =
        document.querySelector(".main-grid");

    if (mainGrid &&
        !document.getElementById("tasksMainCard")) {

        const card =
            document.createElement("div");

        card.id = "tasksMainCard";

        card.className = "main-card";

        card.onclick = function () {
            openTasks();
        };

        card.innerHTML = `
            <div style="
                font-size:42px;
                margin-bottom:10px;
            ">
                📋
            </div>

            <div style="
                font-size:20px;
                font-weight:bold;
            ">
                المهام
            </div>

            <div style="
                margin-top:7px;
                color:#777;
                font-size:14px;
            ">
                مهام المهندسين
            </div>
        `;

        mainGrid.appendChild(card);
    }

    // --------------------------------------------------------
    // صفحة المهام الرئيسية
    // --------------------------------------------------------

    if (!document.getElementById("tasksPage")) {

        const page =
            document.createElement("div");

        page.id = "tasksPage";

        page.className = "page";

        page.style.display = "none";

        page.innerHTML = `

            <div style="
                direction:rtl;
                padding:20px;
            ">

                <button
                    onclick="goHome()"
                    style="
                        border:0;
                        background:#555;
                        color:white;
                        padding:11px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        margin-bottom:20px;
                        font-weight:bold;
                    "
                >
                    ← الرئيسية
                </button>

                <h1 style="
                    margin-bottom:20px;
                ">
                    المهام
                </h1>

                <div id="engineersList"
                     style="
                        display:grid;
                        grid-template-columns:
                        repeat(auto-fit,minmax(180px,1fr));
                        gap:15px;
                     ">
                </div>

            </div>
        `;

        document.body.appendChild(page);
    }

    // --------------------------------------------------------
    // صفحة مهام المهندس
    // --------------------------------------------------------

    if (!document.getElementById("engineerTasksPage")) {

        const page =
            document.createElement("div");

        page.id = "engineerTasksPage";

        page.className = "page";

        page.style.display = "none";

        page.innerHTML = `

            <div style="
                direction:rtl;
                padding:20px;
            ">

                <button
                    onclick="openTasks()"
                    style="
                        border:0;
                        background:#555;
                        color:white;
                        padding:11px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        margin-bottom:20px;
                        font-weight:bold;
                    "
                >
                    ← المهندسين
                </button>

                <h1 id="currentEngineerTitle"
                    style="
                        margin-bottom:20px;
                    ">
                </h1>

                <button
                    onclick="openTaskForm()"
                    style="
                        width:100%;
                        padding:15px;
                        border:0;
                        border-radius:12px;
                        background:#1976d2;
                        color:white;
                        font-size:17px;
                        font-weight:bold;
                        cursor:pointer;
                        margin-bottom:20px;
                    "
                >
                    + إضافة مهام
                </button>

                <div id="taskForm"
                     style="
                        display:none;
                        background:#f5f5f5;
                        padding:18px;
                        border-radius:14px;
                        margin-bottom:25px;
                     ">

                    <textarea
                        id="taskText"
                        placeholder="اكتب المهمة هنا..."
                        style="
                            width:100%;
                            min-height:120px;
                            padding:12px;
                            border:1px solid #ccc;
                            border-radius:10px;
                            resize:vertical;
                            box-sizing:border-box;
                            font-size:16px;
                            direction:rtl;
                        "
                    ></textarea>

                    <button
                        onclick="addTask()"
                        style="
                            width:100%;
                            padding:13px;
                            margin-top:10px;
                            border:0;
                            border-radius:10px;
                            background:#2e7d32;
                            color:white;
                            font-weight:bold;
                            cursor:pointer;
                        "
                    >
                        حفظ المهمة
                    </button>

                    <button
                        onclick="closeTaskForm()"
                        style="
                            width:100%;
                            padding:11px;
                            margin-top:8px;
                            border:0;
                            border-radius:10px;
                            background:#777;
                            color:white;
                            cursor:pointer;
                        "
                    >
                        إلغاء
                    </button>

                </div>

                <h2 style="
                    margin-top:20px;
                    margin-bottom:15px;
                ">
                    المهام الحالية
                </h2>

                <div id="pendingTasksList"></div>

                <h2 style="
                    margin-top:35px;
                    margin-bottom:15px;
                ">
                    المنجزة
                </h2>

                <div id="completedTasksList"></div>

            </div>
        `;

        document.body.appendChild(page);
    }

}

// ============================================================
// فتح صفحة المهام
// ============================================================

function openTasks() {

    createTasksInterface();

    showPage("tasksPage");

    renderEngineers();

}

function renderEngineers() {

    const container =
        document.getElementById("engineersList");

    if (!container) return;

    let html = "";

    ENGINEERS.forEach(engineer => {

        html += `
            <button
                onclick="openEngineerTasks('${engineer}')"
                style="
                    border:0;
                    background:white;
                    border-radius:16px;
                    padding:25px 15px;
                    box-shadow:0 3px 14px rgba(0,0,0,0.12);
                    cursor:pointer;
                    direction:rtl;
                    font-size:18px;
                    font-weight:bold;
                    min-height:100px;
                "
            >
                👷
                <br>
                <span style="
                    display:block;
                    margin-top:10px;
                ">
                    ${escapeHTML(engineer)}
                </span>
            </button>
        `;

    });

    container.innerHTML = html;

}

// ============================================================
// فتح مهام مهندس
// ============================================================

async function openEngineerTasks(engineerName) {

    currentEngineer = engineerName;

    createTasksInterface();

    showPage("engineerTasksPage");

    const title =
        document.getElementById("currentEngineerTitle");

    if (title) {

        title.textContent =
            "مهام " + engineerName;

    }

    closeTaskForm();

    await getTasks();

}

// ============================================================
// فتح نموذج المهمة
// ============================================================

function openTaskForm() {

    const form =
        document.getElementById("taskForm");

    if (form) {

        form.style.display = "block";

    }

    const input =
        document.getElementById("taskText");

    if (input) {

        input.focus();

    }

}

function closeTaskForm() {

    const form =
        document.getElementById("taskForm");

    if (form) {

        form.style.display = "none";

    }

}

// ============================================================
// جلب المهام من Firebase
// ============================================================

async function getTasks() {

    const db = getFirestoreDB();

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
                collection(db, TASKS_COLLECTION)
            );

        tasksCache = [];

        snapshot.forEach(doc => {

            tasksCache.push({
                id: doc.id,
                ...doc.data()
            });

        });

        tasksCache.sort((a, b) => {

            const dateA =
                a.createdAt?.seconds || 0;

            const dateB =
                b.createdAt?.seconds || 0;

            return dateB - dateA;

        });

        renderEngineerTasks();

    } catch (error) {

        console.error(
            "خطأ تحميل المهام:",
            error
        );

        showMessage(
            "تعذر تحميل المهام. تأكد من Firebase Rules",
            "error"
        );

    }

}

// ============================================================
// إضافة مهمة
// ============================================================

async function addTask() {

    const input =
        document.getElementById("taskText");

    if (!input) return;

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

        await addDoc(
            collection(db, TASKS_COLLECTION),
            {
                engineer: currentEngineer,
                text: text,
                status: "pending",
                createdAt: serverTimestamp(),
                completedAt: null
            }
        );

        input.value = "";

        closeTaskForm();

        showMessage(
            "تمت إضافة المهمة بنجاح"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إضافة المهمة:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إضافة المهمة",
            "error"
        );

    }

}

// ============================================================
// عرض مهام المهندس
// ============================================================

function renderEngineerTasks() {

    const pendingContainer =
        document.getElementById("pendingTasksList");

    const completedContainer =
        document.getElementById("completedTasksList");

    if (!pendingContainer ||
        !completedContainer) {

        return;

    }

    const engineerTasks =
        tasksCache.filter(
            task =>
                task.engineer === currentEngineer
        );

    const pending =
        engineerTasks.filter(
            task =>
                task.status !== "completed"
        );

    const completed =
        engineerTasks.filter(
            task =>
                task.status === "completed"
        );

    // --------------------------------------------------------
    // المهام الحالية
    // --------------------------------------------------------

    if (pending.length === 0) {

        pendingContainer.innerHTML = `
            <div style="
                padding:20px;
                background:#f5f5f5;
                border-radius:12px;
                text-align:center;
                color:#777;
            ">
                لا توجد مهام حالياً
            </div>
        `;

    } else {

        pendingContainer.innerHTML =
            pending
                .map(task =>
                    createTaskHTML(task)
                )
                .join("");

    }

    // --------------------------------------------------------
    // المنجزة
    // --------------------------------------------------------

    if (completed.length === 0) {

        completedContainer.innerHTML = `
            <div style="
                padding:20px;
                background:#f5f5f5;
                border-radius:12px;
                text-align:center;
                color:#777;
            ">
                لا توجد مهام منجزة
            </div>
        `;

    } else {

        completedContainer.innerHTML =
            completed
                .map(task =>
                    createCompletedTaskHTML(task)
                )
                .join("");

    }

}

// ============================================================
// شكل المهمة الحالية
// ============================================================

function createTaskHTML(task) {

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
                font-size:17px;
                line-height:1.8;
                white-space:pre-wrap;
                margin-bottom:12px;
            ">
                ${escapeHTML(task.text)}
            </div>

            <div style="
                font-size:13px;
                color:#777;
                margin-bottom:12px;
            ">
                تاريخ الإضافة:
                ${formatPurchaseDate(task.createdAt)}
            </div>

            <button
                onclick="completeTask('${task.id}')"
                style="
                    width:100%;
                    padding:13px;
                    border:0;
                    border-radius:10px;
                    background:#2e7d32;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                    font-size:15px;
                "
            >
                ✓ تم الإنجاز
            </button>

        </div>
    `;

}

// ============================================================
// شكل المهمة المنجزة
// ============================================================

function createCompletedTaskHTML(task) {

    return `
        <div style="
            background:#f1f8f1;
            border:1px solid #c8e6c9;
            border-radius:14px;
            padding:18px;
            margin-bottom:14px;
            direction:rtl;
        ">

            <div style="
                font-size:17px;
                line-height:1.8;
                white-space:pre-wrap;
                text-decoration:line-through;
                margin-bottom:10px;
                color:#555;
            ">
                ${escapeHTML(task.text)}
            </div>

            <div style="
                color:#2e7d32;
                font-size:13px;
                margin-bottom:12px;
            ">
                ✓ تم الإنجاز:
                ${formatPurchaseDate(task.completedAt)}
            </div>

            <button
                onclick="returnTask('${task.id}')"
                style="
                    width:100%;
                    padding:10px;
                    border:0;
                    border-radius:10px;
                    background:#777;
                    color:white;
                    cursor:pointer;
                "
            >
                إرجاع للمهمات
            </button>

        </div>
    `;

}

// ============================================================
// إنجاز المهمة
// ============================================================

async function completeTask(id) {

    const db = getFirestoreDB();

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
            doc(db, TASKS_COLLECTION, id),
            {
                status: "completed",
                completedAt: serverTimestamp()
            }
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
            "حدث خطأ أثناء تحديث المهمة",
            "error"
        );

    }

}

// ============================================================
// إرجاع المهمة من المنجزة
// ============================================================

async function returnTask(id) {

    const db = getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(db, TASKS_COLLECTION, id),
            {
                status: "pending",
                completedAt: null
            }
        );

        showMessage(
            "تم إرجاع المهمة"
        );

        await getTasks();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ",
            "error"
        );

    }

}

// ============================================================
// حماية HTML
// ============================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ============================================================
// تهيئة التطبيق
// ============================================================

function initializeCompanyApp() {

    console.log(
        "شركة نوافذ البناء - التطبيق بدأ"
    );

    createTasksInterface();

}

// ============================================================
// منع الضغط المزدوج على بعض الأزرار
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
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCompanyApp
    );

} else {

    initializeCompanyApp();

}

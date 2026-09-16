const PURCHASES_COLLECTION = "purchases";
const REPORTS_COLLECTION = "reports";

let purchasesCache = [];
let reportsCache = [];


// =====================================================
// التحقق من Firebase
// =====================================================

function getFirestoreDB() {

    if (!window.firebaseDb) {

        console.error(
            "Firebase Firestore غير جاهز.",
            window.firebaseDb
        );

        alert(
            "قاعدة البيانات غير جاهزة. أعد تحميل الصفحة."
        );

        return null;
    }

    return window.firebaseDb;
}


// =====================================================
// الصفحات
// =====================================================

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(function(page) {

        page.classList.remove("active");

    });


    const targetPage =
        document.getElementById(pageId);


    if (targetPage) {

        targetPage.classList.add("active");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}


function goHome() {

    showPage("homePage");

}


function openStorage() {

    showPage("storagePage");

}


function showMessage(sectionName) {

    alert(
        "قسم " +
        sectionName +
        " سيكون متاحاً قريباً."
    );

}


// =====================================================
// المشتريات
// =====================================================

function openPurchases() {

    showPage("purchasesPage");

    closePurchaseForm();

    renderPurchases();

}


function openPurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );


    if (form) {

        form.style.display = "block";

    }


    const item =
        document.getElementById(
            "purchaseItem"
        );


    if (item) {

        item.focus();

    }

}


function closePurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );


    if (form) {

        form.style.display = "none";

    }


    const item =
        document.getElementById(
            "purchaseItem"
        );


    const unit =
        document.getElementById(
            "purchaseUnit"
        );


    const quantity =
        document.getElementById(
            "purchaseQuantity"
        );


    if (item) {

        item.value = "";

    }


    if (unit) {

        unit.value = "";

    }


    if (quantity) {

        quantity.value = "";

    }

}


// =====================================================
// قراءة المشتريات
// =====================================================

async function getPurchases() {

    const db =
        getFirestoreDB();


    if (!db) {

        return [];

    }


    try {

        const {
            collection,
            getDocs,
            query,
            orderBy
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        const purchasesRef =
            collection(
                db,
                PURCHASES_COLLECTION
            );


        let snapshot;


        try {

            const purchasesQuery =
                query(
                    purchasesRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );


            snapshot =
                await getDocs(
                    purchasesQuery
                );


        } catch (orderError) {

            console.warn(
                "تعذر ترتيب المشتريات. سيتم جلبها بدون ترتيب.",
                orderError
            );


            snapshot =
                await getDocs(
                    purchasesRef
                );

        }


        const purchases = [];


        snapshot.forEach(
            function(docSnapshot) {

                purchases.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        purchasesCache =
            purchases;


        return purchases;


    } catch (error) {

        console.error(
            "خطأ في قراءة المشتريات:",
            error
        );


        alert(
            "تعذر تحميل المشتريات من قاعدة البيانات."
        );


        return [];

    }

}


// =====================================================
// إضافة طلب شراء
// =====================================================

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

        alert(
            "تعذر العثور على حقول طلب الشراء."
        );

        return;

    }


    const item =
        itemInput.value.trim();


    const unit =
        unitInput.value.trim();


    const quantity =
        quantityInput.value.trim();


    if (!item) {

        alert(
            "يرجى كتابة المادة المطلوبة."
        );

        itemInput.focus();

        return;

    }


    if (!unit) {

        alert(
            "يرجى كتابة الوحدة."
        );

        unitInput.focus();

        return;

    }


    if (!quantity) {

        alert(
            "يرجى كتابة العدد."
        );

        quantityInput.focus();

        return;

    }


    const numericQuantity =
        Number(quantity);


    if (
        !Number.isFinite(
            numericQuantity
        ) ||
        numericQuantity <= 0
    ) {

        alert(
            "يرجى إدخال عدد أكبر من صفر."
        );

        quantityInput.focus();

        return;

    }


    const db =
        getFirestoreDB();


    if (!db) {

        return;

    }


    try {

        const {
            collection,
            addDoc
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        const now =
            new Date().toISOString();


        const purchaseData = {

            item:
                item,

            unit:
                unit,

            quantity:
                numericQuantity,

            status:
                "pending",

            createdAt:
                now,

            completedAt:
                null

        };


        const docRef =
            await addDoc(

                collection(
                    db,
                    PURCHASES_COLLECTION
                ),

                purchaseData

            );


        console.log(
            "تم حفظ طلب الشراء:",
            docRef.id
        );


        closePurchaseForm();


        await renderPurchases();


        alert(
            "تمت إضافة طلب الشراء بنجاح."
        );


    } catch (error) {

        console.error(
            "خطأ في إضافة طلب الشراء:",
            error
        );


        alert(
            "حدث خطأ أثناء حفظ طلب الشراء.\n\n" +
            error.message
        );

    }

}


// =====================================================
// عرض المشتريات
// =====================================================

async function renderPurchases() {

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


    const purchases =
        await getPurchases();


    const pendingPurchases =
        purchases.filter(
            function(purchase) {

                return (
                    purchase.status !==
                    "completed"
                );

            }
        );


    const completedPurchases =
        purchases.filter(
            function(purchase) {

                return (
                    purchase.status ===
                    "completed"
                );

            }
        );


    if (pendingCount) {

        pendingCount.textContent =
            pendingPurchases.length;

    }


    if (completedCount) {

        completedCount.textContent =
            completedPurchases.length;

    }


    // الطلبات الحالية

    if (pendingContainer) {

        if (
            pendingPurchases.length === 0
        ) {

            pendingContainer.innerHTML =

                '<div class="empty-purchases">' +

                '<div class="empty-purchases-icon">🛒</div>' +

                '<p>لا توجد طلبات شراء حالياً</p>' +

                '<span>' +
                'اضغط على "طلب شراء" لإضافة مادة جديدة' +
                '</span>' +

                '</div>';

        } else {

            pendingContainer.innerHTML =
                "";


            pendingPurchases.forEach(
                function(purchase) {

                    pendingContainer.insertAdjacentHTML(

                        "beforeend",

                        createPurchaseHTML(
                            purchase
                        )

                    );

                }
            );

        }

    }


    // المواد المجهزة

    if (completedContainer) {

        if (
            completedPurchases.length === 0
        ) {

            completedContainer.innerHTML =

                '<div class="empty-purchases completed-empty">' +

                '<div class="empty-purchases-icon">📦</div>' +

                '<p>لا توجد مواد تم تجهيزها</p>' +

                '<span>' +
                'الطلبات التي يتم شراؤها ستظهر هنا' +
                '</span>' +

                '</div>';

        } else {

            completedContainer.innerHTML =
                "";


            completedPurchases.forEach(
                function(purchase) {

                    completedContainer.insertAdjacentHTML(

                        "beforeend",

                        createCompletedPurchaseHTML(
                            purchase
                        )

                    );

                }
            );

        }

    }

}


// =====================================================
// بطاقة الطلب
// =====================================================

function createPurchaseHTML(purchase) {

    const item =
        escapeHTML(
            purchase.item
        );


    const unit =
        escapeHTML(
            purchase.unit
        );


    const quantity =
        escapeHTML(
            String(
                purchase.quantity
            )
        );


    const date =
        formatPurchaseDate(
            purchase.createdAt
        );


    return (

        '<div class="purchase-card pending-purchase">' +

        '<div class="purchase-card-main">' +

        '<div class="purchase-card-icon">🛒</div>' +

        '<div class="purchase-card-info">' +

        '<h4>' +
        item +
        '</h4>' +

        '<div class="purchase-details">' +

        '<span>' +
        '<strong>الوحدة:</strong> ' +
        unit +
        '</span>' +

        '<span>' +
        '<strong>العدد:</strong> ' +
        quantity +
        '</span>' +

        '</div>' +

        '<small>📅 تاريخ الطلب: ' +
        date +
        '</small>' +

        '</div>' +

        '</div>' +

        '<button ' +
        'type="button" ' +
        'class="complete-purchase-button" ' +
        'onclick="completePurchase(\'' +
        purchase.id +
        '\')">' +

        '<span>✓</span>' +
        '<span>تم الشراء</span>' +

        '</button>' +

        '</div>'

    );

}


// =====================================================
// بطاقة المادة المجهزة
// =====================================================

function createCompletedPurchaseHTML(
    purchase
) {

    const item =
        escapeHTML(
            purchase.item
        );


    const unit =
        escapeHTML(
            purchase.unit
        );


    const quantity =
        escapeHTML(
            String(
                purchase.quantity
            )
        );


    const orderDate =
        formatPurchaseDate(
            purchase.createdAt
        );


    const completedDate =
        formatPurchaseDate(
            purchase.completedAt
        );


    return (

        '<div class="purchase-card completed-purchase">' +

        '<div class="purchase-card-main">' +

        '<div class="purchase-card-icon completed-icon">✓</div>' +

        '<div class="purchase-card-info">' +

        '<h4>' +
        item +
        '</h4>' +

        '<div class="purchase-details">' +

        '<span>' +
        '<strong>الوحدة:</strong> ' +
        unit +
        '</span>' +

        '<span>' +
        '<strong>العدد:</strong> ' +
        quantity +
        '</span>' +

        '</div>' +

        '<div class="purchase-dates">' +

        '<div>' +
        '<strong>📅 تاريخ الطلب:</strong> ' +
        orderDate +
        '</div>' +

        '<div>' +
        '<strong>✅ تاريخ التجهيز:</strong> ' +
        completedDate +
        '</div>' +

        '</div>' +

        '</div>' +

        '</div>' +

        '<button ' +
        'type="button" ' +
        'class="return-purchase-button" ' +
        'onclick="returnPurchase(\'' +
        purchase.id +
        '\')">' +

        '<span>↩</span>' +
        '<span>إرجاع</span>' +

        '</button>' +

        '</div>'

    );

}


// =====================================================
// تم الشراء
// =====================================================

async function completePurchase(id) {

    const purchase =
        purchasesCache.find(
            function(item) {

                return (
                    item.id === id
                );

            }
        );


    if (!purchase) {

        return;

    }


    const confirmed =
        confirm(
            'هل تم شراء المادة "' +
            purchase.item +
            '"؟'
        );


    if (!confirmed) {

        return;

    }


    const db =
        getFirestoreDB();


    if (!db) {

        return;

    }


    try {

        const {
            doc,
            updateDoc
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        await updateDoc(

            doc(
                db,
                PURCHASES_COLLECTION,
                id
            ),

            {
                status:
                    "completed",

                completedAt:
                    new Date().toISOString()
            }

        );


        await renderPurchases();


    } catch (error) {

        console.error(
            "خطأ في إكمال الطلب:",
            error
        );


        alert(
            "حدث خطأ أثناء تحديث حالة الطلب."
        );

    }

}


// =====================================================
// إرجاع الطلب
// =====================================================

async function returnPurchase(id) {

    const purchase =
        purchasesCache.find(
            function(item) {

                return (
                    item.id === id
                );

            }
        );


    if (!purchase) {

        return;

    }


    const confirmed =
        confirm(
            'هل تريد إرجاع المادة "' +
            purchase.item +
            '" إلى طلبات الشراء؟'
        );


    if (!confirmed) {

        return;

    }


    const db =
        getFirestoreDB();


    if (!db) {

        return;

    }


    try {

        const {
            doc,
            updateDoc
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        await updateDoc(

            doc(
                db,
                PURCHASES_COLLECTION,
                id
            ),

            {
                status:
                    "pending",

                completedAt:
                    null
            }

        );


        await renderPurchases();


    } catch (error) {

        console.error(
            "خطأ في إرجاع الطلب:",
            error
        );


        alert(
            "حدث خطأ أثناء إرجاع الطلب."
        );

    }

}


// =====================================================
// تنسيق تاريخ المشتريات
// =====================================================

function formatPurchaseDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "ar-IQ",
        {
            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    );

}


// =====================================================
// التقارير
// =====================================================

async function getReports() {

    const db =
        getFirestoreDB();


    if (!db) {

        return [];

    }


    try {

        const {
            collection,
            getDocs,
            query,
            orderBy
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        const reportsRef =
            collection(
                db,
                REPORTS_COLLECTION
            );


        let snapshot;


        try {

            const reportsQuery =
                query(
                    reportsRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );


            snapshot =
                await getDocs(
                    reportsQuery
                );


        } catch (orderError) {

            console.warn(
                "تعذر ترتيب التقارير.",
                orderError
            );


            snapshot =
                await getDocs(
                    reportsRef
                );

        }


        const reports = [];


        snapshot.forEach(
            function(docSnapshot) {

                reports.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        reportsCache =
            reports;


        return reports;


    } catch (error) {

        console.error(
            "خطأ في قراءة التقارير:",
            error
        );


        alert(
            "تعذر تحميل التقارير من قاعدة البيانات."
        );


        return [];

    }

}


// =====================================================
// صفحة التقارير
// =====================================================

async function openReports() {

    showPage(
        "reportsPage"
    );


    await renderReports();

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


    const dayInput =
        document.getElementById(
            "reportDay"
        );


    const textInput =
        document.getElementById(
            "reportText"
        );


    if (dateInput) {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        dateInput.value =
            year +
            "-" +
            month +
            "-" +
            day;


        updateDayFromDate();

    }


    if (
        dayInput &&
        !dayInput.value
    ) {

        updateDayFromDate();

    }


    if (textInput) {

        textInput.value =
            "";

    }

}


// =====================================================
// يوم الأسبوع
// =====================================================

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
        !dayInput ||
        !dateInput.value
    ) {

        return;

    }


    const date =
        new Date(
            dateInput.value +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return;

    }


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


// =====================================================
// حفظ التقرير
// =====================================================

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

        alert(
            "تعذر العثور على حقول التقرير."
        );

        return;

    }


    const date =
        dateInput.value;


    const day =
        dayInput.value.trim();


    const text =
        textInput.value.trim();


    if (!date) {

        alert(
            "يرجى اختيار تاريخ التقرير."
        );

        return;

    }


    if (!text) {

        alert(
            "يرجى كتابة تفاصيل التقرير."
        );

        textInput.focus();

        return;

    }


    const db =
        getFirestoreDB();


    if (!db) {

        return;

    }


    try {

        const {
            collection,
            addDoc
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        await addDoc(

            collection(
                db,
                REPORTS_COLLECTION
            ),

            {
                date:
                    date,

                day:
                    day,

                text:
                    text,

                createdAt:
                    new Date().toISOString()
            }

        );


        await openReports();


        alert(
            "تم حفظ التقرير بنجاح."
        );


    } catch (error) {

        console.error(
            "خطأ في حفظ التقرير:",
            error
        );


        alert(
            "حدث خطأ أثناء حفظ التقرير.\n\n" +
            error.message
        );

    }

}


// =====================================================
// عرض التقارير
// =====================================================

async function renderReports() {

    const container =
        document.getElementById(
            "reportsList"
        );


    if (!container) {

        return;

    }


    const reports =
        await getReports();


    if (
        reports.length === 0
    ) {

        container.innerHTML =

            '<div class="empty-reports">' +

            '<div class="empty-reports-icon">📋</div>' +

            '<h3>لا توجد تقارير</h3>' +

            '<p>' +
            'اضغط على إضافة تقرير لإنشاء أول تقرير يومي.' +
            '</p>' +

            '</div>';

        return;

    }


    container.innerHTML =
        "";


    reports.forEach(
        function(report) {

            container.insertAdjacentHTML(

                "beforeend",

                createReportHTML(
                    report
                )

            );

        }
    );

}


// =====================================================
// بطاقة التقرير
// =====================================================

function createReportHTML(
    report
) {

    const day =
        escapeHTML(
            report.day || ""
        );


    const text =
        escapeHTML(
            report.text || ""
        );


    const date =
        formatDate(
            report.date
        );


    return (

        '<div class="report-card">' +

        '<div class="report-card-header">' +

        '<div>' +

        '<span class="report-day">' +
        day +
        '</span>' +

        '<span class="report-date">' +
        date +
        '</span>' +

        '</div>' +

        '<button ' +
        'type="button" ' +
        'class="delete-report-button" ' +
        'onclick="deleteReport(\'' +
        report.id +
        '\')">' +

        'حذف' +

        '</button>' +

        '</div>' +

        '<div class="report-card-body">' +
        text +
        '</div>' +

        '</div>'

    );

}


// =====================================================
// تنسيق التاريخ
// =====================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "ar-IQ",
        {
            year:
                "numeric",

            month:
                "long",

            day:
                "numeric"
        }
    );

}


// =====================================================
// حذف التقرير
// =====================================================

async function deleteReport(id) {

    const report =
        reportsCache.find(
            function(item) {

                return (
                    item.id === id
                );

            }
        );


    if (!report) {

        return;

    }


    const confirmed =
        confirm(
            "هل تريد حذف هذا التقرير؟"
        );


    if (!confirmed) {

        return;

    }


    const db =
        getFirestoreDB();


    if (!db) {

        return;

    }


    try {

        const {
            doc,
            deleteDoc
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );


        await deleteDoc(

            doc(
                db,
                REPORTS_COLLECTION,
                id
            )

        );


        await renderReports();


    } catch (error) {

        console.error(
            "خطأ في حذف التقرير:",
            error
        );


        alert(
            "حدث خطأ أثناء حذف التقرير."
        );

    }

}


// =====================================================
// حماية النصوص
// =====================================================

function escapeHTML(value) {

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


// =====================================================
// تشغيل التطبيق
// =====================================================

async function initializeCompanyApp() {

    console.log(
        "تشغيل تطبيق شركة نوافذ البناء..."
    );


    if (!window.firebaseDb) {

        console.error(
            "Firebase غير موجود عند تشغيل التطبيق."
        );

        return;

    }


    console.log(
        "Firestore جاهز."
    );


    await renderPurchases();

    await renderReports();


    const reportDate =
        document.getElementById(
            "reportDate"
        );


    if (reportDate) {

        reportDate.addEventListener(
            "change",
            updateDayFromDate
        );

    }

}


// =====================================================
// منع الضغط المزدوج
// =====================================================

document.addEventListener(
    "touchend",
    function(event) {

        const now =
            Date.now();


        if (
            window.lastTouchEnd &&
            now -
            window.lastTouchEnd <=
            300
        ) {

            event.preventDefault();

        }


        window.lastTouchEnd =
            now;

    },
    false
);


// =====================================================
// بدء التطبيق
// =====================================================

// لأن script.js يتم تحميله بعد Firebase
// نبدأ مباشرة بعد تحميل الملف.

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

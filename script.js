const PURCHASES_KEY = "nawafth_albnaa_purchases";
const REPORTS_KEY = "nawafth_albnaa_daily_reports";

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");

    pages.forEach(function(page) {
        page.classList.remove("active");
    });

    const targetPage = document.getElementById(pageId);

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
    alert("قسم " + sectionName + " سيكون متاحاً قريباً.");
}

function openPurchases() {
    showPage("purchasesPage");
    closePurchaseForm();
    renderPurchases();
}

function openPurchaseForm() {
    const form = document.getElementById("purchaseForm");

    if (form) {
        form.style.display = "block";
    }

    const item = document.getElementById("purchaseItem");

    if (item) {
        item.focus();
    }
}

function closePurchaseForm() {
    const form = document.getElementById("purchaseForm");

    if (form) {
        form.style.display = "none";
    }

    const item = document.getElementById("purchaseItem");
    const unit = document.getElementById("purchaseUnit");
    const quantity = document.getElementById("purchaseQuantity");

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

function getPurchases() {
    try {
        const saved = localStorage.getItem(PURCHASES_KEY);

        if (!saved) {
            return [];
        }

        const purchases = JSON.parse(saved);

        if (!Array.isArray(purchases)) {
            return [];
        }

        return purchases;
    } catch (error) {
        console.error("خطأ في قراءة المشتريات:", error);
        return [];
    }
}

function savePurchases(purchases) {
    try {
        localStorage.setItem(
            PURCHASES_KEY,
            JSON.stringify(purchases)
        );
    } catch (error) {
        console.error("خطأ في حفظ المشتريات:", error);
        alert("حدث خطأ أثناء حفظ طلب الشراء.");
    }
}

function addPurchase() {
    const itemInput = document.getElementById("purchaseItem");
    const unitInput = document.getElementById("purchaseUnit");
    const quantityInput = document.getElementById("purchaseQuantity");

    if (!itemInput || !unitInput || !quantityInput) {
        alert("تعذر العثور على حقول طلب الشراء.");
        return;
    }

    const item = itemInput.value.trim();
    const unit = unitInput.value.trim();
    const quantity = quantityInput.value.trim();

    if (!item) {
        alert("يرجى كتابة المادة المطلوبة.");
        itemInput.focus();
        return;
    }

    if (!unit) {
        alert("يرجى كتابة الوحدة.");
        unitInput.focus();
        return;
    }

    if (!quantity) {
        alert("يرجى كتابة العدد.");
        quantityInput.focus();
        return;
    }

    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
        alert("يرجى إدخال عدد أكبر من صفر.");
        quantityInput.focus();
        return;
    }

    const purchases = getPurchases();

    const newPurchase = {
        id: Date.now().toString(),
        item: item,
        unit: unit,
        quantity: numericQuantity,
        status: "pending",
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    purchases.unshift(newPurchase);

    savePurchases(purchases);

    closePurchaseForm();
    renderPurchases();

    alert("تمت إضافة طلب الشراء بنجاح.");
}

function renderPurchases() {
    const pendingContainer = document.getElementById("pendingPurchases");
    const completedContainer = document.getElementById("completedPurchases");

    const pendingCount = document.getElementById("pendingPurchaseCount");
    const completedCount = document.getElementById("completedPurchaseCount");

    const purchases = getPurchases();

    const pendingPurchases = purchases.filter(function(purchase) {
        return purchase.status !== "completed";
    });

    const completedPurchases = purchases.filter(function(purchase) {
        return purchase.status === "completed";
    });

    if (pendingCount) {
        pendingCount.textContent = pendingPurchases.length;
    }

    if (completedCount) {
        completedCount.textContent = completedPurchases.length;
    }

    if (pendingContainer) {
        if (pendingPurchases.length === 0) {
            pendingContainer.innerHTML =
                '<div class="empty-purchases">' +
                '<div class="empty-purchases-icon">🛒</div>' +
                '<p>لا توجد طلبات شراء حالياً</p>' +
                '<span>اضغط على "طلب شراء" لإضافة مادة جديدة</span>' +
                '</div>';
        } else {
            pendingContainer.innerHTML = "";

            pendingPurchases.forEach(function(purchase) {
                pendingContainer.insertAdjacentHTML(
                    "beforeend",
                    createPurchaseHTML(purchase)
                );
            });
        }
    }

    if (completedContainer) {
        if (completedPurchases.length === 0) {
            completedContainer.innerHTML =
                '<div class="empty-purchases completed-empty">' +
                '<div class="empty-purchases-icon">📦</div>' +
                '<p>لا توجد مواد تم تجهيزها</p>' +
                '<span>الطلبات التي يتم شراؤها ستظهر هنا</span>' +
                '</div>';
        } else {
            completedContainer.innerHTML = "";

            completedPurchases.forEach(function(purchase) {
                completedContainer.insertAdjacentHTML(
                    "beforeend",
                    createCompletedPurchaseHTML(purchase)
                );
            });
        }
    }
}

function createPurchaseHTML(purchase) {
    const item = escapeHTML(purchase.item);
    const unit = escapeHTML(purchase.unit);

    const quantity = escapeHTML(
        String(purchase.quantity)
    );

    const date = formatPurchaseDate(
        purchase.createdAt
    );

    return (
        '<div class="purchase-card pending-purchase">' +

        '<div class="purchase-card-main">' +

        '<div class="purchase-card-icon">🛒</div>' +

        '<div class="purchase-card-info">' +

        '<h4>' + item + '</h4>' +

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

function createCompletedPurchaseHTML(purchase) {
    const item = escapeHTML(purchase.item);
    const unit = escapeHTML(purchase.unit);

    const quantity = escapeHTML(
        String(purchase.quantity)
    );

    const orderDate = formatPurchaseDate(
        purchase.createdAt
    );

    const completedDate = formatPurchaseDate(
        purchase.completedAt
    );

    return (
        '<div class="purchase-card completed-purchase">' +

        '<div class="purchase-card-main">' +

        '<div class="purchase-card-icon completed-icon">✓</div>' +

        '<div class="purchase-card-info">' +

        '<h4>' + item + '</h4>' +

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

function completePurchase(id) {
    const purchases = getPurchases();

    const purchase = purchases.find(function(item) {
        return item.id === id;
    });

    if (!purchase) {
        return;
    }

    const confirmed = confirm(
        'هل تم شراء المادة "' +
        purchase.item +
        '"؟'
    );

    if (!confirmed) {
        return;
    }

    purchase.status = "completed";
    purchase.completedAt = new Date().toISOString();

    savePurchases(purchases);
    renderPurchases();
}

function returnPurchase(id) {
    const purchases = getPurchases();

    const purchase = purchases.find(function(item) {
        return item.id === id;
    });

    if (!purchase) {
        return;
    }

    const confirmed = confirm(
        'هل تريد إرجاع المادة "' +
        purchase.item +
        '" إلى طلبات الشراء؟'
    );

    if (!confirmed) {
        return;
    }

    purchase.status = "pending";
    purchase.completedAt = null;

    savePurchases(purchases);
    renderPurchases();
}

function formatPurchaseDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function getReports() {
    try {
        const saved = localStorage.getItem(REPORTS_KEY);

        if (!saved) {
            return [];
        }

        const reports = JSON.parse(saved);

        if (!Array.isArray(reports)) {
            return [];
        }

        return reports;
    } catch (error) {
        console.error("خطأ في قراءة التقارير:", error);
        return [];
    }
}

function saveReports(reports) {
    try {
        localStorage.setItem(
            REPORTS_KEY,
            JSON.stringify(reports)
        );
    } catch (error) {
        console.error("خطأ في حفظ التقارير:", error);
        alert("حدث خطأ أثناء حفظ التقرير.");
    }
}

function openReports() {
    showPage("reportsPage");
    renderReports();
}

function openAddReport() {
    showPage("addReportPage");
    prepareReportForm();
}

function prepareReportForm() {
    const dateInput = document.getElementById("reportDate");
    const dayInput = document.getElementById("reportDay");
    const textInput = document.getElementById("reportText");

    if (dateInput) {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        dateInput.value =
            year + "-" + month + "-" + day;

        updateDayFromDate();
    }

    if (dayInput && !dayInput.value) {
        updateDayFromDate();
    }

    if (textInput) {
        textInput.value = "";
    }
}

function updateDayFromDate() {
    const dateInput = document.getElementById("reportDate");
    const dayInput = document.getElementById("reportDay");

    if (!dateInput || !dayInput || !dateInput.value) {
        return;
    }

    const date = new Date(
        dateInput.value + "T00:00:00"
    );

    if (Number.isNaN(date.getTime())) {
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

    dayInput.value = days[date.getDay()];
}

function saveReport() {
    const dateInput = document.getElementById("reportDate");
    const dayInput = document.getElementById("reportDay");
    const textInput = document.getElementById("reportText");

    if (!dateInput || !dayInput || !textInput) {
        alert("تعذر العثور على حقول التقرير.");
        return;
    }

    const date = dateInput.value;
    const day = dayInput.value.trim();
    const text = textInput.value.trim();

    if (!date) {
        alert("يرجى اختيار تاريخ التقرير.");
        return;
    }

    if (!text) {
        alert("يرجى كتابة تفاصيل التقرير.");
        textInput.focus();
        return;
    }

    const reports = getReports();

    const newReport = {
        id: Date.now().toString(),
        date: date,
        day: day,
        text: text,
        createdAt: new Date().toISOString()
    };

    reports.unshift(newReport);

    saveReports(reports);

    openReports();

    alert("تم حفظ التقرير بنجاح.");
}

function renderReports() {
    const container = document.getElementById("reportsList");

    if (!container) {
        return;
    }

    const reports = getReports();

    if (reports.length === 0) {
        container.innerHTML =
            '<div class="empty-reports">' +
            '<div class="empty-reports-icon">📋</div>' +
            '<h3>لا توجد تقارير</h3>' +
            '<p>اضغط على إضافة تقرير لإنشاء أول تقرير يومي.</p>' +
            '</div>';

        return;
    }

    container.innerHTML = "";

    reports.forEach(function(report) {
        container.insertAdjacentHTML(
            "beforeend",
            createReportHTML(report)
        );
    });
}

function createReportHTML(report) {
    const day = escapeHTML(report.day || "");
    const text = escapeHTML(report.text || "");
    const date = formatDate(report.date);

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

function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(
        dateString + "T00:00:00"
    );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function deleteReport(id) {
    const reports = getReports();

    const report = reports.find(function(item) {
        return item.id === id;
    });

    if (!report) {
        return;
    }

    const confirmed = confirm(
        "هل تريد حذف هذا التقرير؟"
    );

    if (!confirmed) {
        return;
    }

    const filteredReports = reports.filter(function(item) {
        return item.id !== id;
    });

    saveReports(filteredReports);
    renderReports();
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function() {
    renderPurchases();
    renderReports();

    const reportDate = document.getElementById("reportDate");

    if (reportDate) {
        reportDate.addEventListener(
            "change",
            updateDayFromDate
        );
    }
});

document.addEventListener(
    "touchend",
    function(event) {
        const now = Date.now();

        if (
            window.lastTouchEnd &&
            now - window.lastTouchEnd <= 300
        ) {
            event.preventDefault();
        }

        window.lastTouchEnd = now;
    },
    false
);

/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(function (page) {
    page.classList.remove("active");
  });

  const selectedPage = document.getElementById(pageId);

  if (selectedPage) {
    selectedPage.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}


/* =========================================================
   HOME
========================================================= */

function goHome() {
  showPage("homePage");
}


/* =========================================================
   STORAGE
========================================================= */

function openStorage() {
  showPage("storagePage");
}


/* =========================================================
   TEMPORARY SECTIONS
========================================================= */

function showMessage(name) {
  alert(
    "تم اختيار قسم: " +
    name +
    "\n\nسيتم إضافة محتوى هذا القسم لاحقاً."
  );
}


/* =========================================================
   PURCHASES
========================================================= */

const PURCHASES_KEY = "nawafth_albnaa_purchases";


function getPurchases() {
  try {
    const saved = localStorage.getItem(PURCHASES_KEY);

    if (!saved) {
      return [];
    }

    const data = JSON.parse(saved);

    if (!Array.isArray(data)) {
      return [];
    }

    return data;

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

    return true;

  } catch (error) {
    console.error("خطأ في حفظ المشتريات:", error);
    return false;
  }
}


function openPurchases() {
  showPage("purchasesPage");

  closePurchaseForm();

  renderPurchases();
}


function openPurchaseForm() {
  const form = document.getElementById("purchaseForm");

  if (!form) {
    return;
  }

  form.style.display = "block";

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

  setTimeout(function () {
    if (item) {
      item.focus();
    }
  }, 100);
}


function closePurchaseForm() {
  const form = document.getElementById("purchaseForm");

  if (form) {
    form.style.display = "none";
  }
}


function addPurchase() {
  const itemInput =
    document.getElementById("purchaseItem");

  const unitInput =
    document.getElementById("purchaseUnit");

  const quantityInput =
    document.getElementById("purchaseQuantity");

  if (!itemInput || !unitInput || !quantityInput) {
    alert("تعذر العثور على حقول طلب الشراء.");
    return;
  }

  const item = itemInput.value.trim();
  const unit = unitInput.value.trim();
  const quantityText = quantityInput.value.trim();

  if (!item) {
    alert("يرجى إدخال المادة المطلوبة.");
    itemInput.focus();
    return;
  }

  if (!unit) {
    alert("يرجى إدخال الوحدة.");
    unitInput.focus();
    return;
  }

  if (!quantityText) {
    alert("يرجى إدخال العدد.");
    quantityInput.focus();
    return;
  }

  const quantity = Number(quantityText);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    alert("يرجى إدخال عدد أكبر من صفر.");
    quantityInput.focus();
    return;
  }

  const purchases = getPurchases();

  const newPurchase = {
    id: Date.now(),
    item: item,
    unit: unit,
    quantity: quantity,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  purchases.unshift(newPurchase);

  const saved = savePurchases(purchases);

  if (!saved) {
    alert("حدث خطأ أثناء حفظ طلب الشراء.");
    return;
  }

  itemInput.value = "";
  unitInput.value = "";
  quantityInput.value = "";

  closePurchaseForm();

  renderPurchases();

  alert("تمت إضافة طلب الشراء بنجاح.");
}


function renderPurchases() {
  const pendingList =
    document.getElementById("pendingPurchases");

  const completedList =
    document.getElementById("completedPurchases");

  if (!pendingList || !completedList) {
    return;
  }

  const purchases = getPurchases();

  const pending = purchases.filter(function (purchase) {
    return purchase.status !== "completed";
  });

  const completed = purchases.filter(function (purchase) {
    return purchase.status === "completed";
  });

  const pendingCount =
    document.getElementById("pendingPurchaseCount");

  const completedCount =
    document.getElementById("completedPurchaseCount");

  if (pendingCount) {
    pendingCount.textContent = pending.length;
  }

  if (completedCount) {
    completedCount.textContent = completed.length;
  }


  /* الطلبات الحالية */

  if (pending.length === 0) {

    pendingList.innerHTML =
      '<div class="empty-purchases">' +
        '<div class="empty-purchases-icon">🛒</div>' +
        '<strong>لا توجد طلبات شراء</strong>' +
        '<span>اضغط على "طلب شراء" لإضافة مادة جديدة</span>' +
      '</div>';

  } else {

    pendingList.innerHTML = pending
      .map(function (purchase) {
        return createPurchaseHTML(purchase);
      })
      .join("");
  }


  /* الطلبات المكتملة */

  if (completed.length === 0) {

    completedList.innerHTML =
      '<div class="empty-purchases completed-empty">' +
        '<div class="empty-purchases-icon">📦</div>' +
        '<strong>لا توجد مواد مجهزة</strong>' +
        '<span>الطلبات التي يتم شراؤها ستظهر هنا</span>' +
      '</div>';

  } else {

    completedList.innerHTML = completed
      .map(function (purchase) {
        return createCompletedPurchaseHTML(purchase);
      })
      .join("");
  }
}


function createPurchaseHTML(purchase) {
  const safeItem = escapeHTML(purchase.item);
  const safeUnit = escapeHTML(purchase.unit);
  const safeQuantity = escapeHTML(String(purchase.quantity));
  const date = formatPurchaseDate(purchase.createdAt);

  return (
    '<article class="purchase-card">' +

      '<div class="purchase-card-main">' +

        '<div class="purchase-item-icon">' +
          '🛒' +
        '</div>' +

        '<div class="purchase-item-details">' +

          '<h4>' +
            safeItem +
          '</h4>' +

          '<div class="purchase-details">' +

            '<span>' +
              'الوحدة: ' +
              '<strong>' +
                safeUnit +
              '</strong>' +
            '</span>' +

            '<span>' +
              'العدد: ' +
              '<strong>' +
                safeQuantity +
              '</strong>' +
            '</span>' +

          '</div>' +

          '<div class="purchase-created-date">' +
            date +
          '</div>' +

        '</div>' +

      '</div>' +

      '<button ' +
        'type="button" ' +
        'class="purchase-complete-button" ' +
        'onclick="completePurchase(' + purchase.id + ')" ' +
        'title="تأشير الطلب بأنه تم الشراء">' +

        '<span class="purchase-check-icon">✓</span>' +

        '<span>تم الشراء</span>' +

      '</button>' +

    '</article>'
  );
}


function createCompletedPurchaseHTML(purchase) {
  const safeItem = escapeHTML(purchase.item);
  const safeUnit = escapeHTML(purchase.unit);
  const safeQuantity = escapeHTML(String(purchase.quantity));
  const date = formatPurchaseDate(purchase.completedAt);

  return (
    '<article class="purchase-card completed-purchase-card">' +

      '<div class="purchase-card-main">' +

        '<div class="purchase-item-icon completed-purchase-icon">' +
          '✓' +
        '</div>' +

        '<div class="purchase-item-details">' +

          '<h4>' +
            safeItem +
          '</h4>' +

          '<div class="purchase-details">' +

            '<span>' +
              'الوحدة: ' +
              '<strong>' +
                safeUnit +
              '</strong>' +
            '</span>' +

            '<span>' +
              'العدد: ' +
              '<strong>' +
                safeQuantity +
              '</strong>' +
            '</span>' +

          '</div>' +

          '<div class="purchase-completed-label">' +
            '✓ تم تجهيزه' +
          '</div>' +

          '<div class="purchase-created-date">' +
            'تم الشراء: ' + date +
          '</div>' +

        '</div>' +

      '</div>' +

      '<button ' +
        'type="button" ' +
        'class="purchase-return-button" ' +
        'onclick="returnPurchase(' + purchase.id + ')" ' +
        'title="إرجاع الطلب">' +

        '↩' +

      '</button>' +

    '</article>'
  );
}


function completePurchase(purchaseId) {
  const purchases = getPurchases();

  const purchase = purchases.find(function (item) {
    return item.id === purchaseId;
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

  const saved = savePurchases(purchases);

  if (!saved) {
    alert("حدث خطأ أثناء تحديث الطلب.");
    return;
  }

  renderPurchases();
}


function returnPurchase(purchaseId) {
  const purchases = getPurchases();

  const purchase = purchases.find(function (item) {
    return item.id === purchaseId;
  });

  if (!purchase) {
    return;
  }

  const confirmed = confirm(
    "هل تريد إعادة هذه المادة إلى طلبات الشراء؟"
  );

  if (!confirmed) {
    return;
  }

  purchase.status = "pending";
  purchase.completedAt = null;

  const saved = savePurchases(purchases);

  if (!saved) {
    alert("حدث خطأ أثناء إعادة الطلب.");
    return;
  }

  renderPurchases();
}


function formatPurchaseDate(dateString) {
  if (!dateString) {
    return "";
  }

  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
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


/* =========================================================
   REPORTS
========================================================= */

const REPORTS_KEY =
  "nawafth_albnaa_daily_reports";


function getReports() {
  try {
    const savedReports =
      localStorage.getItem(REPORTS_KEY);

    if (!savedReports) {
      return [];
    }

    const reports =
      JSON.parse(savedReports);

    if (!Array.isArray(reports)) {
      return [];
    }

    return reports;

  } catch (error) {
    console.error(
      "خطأ في قراءة التقارير:",
      error
    );

    return [];
  }
}


function saveReports(reports) {
  try {
    localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify(reports)
    );

    return true;

  } catch (error) {
    console.error(
      "خطأ في حفظ التقارير:",
      error
    );

    return false;
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
  const dayInput =
    document.getElementById("reportDay");

  const dateInput =
    document.getElementById("reportDate");

  if (
    dateInput &&
    !dateInput.value
  ) {

    const today = new Date();

    const year = today.getFullYear();

    const month =
      String(today.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(today.getDate())
        .padStart(2, "0");

    dateInput.value =
      year + "-" +
      month + "-" +
      day;
  }

  if (
    dateInput &&
    dayInput &&
    dateInput.value
  ) {
    updateDayFromDate();
  }

  if (dateInput) {
    dateInput.onchange =
      updateDayFromDate;
  }
}


function updateDayFromDate() {
  const dateInput =
    document.getElementById("reportDate");

  const dayInput =
    document.getElementById("reportDay");

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
      "T12:00:00"
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
    days[date.getDay()];
}


function saveReport() {
  const dayInput =
    document.getElementById("reportDay");

  const dateInput =
    document.getElementById("reportDate");

  const textInput =
    document.getElementById("reportText");

  if (
    !dayInput ||
    !dateInput ||
    !textInput
  ) {
    return;
  }

  const day =
    dayInput.value.trim();

  const date =
    dateInput.value.trim();

  const text =
    textInput.value.trim();

  if (!day) {
    alert("يرجى اختيار اليوم.");
    dayInput.focus();
    return;
  }

  if (!date) {
    alert("يرجى اختيار التاريخ.");
    dateInput.focus();
    return;
  }

  if (!text) {
    alert("يرجى كتابة التقرير.");
    textInput.focus();
    return;
  }

  const reports = getReports();

  const newReport = {
    id: Date.now(),
    day: day,
    date: date,
    text: text,
    createdAt: new Date().toISOString()
  };

  reports.unshift(newReport);

  const saved =
    saveReports(reports);

  if (!saved) {
    alert("حدث خطأ أثناء حفظ التقرير.");
    return;
  }

  dayInput.value = "";
  dateInput.value = "";
  textInput.value = "";

  alert("تم حفظ التقرير بنجاح.");

  openReports();
}


function renderReports() {
  const reportsList =
    document.getElementById("reportsList");

  if (!reportsList) {
    return;
  }

  const reports = getReports();

  if (reports.length === 0) {

    reportsList.innerHTML =
      '<div class="empty-reports">' +
        '<div class="empty-reports-icon">📋</div>' +
        '<strong>لا توجد تقارير حالياً</strong>' +
        '<span>اضغط على "إضافة تقرير" لإنشاء أول تقرير</span>' +
      '</div>';

    return;
  }

  reportsList.innerHTML =
    reports
      .map(function (report) {
        return createReportHTML(report);
      })
      .join("");
}


function createReportHTML(report) {
  const safeDay =
    escapeHTML(report.day);

  const safeDate =
    formatDate(report.date);

  const safeText =
    escapeHTML(report.text);

  return (
    '<article class="report-card">' +

      '<div class="report-card-header">' +

        '<div class="report-date-box">' +

          '<div class="report-date-icon">' +
            '📅' +
          '</div>' +

          '<div class="report-date-text">' +

            '<strong>' +
              safeDay +
            '</strong>' +

            '<span>' +
              safeDate +
            '</span>' +

          '</div>' +

        '</div>' +

        '<button ' +
          'type="button" ' +
          'class="delete-report-button" ' +
          'onclick="deleteReport(' + report.id + ')" ' +
          'aria-label="حذف التقرير">' +
          '🗑️' +
        '</button>' +

      '</div>' +

      '<div class="report-body">' +

        '<div class="report-body-title">' +
          'تفاصيل التقرير' +
        '</div>' +

        '<div class="report-body-text">' +
          safeText +
        '</div>' +

      '</div>' +

    '</article>'
  );
}


function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts =
    dateString.split("-");

  if (parts.length !== 3) {
    return escapeHTML(dateString);
  }

  return (
    parts[2] +
    "/" +
    parts[1] +
    "/" +
    parts[0]
  );
}


function deleteReport(reportId) {
  const confirmed =
    confirm(
      "هل أنت متأكد من حذف هذا التقرير؟"
    );

  if (!confirmed) {
    return;
  }

  let reports = getReports();

  reports =
    reports.filter(function (report) {
      return report.id !== reportId;
    });

  saveReports(reports);

  renderReports();
}


/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   PREVENT DOUBLE TAP ZOOM
========================================================= */

document.addEventListener(
  "dblclick",
  function (event) {
    event.preventDefault();
  },
  {
    passive: false
  }
);

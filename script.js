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

```
selectedPage.classList.add("active");

window.scrollTo({
  top: 0,
  behavior: "smooth"
});
```

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
REPORT STORAGE KEY
========================================================= */

const REPORTS_KEY = "nawafth_albnaa_daily_reports";

/* =========================================================
GET REPORTS
========================================================= */

function getReports() {

try {

```
const savedReports =
  localStorage.getItem(REPORTS_KEY);

if (!savedReports) {

  return [];

}

return JSON.parse(savedReports);
```

} catch (error) {

```
console.error(
  "خطأ في قراءة التقارير:",
  error
);

return [];
```

}

}

/* =========================================================
SAVE REPORTS
========================================================= */

function saveReports(reports) {

try {

```
localStorage.setItem(
  REPORTS_KEY,
  JSON.stringify(reports)
);

return true;
```

} catch (error) {

```
console.error(
  "خطأ في حفظ التقارير:",
  error
);

return false;
```

}

}

/* =========================================================
OPEN REPORTS
========================================================= */

function openReports() {

showPage("reportsPage");

renderReports();

}

/* =========================================================
OPEN ADD REPORT
========================================================= */

function openAddReport() {

showPage("addReportPage");

prepareReportForm();

}

/* =========================================================
PREPARE REPORT FORM
========================================================= */

function prepareReportForm() {

const dayInput =
document.getElementById("reportDay");

const dateInput =
document.getElementById("reportDate");

const textInput =
document.getElementById("reportText");

if (
dateInput &&
!dateInput.value
) {

```
const today =
  new Date();

const year =
  today.getFullYear();

const month =
  String(
    today.getMonth() + 1
  ).padStart(2, "0");

const day =
  String(
    today.getDate()
  ).padStart(2, "0");

dateInput.value =
  `${year}-${month}-${day}`;
```

}

if (
dateInput &&
dayInput &&
dateInput.value
) {

```
updateDayFromDate();
```

}

if (dateInput) {

```
dateInput.onchange =
  updateDayFromDate;
```

}

}

/* =========================================================
UPDATE DAY FROM DATE
========================================================= */

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

```
return;
```

}

const date =
new Date(
dateInput.value +
"T12:00:00"
);

const days = [

```
"الأحد",
"الاثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"
```

];

const dayName =
days[date.getDay()];

dayInput.value =
dayName;

}

/* =========================================================
SAVE NEW REPORT
========================================================= */

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

```
return;
```

}

const day =
dayInput.value.trim();

const date =
dateInput.value.trim();

const text =
textInput.value.trim();

if (!day) {

```
alert(
  "يرجى اختيار اليوم."
);

dayInput.focus();

return;
```

}

if (!date) {

```
alert(
  "يرجى اختيار التاريخ."
);

dateInput.focus();

return;
```

}

if (!text) {

```
alert(
  "يرجى كتابة التقرير."
);

textInput.focus();

return;
```

}

const reports =
getReports();

const newReport = {

```
id:
  Date.now(),

day:
  day,

date:
  date,

text:
  text,

createdAt:
  new Date().toISOString()
```

};

reports.unshift(
newReport
);

const saved =
saveReports(reports);

if (!saved) {

```
alert(
  "حدث خطأ أثناء حفظ التقرير."
);

return;
```

}

dayInput.value = "";

dateInput.value = "";

textInput.value = "";

alert(
"تم حفظ التقرير بنجاح."
);

openReports();

}

/* =========================================================
DISPLAY REPORTS
========================================================= */

function renderReports() {

const reportsList =
document.getElementById("reportsList");

if (!reportsList) {

```
return;
```

}

const reports =
getReports();

if (
reports.length === 0
) {

```
reportsList.innerHTML = `

  <div class="empty-reports">

    <div class="empty-reports-icon">
      📋
    </div>

    <strong>
      لا توجد تقارير حالياً
    </strong>

    <span>
      اضغط على "إضافة تقرير" لإنشاء أول تقرير
    </span>

  </div>

`;

return;
```

}

reportsList.innerHTML =
reports
.map(function (report) {

```
    return createReportHTML(
      report
    );

  })
  .join("");
```

}

/* =========================================================
CREATE REPORT HTML
========================================================= */

function createReportHTML(report) {

const safeDay =
escapeHTML(
report.day
);

const safeDate =
formatDate(
report.date
);

const safeText =
escapeHTML(
report.text
);

return `

```
<article class="report-card">

  <div class="report-card-header">

    <div class="report-date-box">

      <div class="report-date-icon">
        📅
      </div>

      <div class="report-date-text">

        <strong>
          ${safeDay}
        </strong>

        <span>
          ${safeDate}
        </span>

      </div>

    </div>


    <button
      type="button"
      class="delete-report-button"
      onclick="deleteReport(${report.id})"
      aria-label="حذف التقرير"
      title="حذف التقرير"
    >
      🗑️
    </button>

  </div>


  <div class="report-body">

    <div class="report-body-title">
      تفاصيل التقرير
    </div>

    <div class="report-body-text">
      ${safeText}
    </div>

  </div>

</article>
```

`;

}

/* =========================================================
FORMAT DATE
========================================================= */

function formatDate(dateString) {

if (!dateString) {

```
return "";
```

}

const parts =
dateString.split("-");

if (
parts.length !== 3
) {

```
return escapeHTML(
  dateString
);
```

}

return (
parts[2] +
"/" +
parts[1] +
"/" +
parts[0]
);

}

/* =========================================================
DELETE REPORT
========================================================= */

function deleteReport(reportId) {

const confirmed =
confirm(
"هل أنت متأكد من حذف هذا التقرير؟"
);

if (!confirmed) {

```
return;
```

}

let reports =
getReports();

reports =
reports.filter(
function (report) {

```
    return report.id !== reportId;

  }
);
```

saveReports(
reports
);

renderReports();

}

# /* =========================================================

# PURCHASES

========================================================= */

/* =========================================================
PURCHASE STORAGE KEY
========================================================= */

const PURCHASES_KEY =
"nawafth_albnaa_purchases";

/* =========================================================
GET PURCHASES
========================================================= */

function getPurchases() {

try {

```
const savedPurchases =
  localStorage.getItem(
    PURCHASES_KEY
  );


if (!savedPurchases) {

  return [];

}


const purchases =
  JSON.parse(
    savedPurchases
  );


if (!Array.isArray(purchases)) {

  return [];

}


return purchases;
```

} catch (error) {

```
console.error(
  "خطأ في قراءة طلبات الشراء:",
  error
);

return [];
```

}

}

/* =========================================================
SAVE PURCHASES
========================================================= */

function savePurchases(purchases) {

try {

```
localStorage.setItem(
  PURCHASES_KEY,
  JSON.stringify(purchases)
);

return true;
```

} catch (error) {

```
console.error(
  "خطأ في حفظ طلبات الشراء:",
  error
);

return false;
```

}

}

/* =========================================================
OPEN PURCHASES
========================================================= */

function openPurchases() {

showPage(
"purchasesPage"
);

closePurchaseForm();

renderPurchases();

}

/* =========================================================
OPEN PURCHASE FORM
========================================================= */

function openPurchaseForm() {

const form =
document.getElementById(
"purchaseForm"
);

if (!form) {

```
return;
```

}

form.style.display =
"block";

const itemInput =
document.getElementById(
"purchaseItem"
);

if (itemInput) {

```
setTimeout(
  function () {

    itemInput.focus();

  },
  100
);
```

}

}

/* =========================================================
CLOSE PURCHASE FORM
========================================================= */

function closePurchaseForm() {

const form =
document.getElementById(
"purchaseForm"
);

if (form) {

```
form.style.display =
  "none";
```

}

}

/* =========================================================
ADD PURCHASE
========================================================= */

function addPurchase() {

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

```
return;
```

}

const item =
itemInput.value.trim();

const unit =
unitInput.value.trim();

const quantity =
quantityInput.value.trim();

/* التحقق من المادة */

if (!item) {

```
alert(
  "يرجى إدخال المادة المطلوبة."
);

itemInput.focus();

return;
```

}

/* التحقق من الوحدة */

if (!unit) {

```
alert(
  "يرجى إدخال الوحدة."
);

unitInput.focus();

return;
```

}

/* التحقق من العدد */

if (!quantity) {

```
alert(
  "يرجى إدخال العدد."
);

quantityInput.focus();

return;
```

}

const numericQuantity =
Number(quantity);

if (
!Number.isFinite(
numericQuantity
) ||
numericQuantity <= 0
) {

```
alert(
  "يرجى إدخال عدد صحيح أكبر من صفر."
);

quantityInput.focus();

return;
```

}

const purchases =
getPurchases();

const newPurchase = {

```
id:
  Date.now(),

item:
  item,

unit:
  unit,

quantity:
  numericQuantity,

status:
  "pending",

createdAt:
  new Date().toISOString(),

completedAt:
  null
```

};

purchases.unshift(
newPurchase
);

const saved =
savePurchases(
purchases
);

if (!saved) {

```
alert(
  "حدث خطأ أثناء حفظ طلب الشراء."
);

return;
```

}

/* تنظيف النموذج */

itemInput.value = "";

unitInput.value = "";

quantityInput.value = "";

closePurchaseForm();

/* تحديث القائمة */

renderPurchases();

alert(
"تمت إضافة طلب الشراء بنجاح."
);

}

/* =========================================================
RENDER PURCHASES
========================================================= */

function renderPurchases() {

const pendingList =
document.getElementById(
"pendingPurchases"
);

const completedList =
document.getElementById(
"completedPurchases"
);

if (
!pendingList ||
!completedList
) {

```
return;
```

}

const purchases =
getPurchases();

const pendingPurchases =
purchases.filter(
function (purchase) {

```
    return purchase.status === "pending";

  }
);
```

const completedPurchases =
purchases.filter(
function (purchase) {

```
    return purchase.status === "completed";

  }
);
```

/* العدد */

const pendingCount =
document.getElementById(
"pendingPurchaseCount"
);

const completedCount =
document.getElementById(
"completedPurchaseCount"
);

if (pendingCount) {

```
pendingCount.textContent =
  pendingPurchases.length;
```

}

if (completedCount) {

```
completedCount.textContent =
  completedPurchases.length;
```

}

/* الطلبات الحالية */

if (
pendingPurchases.length === 0
) {

```
pendingList.innerHTML = `

  <div class="empty-purchases">

    <div class="empty-purchases-icon">
      🛒
    </div>

    <strong>
      لا توجد طلبات شراء
    </strong>

    <span>
      اضغط على "طلب شراء" لإضافة مادة جديدة
    </span>

  </div>

`;
```

} else {

```
pendingList.innerHTML =
  pendingPurchases
    .map(
      function (purchase) {

        return createPurchaseHTML(
          purchase
        );

      }
    )
    .join("");
```

}

/* الطلبات المكتملة */

if (
completedPurchases.length === 0
) {

```
completedList.innerHTML = `

  <div class="empty-purchases completed-empty">

    <div class="empty-purchases-icon">
      📦
    </div>

    <strong>
      لا توجد مواد مجهزة
    </strong>

    <span>
      الطلبات التي يتم شراؤها ستظهر هنا
    </span>

  </div>

`;
```

} else {

```
completedList.innerHTML =
  completedPurchases
    .map(
      function (purchase) {

        return createCompletedPurchaseHTML(
          purchase
        );

      }
    )
    .join("");
```

}

}

/* =========================================================
CREATE PENDING PURCHASE HTML
========================================================= */

function createPurchaseHTML(
purchase
) {

const safeItem =
escapeHTML(
purchase.item
);

const safeUnit =
escapeHTML(
purchase.unit
);

const safeQuantity =
escapeHTML(
String(
purchase.quantity
)
);

return `

```
<article class="purchase-card">

  <div class="purchase-card-main">

    <div class="purchase-item-icon">
      🛍️
    </div>

    <div class="purchase-item-details">

      <h4>
        ${safeItem}
      </h4>

      <div class="purchase-details">

        <span>
          الوحدة:
          <strong>
            ${safeUnit}
          </strong>
        </span>

        <span>
          العدد:
          <strong>
            ${safeQuantity}
          </strong>
        </span>

      </div>

    </div>

  </div>


  <button
    type="button"
    class="purchase-complete-button"
    onclick="completePurchase(${purchase.id})"
    title="تأشير الطلب بأنه تم الشراء"
  >

    <span>
      ✓
    </span>

    <span>
      تم الشراء
    </span>

  </button>

</article>
```

`;

}

/* =========================================================
CREATE COMPLETED PURCHASE HTML
========================================================= */

function createCompletedPurchaseHTML(
purchase
) {

const safeItem =
escapeHTML(
purchase.item
);

const safeUnit =
escapeHTML(
purchase.unit
);

const safeQuantity =
escapeHTML(
String(
purchase.quantity
)
);

return `

```
<article class="purchase-card completed-purchase-card">

  <div class="purchase-card-main">

    <div class="purchase-item-icon completed-purchase-icon">
      ✓
    </div>

    <div class="purchase-item-details">

      <h4>
        ${safeItem}
      </h4>

      <div class="purchase-details">

        <span>
          الوحدة:
          <strong>
            ${safeUnit}
          </strong>
        </span>

        <span>
          العدد:
          <strong>
            ${safeQuantity}
          </strong>
        </span>

      </div>


      <div class="purchase-completed-label">

        ✓ تم تجهيزه

      </div>

    </div>

  </div>


  <button
    type="button"
    class="purchase-return-button"
    onclick="returnPurchase(${purchase.id})"
    title="إرجاع الطلب إلى الطلبات الحالية"
  >

    ↩

  </button>

</article>
```

`;

}

/* =========================================================
COMPLETE PURCHASE
========================================================= */

function completePurchase(
purchaseId
) {

const purchases =
getPurchases();

const purchase =
purchases.find(
function (item) {

```
    return item.id === purchaseId;

  }
);
```

if (!purchase) {

```
return;
```

}

const confirmed =
confirm(
"هل تم شراء المادة "" +
purchase.item +
""؟"
);

if (!confirmed) {

```
return;
```

}

purchase.status =
"completed";

purchase.completedAt =
new Date().toISOString();

const saved =
savePurchases(
purchases
);

if (!saved) {

```
alert(
  "حدث خطأ أثناء تحديث الطلب."
);

return;
```

}

renderPurchases();

}

/* =========================================================
RETURN PURCHASE
========================================================= */

function returnPurchase(
purchaseId
) {

const purchases =
getPurchases();

const purchase =
purchases.find(
function (item) {

```
    return item.id === purchaseId;

  }
);
```

if (!purchase) {

```
return;
```

}

purchase.status =
"pending";

purchase.completedAt =
null;

const saved =
savePurchases(
purchases
);

if (!saved) {

```
alert(
  "حدث خطأ أثناء إعادة الطلب."
);

return;
```

}

renderPurchases();

}

/* =========================================================
SECURITY
منع إدخال HTML داخل النصوص
========================================================= */

function escapeHTML(value) {

return String(value)

```
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
```

}

/* =========================================================
PREVENT DOUBLE TAP ZOOM
========================================================= */

document.addEventListener(
"dblclick",
function (event) {

```
event.preventDefault();
```

},
{
passive: false
}
);

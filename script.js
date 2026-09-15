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
   REPORT STORAGE KEY
========================================================= */

const REPORTS_KEY = "nawafth_albnaa_daily_reports";


/* =========================================================
   GET REPORTS
========================================================= */

function getReports() {

  try {

    const savedReports =
      localStorage.getItem(REPORTS_KEY);

    if (!savedReports) {

      return [];

    }

    return JSON.parse(savedReports);

  } catch (error) {

    console.error(
      "خطأ في قراءة التقارير:",
      error
    );

    return [];

  }

}


/* =========================================================
   SAVE REPORTS
========================================================= */

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


  /*
     إذا الحقول فارغة،
     نضع تاريخ اليوم تلقائياً
  */

  if (
    dateInput &&
    !dateInput.value
  ) {

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

  }


  /*
     اختيار اليوم تلقائياً
     حسب التاريخ
  */

  if (
    dateInput &&
    dayInput &&
    dateInput.value
  ) {

    updateDayFromDate();

  }


  /*
     عند تغيير التاريخ
     يتغير اليوم تلقائياً
  */

  if (dateInput) {

    dateInput.onchange =
      updateDayFromDate;

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

    return;

  }


  const day =
    dayInput.value.trim();

  const date =
    dateInput.value.trim();

  const text =
    textInput.value.trim();


  /* التحقق من اليوم */

  if (!day) {

    alert(
      "يرجى اختيار اليوم."
    );

    dayInput.focus();

    return;

  }


  /* التحقق من التاريخ */

  if (!date) {

    alert(
      "يرجى اختيار التاريخ."
    );

    dateInput.focus();

    return;

  }


  /* التحقق من التقرير */

  if (!text) {

    alert(
      "يرجى كتابة التقرير."
    );

    textInput.focus();

    return;

  }


  /*
     قراءة التقارير الموجودة
  */

  const reports =
    getReports();


  /*
     إنشاء التقرير الجديد
  */

  const newReport = {

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

  };


  /*
     إضافة التقرير في البداية
  */

  reports.unshift(
    newReport
  );


  /*
     الحفظ
  */

  const saved =
    saveReports(reports);


  if (!saved) {

    alert(
      "حدث خطأ أثناء حفظ التقرير."
    );

    return;

  }


  /*
     تنظيف الحقول
  */

  dayInput.value = "";

  dateInput.value = "";

  textInput.value = "";


  /*
     رسالة نجاح
  */

  alert(
    "تم حفظ التقرير بنجاح."
  );


  /*
     العودة إلى قائمة التقارير
  */

  openReports();

}


/* =========================================================
   DISPLAY REPORTS
========================================================= */

function renderReports() {

  const reportsList =
    document.getElementById("reportsList");


  if (!reportsList) {

    return;

  }


  const reports =
    getReports();


  /*
     لا توجد تقارير
  */

  if (
    reports.length === 0
  ) {

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

  }


  /*
     عرض التقارير
  */

  reportsList.innerHTML =
    reports
      .map(function (report) {

        return createReportHTML(
          report
        );

      })
      .join("");

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

  `;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateString) {

  if (!dateString) {

    return "";

  }


  const parts =
    dateString.split("-");


  if (
    parts.length !== 3
  ) {

    return escapeHTML(
      dateString
    );

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

    return;

  }


  let reports =
    getReports();


  reports =
    reports.filter(
      function (report) {

        return report.id !== reportId;

      }
    );


  saveReports(
    reports
  );


  renderReports();

}


/* =========================================================
   SECURITY
   منع إدخال HTML داخل التقرير
========================================================= */

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

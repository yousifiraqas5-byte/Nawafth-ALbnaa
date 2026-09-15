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
   OPEN STORAGE
========================================================= */

function openStorage() {

  showPage("storagePage");

}


/* =========================================================
   RETURN HOME
========================================================= */

function goHome() {

  showPage("homePage");

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
   PREVENT DOUBLE TAP ZOOM
========================================================= */

document.addEventListener(
  "dblclick",
  function (event) {

    event.preventDefault();

  },
  { passive: false }
);

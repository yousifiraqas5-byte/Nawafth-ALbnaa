```javascript
// ==========================================
// التنقل بين الصفحات
// ==========================================

function showPage(pageId) {

  // إخفاء كل الصفحات
  document.querySelectorAll(".page").forEach(function(page) {
    page.classList.remove("active");
  });

  // إظهار الصفحة المطلوبة
  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  // الرجوع إلى أعلى الصفحة
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==========================================
// فتح المخازن
// ==========================================

function openStorage() {

  showPage("storagePage");

}


// ==========================================
// الرجوع للرئيسية
// ==========================================

function goHome() {

  showPage("homePage");

}


// ==========================================
// الأقسام التي لم نبرمج صفحاتها بعد
// ==========================================

function showMessage(name) {

  alert(
    "تم اختيار قسم: " + name +
    "\n\nسيتم إضافة محتوى هذا القسم لاحقاً."
  );

}
```

```javascript
// فتح صفحة المخازن
function openStorage() {
  document.getElementById("homePage").classList.remove("active");
  document.getElementById("storagePage").classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// الرجوع إلى الصفحة الرئيسية
function goHome() {
  document.getElementById("storagePage").classList.remove("active");
  document.getElementById("homePage").classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// اختيار قسم
function showMessage(name) {
  alert("تم اختيار: " + name);
}
```

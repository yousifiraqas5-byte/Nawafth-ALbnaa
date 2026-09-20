// شركة نوافذ البناء - فحص ترميز الملفات
// ============================================================
// الغرض: كشف أي تلف في الترميز قبل نشره على الواجهة، مثل تحوّل النصوص
// العربية إلى علامتَي استفهام متتاليتين أو محارف تالفة (U+FFFD) بسبب حفظ
// الملف بترميز ANSI/Windows-1252 بدل UTF-8.
//
// الاستخدام:  node check_encoding.js
// يطبع تقريرًا لكل ملف، ويعيد رمز خروج 1 إذا وُجد أي تلف.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SKIP_DIRS = new Set([".git", "node_modules", "vendor", ".kilo", ".firebase", "functions"]);
const CHECK_EXT = /\.(js|html|css|json|md|txt|rules)$/i;
// عمود عدد تسلسلات: علامة استفهام مرتين متتاليتين (يُبنى دون كتابتها حرفيًا
// حتى لا يكتشف الفاحص نفسه).
const DOUBLE_QUESTION_LABEL = String.fromCharCode(0x3f, 0x3f);

function collectFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (CHECK_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

// كشف البايتات غير الصالحة كتسلسل UTF-8 (ناتجة عن الحفظ بترميز ANSI)
function countInvalidUtf8(buf) {
  let invalid = 0;
  for (let i = 0; i < buf.length; ) {
    const byte = buf[i];
    if (byte < 0x80) {
      i += 1;
      continue;
    }
    let length = 0;
    if (byte >= 0xc2 && byte <= 0xdf) length = 2;
    else if (byte >= 0xe0 && byte <= 0xef) length = 3;
    else if (byte >= 0xf0 && byte <= 0xf4) length = 4;
    let valid = length > 0;
    if (valid) {
      for (let k = 1; k < length; k += 1) {
        if (i + k >= buf.length || buf[i + k] < 0x80 || buf[i + k] > 0xbf) {
          valid = false;
          break;
        }
      }
    }
    if (valid) i += length;
    else {
      invalid += 1;
      i += 1;
    }
  }
  return invalid;
}

function analyse(file) {
  const buf = fs.readFileSync(file);
  const text = buf.toString("utf8");
  let replacement = 0;
  let doubleQuestion = 0;
  let arabic = 0;
  for (let i = 0; i < buf.length; i += 1) {
    if (buf[i] === 0xef && buf[i + 1] === 0xbf && buf[i + 2] === 0xbd) replacement += 1;
    if (buf[i] === 0x3f && buf[i + 1] === 0x3f) doubleQuestion += 1;
  }
  arabic = (text.match(/[\u0600-\u06ff]/g) || []).length;
  return {
    file: path.relative(ROOT, file).replace(/\\/g, "/"),
    replacement,
    doubleQuestion,
    invalid: countInvalidUtf8(buf),
    arabic,
    size: buf.length
  };
}

const files = collectFiles(ROOT, []);
let problems = 0;
const rows = files
  .map(analyse)
  .sort((a, b) => b.arabic - a.arabic || a.file.localeCompare(b.file));

console.log(
  "ملف".padEnd(34) +
    "عربي".padStart(8) +
    "U+FFFD".padStart(9) +
    DOUBLE_QUESTION_LABEL.padStart(7) +
    "بايت تالف".padStart(10)
);
console.log("-".repeat(70));
for (const row of rows) {
  const broken = row.replacement > 0 || row.doubleQuestion > 0 || row.invalid > 0;
  if (broken) problems += 1;
  console.log(
    row.file.padEnd(34) +
      String(row.arabic).padStart(8) +
      String(row.replacement).padStart(9) +
      String(row.doubleQuestion).padStart(7) +
      String(row.invalid).padStart(10) +
      (broken ? "   <-- تالف" : "")
  );
}

console.log("-".repeat(70));
if (problems === 0) {
  console.log("النتيجة: لا يوجد تلف في الترميز. جميع الملفات UTF-8 سليمة.");
  process.exit(0);
}
console.log("النتيجة: يوجد " + problems + " ملف فيه تلف. أعد حفظ الملف بترميز UTF-8.");
process.exit(1);
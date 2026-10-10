// تشغيل: node tests/fuel-calc.test.js
const assert = require("assert");
const F = require("../fuel-calc.js");

let passed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log("  ✓", name); }
  catch (e) { console.error("  ✗", name, "\n   ", e.message); process.exitCode = 1; }
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ` expected ${b}±${tol}, got ${a}`);
const def = (id) => F.DEFINITIONS.find((d) => d.id === id);
const geo38 = def("hospitalGenerator"), geoComplex = def("complexGenerator"), geoRect = def("boiler1");

console.log("التعريفات");
t("الإجمالي الاسمي 86,000 لتر وسبعة خزانات", () => {
  assert.strictEqual(F.TOTAL_NOMINAL_L, 86000);
  assert.strictEqual(F.DEFINITIONS.length, 7);
  // الكبيرة 1-4 ثم الصغيرة الممتلئة دائماً 5-7
  assert.deepStrictEqual(F.DEFINITIONS.map((d) => d.no), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepStrictEqual(F.DEFINITIONS.map((d) => d.id), ["hospitalGenerator", "complexGenerator", "boiler1", "boiler2", "tank1", "tank2", "tank3"]);
});
t("المعرّفات القديمة محفوظة", () => {
  ["hospitalGenerator", "complexGenerator", "boiler1", "boiler2"].forEach((id) => assert.ok(def(id), id));
});

console.log("أسطواني أفقي — خزان 38,000 (L=7.75, D=2.5)");
t("السعة الهندسية ≈ 38,043 لتر", () => near(F.geometricCapacityL(geo38), 38043, 1));
t("h=0 → 0", () => assert.strictEqual(F.cylinderVolumeL(7.75, 2.5, 0), 0));
t("h=r → نصف الحجم", () => near(F.cylinderVolumeL(7.75, 2.5, 1.25), F.geometricCapacityL(geo38) / 2, 0.01));
t("h=D → الحجم الكامل", () => near(F.cylinderVolumeL(7.75, 2.5, 2.5), F.geometricCapacityL(geo38), 0.01));
t("المسافة = القطر → فارغ", () => {
  const r = F.computeReading(geo38, "top_distance", "250", "cm");
  assert.ok(r.ok); assert.strictEqual(r.volumeL, 0); assert.strictEqual(r.levelM, 0);
});
t("المسافة = 0 → ممتلئ هندسياً", () => {
  const r = F.computeReading(geo38, "top_distance", "0", "cm");
  assert.ok(r.ok); near(r.volumeL, 38043, 1); near(r.levelM, 2.5, 1e-9);
});
t("المسافة 125 سم → h = 1.25 م ونصف الحجم", () => {
  const r = F.computeReading(geo38, "top_distance", "125", "cm");
  near(r.levelM, 1.25, 1e-9); near(r.volumeL, 19021.5, 1);
});
t("اللاخطية: ربع الارتفاع ≠ ربع الحجم", () => {
  const r = F.computeReading(geo38, "top_distance", "187.5", "cm"); // h = 0.625
  assert.ok(Math.abs(r.volumeL / 38043 - 0.25) > 0.02);
  // قيمة مرجعية محسوبة بتكامل عددي مستقل (انظر اختبار التكامل أدناه)
  let area = 0; const n = 400000, rr = 1.25, h = 0.625;
  for (let i = 0; i < n; i++) { const y = (i + 0.5) / n * h; area += 2 * Math.sqrt(Math.max(0, rr * rr - (rr - y) ** 2)) * (h / n); }
  near(r.volumeL, 7.75 * area * 1000, 0.5);
});
t("التطابق مع تكامل عددي", () => {
  const L = 7.75, r = 1.25, h = 0.9; let area = 0; const n = 200000;
  for (let i = 0; i < n; i++) { const y = (i + 0.5) / n * h; area += 2 * Math.sqrt(Math.max(0, r * r - (r - y) ** 2)) * (h / n); }
  near(F.cylinderVolumeL(L, 2.5, h), L * area * 1000, 0.5);
});
t("الحجم متزايد رتيباً مع الارتفاع", () => {
  let prev = -1; for (let h = 0; h <= 2.5; h += 0.05) { const v = F.cylinderVolumeL(7.75, 2.5, h); assert.ok(v >= prev); prev = v; }
});

console.log("أسطواني أفقي — المجمع (L=3.2, D=2.3)");
t("السعة الهندسية ≈ 13,295 لتر (π·1.15²·3.2؛ الرقم المذكور 13,294 تقريبي)", () => near(F.geometricCapacityL(geoComplex), 13295.2, 0.5));
t("المسافة من الأعلى: h = 2.3 − d", () => {
  const r = F.computeReading(geoComplex, "top_distance", "115", "cm");
  near(r.levelM, 1.15, 1e-9); near(r.volumeL, F.geometricCapacityL(geoComplex) / 2, 1);
});
t("إذا كانت القراءة ارتفاعاً مباشراً لا تُطرح من القطر", () => {
  const r = F.computeReading(geoComplex, "level_height", "115", "cm");
  near(r.levelM, 1.15, 1e-9);
});

console.log("مستطيل — 3×3×1.5");
t("السعة 13,500", () => assert.strictEqual(F.geometricCapacityL(geoRect), 13500));
t("h=0 → 0", () => assert.strictEqual(F.computeReading(geoRect, "level_height", "0", "cm").volumeL, 0));
t("h=1.5 م → 13,500", () => assert.strictEqual(F.computeReading(geoRect, "level_height", "150", "cm").volumeL, 13500));
t("خطي: 75 سم → 6,750", () => assert.strictEqual(F.computeReading(geoRect, "level_height", "75", "cm").volumeL, 6750));
t("خطي: 30 سم = ٢× 15 سم", () => {
  const a = F.computeReading(geoRect, "level_height", "15", "cm").volumeL;
  const b = F.computeReading(geoRect, "level_height", "30", "cm").volumeL;
  assert.strictEqual(b, 2 * a);
});

console.log("الإدخال والتحقق");
t("سنتيمتر ومتر يعطيان النتيجة نفسها", () => {
  const a = F.computeReading(geoRect, "level_height", "75", "cm");
  const b = F.computeReading(geoRect, "level_height", "0.75", "m");
  assert.strictEqual(a.volumeL, b.volumeL);
});
t("قيمة سالبة مرفوضة", () => assert.ok(!F.computeReading(geoRect, "level_height", "-5", "cm").ok));
t("أكبر من الحد مرفوضة (رتفاع)", () => assert.ok(!F.computeReading(geoRect, "level_height", "151", "cm").ok));
t("أكبر من القطر مرفوضة (مسافة)", () => assert.ok(!F.computeReading(geo38, "top_distance", "251", "cm").ok));
t("خطأ الوحدة (150 متر) مرفوض برسالة", () => {
  const r = F.computeReading(geoRect, "level_height", "150", "m");
  assert.ok(!r.ok); assert.ok(/خارج الحدود/.test(r.error));
});
t("حقل فارغ", () => { assert.ok(!F.computeReading(geoRect, "level_height", "", "cm").ok); assert.ok(!F.computeReading(geoRect, "level_height", null, "cm").ok); });
t("قيم غير رقمية", () => ["abc", "12x", "1e3", "NaN", "Infinity", "--5"].forEach((v) => assert.ok(!F.computeReading(geoRect, "level_height", v, "cm").ok, v)));
t("أرقام عربية وفاصلة عربية", () => {
  assert.strictEqual(F.parseInput("٧٥").value, 75);
  assert.strictEqual(F.parseInput("٧٥٫٥").value, 75.5);
  assert.strictEqual(F.parseInput("75,5").value, 75.5);
});
t("هندسة ناقصة ← خطأ وليس رقماً", () => assert.ok(!F.computeReading(null, "top_distance", "10", "cm").ok));
t("طريقة قياس غير معروفة", () => assert.ok(!F.computeReading(geoRect, "x", "10", "cm").ok));

console.log("حالة الخزان والإجماليات");
const now = new Date("2026-10-10T10:00:00Z");
const S = F.DEFAULT_SETTINGS;
const mk = (id, doc) => F.deriveTankState(def(id), doc, S, now);
t("بلا وثيقة → no_reading (وليس صفراً)", () => {
  const s = mk("hospitalGenerator", undefined);
  assert.strictEqual(s.status, "no_reading"); assert.strictEqual(s.volumeL, null);
});
t("الخزانات الصغيرة (tank1-3): أبعادها مسجلة والسعة الهندسية = الاسمية", () => ["tank1", "tank2", "tank3"].forEach((id) => {
  assert.strictEqual(mk(id, {}).geomCapacityL, def(id).nominalL, id);
}));
t("الخزانات الصغيرة (tank1-3) ممتلئة دائماً: كمية = الاسمية، فارغ 0، 100%، بلا قراءة", () => ["tank1", "tank2", "tank3"].forEach((id) => {
  const s = mk(id, undefined);
  assert.strictEqual(s.status, "ok", id); assert.strictEqual(s.source, "always_full", id);
  assert.strictEqual(s.volumeL, def(id).nominalL, id); assert.strictEqual(s.emptyL, 0, id);
  assert.strictEqual(s.percent, 100, id); assert.strictEqual(s.stale, false, id); assert.strictEqual(s.overflowL, 0, id);
}));
t("ممتلئ دائماً: تتجاهل أي قراءة محفوظة ولا تنتج تنبيهات", () => {
  const s = mk("tank3", { reading: { value: 10, unit: "cm", method: "level_height" }, updatedAt: new Date("2020-01-01") });
  assert.strictEqual(s.volumeL, 4000);
  const states = ["tank1", "tank2", "tank3"].map((id) => mk(id, undefined));
  assert.strictEqual(F.buildAlerts(states, S, now).length, 0);
});
t("tank1 (1×1×2): 100 سم → 1,000 لتر، 200 سم → 2,000", () => {
  assert.strictEqual(F.computeReading(F.getGeometry(def("tank1")), "level_height", "100", "cm").volumeL, 1000);
  assert.strictEqual(F.computeReading(F.getGeometry(def("tank1")), "level_height", "200", "cm").volumeL, 2000);
  assert.ok(!F.computeReading(F.getGeometry(def("tank1")), "level_height", "201", "cm").ok);
});
t("tank3 (2×1×2): 100 سم → 2,000 لتر، 200 سم → 4,000", () => {
  assert.strictEqual(F.computeReading(F.getGeometry(def("tank3")), "level_height", "100", "cm").volumeL, 2000);
  assert.strictEqual(F.computeReading(F.getGeometry(def("tank3")), "level_height", "200", "cm").volumeL, 4000);
});
t("إعداد config لخزان بلا أبعاد (تعريف تجريبي)", () => {
  const d = { id: "x", no: 9, name: "خزان", nominalL: 1000, shape: null, method: null, legacyQuantityOk: false };
  const cfg = { shape: "rect", lengthM: 1, widthM: 1, heightM: 2, method: "level_height" };
  const s = F.deriveTankState(d, { config: cfg, reading: { value: 100, unit: "cm", method: "level_height" } }, S, now);
  assert.strictEqual(s.status, "ok"); assert.strictEqual(s.volumeL, 1000);
  assert.strictEqual(F.deriveTankState(d, {}, S, now).status, "no_geometry");
  assert.strictEqual(F.deriveTankState(d, { config: { shape: "rect", lengthM: 0, widthM: 1, heightM: 1, method: "level_height" } }, S, now).status, "no_geometry");
});
t("القيمة القديمة (لتر) للخزان 38,000 تُهمل", () => assert.strictEqual(mk("hospitalGenerator", { quantity: 20000 }).status, "no_reading"));
t("القيمة القديمة للمجمع تُهمل", () => assert.strictEqual(mk("complexGenerator", { quantity: 9000 }).status, "no_reading"));
t("القيمة القديمة للبويلر تُقبل كقراءة قديمة", () => {
  const s = mk("boiler1", { quantity: 6750 });
  assert.strictEqual(s.status, "ok"); assert.strictEqual(s.source, "legacy"); assert.strictEqual(s.volumeL, 6750); near(s.levelM, 0.75, 1e-9);
});
t("قيمة قديمة أكبر من السعة تُرفض", () => assert.strictEqual(mk("boiler1", { quantity: 20000 }).status, "no_reading"));
t("قراءة جديدة تُعاد من القيمة الخام", () => {
  const s = mk("hospitalGenerator", { reading: { value: 125, unit: "cm", method: "top_distance" }, updatedAt: new Date("2026-10-09T10:00:00Z") });
  assert.strictEqual(s.status, "ok"); assert.strictEqual(s.source, "reading"); near(s.volumeL, 19021.5, 1);
  near(s.emptyL, 38000 - 19021.5, 1); near(s.percent, 50.06, 0.01); assert.strictEqual(s.stale, false);
});
t("قراءة قديمة (> 7 أيام) = stale", () => {
  const s = mk("boiler1", { reading: { value: 75, unit: "cm", method: "level_height" }, updatedAt: new Date("2026-10-01T00:00:00Z") });
  assert.strictEqual(s.stale, true);
});
t("تجاوز السعة الاسمية يُظهر تنبيه error", () => {
  const s = mk("hospitalGenerator", { reading: { value: 0, unit: "cm", method: "top_distance" } });
  near(s.overflowL, 43, 1); assert.strictEqual(s.emptyL, 0);
  assert.ok(F.buildAlerts([s], S, now).some((a) => a.code === "overflow" && a.level === "error"));
});
t("الإجمالي غير مكتمل لا يعتبر الناقص صفراً", () => {
  const states = F.DEFINITIONS.map((d) => mk(d.id, d.id === "boiler1" ? { quantity: 6750 } : undefined));
  const tot = F.computeTotals(states);
  // الخزانات 1-3 ممتلئة دائماً (8,000 لتر) + بويلر 1 (6,750 من 13,500)
  assert.strictEqual(tot.complete, false); assert.strictEqual(tot.countedCount, 4);
  assert.strictEqual(tot.availableL, 14750); assert.strictEqual(tot.emptyL, 6750);
  assert.strictEqual(tot.nominalL, 86000); assert.strictEqual(tot.missingIds.length, 3);
  near(tot.percent, 14750 / 21500 * 100, 1e-9); assert.strictEqual(tot.percentBasis, "counted");
});
t("الإجمالي المكتمل: ÷ 86,000 والمتوفر + الفارغ = 86,000", () => {
  const docs = {
    tank1: { reading: { value: 100, unit: "cm", method: "level_height" } }, // 1000 من 2000
    tank2: { reading: { value: 100, unit: "cm", method: "level_height" } },
    tank3: { reading: { value: 100, unit: "cm", method: "level_height" } }, // 2000 من 4000
    hospitalGenerator: { reading: { value: 125, unit: "cm", method: "top_distance" } },
    complexGenerator: { reading: { value: 115, unit: "cm", method: "top_distance" } },
    boiler1: { reading: { value: 75, unit: "cm", method: "level_height" } },
    boiler2: { reading: { value: 75, unit: "cm", method: "level_height" } }
  };
  const states = F.DEFINITIONS.map((d) => mk(d.id, docs[d.id]));
  states.forEach((s) => assert.strictEqual(s.status, "ok", s.id));
  const tot = F.computeTotals(states);
  assert.strictEqual(tot.complete, true);
  near(tot.availableL + tot.emptyL, 86000, 0.5);
  near(tot.percent, tot.availableL / 86000 * 100, 1e-9); assert.strictEqual(tot.percentBasis, "all");
});
t("تنبيهات: منخفض/مرتفع/اختلاف هندسي", () => {
  const low = mk("boiler1", { reading: { value: 15, unit: "cm", method: "level_height" }, updatedAt: now });
  const high = mk("boiler2", { reading: { value: 145, unit: "cm", method: "level_height" }, updatedAt: now });
  const cx = mk("complexGenerator", { reading: { value: 115, unit: "cm", method: "top_distance" }, updatedAt: now });
  const codes = F.buildAlerts([low, high, cx], S, now).map((a) => a.code);
  assert.ok(codes.includes("low")); assert.ok(codes.includes("high")); assert.ok(codes.includes("geom_diff"));
});
t("الإعدادات: قيم غير صالحة ترجع للافتراضي", () => {
  const m = F.mergeSettings({ lowPercent: "x", highPercent: 80, staleDays: -1 });
  assert.strictEqual(m.lowPercent, 20); assert.strictEqual(m.highPercent, 80); assert.strictEqual(m.staleDays, 7);
});

console.log(`\n${passed} اختباراً نجح` + (process.exitCode ? " — مع إخفاقات" : ""));

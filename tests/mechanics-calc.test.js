// تشغيل: node tests/mechanics-calc.test.js
const assert = require("assert");
const M = require("../mechanics-calc.js");

let passed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log("  ✓", name); }
  catch (e) { console.error("  ✗", name, "\n   ", e.message); process.exitCode = 1; }
}

console.log("الأقسام الميكانيكية");
t("خمسة أقسام بمعرّفات صحيحة", () => {
  assert.strictEqual(M.DEPARTMENTS.length, 5);
  assert.deepStrictEqual(
    M.DEPARTMENTS.map((d) => d.id),
    ["fire-fighting", "medical-air", "hvac", "water-supply", "sewage-drainage"]
  );
});
t("deptName / deptExists", () => {
  assert.strictEqual(M.deptName("hvac"), "التكييف والتهوية");
  assert.ok(M.deptExists("fire-fighting"));
  assert.ok(!M.deptExists("kitchen"));
});
t("أنواع كل قسم متوفرة", () => {
  assert.ok(M.deptTypes("fire-fighting").includes("Fire Pumps"));
  assert.ok(M.deptTypes("water-supply").includes("Water Tanks"));
  assert.ok(M.deptTypes("sewage-drainage").includes("Sump Pumps"));
});

console.log("أرقام أوامر العمل");
t("buildOrderNumber يضيف أصفاراً", () => {
  assert.strictEqual(M.buildOrderNumber("MECH", 7, 2026), "MECH-2026-0007");
  assert.strictEqual(M.buildOrderNumber("ff", 1234, 2025), "FF-2025-1234");
  assert.strictEqual(M.buildOrderNumber("MECH", 0, 2026), "MECH-2026-0001");
});

console.log("حساب موعد الاستحقاق");
t("MONTHLY = +30 يوم", () => {
  const nd = M.computeNextDue("2026-01-01", "MONTHLY");
  assert.strictEqual(nd.getMonth(), 0); // يبقى يناير
  assert.strictEqual(nd.getDate(), 31);
});
t("WEEKLY = +7 أيام", () => {
  const nd = M.computeNextDue("2026-01-01", "WEEKLY");
  assert.strictEqual(nd.getDate(), 8);
});
t("CUSTOM يحتاج أياماً موجبة", () => {
  assert.strictEqual(M.computeNextDue("2026-01-01", "CUSTOM", 45).getDate(), 15);
  assert.strictEqual(M.computeNextDue("2026-01-01", "CUSTOM", 0), null);
});
t("بلا تاريخ أساس = null", () => {
  assert.strictEqual(M.computeNextDue(null, "MONTHLY"), null);
});

console.log("حالة الصيانة");
t("OVERDUE / DUE_SOON / UPCOMING", () => {
  const ref = new Date("2026-06-10");
  assert.strictEqual(M.pmStatus("2026-06-01", ref), "OVERDUE");
  assert.strictEqual(M.pmStatus("2026-06-12", ref), "DUE_SOON");
  assert.strictEqual(M.pmStatus("2026-07-01", ref), "UPCOMING");
  assert.strictEqual(M.pmStatus(null, ref), "NONE");
});

console.log("الإحصائيات");
t("computeStats يحسب كل الحقول", () => {
  const s = M.computeStats({
    equipment: [{ status: "OPERATIONAL" }, { status: "STOPPED" }, { status: "OUT_OF_SERVICE" }],
    orders: [{ status: "NEW" }, { status: "IN PROGRESS" }, { status: "AWAITING PARTS" }, { status: "COMPLETE" }],
    plans: [
      { active: true, nextDue: "2020-01-01" },  // متأخرة
      { active: true, nextDue: "2099-01-01" },  // قادمة
      { active: false, nextDue: "2020-01-01" }  // معطلة لا تُحسب
    ]
  });
  assert.strictEqual(s.totalEquipment, 3);
  assert.strictEqual(s.operationalEquipment, 1);
  assert.strictEqual(s.stoppedEquipment, 2);
  assert.strictEqual(s.openOrders, 3);
  assert.strictEqual(s.tasksInProgress, 1);
  assert.strictEqual(s.tasksAwaitingParts, 1);
  assert.strictEqual(s.completedOrders, 1);
  assert.strictEqual(s.overdueMaintenance, 1);
});

console.log("الأعمال التي تحتاج إلى متابعة");
t("مرتبة بالأولوية", () => {
  const items = M.buildFollowUpList({
    orders: [
      { id: "1", title: "منخفضة", priority: "LOW", status: "NEW" },
      { id: "2", title: "حرجة", priority: "CRITICAL", status: "NEW" },
      { id: "3", title: "مكتمل", priority: "CRITICAL", status: "COMPLETE" }
    ],
    plans: []
  });
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].priority, "CRITICAL");
  assert.strictEqual(items[1].priority, "LOW");
});

console.log("التحقق من صحة السجلات");
t("validateEquipment", () => {
  assert.ok(M.validateEquipment({}).name);
  assert.ok(M.validateEquipment({ name: "x" }).department);
  assert.deepStrictEqual(M.validateEquipment({ name: "x", department: "hvac" }), {});
});
t("validateOrder", () => {
  assert.ok(M.validateOrder({}).title);
  assert.deepStrictEqual(M.validateOrder({ title: "t", department: "hvac" }), {});
});
t("validatePlan — الفترة المخصصة تحتاج أياماً", () => {
  assert.ok(M.validatePlan({ equipmentId: "e", period: "CUSTOM" }).customDays);
  assert.deepStrictEqual(M.validatePlan({ equipmentId: "e", period: "MONTHLY" }), {});
});
t("validateSpare", () => {
  assert.ok(M.validateSpare({}).name);
  assert.ok(M.validateSpare({ name: "p", quantityRequired: -1 }).quantityRequired);
  assert.deepStrictEqual(M.validateSpare({ name: "p", quantityRequired: 2 }), {});
});

console.log("التصفية");
t("filterEquipment بالقسم والبحث", () => {
  const eq = [
    { id: "1", name: "مضخة", department: "fire-fighting", tagNumber: "FP-01" },
    { id: "2", name: "مبرد", department: "hvac", tagNumber: "CH-01" }
  ];
  assert.strictEqual(M.filterEquipment(eq, { department: "hvac" }).length, 1);
  assert.strictEqual(M.filterEquipment(eq, { search: "FP-01" }).length, 1);
});
t("filterOrders بالحالة والأولوية", () => {
  const ord = [
    { id: "1", status: "NEW", priority: "HIGH" },
    { id: "2", status: "COMPLETE", priority: "HIGH" }
  ];
  assert.strictEqual(M.filterOrders(ord, { status: "NEW" }).length, 1);
  assert.strictEqual(M.filterOrders(ord, { priority: "HIGH" }).length, 2);
});

console.log("CSV");
t("toCsv يهرّب الفواصل وعلامات التنصيص", () => {
  const csv = M.toCsv(["a", "b"], [["x,y", 'q"z']]);
  assert.ok(csv.startsWith("a,b"));
  assert.ok(csv.includes('"x,y"'));
  assert.ok(csv.includes('"q""z"'));
});
t("csvWithBom يضيف BOM", () => {
  assert.ok(M.csvWithBom("x").charCodeAt(0) === 0xfeff);
});

console.log("قوالب الحقول التقنية");
t("typeFields يعيد حقولاً معروفة", () => {
  assert.ok(M.typeFields("Fire Pumps").some((f) => f.key === "operatingPressure"));
  assert.ok(M.typeFields("Water Tanks").some((f) => f.key === "capacity"));
  assert.strictEqual(M.typeFields("Unknown").length, 0);
});

console.log("مجموعات واجهة مكافحة الحريق");
t("ثلاث مجموعات بمعرّفات وأيقونات", () => {
  assert.strictEqual(M.FF_GROUPS.length, 3);
  assert.deepStrictEqual(M.FF_GROUPS.map((g) => g.id), ["pump-set", "extinguishers", "fixed"]);
  M.FF_GROUPS.forEach((g) => assert.ok(g.icon && g.name && g.nameEn));
});
t("ffGroupOf يصنّف الأنواع صحيحاً", () => {
  assert.strictEqual(M.ffGroupOf("Fire Pumps"), "pump-set");
  assert.strictEqual(M.ffGroupOf("Jockey Pumps"), "pump-set");
  assert.strictEqual(M.ffGroupOf("Fire Extinguishers"), "extinguishers");
  assert.strictEqual(M.ffGroupOf("Fire Hydrants"), "fixed");
  assert.strictEqual(M.ffGroupOf("Sprinkler Systems"), "fixed");
  assert.strictEqual(M.ffGroupOf("نوع مجهول"), "fixed"); // الحاوية الافتراضية
});
t("ffGroupOf يحترم ffGroup الصريح", () => {
  assert.strictEqual(M.ffGroupOf({ ffGroup: "extinguishers", type: "Valves" }), "extinguishers");
  assert.strictEqual(M.ffGroupOf({ type: "Fire Pumps" }), "pump-set");
});
t("نوع Fire Extinguishers مضاف للقسم وله قوالب حقول", () => {
  assert.ok(M.deptTypes("fire-fighting").includes("Fire Extinguishers"));
  assert.ok(M.typeFields("Fire Extinguishers").some((f) => f.key === "agentType"));
});
t("كل نوع في المجموعات موجود ضمن DEPT_TYPES", () => {
  const fireTypes = M.deptTypes("fire-fighting");
  M.FF_GROUPS.forEach((g) => g.types.forEach((ty) => assert.ok(fireTypes.includes(ty), ty)));
});

console.log("بيانات التسجيل المعتمدة — مكافحة الحريق");
t("ثلاث مضخات بمواصفات المصدر حرفياً", () => {
  assert.strictEqual(M.FF_PUMP_SEED.length, 3);
  const e = M.FF_PUMP_SEED.find((p) => p.id === "ff-pump-electric");
  assert.deepStrictEqual(e.techData, { head: "85 m", flow: "175 m³/hr", power: "60 kW", voltage: "400 V", frequency: "50 Hz" });
  const d = M.FF_PUMP_SEED.find((p) => p.id === "ff-pump-diesel");
  assert.deepStrictEqual(d.techData, { head: "85 m", flow: "175 m³/hr", power: "75 kW", voltage: "400 V", frequency: "50 Hz" });
  const j = M.FF_PUMP_SEED.find((p) => p.id === "ff-pump-jockey");
  assert.deepStrictEqual(j.techData, { head: "90 m", flow: "4 m³/hr", power: "2.6 kW", voltage: "400 V", frequency: "50 Hz" });
});
t("ملاحظة مراجعة الديزل محفوظة والقيم كما وردت", () => {
  const d = M.FF_PUMP_SEED.find((p) => p.id === "ff-pump-diesel");
  assert.ok(d.notes.includes("مراجعة فنية"));
  assert.strictEqual(d.techData.power, "75 kW"); // لم تتغير
});
t("أنواع المطفآت والكميات كما وردت", () => {
  const byId = (id) => M.FF_CATALOG_SEED.find((c) => c.id === id);
  assert.strictEqual(byId("ff-type-ext-6kg-dp-portable").approvedQuantity, 221);
  assert.strictEqual(byId("ff-type-ext-12kg-dp-top-auto").approvedQuantity, 14);
  assert.strictEqual(byId("ff-type-ext-5kg-co2-portable").approvedQuantity, 38);
  assert.strictEqual(byId("ff-type-ext-50kg-foam").approvedQuantity, 4);
});
t("50kgm foam: الوصف الأصلي محفوظ والاسم المعروض مؤقت", () => {
  const f = M.FF_CATALOG_SEED.find((c) => c.id === "ff-type-ext-50kg-foam");
  assert.strictEqual(f.sourceDescription, "50kgm foam");
  assert.strictEqual(f.name, "50kg Foam");
  assert.ok(f.notes.includes("50kgm foam"));
});
t("المعدات الثابتة: حنفيات 15 وصناديق 130", () => {
  const h = M.FF_CATALOG_SEED.find((c) => c.id === "ff-type-fixed-hydrant");
  const c2 = M.FF_CATALOG_SEED.find((c) => c.id === "ff-type-fixed-hose-cabinet");
  assert.strictEqual(h.approvedQuantity, 15);
  assert.strictEqual(c2.approvedQuantity, 130);
});
t("الملحقات بلا كميات (null) لأن المصدر لا يذكرها", () => {
  const acc = M.FF_CATALOG_SEED.filter((c) => c.ffGroup === "pump-set");
  assert.strictEqual(acc.length, 4);
  acc.forEach((a) => {
    assert.strictEqual(a.approvedQuantity, null);
    assert.strictEqual(a.unit, null);
  });
});
t("معرفات ثابتة وغير مكررة", () => {
  const ids = [...M.FF_PUMP_SEED, ...M.FF_CATALOG_SEED].map((x) => x.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});
t("كل سجل في المجموعة الصحيحة", () => {
  M.FF_CATALOG_SEED.forEach((c) => assert.ok(["pump-set", "extinguishers", "fixed"].includes(c.ffGroup), c.id));
});
t("حالة UNVERIFIED معرّفة وغير محسوبة عاملة أو متوقفة", () => {
  assert.ok(M.EQUIPMENT_STATUSES.includes("UNVERIFIED"));
  assert.strictEqual(M.equipStatusLabel("UNVERIFIED"), "غير مفحوصة");
  const s = M.computeStats({ equipment: [{ status: "UNVERIFIED" }, { status: "OPERATIONAL" }], orders: [], plans: [] });
  assert.strictEqual(s.totalEquipment, 2);
  assert.strictEqual(s.operationalEquipment, 1);
  assert.strictEqual(s.stoppedEquipment, 0); // UNVERIFIED لا يُحسب متوقفة
});

console.log("وحدات فردية: عزل السجلات ومنع التكرار");
t("ffUnitLogs يعزل سجلات كل مضخة (لا اختلاط)", () => {
  const orders = [
    { id: "o1", equipmentId: "ff-pump-electric", type: "INSPECTION", status: "COMPLETE" },
    { id: "o2", equipmentId: "ff-pump-diesel", type: "BREAKDOWN", status: "NEW" },
    { id: "o3", equipmentId: "ff-pump-diesel", type: "INSPECTION", status: "COMPLETE" },
    { id: "o4", equipmentId: "other", type: "BREAKDOWN", status: "NEW" }
  ];
  const pmLogs = [
    { id: "l1", equipmentId: "ff-pump-jockey" },
    { id: "l2", equipmentId: "ff-pump-diesel" }
  ];
  const el = M.ffUnitLogs(orders, pmLogs, "ff-pump-electric");
  assert.strictEqual(el.inspections.length, 1);
  assert.strictEqual(el.faults.length, 0);
  assert.strictEqual(el.workOrders.length, 1);
  assert.strictEqual(el.maintenance.length, 0);
  const di = M.ffUnitLogs(orders, pmLogs, "ff-pump-diesel");
  assert.strictEqual(di.inspections.length, 1);
  assert.strictEqual(di.faults.length, 1);
  assert.strictEqual(di.maintenance.length, 1);
  const jo = M.ffUnitLogs(orders, pmLogs, "ff-pump-jockey");
  assert.strictEqual(jo.workOrders.length, 0);
  assert.strictEqual(jo.maintenance.length, 1);
});
t("ffNextInternalCode يولد رموزاً غير مكررة", () => {
  assert.strictEqual(M.ffNextInternalCode([], "FF-EXT"), "FF-EXT-001");
  assert.strictEqual(M.ffNextInternalCode(["FF-EXT-001", "FF-EXT-002"], "FF-EXT"), "FF-EXT-003");
  assert.strictEqual(M.ffNextInternalCode(["FF-EXT-001"], "ff-ext"), "FF-EXT-002"); // حارف صغير
  assert.strictEqual(M.ffNextInternalCode(["FF-EXT-001", "FF-EXT-002", "FF-EXT-003"], "FF-EXT", "FF-EXT-002"), "FF-EXT-004");
});
t("ffFindDuplicateTag يمنع تكرار الرمز", () => {
  const units = [
    { id: "u1", tagNumber: "FE-101" },
    { id: "u2", tagNumber: " fe-102 " }
  ];
  assert.strictEqual(M.ffFindDuplicateTag(units, "FE-101").id, "u1");
  assert.strictEqual(M.ffFindDuplicateTag(units, "fe-102").id, "u2");
  assert.strictEqual(M.ffFindDuplicateTag(units, "FE-101", "u1"), null); // استثناء نفس الوحدة
  assert.strictEqual(M.ffFindDuplicateTag(units, ""), null);
  assert.strictEqual(M.ffFindDuplicateTag(units, "FE-999"), null);
});
t("ffCatalogCounts تحسب من المسجّل فعلياً فقط", () => {
  const types = [{ id: "t1", name: "Ext A" }];
  const units = [
    { id: "u1", catalogTypeId: "t1" },
    { id: "u2", catalogTypeId: "t1" },
    { id: "u3", type: "Ext A" } // مطابقة بالاسم
  ];
  const orders = [
    { equipmentId: "u1", type: "INSPECTION", status: "COMPLETE" },
    { equipmentId: "u2", type: "BREAKDOWN", status: "NEW" },
    { equipmentId: "uX", type: "BREAKDOWN", status: "NEW" } // ليس من هذه الوحدات
  ];
  const c = M.ffCatalogCounts(types, units, orders)["t1"];
  assert.strictEqual(c.registered, 3);
  assert.strictEqual(c.withInspections, 1);
  assert.strictEqual(c.withOpenFaults, 1);
});

console.log("التحقق من الفحص والصيانة والأعطال وسجل التغييرات");
t("validateInspection يتحقق من وجود نتيجة أو ملاحظة", () => {
  assert.ok(M.validateInspection({}).result);
  assert.deepStrictEqual(M.validateInspection({ result: "PASS" }), {});
  assert.deepStrictEqual(M.validateInspection({ notes: "تم الفحص بنجاح" }), {});
});
t("validateMaintenance يتحقق من النوع والوصف", () => {
  assert.ok(M.validateMaintenance({}).type);
  assert.ok(M.validateMaintenance({ type: "ROUTINE" }).description);
  assert.deepStrictEqual(M.validateMaintenance({ type: "ROUTINE", description: "تبديل زيت وفلاتر" }), {});
});
t("validateFault يتحقق من وجود عنوان أو وصف", () => {
  assert.ok(M.validateFault({}).description);
  assert.deepStrictEqual(M.validateFault({ title: "تسريب في الصمام" }), {});
  assert.deepStrictEqual(M.validateFault({ description: "هبوط في الضغط" }), {});
});
t("ffLogEquipmentChange يسجل التغييرات بدقة", () => {
  const res = M.ffLogEquipmentChange("eq-1", {
    status_old: "UNVERIFIED",
    status: "OPERATIONAL",
    location_old: "طابق 1",
    location: "طابق 2",
    by: "مهندس الحريق",
    at: "2026-10-13T10:00:00Z"
  });
  assert.strictEqual(res.applied, 2);
  assert.strictEqual(res.changes.length, 2);
  assert.strictEqual(res.changes[0].field, "status");
  assert.strictEqual(res.changes[0].previous, "UNVERIFIED");
  assert.strictEqual(res.changes[0].current, "OPERATIONAL");
});

console.log("\n" + passed + " اختبار ناجح");

/* ============================================================
   mechanics-calc.js — محرك منطق قسم «الميكانيك»
   ------------------------------------------------------------
   دوال نقية (بلا DOM وبلا Firebase) حتى يمكن اختبارها في Node:
     node tests/mechanics-calc.test.js
   وتعمل في المتصفح كمتغيّر عام: window.MechanicsCalc
   كل التعريفات (الأقسام/الحالات/الأولويات/الفترات/القوالب)
   تُصدَّر من هنا كي يستخدمها script.js بدل تكرارها.
   ============================================================ */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.MechanicsCalc = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    /* ---------- الأقسام الميكانيكية الخمسة ---------- */
    var DEPARTMENTS = [
        { id: "fire-fighting", name: "مكافحة الحريق", nameEn: "Fire Fighting", icon: "🧯" },
        { id: "medical-air", name: "الهواء الطبي", nameEn: "Medical Air", icon: "🫁" },
        { id: "hvac", name: "التكييف والتهوية", nameEn: "HVAC", icon: "❄️" },
        { id: "water-supply", name: "تجهيز المياه", nameEn: "Water Supply", icon: "💧" },
        { id: "sewage-drainage", name: "الصرف الصحي والتصريف", nameEn: "Sewage & Drainage", icon: "🚽" }
    ];

    function deptName(id) {
        var d = DEPARTMENTS.find(function (x) { return x.id === id; });
        return d ? d.name : "—";
    }
    function deptNameEn(id) {
        var d = DEPARTMENTS.find(function (x) { return x.id === id; });
        return d ? d.nameEn : "—";
    }
    function deptIcon(id) {
        var d = DEPARTMENTS.find(function (x) { return x.id === id; });
        return d ? d.icon : "⚙️";
    }
    function deptExists(id) {
        return DEPARTMENTS.some(function (x) { return x.id === id; });
    }

    /* ---------- قوالب أنواع المعدات لكل قسم (فئات مفتوحة قابلة للتخصيص) ---------- */
    var DEPT_TYPES = {
        "fire-fighting": ["Fire Pumps", "Jockey Pumps", "Fire Water Tanks", "Control Panels", "Valves", "Fire Hydrants", "Sprinkler Systems", "Fire Hose Reels", "Fire Extinguishers", "Fire Hose Cabinets", "Foam Fire Extinguishers"],
        "medical-air": ["Medical Air Compressors", "Air Receivers", "Dryers", "Filters", "Pressure Regulators", "Alarm Panels", "Medical Air Distribution"],
        "hvac": ["Chillers", "AHU", "FCU", "Split Units", "Exhaust Fans", "Fresh Air Units", "Pumps", "Filters", "Ductwork"],
        "water-supply": ["Water Pumps", "Water Tanks", "Booster Sets", "Transfer Pumps", "Water Filters", "Valves", "Water Distribution"],
        "sewage-drainage": ["Sewage Pumps", "Sump Pumps", "Drainage Pumps", "Sump Pits", "Drainage Lines", "Sewage Tanks", "Level Sensors", "Float Switches"]
    };

    function deptTypes(id) {
        return (DEPT_TYPES[id] || []).slice();
    }

    /* ---------- حالات المعدة ---------- */
    // UNVERIFIED: معدة سُجّلت من وثائق مصدر معتمدة ولم تُفحص ميدانياً بعد —
    // لا تُعامل كعاملة ولا كمتوقفة حتى يُسجَّل فحص فعلي.
    var EQUIPMENT_STATUSES = ["OPERATIONAL", "STOPPED", "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "UNVERIFIED"];
    var EQUIPMENT_STATUS_LABELS = {
        "OPERATIONAL": "عاملة", "STOPPED": "متوقفة",
        "UNDER_MAINTENANCE": "تحت الصيانة", "OUT_OF_SERVICE": "خارج الخدمة",
        "UNVERIFIED": "غير مفحوصة"
    };
    function equipStatusLabel(s) { return EQUIPMENT_STATUS_LABELS[s] || "—"; }

    /* ---------- مستوى الأهمية التشغيلية ---------- */
    var CRITICALITY = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    var CRITICALITY_LABELS = { "CRITICAL": "حرجة", "HIGH": "عالية", "MEDIUM": "متوسطة", "LOW": "منخفضة" };
    function criticalityLabel(s) { return CRITICALITY_LABELS[s] || "—"; }

    /* ---------- أولوية أمر العمل ---------- */
    var PRIORITY = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    var PRIORITY_LABELS = { "CRITICAL": "حرجة", "HIGH": "عالية", "MEDIUM": "متوسطة", "LOW": "منخفضة" };
    function priorityLabel(p) { return PRIORITY_LABELS[p] || "—"; }

    /* ---------- حالات أمر العمل (مشتركة مع بقية النظام) ---------- */
    var STATUSES = ["NEW", "IN PROGRESS", "AWAITING PARTS", "COMPLETE"];
    var STATUS_LABELS = {
        "NEW": "جديد", "IN PROGRESS": "قيد التنفيذ",
        "AWAITING PARTS": "بانتظار قطع الغيار", "COMPLETE": "مكتمل"
    };
    function statusLabel(s) { return STATUS_LABELS[s] || "—"; }

    /* ---------- أنواع الطلب ---------- */
    var REQUEST_TYPES = ["BREAKDOWN", "PREVENTIVE", "INSPECTION", "REPAIR", "OTHER"];
    var REQUEST_TYPE_LABELS = {
        "BREAKDOWN": "عطل", "PREVENTIVE": "صيانة وقائية", "INSPECTION": "فحص",
        "REPAIR": "إصلاح", "OTHER": "طلب آخر"
    };
    function requestTypeLabel(t) { return REQUEST_TYPE_LABELS[t] || "—"; }

    /* ---------- فترات الصيانة الوقائية ----------
       عدد الأيام لكل فترة: ترجمة مبسّطة قابلة للتخصيص لكل معدة،
       وليست توصية فنية معتمدة. */
    var PM_PERIODS = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "CUSTOM"];
    var PM_PERIOD_LABELS = {
        "DAILY": "يومية", "WEEKLY": "أسبوعية", "MONTHLY": "شهرية",
        "QUARTERLY": "ربع سنوية", "SEMI_ANNUAL": "نصف سنوية",
        "ANNUAL": "سنوية", "CUSTOM": "فترة مخصصة"
    };
    var PM_PERIOD_DAYS = { "DAILY": 1, "WEEKLY": 7, "MONTHLY": 30, "QUARTERLY": 90, "SEMI_ANNUAL": 182, "ANNUAL": 365 };
    function pmPeriodLabel(p) { return PM_PERIOD_LABELS[p] || "—"; }

    /* ---------- أنواع الصيانة الوقائية ---------- */
    var PM_TYPES = ["ROUTINE", "INSPECTION", "LUBRICATION", "CALIBRATION", "REPLACEMENT", "TESTING", "CLEANING", "OTHER"];
    var PM_TYPE_LABELS = {
        "ROUTINE": "صيانة دورية", "INSPECTION": "فحص", "LUBRICATION": "تشحيم",
        "CALIBRATION": "معايرة", "REPLACEMENT": "استبدال", "TESTING": "اختبار",
        "CLEANING": "تنظيف", "OTHER": "أخرى"
    };
    function pmTypeLabel(t) { return PM_TYPE_LABELS[t] || "—"; }

    /* ---------- حالات توفر قطع الغيار ---------- */
    var SPARE_STATUSES = ["AVAILABLE", "ORDERED", "IN_TRANSIT", "NOT_AVAILABLE"];
    var SPARE_STATUS_LABELS = {
        "AVAILABLE": "متوفرة", "ORDERED": "تم طلبها",
        "IN_TRANSIT": "قيد التوريد", "NOT_AVAILABLE": "غير متوفرة"
    };
    function spareStatusLabel(s) { return SPARE_STATUS_LABELS[s] || "—"; }


    /* ---------- تواريخ ---------- */
    // يقبل Date أو Timestamp أو نص أو رقم. يعيد Date أو null.
    function toDate(v) {
        if (!v) return null;
        if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
        if (typeof v === "object" && typeof v.toDate === "function") {
            var d = v.toDate();
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof v === "number") {
            var dn = new Date(v);
            return isNaN(dn.getTime()) ? null : dn;
        }
        if (typeof v === "string") {
            var d2 = new Date(v);
            return isNaN(d2.getTime()) ? null : d2;
        }
        return null;
    }

    // تحويل Date إلى قيمة input[type=date] (YYYY-MM-DD)
    function toDateInputValue(v) {
        var d = toDate(v);
        if (!d) return "";
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + m + "-" + day;
    }

    // صياغة تاريخ قصير للعرض
    function formatDateShort(v) {
        var d = toDate(v);
        if (!d) return "—";
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    }

    // فرق الأيام بين تاريخين (a - b)، موجب إذا كان a بعد b.
    function daysBetween(a, b) {
        var da = toDate(a), db = toDate(b);
        if (!da || !db) return null;
        return Math.round((da.getTime() - db.getTime()) / 86400000);
    }

    /* ---------- حساب موعد الاستحقاق للصيانة الوقائية ----------
       من تاريخ آخر تنفيذ + الفترة. المخصص يحتاج customDays>0.
       عند غياب الأساس أو الفترة الصالحة تعيد null. */
    function computeNextDue(lastDone, period, customDays) {
        var base = toDate(lastDone);
        if (!base) return null;
        var days;
        if (period === "CUSTOM") {
            days = parseInt(customDays, 10);
            if (!days || days <= 0) return null;
        } else {
            days = PM_PERIOD_DAYS[period];
            if (!days) return null;
        }
        var next = new Date(base.getTime());
        next.setDate(next.getDate() + days);
        return next;
    }

    // حالة خطة الصيانة نسبةً للاستحقاق واليوم المرجعي:
    // OVERDUE (متأخرة)، DUE_SOON (خلال 3 أيام)، UPCOMING، NONE.
    function pmStatus(nextDue, refDate) {
        var nd = toDate(nextDue);
        if (!nd) return "NONE";
        var ref = toDate(refDate) || new Date();
        var diff = daysBetween(nd, ref);
        if (diff === null) return "NONE";
        if (diff < 0) return "OVERDUE";
        if (diff <= 3) return "DUE_SOON";
        return "UPCOMING";
    }

    var PM_STATUS_LABELS = {
        "UPCOMING": "قادمة", "DUE_SOON": "مستحقة قريباً",
        "OVERDUE": "متأخرة", "NONE": "غير محدد"
    };
    function pmStatusLabel(s) { return PM_STATUS_LABELS[s] || "—"; }


    /* ---------- الإحصائيات ----------
       تُحسب من المصفوفات المحمّلة لتجنّب استعلامات مكلفة. */
    function computeStats(data) {
        data = data || {};
        var equipment = data.equipment || [];
        var orders = data.orders || [];
        var plans = data.plans || [];
        var ref = toDate(data.refDate) || new Date();

        var stats = {
            totalEquipment: equipment.length,
            operationalEquipment: 0,
            stoppedEquipment: 0,
            openOrders: 0,
            dueMaintenance: 0,
            overdueMaintenance: 0,
            tasksInProgress: 0,
            tasksAwaitingParts: 0,
            completedOrders: 0
        };

        equipment.forEach(function (eq) {
            if (eq.status === "OPERATIONAL") stats.operationalEquipment++;
            else if (eq.status === "STOPPED" || eq.status === "OUT_OF_SERVICE") stats.stoppedEquipment++;
        });

        var isOpen = { "NEW": 1, "IN PROGRESS": 1, "AWAITING PARTS": 1 };
        orders.forEach(function (o) {
            var s = o.status || "NEW";
            if (isOpen[s]) stats.openOrders++;
            if (s === "IN PROGRESS") stats.tasksInProgress++;
            if (s === "AWAITING PARTS") stats.tasksAwaitingParts++;
            if (s === "COMPLETE") stats.completedOrders++;
        });

        plans.forEach(function (p) {
            if (p.active === false) return;
            var st = pmStatus(p.nextDue, ref);
            if (st === "OVERDUE") stats.overdueMaintenance++;
            else if (st === "DUE_SOON") stats.dueMaintenance++;
        });

        return stats;
    }

    // قائمة «الأعمال التي تحتاج إلى متابعة»: أوامر مفتوحة + صيانة متأخرة،
    // مرتّبة بالأولوية ثم تاريخ الاستحقاق.
    function buildFollowUpList(data) {
        data = data || {};
        var orders = data.orders || [];
        var plans = data.plans || [];
        var equipById = {};
        (data.equipment || []).forEach(function (e) { equipById[e.id] = e; });

        var rank = { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
        var isOpen = { "NEW": 1, "IN PROGRESS": 1, "AWAITING PARTS": 1 };
        var items = [];

        orders.forEach(function (o) {
            if (!isOpen[o.status || "NEW"]) return;
            var due = toDate(o.dueDate);
            items.push({
                kind: "order",
                priority: o.priority || "MEDIUM",
                title: o.title || "أمر عمل",
                system: o.department ? deptName(o.department) : "—",
                equipment: (equipById[o.equipmentId] || {}).name || o.equipmentName || "—",
                location: o.location || "—",
                dueDate: due,
                orderId: o.id,
                status: o.status || "NEW"
            });
        });

        plans.forEach(function (p) {
            if (p.active === false) return;
            if (pmStatus(p.nextDue, data.refDate) !== "OVERDUE") return;
            var due = toDate(p.nextDue);
            items.push({
                kind: "pm",
                priority: "MEDIUM",
                title: "صيانة وقائية متأخرة",
                system: p.department ? deptName(p.department) : "—",
                equipment: (equipById[p.equipmentId] || {}).name || "—",
                location: p.location || "—",
                dueDate: due,
                planId: p.id,
                status: "OVERDUE"
            });
        });

        items.sort(function (a, b) {
            var ra = rank[a.priority] === undefined ? 9 : rank[a.priority];
            var rb = rank[b.priority] === undefined ? 9 : rank[b.priority];
            if (ra !== rb) return ra - rb;
            var ta = a.dueDate ? a.dueDate.getTime() : Infinity;
            var tb = b.dueDate ? b.dueDate.getTime() : Infinity;
            return ta - tb;
        });
        return items;
    }

    /* ---------- توليد رقم أمر عمل: <PREFIX>-YYYY-#### ---------- */
    function buildOrderNumber(prefix, seq, year) {
        var y = year || new Date().getFullYear();
        var p = (prefix || "MECH").toString().trim().toUpperCase();
        var s = parseInt(seq, 10);
        if (!s || s < 1) s = 1;
        var seqStr = String(s);
        while (seqStr.length < 4) seqStr = "0" + seqStr;
        return p + "-" + y + "-" + seqStr;
    }


    /* ---------- التحقق من صحة السجلات (قبل الحفظ) ---------- */
    function validateEquipment(eq) {
        var errors = {};
        if (!eq || !eq.name || !eq.name.trim()) errors.name = "اسم المعدة مطلوب";
        if (!eq || !eq.department || !deptExists(eq.department)) errors.department = "القسم الميكانيكي مطلوب";
        if (eq && eq.tagNumber && String(eq.tagNumber).length > 60) errors.tagNumber = "الرمز طويل جداً";
        return errors;
    }

    function validateOrder(o) {
        var errors = {};
        if (!o || !o.title || !o.title.trim()) errors.title = "عنوان المشكلة مطلوب";
        if (!o || !o.department || !deptExists(o.department)) errors.department = "القسم الميكانيكي مطلوب";
        if (o && o.description && String(o.description).length > 2000) errors.description = "الوصف طويل جداً";
        return errors;
    }

    function validatePlan(p) {
        var errors = {};
        if (!p || !p.equipmentId) errors.equipmentId = "المعدة مطلوبة";
        if (!p || !p.period || PM_PERIODS.indexOf(p.period) === -1) errors.period = "فترة الصيانة مطلوبة";
        if (p && p.period === "CUSTOM") {
            var cd = parseInt(p.customDays, 10);
            if (!cd || cd <= 0) errors.customDays = "أدخل عدد أيام أكبر من صفر للفترة المخصصة";
        }
        return errors;
    }

    function validateSpare(s) {
        var errors = {};
        if (!s || !s.name || !s.name.trim()) errors.name = "اسم القطعة مطلوبة";
        var qty = s ? s.quantityRequired : undefined;
        if (qty !== undefined && qty !== null && qty !== "") {
            var n = Number(qty);
            if (isNaN(n) || n < 0) errors.quantityRequired = "الكمية يجب أن تكون رقماً غير سالب";
        }
        return errors;
    }

    /* ---------- التصدير إلى CSV ---------- */
    function toCsv(headers, rows) {
        function esc(v) {
            if (v === null || v === undefined) return "";
            var s = String(v);
            if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
            return s;
        }
        var lines = [headers.map(esc).join(",")];
        (rows || []).forEach(function (row) { lines.push(row.map(esc).join(",")); });
        return lines.join("\r\n");
    }

    // بادئة BOM حتى يقرأ Excel العربية بصيغة UTF-8 بشكل صحيح.
    function csvWithBom(content) {
        return "\uFEFF" + content;
    }

    /* ---------- التصفية ---------- */
    function filterEquipment(equipment, f) {
        f = f || {};
        var q = (f.search || "").trim().toLowerCase();
        return (equipment || []).filter(function (e) {
            if (f.department && e.department !== f.department) return false;
            if (f.status && e.status !== f.status) return false;
            if (f.type && e.type !== f.type) return false;
            if (f.criticality && e.criticality !== f.criticality) return false;
            if (q) {
                var hay = [e.name, e.tagNumber, e.manufacturer, e.model, e.serialNumber, e.location, e.building, e.room].join(" ").toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function filterOrders(orders, f) {
        f = f || {};
        var q = (f.search || "").trim().toLowerCase();
        return (orders || []).filter(function (o) {
            if (f.department && o.department !== f.department) return false;
            if (f.status && o.status !== f.status) return false;
            if (f.priority && o.priority !== f.priority) return false;
            if (f.type && o.type !== f.type) return false;
            if (f.assignee && (o.assignedTo || "") !== f.assignee) return false;
            var from = toDate(f.fromDate), to = toDate(f.toDate);
            if (from || to) {
                var c = toDate(o.createdAt);
                if (!c) return false;
                if (from && c.getTime() < from.getTime()) return false;
                if (to) {
                    var toEnd = new Date(to.getTime());
                    toEnd.setHours(23, 59, 59, 999);
                    if (c.getTime() > toEnd.getTime()) return false;
                }
            }
            if (q) {
                var hay = [o.title, o.description, o.location, o.orderNumber, o.equipmentName].join(" ").toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }


    /* ---------- قوالب الحقول التقنية لكل نوع معدة ----------
       تعريفات وصفية للواجهة فقط (لا تُستخدم كمعايير قبول). */
    var TYPE_FIELD_TEMPLATES = {
        "Fire Pumps": [
            { key: "operatingPressure", label: "ضغط التشغيل", type: "text", unit: "bar" },
            { key: "ratedPower", label: "القدرة", type: "text", unit: "kW" },
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Jockey Pumps": [
            { key: "cutInPressure", label: "ضغط التشغيل (Cut-in)", type: "text", unit: "bar" },
            { key: "cutOutPressure", label: "ضغط التوقف (Cut-out)", type: "text", unit: "bar" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Fire Water Tanks": [
            { key: "capacity", label: "السعة", type: "number", unit: "L" },
            { key: "currentLevel", label: "المستوى الحالي", type: "text" },
            { key: "lastInspection", label: "تاريخ آخر فحص", type: "date" }
        ],
        "Control Panels": [
            { key: "panelType", label: "نوع اللوحة", type: "text" },
            { key: "voltage", label: "الجهد", type: "text", unit: "V" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Valves": [
            { key: "valveType", label: "نوع الصمام", type: "text" },
            { key: "size", label: "المقاس", type: "text" },
            { key: "pressureRating", label: "تصنيف الضغط", type: "text" }
        ],
        "Fire Hydrants": [
            { key: "hydrantType", label: "نوع الحنفية", type: "text" },
            { key: "flowPressure", label: "ضغط التدفق", type: "text", unit: "bar" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Sprinkler Systems": [
            { key: "systemType", label: "نوع النظام", type: "text" },
            { key: "coverageArea", label: "المساحة المغطاة", type: "text" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Fire Hose Reels": [
            { key: "hoseLength", label: "طول الخرطوم", type: "text", unit: "m" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Fire Extinguishers": [
            { key: "agentType", label: "نوع الوسط الإطفائي", type: "text" },
            { key: "capacity", label: "السعة", type: "text", unit: "kg/L" },
            { key: "lastInspection", label: "تاريخ آخر فحص", type: "date" }
        ],
        "Fire Hose Cabinets": [
            { key: "cabinetNumber", label: "رقم الصندوق", type: "text" },
            { key: "hoseLength", label: "طول الخرطوم", type: "text", unit: "m" },
            { key: "nozzleType", label: "نوع الرأس", type: "text" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Medical Air Compressors": [
            { key: "operatingPressure", label: "ضغط التشغيل", type: "text", unit: "bar" },
            { key: "ratedPower", label: "القدرة", type: "text", unit: "kW" },
            { key: "airQualityTest", label: "نتيجة فحص جودة الهواء", type: "text" }
        ],
        "Air Receivers": [
            { key: "capacity", label: "السعة", type: "number", unit: "L" },
            { key: "designPressure", label: "ضغط التصميم", type: "text", unit: "bar" },
            { key: "lastSafetyTest", label: "تاريخ آخر اختبار سلامة", type: "date" }
        ],
        "Dryers": [
            { key: "dewPoint", label: "نقطة الندى", type: "text", unit: "°C" },
            { key: "lastTestResult", label: "نتيجة آخر فحص", type: "text" }
        ],
        "Filters": [
            { key: "filterType", label: "نوع المرشح", type: "text" },
            { key: "lastChangeDate", label: "تاريخ آخر تغيير", type: "date" }
        ],
        "Pressure Regulators": [
            { key: "inputPressure", label: "ضغط الدخول", type: "text", unit: "bar" },
            { key: "outputPressure", label: "ضغط الخروج", type: "text", unit: "bar" }
        ],
        "Alarm Panels": [
            { key: "panelType", label: "نوع اللوحة", type: "text" },
            { key: "lastTestResult", label: "نتيجة آخر اختبار", type: "text" }
        ],
        "Medical Air Distribution": [
            { key: "pipeMaterial", label: "مادة الأنبوب", type: "text" },
            { key: "pressureTest", label: "نتيجة اختبار الضغط", type: "text" }
        ],

        "Chillers": [
            { key: "coolingCapacity", label: "القدرة التبريدية", type: "text", unit: "kW" },
            { key: "refrigerantType", label: "نوع المبرد", type: "text" },
            { key: "operatingPressure", label: "ضغط التشغيل", type: "text", unit: "bar" },
            { key: "currentDraw", label: "التيار الكهربائي", type: "text", unit: "A" }
        ],
        "AHU": [
            { key: "airflow", label: "معدل تدفق الهواء", type: "text", unit: "m³/h" },
            { key: "supplyTemp", label: "درجة حرارة الدفع", type: "text", unit: "°C" },
            { key: "filterStatus", label: "حالة الفلاتر", type: "text" },
            { key: "fanStatus", label: "حالة المروحة", type: "text" }
        ],
        "FCU": [
            { key: "supplyTemp", label: "درجة حرارة الدفع", type: "text", unit: "°C" },
            { key: "filterStatus", label: "حالة الفلاتر", type: "text" },
            { key: "currentDraw", label: "التيار الكهربائي", type: "text", unit: "A" }
        ],
        "Split Units": [
            { key: "coolingCapacity", label: "القدرة التبريدية", type: "text", unit: "kW" },
            { key: "currentDraw", label: "التيار الكهربائي", type: "text", unit: "A" }
        ],
        "Exhaust Fans": [
            { key: "airflow", label: "معدل تدفق الهواء", type: "text", unit: "m³/h" },
            { key: "fanStatus", label: "حالة المروحة", type: "text" }
        ],
        "Fresh Air Units": [
            { key: "airflow", label: "معدل تدفق الهواء", type: "text", unit: "m³/h" },
            { key: "supplyTemp", label: "درجة حرارة الدفع", type: "text", unit: "°C" }
        ],
        "Pumps": [
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "operatingPressure", label: "ضغط التشغيل", type: "text", unit: "bar" },
            { key: "currentDraw", label: "التيار الكهربائي", type: "text", unit: "A" }
        ],
        "Ductwork": [
            { key: "ductSize", label: "مقاس المجرى", type: "text" },
            { key: "insulationStatus", label: "حالة العزل", type: "text" }
        ],
        "Water Pumps": [
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "operatingPressure", label: "ضغط التشغيل", type: "text", unit: "bar" },
            { key: "currentDraw", label: "التيار الكهربائي", type: "text", unit: "A" }
        ],
        "Water Tanks": [
            { key: "capacity", label: "السعة", type: "number", unit: "L" },
            { key: "capacityUnit", label: "وحدة السعة", type: "text" },
            { key: "currentLevel", label: "المستوى الحالي", type: "text" },
            { key: "lastCleaned", label: "تاريخ آخر تنظيف", type: "date" }
        ],
        "Booster Sets": [
            { key: "dischargePressure", label: "ضغط الدفع", type: "text", unit: "bar" },
            { key: "pumpCount", label: "عدد المضخات", type: "number" }
        ],
        "Transfer Pumps": [
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "operatingPressure", label: "ضغط التشغيل", type: "text", unit: "bar" }
        ],
        "Water Filters": [
            { key: "filterType", label: "نوع الفلتر", type: "text" },
            { key: "lastChangeDate", label: "تاريخ آخر تغيير", type: "date" }
        ],
        "Water Distribution": [
            { key: "pipeMaterial", label: "مادة الأنبوب", type: "text" },
            { key: "pressureTest", label: "نتيجة اختبار الضغط", type: "text" }
        ],
        "Sewage Pumps": [
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "headHeight", label: "ارتفاع الرفع", type: "text", unit: "m" },
            { key: "currentDraw", label: "التيار الكهربائي", type: "text", unit: "A" }
        ],
        "Sump Pumps": [
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "headHeight", label: "ارتفاع الرفع", type: "text", unit: "m" }
        ],
        "Drainage Pumps": [
            { key: "flowRate", label: "معدل التدفق", type: "text", unit: "L/min" },
            { key: "headHeight", label: "ارتفاع الرفع", type: "text", unit: "m" }
        ],
        "Sump Pits": [
            { key: "pitDepth", label: "عمق الحوض", type: "text", unit: "m" },
            { key: "lastCleaned", label: "تاريخ آخر تنظيف", type: "date" }
        ],
        "Drainage Lines": [
            { key: "pipeDiameter", label: "قطر الأنبوب", type: "text", unit: "mm" },
            { key: "lineMaterial", label: "مادة الخط", type: "text" }
        ],
        "Sewage Tanks": [
            { key: "capacity", label: "السعة", type: "number", unit: "L" },
            { key: "lastEmptied", label: "تاريخ آخر تفريغ", type: "date" }
        ],
        "Level Sensors": [
            { key: "sensorType", label: "نوع الحساس", type: "text" },
            { key: "range", label: "المدى", type: "text" }
        ],
        "Float Switches": [
            { key: "switchType", label: "نوع العوامة", type: "text" },
            { key: "triggerLevel", label: "مستوى التشغيل", type: "text" }
        ]
    };

    function typeFields(type) {
        var t = TYPE_FIELD_TEMPLATES[type];
        return t ? t.map(function (f) { return Object.assign({}, f); }) : [];
    }

    /* ---------- مجموعات واجهة منظومة مكافحة الحريق ----------
       تجميع بصري للمعدات داخل قسم fire-fighting إلى ثلاث مجموعات:
       سيت المضخات / المطفآت / المعدات الثابتة. التصنيف يشتق من نوع
       المعدة (type) ما لم تُحدَّد مجموعة صريحة في ffGroup، والأنواع
       غير المدرجة تُصنَّف ضمن المعدات الثابتة (الحاوية الافتراضية). */
    var FF_GROUPS = [
        { id: "pump-set", name: "مضخات الحريق", nameEn: "Fire Pumps", icon: "🚒",
          types: ["Fire Pumps", "Jockey Pumps"] },
        { id: "extinguishers", name: "مطافئ الحريق", nameEn: "Fire Extinguishers", icon: "🧯",
          types: ["Fire Extinguishers"] },
        { id: "hydrants", name: "حنفيات الحريق الخارجية", nameEn: "Fire Hydrants", icon: "🚰",
          types: ["Fire Hydrants"] },
        { id: "hose-cabinets", name: "صناديق خراطيم الحريق", nameEn: "Fire Hose Cabinets", icon: "🗄️",
          types: ["Fire Hose Cabinets"] },
        { id: "foam", name: "معدات الإطفاء بالرغوة", nameEn: "Foam Fire Extinguishers", icon: "🫧",
          types: ["Foam Fire Extinguishers"] },
        // حاوية للأنواع القديمة غير المصنّفة أعلاه (لا يُحذف أي نوع موجود)
        { id: "fixed", name: "معدات ثابتة أخرى", nameEn: "Other Fixed Equipment", icon: "🔧",
          types: ["Fire Water Tanks", "Control Panels", "Valves", "Sprinkler Systems", "Fire Hose Reels"] }
    ];

    /* تحديد مجموعة المعدة: الأولوية لنوع الكتالوج المرتبط (catalogTypeId)، ثم ffGroup
       الصريح (القيمة القديمة "fixed" تُعاد قراءتها حسب النوع)، ثم اسم النوع. */
    function ffGroupOf(eqOrType) {
        var isObj = !!eqOrType && typeof eqOrType === "object";
        var type = isObj ? (eqOrType.type || "") : (eqOrType || "");
        var i;
        if (isObj && eqOrType.catalogTypeId) {
            var seed = FF_CATALOG_SEED.filter(function (c) { return c.id === eqOrType.catalogTypeId; })[0];
            if (seed) return seed.ffGroup;
        }
        if (isObj && eqOrType.ffGroup && eqOrType.ffGroup !== "fixed") {
            for (i = 0; i < FF_GROUPS.length; i++) {
                if (FF_GROUPS[i].id === eqOrType.ffGroup) return FF_GROUPS[i].id;
            }
        }
        for (i = 0; i < FF_GROUPS.length; i++) {
            if (FF_GROUPS[i].types.indexOf(type) !== -1) return FF_GROUPS[i].id;
        }
        var byName = FF_CATALOG_SEED.filter(function (c) { return c.name === type; })[0];
        if (byName) return byName.ffGroup;
        return "fixed";
    }

    /* ---------- ملصقات الحقول التقنية للعرض ---------- */
    var TECH_LABELS = {
        head: "الارتفاع (Head)",
        flow: "التدفق (Flow)",
        power: "القدرة (Power)",
        voltage: "الجهد (Voltage)",
        frequency: "التردد (Frequency)"
    };
    function techLabel(key) { return TECH_LABELS[key] || key; }

    // الجهات التشغيلية المعتمدة
    var FF_FACILITIES = [
        { id: "hospital", name: "المستشفى", nameEn: "Hospital" },
        { id: "complex", name: "المجمع", nameEn: "Complex" }
    ];
    var FF_UNASSIGNED_FACILITY = { id: "unassigned", name: "غير محددة الجهة", nameEn: "Unassigned" };

    // الجهة الفعلية للمعدة: الحقل الصريح، ثم المضخات الثلاث المعتمدة (المستشفى)،
    // ثم جهة نوع الكتالوج المرتبط؛ وإلا «غير محددة» (لا تُخمَّن).
    function ffFacilityOf(eq) {
        if (!eq) return "unassigned";
        if (eq.facility === "hospital" || eq.facility === "complex") return eq.facility;
        if (FF_PUMP_SEED.some(function (p) { return p.id === eq.id; })) return "hospital";
        if (eq.catalogTypeId) {
            var seed = FF_CATALOG_SEED.filter(function (c) { return c.id === eq.catalogTypeId; })[0];
            if (seed && seed.facility) return seed.facility;
        }
        return "unassigned";
    }

    // عزل بيانات جهة واحدة (معدات + أوامر + خطط + سجلات + أنواع) دون دمج الجهات.
    function ffScopeData(data, facility) {
        if (!facility) return data;
        var eq = (data.equipment || []).filter(function (e) { return ffFacilityOf(e) === facility; });
        var ids = {};
        eq.forEach(function (e) { ids[e.id] = 1; });
        function linked(x) {
            if (x.equipmentId) return !!ids[x.equipmentId];
            var f = (x.facility === "hospital" || x.facility === "complex") ? x.facility : "unassigned";
            return f === facility;
        }
        return {
            equipment: eq,
            orders: (data.orders || []).filter(linked),
            plans: (data.plans || []).filter(linked),
            pmLogs: (data.pmLogs || []).filter(linked),
            types: (data.types || []).filter(function (t) {
                var f = (t.facility === "hospital" || t.facility === "complex") ? t.facility : "hospital";
                return f === facility;
            })
        };
    }

    // مجاميع الكميات المعتمدة لجهة: لكل مجموعة ومجموع كلي (المضخات الثلاث المعتمدة = المستشفى).
    function ffApprovedTotals(facility) {
        var byGroup = {};
        FF_GROUPS.forEach(function (g) { byGroup[g.id] = 0; });
        FF_CATALOG_SEED.forEach(function (c) {
            if (c.facility === facility && typeof c.approvedQuantity === "number") {
                byGroup[c.ffGroup] = (byGroup[c.ffGroup] || 0) + c.approvedQuantity;
            }
        });
        if (facility === "hospital") byGroup["pump-set"] += FF_PUMP_SEED.length;
        var total = 0;
        Object.keys(byGroup).forEach(function (k) { total += byGroup[k]; });
        return { byGroup: byGroup, total: total };
    }

    /* ---------- بيانات التسجيل المعتمدة لمنظومة مكافحة الحريق ----------
       المصدر: مواصفات المشروع المعتمدة (جدول التجهيز + جدول المطفآت).
       القيم مسجّلة كما وردت حرفياً؛ لا تُشتق ولا تُقدَّر ولا تُفترَض أي
       قيمة غير واردة (بلا مواقع أو Tag أو تواريخ أو صانعين غير موجودة). */
    var FF_PUMP_SEED = [
        {
            id: "ff-pump-electric",
            name: "Electric Fire Pump",
            type: "Fire Pumps",
            techData: { head: "85 m", flow: "175 m³/hr", power: "60 kW", voltage: "400 V", frequency: "50 Hz" },
            notes: ""
        },
        {
            id: "ff-pump-diesel",
            name: "Diesel Fire Pump",
            type: "Fire Pumps",
            techData: { head: "85 m", flow: "175 m³/hr", power: "75 kW", voltage: "400 V", frequency: "50 Hz" },
            notes: "القدرة 75 kW والجهد 400 V والتردد 50 Hz مسجّلة حسب جدول التجهيز كما وردت دون تغيير، ومواصفات محرك الديزل الكهربائية تحتاج إلى مراجعة فنية قبل الاعتماد النهائي."
        },
        {
            id: "ff-pump-jockey",
            name: "Jockey Pump",
            type: "Jockey Pumps",
            techData: { head: "90 m", flow: "4 m³/hr", power: "2.6 kW", voltage: "400 V", frequency: "50 Hz" },
            notes: ""
        }
    ];

    /* ---------- التحقق من سجلات الفحص والصيانة والأعطال والتغييرات ---------- */
    function validateInspection(v) {
        var errors = {};
        if (!v || (!v.result && !v.notes)) {
            errors.result = "نتيجة الفحص أو الملاحظة مطلوبة";
        }
        return errors;
    }

    function validateMaintenance(v) {
        var errors = {};
        if (!v || !v.type) errors.type = "نوع الصيانة مطلوب";
        if (!v || !v.description || !v.description.trim()) errors.description = "وصف العمل مطلوب";
        return errors;
    }

    function validateFault(v) {
        var errors = {};
        if (!v || (!v.title && !v.description)) {
            errors.description = "عنوان العطل أو وصفه مطلوب";
        }
        return errors;
    }

    /* ---------- سجل التغييرات على المعدة ----------
       سجل تحديث بيانات المعدة (حقل، القديمة، الجديدة، هوية من سجل). */
    function ffLogEquipmentChange(equipmentId, changes, byUser) {
        var changesList = [];
        var v = changes || {};
        var author = byUser || (v.by || "").trim() || null;
        var timestamp = v.at || new Date().toISOString();
        for (var key in v) {
            if (!Object.prototype.hasOwnProperty.call(v, key)) continue;
            if (key.slice(-4) === "_old" || key === "by" || key === "at" || key === "equipmentId") continue;
            var oldValue = v[key + "_old"];
            var newValue = v[key];
            if (oldValue !== undefined && oldValue !== newValue) {
                changesList.push({
                    field: key,
                    previous: oldValue,
                    current: newValue,
                    by: author,
                    at: timestamp
                });
            }
        }
        return {
            equipmentId: equipmentId,
            changes: changesList,
            applied: changesList.length,
            summary: changesList.length > 0 ? changesList.map(function (c) { return c.field + " => " + c.current; }).join("، ") : "(لا تغييرات فعلاً)"
        };
    }

    /* ---------- سجل الأنواع والكميات المعتمدة لمنظومة مكافحة الحريق ----------
       المصدر: جدول التجهيز وجدول المطفآت المعتمد دون تغيير الكميات أو اختراع مواصفات. */
    /* facility: الجهة (hospital | complex) — لا تُدمج أعداد الجهتين.
       ffMode: portable | automatic | null (null = غير محدد في المصدر؛ لا يُخمَّن). */
    var FF_CATALOG_SEED = [
        // ===== المستشفى =====
        { id: "ff-type-ext-6kg-dp-portable", facility: "hospital", name: "6kg Dry Powder (ABCE) Portable Fire Extinguisher", nameAr: "مطفأة بودرة جافة 6 كغم (ABCE) محمولة", ffGroup: "extinguishers", ffMode: "portable", approvedQuantity: 221, unit: "pcs", sourceDescription: "", notes: "" },
        { id: "ff-type-ext-12kg-dp-top-auto", facility: "hospital", name: "12kg Dry Powder (ABCE) Top Automatic Fire Extinguisher", nameAr: "مطفأة بودرة جافة 12 كغم (ABCE) أوتوماتيكية علوية", ffGroup: "extinguishers", ffMode: "automatic", approvedQuantity: 14, unit: "pcs", sourceDescription: "", notes: "" },
        { id: "ff-type-ext-5kg-co2-portable", facility: "hospital", name: "5kg CO2 Portable Fire Extinguisher", nameAr: "مطفأة ثاني أكسيد الكربون 5 كغم محمولة", ffGroup: "extinguishers", ffMode: "portable", approvedQuantity: 38, unit: "pcs", sourceDescription: "", notes: "" },
        { id: "ff-type-ext-50kg-foam", facility: "hospital", name: "50kg Foam", nameAr: "معدة إطفاء بالرغوة 50 كغم", ffGroup: "foam", ffMode: null, approvedQuantity: 4, unit: "pcs", sourceDescription: "50kgm foam", notes: "الوصف الأصلي في مصدر البيانات: «50kgm foam». نوع الرغوة وطريقة التشغيل (محمولة/عجلات/ثابتة) غير مذكورين في المصدر." },
        { id: "ff-type-fixed-hydrant", facility: "hospital", name: "Fire Hydrant", nameAr: "حنفية الحريق", ffGroup: "hydrants", ffMode: null, approvedQuantity: 15, unit: "pcs", sourceDescription: "", notes: "" },
        { id: "ff-type-fixed-hose-cabinet", facility: "hospital", name: "Fire Hose Cabinet", nameAr: "صندوق خرطوم الحريق", ffGroup: "hose-cabinets", ffMode: null, approvedQuantity: 130, unit: "pcs", sourceDescription: "", notes: "" },
        { id: "ff-type-acc-valves", facility: "hospital", name: "Valves", nameAr: "الصمامات", ffGroup: "pump-set", ffMode: null, approvedQuantity: null, unit: null, sourceDescription: "", notes: "كمية ومواصفات هذه الملحقات غير واردة في المصدر — تُسجَّل عند التأكيد الفني." },
        { id: "ff-type-acc-sensors", facility: "hospital", name: "Sensors", nameAr: "الحساسات", ffGroup: "pump-set", ffMode: null, approvedQuantity: null, unit: null, sourceDescription: "", notes: "كمية ومواصفات هذه الملحقات غير واردة في المصدر — تُسجَّل عند التأكيد الفني." },
        { id: "ff-type-acc-pressure-gauges", facility: "hospital", name: "Pressure Gauges", nameAr: "مقاييس الضغط", ffGroup: "pump-set", ffMode: null, approvedQuantity: null, unit: null, sourceDescription: "", notes: "كمية ومواصفات هذه الملحقات غير واردة في المصدر — تُسجَّل عند التأكيد الفني." },
        { id: "ff-type-acc-other", facility: "hospital", name: "Other Accessories", nameAr: "أجهزة القياس والتحكم الأخرى", ffGroup: "pump-set", ffMode: null, approvedQuantity: null, unit: null, sourceDescription: "", notes: "كمية ومواصفات هذه الملحقات غير واردة في المصدر — تُسجَّل عند التأكيد الفني." },
        // ===== المجمع (الأعداد المسجلة سابقاً؛ الأنواع والمواصفات غير محددة في المصدر) =====
        { id: "ff-cx-pumps", facility: "complex", name: "Fire Pumps — Complex", nameAr: "مضخات الحريق — المجمع", ffGroup: "pump-set", ffMode: null, approvedQuantity: 3, unit: "pcs", sourceDescription: "", notes: "العدد المسجل 3؛ أنواع المضخات ومواصفاتها غير واردة في المصدر وتُسجَّل عند التأكيد الفني." },
        { id: "ff-cx-extinguishers", facility: "complex", name: "Fire Extinguishers — Complex", nameAr: "مطافئ الحريق — المجمع", ffGroup: "extinguishers", ffMode: null, approvedQuantity: 12, unit: "pcs", sourceDescription: "", notes: "العدد المسجل 12؛ الأنواع والسعات (محمولة/أوتوماتيكية) غير واردة في المصدر." },
        { id: "ff-cx-hose-cabinets", facility: "complex", name: "Fire Hose Cabinets — Complex", nameAr: "صناديق خراطيم الحريق — المجمع", ffGroup: "hose-cabinets", ffMode: null, approvedQuantity: 12, unit: "pcs", sourceDescription: "", notes: "العدد المسجل 12." }
    ];

    /* ---------- وحدات فردية: سجلات ومنع تكرار ----------
       دوال نقية تُفصل بها بيانات كل وحدة عن الأخرى (لا اختلاط)،
       وتحسب عدادات النوع من البيانات المسجّلة فعلياً فقط. */

    // سجلات وحدة واحدة: فحوصات (أوامر نوع INSPECTION)، أعطال (BREAKDOWN)،
    // كل أوامر العمل المرتبطة، وسجلات الصيانة — كلها مفلترة بـ equipmentId.
    function ffUnitLogs(orders, pmLogs, unitId) {
        var mine = (orders || []).filter(function (o) { return o && o.equipmentId === unitId; });
        return {
            inspections: mine.filter(function (o) { return o.type === "INSPECTION"; }),
            faults: mine.filter(function (o) { return o.type === "BREAKDOWN"; }),
            workOrders: mine,
            maintenance: (pmLogs || []).filter(function (l) { return l && l.equipmentId === unitId; })
        };
    }

    // توليد رمز داخلي مؤقت غير مكرر: PREFIX-001، PREFIX-002…
    // existingCodes: مصفوفة الرموز المستخدمة فعلياً؛ excludeCode للتنويع عند الحاجة.
    function ffNextInternalCode(existingCodes, prefix, excludeCode) {
        var used = {};
        (existingCodes || []).forEach(function (c) {
            if (c) used[String(c).trim().toUpperCase()] = 1;
        });
        var p = (prefix || "FF-UNIT").toUpperCase();
        var n = 1;
        var code;
        do {
            code = p + "-" + String(n).padStart(3, "0");
            n++;
        } while (used[code.toUpperCase()] || code.toUpperCase() === String(excludeCode || "").trim().toUpperCase());
        return code;
    }

    // بحث عن تكرار رقم Tag بين وحدات (تجاهل الحالة والأطراف، واستثنِ وحدة واحدة)
    function ffFindDuplicateTag(units, tagNumber, excludeId) {
        var tag = String(tagNumber || "").trim().toLowerCase();
        if (!tag) return null;
        var found = null;
        (units || []).forEach(function (u) {
            if (found || !u) return;
            if (excludeId && u.id === excludeId) return;
            if (String(u.tagNumber || "").trim().toLowerCase() === tag) found = u;
        });
        return found;
    }

    // عدادات كل نوع في سجل الأنواع: المسجل فردياً / ذو سجل فحص /
    // ذو أعطال مفتوحة — كلها من البيانات المسجّلة فقط.
    function ffCatalogCounts(types, units, orders) {
        var out = {};
        (types || []).forEach(function (t) {
            var mine = (units || []).filter(function (u) {
                if (!u) return false;
                if (u.catalogTypeId) return u.catalogTypeId === t.id;
                // وحدة قديمة بلا نوع كتالوج: تطابق بالاسم، وبالجهة عند توفرها على الطرفين
                return u.type === t.name && (!u.facility || !t.facility || u.facility === t.facility);
            });
            var mineIds = {};
            mine.forEach(function (u) { mineIds[u.id] = 1; });
            var openStatuses = { "NEW": 1, "IN PROGRESS": 1, "AWAITING PARTS": 1 };
            var ordersOfUnits = (orders || []).filter(function (o) {
                return o && o.equipmentId && mineIds[o.equipmentId];
            });
            var withInspections = {};
            var withOpenFaults = {};
            ordersOfUnits.forEach(function (o) {
                if (o.type === "INSPECTION") withInspections[o.equipmentId] = 1;
                if (openStatuses[o.status || "NEW"]) withOpenFaults[o.equipmentId] = 1;
            });
            out[t.id] = {
                registered: mine.length,
                withInspections: Object.keys(withInspections).length,
                withOpenFaults: Object.keys(withOpenFaults).length
            };
        });
        return out;
    }



    /* ---------- التصدير العام ---------- */
    return {
        DEPARTMENTS: DEPARTMENTS,
        deptName: deptName,
        deptNameEn: deptNameEn,
        deptIcon: deptIcon,
        deptExists: deptExists,
        deptTypes: deptTypes,
        DEPT_TYPES: DEPT_TYPES,
        EQUIPMENT_STATUSES: EQUIPMENT_STATUSES,
        EQUIPMENT_STATUS_LABELS: EQUIPMENT_STATUS_LABELS,
        equipStatusLabel: equipStatusLabel,
        CRITICALITY: CRITICALITY,
        CRITICALITY_LABELS: CRITICALITY_LABELS,
        criticalityLabel: criticalityLabel,
        PRIORITY: PRIORITY,
        PRIORITY_LABELS: PRIORITY_LABELS,
        priorityLabel: priorityLabel,
        STATUSES: STATUSES,
        STATUS_LABELS: STATUS_LABELS,
        statusLabel: statusLabel,
        REQUEST_TYPES: REQUEST_TYPES,
        REQUEST_TYPE_LABELS: REQUEST_TYPE_LABELS,
        requestTypeLabel: requestTypeLabel,
        PM_PERIODS: PM_PERIODS,
        PM_PERIOD_LABELS: PM_PERIOD_LABELS,
        pmPeriodLabel: pmPeriodLabel,
        PM_PERIOD_DAYS: PM_PERIOD_DAYS,
        PM_TYPES: PM_TYPES,
        PM_TYPE_LABELS: PM_TYPE_LABELS,
        pmTypeLabel: pmTypeLabel,
        SPARE_STATUSES: SPARE_STATUSES,
        SPARE_STATUS_LABELS: SPARE_STATUS_LABELS,
        spareStatusLabel: spareStatusLabel,
        PM_STATUS_LABELS: PM_STATUS_LABELS,
        pmStatusLabel: pmStatusLabel,
        TYPE_FIELD_TEMPLATES: TYPE_FIELD_TEMPLATES,
        typeFields: typeFields,
        FF_GROUPS: FF_GROUPS,
        ffGroupOf: ffGroupOf,
        TECH_LABELS: TECH_LABELS,
        techLabel: techLabel,
        FF_FACILITIES: FF_FACILITIES,
        FF_UNASSIGNED_FACILITY: FF_UNASSIGNED_FACILITY,
        ffFacilityOf: ffFacilityOf,
        ffScopeData: ffScopeData,
        ffApprovedTotals: ffApprovedTotals,
        FF_PUMP_SEED: FF_PUMP_SEED,
        FF_CATALOG_SEED: FF_CATALOG_SEED,
        ffUnitLogs: ffUnitLogs,
        ffNextInternalCode: ffNextInternalCode,
        ffFindDuplicateTag: ffFindDuplicateTag,
        ffCatalogCounts: ffCatalogCounts,
        toDate: toDate,
        toDateInputValue: toDateInputValue,
        formatDateShort: formatDateShort,
        daysBetween: daysBetween,
        computeNextDue: computeNextDue,
        pmStatus: pmStatus,
        computeStats: computeStats,
        buildFollowUpList: buildFollowUpList,
        buildOrderNumber: buildOrderNumber,
        validateInspection: validateInspection,
        validateMaintenance: validateMaintenance,
        validateFault: validateFault,
        ffLogEquipmentChange: ffLogEquipmentChange,
        validateEquipment: validateEquipment,
        validateOrder: validateOrder,
        validatePlan: validatePlan,
        validateSpare: validateSpare,
        toCsv: toCsv,
        csvWithBom: csvWithBom,
        filterEquipment: filterEquipment,
        filterOrders: filterOrders
    };
});


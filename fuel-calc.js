/* ============================================================
   fuel-calc.js — المحرك الهندسي لقسم خزانات الكاز
   ------------------------------------------------------------
   دوال نقية (بلا DOM ولا Firebase) حتى يمكن اختبارها في Node:
     node tests/fuel-calc.test.js
   وتعمل في المتصفح كمتغير عام: window.FuelCalc
   ============================================================ */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.FuelCalc = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    // ---------- الإعدادات الافتراضية للتنبيهات (قابلة للتعديل من الواجهة) ----------
    var DEFAULT_SETTINGS = {
        lowPercent: 20,          // تنبيه "انخفاض" عند نسبة امتلاء أقل من هذه القيمة
        highPercent: 90,         // تنبيه "قرب الامتلاء" عند نسبة أكبر من أو تساوي هذه القيمة
        staleDays: 7,            // تنبيه "لم تُحدَّث القراءة" بعد هذا العدد من الأيام
    };

    // ---------- طرق القياس ----------
    var METHODS = {
        top_distance: {
            label: "المسافة من أعلى الخزان إلى سطح الكاز",
            short: "مسافة من الأعلى"
        },
        level_height: {
            label: "ارتفاع الكاز من القاع",
            short: "ارتفاع من القاع"
        }
    };

    var SHAPES = {
        hcyl: "أسطواني أفقي",
        rect: "مستطيل"
    };

    // ---------- تعريف الخزانات السبعة ----------
    // الترقيم: 1 مولدات المستشفى (38,000)، 2 المجمع، 3 و4 البويلر، ثم الخزانات الصغيرة الممتلئة دائماً 5 و6 و7.
    // المعرّفات القديمة (hospitalGenerator, complexGenerator, boiler1, boiler2)
    // محفوظة كما هي لأنها مرتبطة بوثائق Firestore الموجودة.
    // legacyQuantityOk: يُسمح باعتبار حقل quantity القديم (لترات) قراءة صالحة.
    //   - خزانات البويلر المستطيلة: نعم (تحويل لتر ← ارتفاع دقيق خطياً).
    //   - الخزان 38,000 والمجمع: لا، تُهمل القيمة القديمة ويُطلب قياس جديد.
    var DEFINITIONS = [
        {
            id: "hospitalGenerator", no: 1, name: "الخزان 1", note: "خزان الكاز الكبير (مولدات المستشفى)",
            nominalL: 38000, shape: "hcyl", lengthM: 7.75, diameterM: 2.5,
            method: "top_distance", legacyQuantityOk: false
        },
        {
            id: "complexGenerator", no: 2, name: "الخزان 2", note: "خزان مولدة المجمع",
            nominalL: 13000, shape: "hcyl", lengthM: 3.2, diameterM: 2.3,
            method: "top_distance", legacyQuantityOk: false
        },
        {
            id: "boiler1", no: 3, name: "الخزان 3", note: "خزان بويلر رقم 1",
            nominalL: 13500, shape: "rect", lengthM: 3, widthM: 3, heightM: 1.5,
            method: "level_height", legacyQuantityOk: true
        },
        {
            id: "boiler2", no: 4, name: "الخزان 4", note: "خزان بويلر رقم 2",
            nominalL: 13500, shape: "rect", lengthM: 3, widthM: 3, heightM: 1.5,
            method: "level_height", legacyQuantityOk: true
        },
        // الخزانات 1-3: أبعاد مستطيلة (الطول × العرض × الارتفاع الداخلي، بالمتر).
        // alwaysFull: بقرار المستخدم تُعتبر ممتلئة دائماً (كمية ثابتة = السعة الاسمية)،
        // فلا تحتاج قراءات ولا تُنتج تنبيهات. تبقى الأبعاد للعرض والرسم.
        {
            id: "tank1", no: 5, name: "الخزان 5", note: "", nominalL: 2000,
            shape: "rect", lengthM: 1, widthM: 1, heightM: 2,
            method: "level_height", legacyQuantityOk: false, alwaysFull: true
        },
        {
            id: "tank2", no: 6, name: "الخزان 6", note: "", nominalL: 2000,
            shape: "rect", lengthM: 1, widthM: 1, heightM: 2,
            method: "level_height", legacyQuantityOk: false, alwaysFull: true
        },
        {
            id: "tank3", no: 7, name: "الخزان 7", note: "", nominalL: 4000,
            shape: "rect", lengthM: 2, widthM: 1, heightM: 2,
            method: "level_height", legacyQuantityOk: false, alwaysFull: true
        }
    ];

    var TOTAL_NOMINAL_L = DEFINITIONS.reduce(function (s, d) { return s + d.nominalL; }, 0);

    // ---------- أدوات مساعدة ----------
    var EPS = 1e-9;

    function isNum(v) {
        return typeof v === "number" && isFinite(v);
    }

    function round(value, digits) {
        var f = Math.pow(10, digits || 0);
        return Math.round(value * f) / f;
    }

    // تحويل الأرقام العربية-الهندية والفاصلة العربية إلى صيغة قياسية
    function normalizeDigits(text) {
        return String(text)
            .replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
            .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x06F0); })
            .replace(/[٫٬,،]/g, ".")
            .trim();
    }

    // تحويل نص الإدخال إلى رقم، أو رسالة خطأ واضحة
    function parseInput(raw) {
        if (raw === null || raw === undefined || String(raw).trim() === "") {
            return { ok: false, error: "أدخل القراءة أولاً" };
        }
        if (typeof raw === "number") {
            if (!isFinite(raw)) return { ok: false, error: "القراءة يجب أن تكون رقماً" };
            if (raw < 0) return { ok: false, error: "لا يمكن إدخال قيمة سالبة" };
            return { ok: true, value: raw };
        }
        var text = normalizeDigits(raw);
        if (/^-/.test(text)) return { ok: false, error: "لا يمكن إدخال قيمة سالبة" };
        if (!/^\d+(\.\d+)?$|^\.\d+$/.test(text)) {
            return { ok: false, error: "القراءة يجب أن تكون رقماً صحيحاً (مثال: 85 أو 85.5)" };
        }
        return { ok: true, value: parseFloat(text) };
    }

    function toMeters(value, unit) {
        return unit === "m" ? value : value / 100;
    }

    function fromMeters(valueM, unit) {
        return unit === "m" ? valueM : valueM * 100;
    }

    // ---------- الهندسة ----------
    function validGeometry(g) {
        if (!g) return false;
        if (g.shape === "hcyl") return isNum(g.lengthM) && g.lengthM > 0 && isNum(g.diameterM) && g.diameterM > 0;
        if (g.shape === "rect") {
            return isNum(g.lengthM) && g.lengthM > 0 && isNum(g.widthM) && g.widthM > 0 &&
                isNum(g.heightM) && g.heightM > 0;
        }
        return false;
    }

    // الهندسة الفعلية للخزان: المعرّفة في الكود، وإلا المحفوظة (config) إن كانت صالحة، وإلا null
    function getGeometry(def, config) {
        if (def.shape) {
            return validGeometry(def) ? def : null;
        }
        if (config && validGeometry(config) && METHODS[config.method]) return config;
        return null;
    }

    // أقصى ارتفاع داخلي للسائل (متر)
    function maxLevelM(geo) {
        return geo.shape === "hcyl" ? geo.diameterM : geo.heightM;
    }

    // حجم المقطع الدائري الأفقي (لتر): V = L × [r²·acos((r−h)/r) − (r−h)·√(2rh−h²)]
    function cylinderVolumeL(lengthM, diameterM, levelM) {
        var r = diameterM / 2;
        var h = levelM;
        if (h < -EPS || h > diameterM + EPS) return NaN;
        if (h <= 0) return 0;
        if (h >= diameterM) return Math.PI * r * r * lengthM * 1000;
        var ratio = Math.max(-1, Math.min(1, (r - h) / r));
        var inner = Math.max(0, 2 * r * h - h * h);
        var area = r * r * Math.acos(ratio) - (r - h) * Math.sqrt(inner);
        return lengthM * area * 1000;
    }

    function rectVolumeL(lengthM, widthM, levelM) {
        if (levelM < -EPS) return NaN;
        return lengthM * widthM * Math.max(0, levelM) * 1000;
    }

    function geometricCapacityL(geo) {
        if (!geo) return null;
        if (geo.shape === "hcyl") return Math.PI * Math.pow(geo.diameterM / 2, 2) * geo.lengthM * 1000;
        return geo.lengthM * geo.widthM * geo.heightM * 1000;
    }

    function volumeFromLevelL(geo, levelM) {
        return geo.shape === "hcyl"
            ? cylinderVolumeL(geo.lengthM, geo.diameterM, levelM)
            : rectVolumeL(geo.lengthM, geo.widthM, levelM);
    }

    // ارتفاع (متر) ← حجم، لتحويل القيم القديمة (لتر) في المستطيل فقط
    function levelFromVolumeRectM(geo, volumeL) {
        return volumeL / 1000 / (geo.lengthM * geo.widthM);
    }

    // ---------- حساب قراءة واحدة ----------
    // المدخلات: geo (الهندسة)، method، القيمة الخام (نص أو رقم)، الوحدة ("cm" أو "m")
    function computeReading(geo, method, rawValue, unit) {
        if (!geo) return { ok: false, error: "أبعاد الخزان غير متوفرة للحساب" };
        if (!METHODS[method]) return { ok: false, error: "طريقة القياس غير محددة" };
        if (unit !== "cm" && unit !== "m") unit = "cm";

        var parsed = parseInput(rawValue);
        if (!parsed.ok) return parsed;

        var valueM = toMeters(parsed.value, unit);
        var maxM = maxLevelM(geo);

        if (valueM > maxM + EPS) {
            var maxShown = round(fromMeters(maxM, unit), 2);
            var what = method === "top_distance" ? "المسافة" : "الارتفاع";
            return {
                ok: false,
                error: what + " خارج الحدود: يجب أن تكون بين 0 و " + maxShown + (unit === "m" ? " م" : " سم") +
                    " (تأكد من الوحدة المختارة)"
            };
        }
        if (valueM > maxM) valueM = maxM; // فرق تقريب عائم فقط

        var levelM = method === "top_distance" ? maxM - valueM : valueM;
        if (levelM < 0) levelM = 0;

        var volumeL = volumeFromLevelL(geo, levelM);
        if (!isNum(volumeL)) return { ok: false, error: "تعذر حساب الحجم من هذه القراءة" };

        return {
            ok: true,
            levelM: round(levelM, 6),
            distanceM: method === "top_distance" ? round(valueM, 6) : null,
            volumeL: round(volumeL, 1),
            geomCapacityL: round(geometricCapacityL(geo), 1),
            maxM: maxM
        };
    }

    // ---------- حالة خزان واحد ----------
    function toDate(ts) {
        if (!ts) return null;
        try {
            if (ts instanceof Date) return ts;
            if (typeof ts.toDate === "function") return ts.toDate();
            if (isNum(ts.seconds)) return new Date(ts.seconds * 1000);
            var d = new Date(ts);
            return isNaN(d.getTime()) ? null : d;
        } catch (e) {
            return null;
        }
    }

    function mergeSettings(saved) {
        var s = {};
        Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
            s[k] = saved && isNum(saved[k]) && saved[k] >= 0 ? saved[k] : DEFAULT_SETTINGS[k];
        });
        return s;
    }

    // doc: الوثيقة المحفوظة في Firestore (أو undefined)
    // الحالة (status):
    //   ok          قراءة صالحة (بعد إعادة الحساب من القيمة الخام)
    //   no_reading  لا توجد قراءة صالحة (لا تُعتبر صفراً)
    //   no_geometry أبعاد/طريقة قياس ناقصة
    function deriveTankState(def, doc, settings, now) {
        settings = settings || DEFAULT_SETTINGS;
        now = now || new Date();
        doc = doc || {};

        var geo = getGeometry(def, doc.config);
        var method = def.method || (doc.config && doc.config.method) || null;

        var state = {
            id: def.id, def: def, geo: geo, method: method,
            nominalL: def.nominalL,
            geomCapacityL: geo ? round(geometricCapacityL(geo), 1) : null,
            status: "no_reading", source: null,
            volumeL: null, emptyL: null, percent: null, levelM: null,
            rawValue: null, unit: null,
            updatedAt: toDate(doc.updatedAt), updatedBy: doc.updatedBy || null,
            stale: false, overflowL: 0, ageDays: null
        };

        // خزان ممتلئ دائماً بقرار المستخدم: كمية ثابتة بلا قراءات
        if (def.alwaysFull) {
            state.status = "ok";
            state.source = "always_full";
            state.volumeL = def.nominalL;
            state.emptyL = 0;
            state.percent = 100;
            state.levelM = geo ? maxLevelM(geo) : null;
            state.updatedAt = null;
            return state;
        }

        if (!geo) {
            state.status = "no_geometry";
            return state;
        }

        var volume = null;

        // 1) قراءة حديثة محفوظة بالصيغة الجديدة: نعيد الحساب من القيمة الخام
        var r = doc.reading;
        if (r && isNum(r.value) && METHODS[r.method]) {
            var calc = computeReading(geo, r.method, r.value, r.unit);
            if (calc.ok) {
                volume = calc.volumeL;
                state.levelM = calc.levelM;
                state.rawValue = r.value;
                state.unit = r.unit;
                state.method = r.method;
                state.source = "reading";
            }
        }

        // 2) قيمة قديمة (لتر مباشرة) — فقط للخزانات المسموح لها
        if (volume === null && def.legacyQuantityOk && isNum(doc.quantity) &&
            doc.quantity >= 0 && doc.quantity <= def.nominalL + 0.5 && geo.shape === "rect") {
            volume = doc.quantity;
            state.levelM = round(levelFromVolumeRectM(geo, doc.quantity), 6);
            state.source = "legacy";
        }

        if (volume === null) return state;

        state.status = "ok";
        state.volumeL = volume;
        state.overflowL = volume > def.nominalL + 0.5 ? round(volume - def.nominalL, 1) : 0;
        state.emptyL = Math.max(0, round(def.nominalL - volume, 1));
        state.percent = (volume / def.nominalL) * 100;

        if (state.updatedAt) {
            state.ageDays = (now.getTime() - state.updatedAt.getTime()) / 86400000;
            state.stale = state.ageDays > settings.staleDays;
        }
        return state;
    }

    // ---------- الإجماليات ----------
    // لا تُعتبر الخزانات بلا قراءة فارغة؛ الإجمالي "غير مكتمل" ما لم تتوفر قراءة للسبعة.
    function computeTotals(states) {
        var t = {
            tankCount: states.length,
            nominalL: states.reduce(function (s, x) { return s + x.nominalL; }, 0),
            countedCount: 0, availableL: 0, emptyL: 0, countedNominalL: 0,
            missingIds: [], staleIds: [], complete: false,
            percent: null, percentBasis: "all"
        };
        states.forEach(function (s) {
            if (s.status === "ok") {
                t.countedCount++;
                t.availableL += s.volumeL;
                t.emptyL += s.emptyL;
                t.countedNominalL += s.nominalL;
                if (s.stale) t.staleIds.push(s.id);
            } else {
                t.missingIds.push(s.id);
            }
        });
        t.availableL = round(t.availableL, 1);
        t.emptyL = round(t.emptyL, 1);
        t.complete = t.countedCount === t.tankCount;
        t.needsUpdateCount = t.missingIds.length + t.staleIds.length;
        if (t.countedCount > 0) {
            // مكتمل: ÷ 86,000 ؛ غير مكتمل: ÷ سعة الخزانات المحسوبة فقط (حتى لا تنخفض النسبة وهمياً)
            var basis = t.complete ? t.nominalL : t.countedNominalL;
            t.percentBasis = t.complete ? "all" : "counted";
            t.percent = (t.availableL / basis) * 100;
        }
        return t;
    }

    // ---------- التنبيهات ----------
    // level: error | warn | info
    function buildAlerts(states, settings, now) {
        settings = settings || DEFAULT_SETTINGS;
        var out = [];
        states.forEach(function (s) {
            var label = s.def.name;
            if (s.def.alwaysFull) return; // ممتلئ دائماً: لا تنبيهات
            if (s.status === "no_geometry") {
                out.push({ level: "info", tankId: s.id, code: "no_geometry",
                    text: label + ": أبعاد الخزان أو طريقة القياس غير مسجلة، لذلك لا يمكن حساب الكمية" });
                return;
            }
            if (s.status === "no_reading") {
                out.push({ level: "warn", tankId: s.id, code: "no_reading",
                    text: label + ": لا توجد قراءة صالحة (لا تُحتسب كخزان فارغ)" });
                return;
            }
            if (s.overflowL > 0) {
                out.push({ level: "error", tankId: s.id, code: "overflow",
                    text: label + ": الكمية المحسوبة تتجاوز السعة الاسمية بمقدار " + Math.round(s.overflowL) +
                        " لتر — تحقق من القياس أو المعايرة" });
            }
            if (s.percent < settings.lowPercent) {
                out.push({ level: "warn", tankId: s.id, code: "low",
                    text: label + ": مستوى الكاز منخفض (" + Math.round(s.percent) + "%)" });
            } else if (s.percent >= settings.highPercent && s.overflowL === 0) {
                out.push({ level: "info", tankId: s.id, code: "high",
                    text: label + ": قريب من الامتلاء (" + Math.round(s.percent) + "%)" });
            }
            if (s.stale) {
                out.push({ level: "warn", tankId: s.id, code: "stale",
                    text: label + ": لم تُحدَّث القراءة منذ " + Math.floor(s.ageDays) + " يوماً" });
            }
        });
        return out;
    }

    return {
        DEFAULT_SETTINGS: DEFAULT_SETTINGS,
        METHODS: METHODS,
        SHAPES: SHAPES,
        DEFINITIONS: DEFINITIONS,
        TOTAL_NOMINAL_L: TOTAL_NOMINAL_L,
        parseInput: parseInput,
        toMeters: toMeters,
        fromMeters: fromMeters,
        validGeometry: validGeometry,
        getGeometry: getGeometry,
        maxLevelM: maxLevelM,
        cylinderVolumeL: cylinderVolumeL,
        rectVolumeL: rectVolumeL,
        geometricCapacityL: geometricCapacityL,
        volumeFromLevelL: volumeFromLevelL,
        computeReading: computeReading,
        mergeSettings: mergeSettings,
        deriveTankState: deriveTankState,
        computeTotals: computeTotals,
        buildAlerts: buildAlerts,
        toDate: toDate
    };
});

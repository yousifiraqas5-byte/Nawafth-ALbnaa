// ============================================================
// شركة نوافذ البناء - script.js
// المشتريات + التقارير اليومية + المهام
// ============================================================

const PURCHASES_COLLECTION = "purchases";
const REPORTS_COLLECTION = "reports";
const TASKS_COLLECTION = "tasks";
const MATERIALS_COLLECTION = "materials";
const NOTIFICATIONS_COLLECTION = "notifications";
const TOKENS_COLLECTION = "notificationTokens";
const MEDICAL_FAULTS_COLLECTION = "medical_device_faults";
const MEDICAL_COUNTERS_COLLECTION = "counters";
const FUEL_TANKS_COLLECTION = "fuelTanks";
const MEDICAL_LOCATIONS_COLLECTION = "medical_locations";

// قسم الميكانيك — مجموعات Firestore والثوابت
const MECH_EQUIPMENT_COLLECTION = "mechanical_equipment";
const MECH_ORDERS_COLLECTION = "mechanical_work_orders";
const MECH_ORDER_HISTORY_COLLECTION = "mechanical_work_order_history";
const MECH_PM_PLANS_COLLECTION = "mechanical_pm_plans";
const MECH_PM_LOGS_COLLECTION = "mechanical_pm_logs";
const MECH_SPARES_COLLECTION = "mechanical_spares";
const MECH_COUNTERS_COLLECTION = "mechanical_counters";
const MECH_TYPES_COLLECTION = "mechanical_equipment_types";

// حالة قسم الميكانيك (ذاكرة التطبيق)
const MC = window.MechanicsCalc || {};
let mechActiveDept = "fire-fighting";
let mechActiveTab = "dashboard"; // dashboard | equipment | orders | pm | spares | reports
let mechEquipmentCache = [];
let mechOrdersCache = [];
let mechPmPlansCache = [];
let mechPmLogsCache = [];
let mechSparesCache = [];
let mechTypesCache = [];
let mechActiveOrderId = null;
let mechLoaded = false;
let mechLoadFailures = [];   // أسماء المجموعات التي فشل تحميلها (صلاحيات/اتصال)
let mechLoadErrors = [];     // تفاصيل الفشل: { name, code, message }
let mechDataUnsubscribe = null;

let mechEquipShown = 0;
let mechOrderShown = 0;
let mechLastLoadAt = 0;
let mechOrderHistoryCache = [];
// فلاتر قائمة المعدات (عرض فقط)
let mechEquipStatusFilter = "";
let mechEquipCriticalityFilter = "";
let mechEquipSearch = "";
// فلاتر قائمة أوامر العمل (عرض فقط)
let mechOrderStatusFilter = "";
let mechOrderPriorityFilter = "";
let mechOrderSearch = "";
// فلتر قائمة «الأعمال التي تحتاج إلى متابعة» (عرض فقط): all | orders | pm
let mechFollowFilter = "all";
// مسار وحدة Firestore المستخدم في كل عمليات قسم الميكانيك
const MECH_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// مهم: ضع هنا مفتاح VAPID العام من
// Firebase Console > Project settings > Cloud Messaging > Web push certificates
const VAPID_KEY = "BHbv8qWWjW8vpXgOUwauTqEev2HCJSAtpXsOiR9_YRKNWY2LwBXbiZwn_SnIpRNNL0vkvIFM0yVHkBoD-DsCfp4";

// ============================================================
// المتغيرات
// ============================================================

let purchasesCache = [];
let reportsCache = [];
let tasksCache = [];
let materialsCache = [];
let notificationsCache = [];

let currentLocation = "";
let currentMaterialAction = "add";
let notificationsUnsubscribe = null;
let localNotifiedIds = new Set();
let toastTimer = null;

let currentEngineer = "";

// ============================================================
// أسماء المهندسين
// ============================================================

const ENGINEERS = [
    "م. يوسف",
    "م. محمد",
    "م. أحمد",
    "م. بلال",
    "م. حسين",
    "د. إبراهيم",
    "م. نور"
];

// ============================================================
// قائمة الأجهزة الطبية (من كتالوج الأجهزة الفعلي)
// ============================================================

const MEDICAL_DEVICES = [
    "(Automated Clinical Analyzer) CLINICAL CHEMISTRY LAB / BIOCHEMISTERY FULL AUTOMATED",
    "(Laryngoscope) Video Laryngoscope",
    "A/B SCAN",
    "ACT MACHINE",
    "Anaesthesia Machine,",
    "Analyser, Haematology, Multi-Parameter (3 parts Differential)",
    "Analyser, Haematology, Multi-Parameter (5 parts Differential)",
    "ANALYZERS, COAGULATION, AUTOMATED",
    "APRON, LEAD",
    "Audiometer, Clinical",
    "AUTO IMMUNE ANALYZER",
    "Auto lense meter",
    "Auto refractokeratmeter with electrical lift table",
    "Autoclave 20L",
    "Autoclave large (DOUBLE DOOR)",
    "Autoclave small",
    "BACTERIA IDENTIFICATION SYSTEM",
    "Balance board",
    "Balance, Precision",
    "Basinette, Infant",
    "BATHS, TISSUE FLOATATION",
    "Bilirubin Anaylzer",
    "bilirubin meter",
    "Biometry and anterior corneal measurement device",
    "Blood gas analyzer",
    "blood gas analyzer (portable)",
    "Blunder",
    "body washing table",
    "Bone Densitometer",
    "Breast Pump",
    "BROCHOSCOPY PEDIATRIC SIZE FLXIABLE",
    "CARDIAC MARKER ANALYZER",
    "CENTERFUAGE",
    "Centrifuge (PCV)",
    "Centrifuge, Bench Mounted, General Purpose",
    "Centrifuge, Haematocrit",
    "Chair, Patient, ENT",
    "Class II Cabinet, Containment, A2",
    "Cogaluation",
    "Colposcopy device",
    "COMBINATION THERAPY, ULTRASOUND AND ELECTROTHERAPY",
    "COMPRESSION UNIT SEQUENTIAL",
    "CONTINIOUS AND PULSED MICROWAVE THERAPY",
    "CONTINUOUS AND PULSED SHORTWAVE THERAPY",
    "Corneal topography, with electrical lift table",
    "Counter / Sink, + Water gun, air gun (Double)",
    "CPM Lower",
    "CPM Upper",
    "CRB / D-DIMAR",
    "CRIBS BAY",
    "CRYOSTAT",
    "Curettage set",
    "Defibrillator & Accessories",
    "dental chair, set complete",
    "dental microscopy",
    "dental x-ray portable",
    "dermoscope",
    "Digital Fluoroscopy x-ray",
    "Digital Radiography DR Unit / General & Bucky",
    "DIGITAL TOURNIQUET",
    "Digital X-Ray Unit, C-Arm",
    "digital-ready slit lamp",
    "Dumb-Bells with Rack",
    "Echo portable machine",
    "ECHO/ Cardiac HOSPITAL TYPE",
    "EEG Monitoring System",
    "Eggsercizer",
    "Electronic Scales, Lab.",
    "Electrosurgical unit (Electro Surgery Unit / Basic)",
    "ElectroSurgicalUnit,With Trolley",
    "ELIZA ANALYZER",
    "ELYCRTOLYTE ANALYZER",
    "EMG Machine",
    "Endoscope cabinet",
    "Endoscope washer and disinfection unit",
    "Endoscopes Washer",
    "ENDOSCOPY TOWER (GIT)",
    "ENDOSCOPY TOWER (GIT) PEDIATRIC",
    "ENT Head Light Examination Set",
    "ENT, Treatment Unit complete.",
    "Epiluminescence Microscope",
    "ESR ANALYSER",
    "ESWL, lithotripsy unit",
    "Exercise stick.wood, 100 cm",
    "EXTRACTION",
    "EXTRACTION DEVICE",
    "Eye-test chart unit",
    "Foetal, Doppler, portable",
    "Gypsum Saw Machine",
    "HARMONE ANALYZER",
    "Harmonic knife machine",
    "HBA1C ANALYZER",
    "Hemorrhoidectomy set",
    "HIGH ENERGY INDUCTIVE THERAPY,with Trolly and fixed Arm with Trolly",
    "HIGH POWER LASER",
    "High pressure regulator",
    "HOLTER ANALYSES SYSTEM",
    "Holter ECG recorder",
    "IABP Machine",
    "incubator transport, infant",
    "infant incubator",
    "INFRA-RED EQUIPMENT",
    "Infusion Pump",
    "Instrument set, Basic Orthopedics",
    "Instrument set, Major Basic set",
    "Instrument set, Minor Basic Surgery",
    "Instrument set, Open Urethra Surgery",
    "Instrument set, Suture Instrument",
    "Instrument set, Vaginal Hysterectomy",
    "Instrument set, Vaginal Plastic Surgery",
    "Instrument set, Vaginal speculum",
    "LAMINECTOMY SET",
    "Large Rotator / Shaker for Blood Bags",
    "Laryngoscope ,SET",
    "Light, Operating Light, portable(Lamp, Examination, Mobile)",
    "Low Temp. Sterilizer 150L",
    "Magnetic Stirrer / Heater",
    "Massage Unit",
    "Medical exercise mat",
    "Medical GYM Bike Rehab",
    "Medical GYM Chest Press",
    "Medical GYM Leg Extension",
    "Medical GYM Treadmill",
    "Medicine ball, leather",
    "Microbiology Analyser",
    "Microcentrifuge",
    "MICROSCOPE",
    "Microscope, Binocular, Routine",
    "Microscope, Laboratory Binocular",
    "MICROSCOPE, LABORATORY, LIGHT",
    "MICROSCOPY (FLUORESCENT)",
    "MICROTOME",
    "Mixer, Vortex",
    "Monitor, Foetal, Antepartum, Twin / CTG Option",
    "Monitor, Patient",
    "Monitor, Patient, Central",
    "Monitor, Patient, ICU",
    "Monitor, Patient, mobile",
    "Mortuary storage 6 body",
    "nebulizer, portable",
    "OCT WITH FUNDUS CAMERA FA",
    "Operating Table for /LDR",
    "Operating Table for OPHTHALMOLOGY Surgery Accessories",
    "Operating Table for Orthopaedic Surgery W/Accessories",
    "Operating Table for Surgery Accessories",
    "Ophthalmology Surgical microscopy",
    "ophthalmoscope,",
    "Opthalmoscope, Indirect",
    "ORTHOPEDIC POWER DRILL AND SAW SYSTEM(ORTHOPEDIC POWER TOOLS SYSTEM)",
    "Otoscope Diagnostic Set",
    "Oxygen Flowmeter,",
    "Pacemaker, External, Invasive",
    "packing devices",
    "PAPER TROLLY",
    "Parallel bars",
    "patient monitor etco",
    "Perimetry SAP measurement unit",
    "phaco machine",
    "phototherapy cylinderical(Intensive care Incubator 360, Neonatal)",
    "phototherapy free stand",
    "PHYSIOTHERAPY COUCH 2-section",
    "PHYSIOTHERAPY COUCH Hight adjustable, 3-section",
    "Pipette, Hand, Automatic",
    "Pipette, Multichannel",
    "Plasma Extractor",
    "Platelet Shaker Incubator (Incubator, Laboratory)",
    "Pulmonary Function Test machine with cabinet",
    "Real-time PCR",
    "Reanimation Table with Accessories",
    "RECORDER, ECG, 12 CHANNEL W/ INTERPRETIVE SOFTWARE",
    "Refrigerator, Laboratory, Blood Refrigeration",
    "Renal Dialysis, Machine",
    "Renal, Chair",
    "Rep exercise band",
    "Resuscitator Neonatal warming with table (Resuscitator, Neonatal )",
    "Resuscitator, Neonatal, portable (Resuscitator, Neonatal )",
    "Retinoscope & ophthalmoscope, AC power",
    "Rinser, Spray Gun",
    "Roller, Tubes Machine",
    "Scales, Balance, Patient",
    "Scales, Balance, Patient, Pediatric",
    "shaker vibroter",
    "Shaker, Flask, Orbital",
    "SHOCKWAVE THERAPY",
    "Shoulder wheel",
    "SLIDE STAINER, HEMATOLOGY, AUTO",
    "SLIDE STAINER, POWER SUPPLY AND MONITOR",
    "SMOKE EVACUATION",
    "Sphygmomanometer, Digital Automatic",
    "storage, Instrument",
    "Suction Regulator",
    "Suction,SurgicalSuction Unit",
    "SURGICAL Light, Mobile",
    "Swiss Ball",
    "Syringe Pump,",
    "Table Operating, Caesarean Surgery",
    "Table Operating, General Surgery for minor operating",
    "TECAR THERAPY,With Cream and Trolly",
    "Thermometer, Electronic (lab)",
    "THERMOTHERAPY - CHILLING UNIT",
    "THERMOTHERAPY - Packheater,50 - 80 Liter with 12 different Packs",
    "THERMOTHERAPY - Wax Bath",
    "TISSUE EMBEDDING EQUIPMENT",
    "TISSUE PROCESSOR",
    "Tonometer, non-contact type WITH PACHYMETER",
    "Tourniquet, Automatic",
    "TRACTION UNIT WITH COUCHES,with full accessories and cervical",
    "Treadmill Machine with ECG 12 channel",
    "Trial lenses",
    "Ultrasonic nebulizer pediatric\\ adult. Hospital type.",
    "Ultrasound Unit (Ob-Gyn)",
    "Ultrasound Unit hospital type",
    "Ultraviolet Lamp Therapy unit ( UV Cabinet)",
    "vacuum extractor",
    "Ventilator, Adult/Paediatric, hospital type",
    "Ventilator, Paediatric",
    "vien viewer device",
    "Wall bars",
    "WARMER, BLOOD AND FLUID",
    "WARMER,PATIENT, BLANKET",
    "washer devices large (DOUBLE DOOR)",
    "Washer, Ultrasonic",
    "water monometer",
    "Water, Bath",
    "Wrislets",
    "X-ray dental Panoramic",
    "X-ray unit, mobile(DR MOBILE)",
    "X-Ray Viewer, Double",
    "X-Ray Viewer, Single"
];

// ============================================================
// مواقع الجرد (المخازن + المطبخ)
// ============================================================

const INVENTORY_LOCATIONS = {
    containers: { name: "الحاويات", icon: "🚢", sub: "مخزن الحاويات" },
    hall: { name: "القاعة", icon: "🏭", sub: "مخزن القاعة" },
    building6: { name: "مخزن بناية 6", icon: "🏢", sub: "مخزن بناية 6" },
    kitchen: { name: "المطبخ", icon: "🍽️", sub: "إدارة ومتابعة المطبخ" }
};

// ============================================================
// الحصول على Firebase
// ============================================================

function getFirestoreDB() {

    if (!window.firebaseDb) {

        console.error(
            "Firebase Firestore غير متوفر"
        );

        showMessage(
            "حدث خطأ في الاتصال بقاعدة البيانات",
            "error"
        );

        return null;
    }

    return window.firebaseDb;
}

// ============================================================
// التنقل بين الصفحات
// ============================================================

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(page => {

        page.style.display = "none";

    });

    const page =
        document.getElementById(pageId);

    if (page) {

        page.style.display = "block";

        window.scrollTo(
            0,
            0
        );

    } else {

        console.error(
            "الصفحة غير موجودة:",
            pageId
        );

    }

}

// ============================================================
// الصفحة الرئيسية
// ============================================================

function goHome() {

    showPage("homePage");

}

function openStorage() {

    showPage("storagePage");

}

function openReports() {

    showPage("reportsPage");
    getReports();

}

function openPurchases() {

    showPage("purchasesPage");
    getPurchases();

}

// ملاحظة: openMedicalDevices يتم تعريفها مرة واحدة فقط داخل قسم الأجهزة الطبية.

// ============================================================
// رسائل
// ============================================================

function showMessage(
    message,
    type = "success"
) {

    const oldMessage =
        document.getElementById(
            "companyMessage"
        );

    if (oldMessage) {

        oldMessage.remove();

    }

    const messageBox =
        document.createElement(
            "div"
        );

    messageBox.id =
        "companyMessage";

    messageBox.textContent =
        message;

    messageBox.style.position =
        "fixed";

    messageBox.style.top =
        "20px";

    messageBox.style.left =
        "50%";

    messageBox.style.transform =
        "translateX(-50%)";

    messageBox.style.zIndex =
        "99999";

    messageBox.style.padding =
        "14px 24px";

    messageBox.style.borderRadius =
        "12px";

    messageBox.style.color =
        "#fff";

    messageBox.style.fontWeight =
        "bold";

    messageBox.style.fontSize =
        "16px";

    messageBox.style.boxShadow =
        "0 5px 20px rgba(0,0,0,0.25)";

    messageBox.style.direction =
        "rtl";

    messageBox.style.maxWidth =
        "90%";

    messageBox.style.textAlign =
        "center";

    if (type === "error") {

        messageBox.style.background =
            "#d32f2f";

    } else {

        messageBox.style.background =
            "#2e7d32";

    }

    document.body.appendChild(
        messageBox
    );

    setTimeout(
        () => {

            if (
                messageBox &&
                messageBox.parentNode
            ) {

                messageBox.remove();

            }

        },
        4000
    );

}

// ============================================================
// ========================= المشتريات ========================
// ============================================================

function openPurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );

    if (form) {

        form.style.display =
            "block";

    }

}

function closePurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );

    if (form) {

        form.style.display =
            "none";

    }

}

async function getPurchases() {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            getDocs,
            query,
            orderBy
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const q =
            query(
                collection(
                    db,
                    PURCHASES_COLLECTION
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(q);

        purchasesCache = [];

        snapshot.forEach(
            doc => {

                purchasesCache.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );

        renderPurchases();

    } catch (error) {

        console.error(
            "خطأ تحميل المشتريات:",
            error
        );

        try {

            const {
                collection,
                getDocs
            } = await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            );

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        PURCHASES_COLLECTION
                    )
                );

            purchasesCache = [];

            snapshot.forEach(
                doc => {

                    purchasesCache.push({

                        id: doc.id,

                        ...doc.data()

                    });

                }
            );

            purchasesCache.sort(
                (a, b) => {

                    const dateA =
                        a.createdAt?.seconds || 0;

                    const dateB =
                        b.createdAt?.seconds || 0;

                    return dateB - dateA;

                }
            );

            renderPurchases();

        } catch (secondError) {

            console.error(
                "خطأ التحميل الثاني:",
                secondError
            );

            showMessage(
                "تعذر تحميل المشتريات",
                "error"
            );

        }

    }

}

async function addPurchase() {

    if (!requireLoginForWrite(addPurchase)) return;

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

        showMessage(
            "حقول المشتريات غير موجودة",
            "error"
        );

        return;

    }

    const item =
        itemInput.value.trim();

    const unit =
        unitInput.value.trim();

    const quantity =
        quantityInput.value.trim();

    if (
        !item ||
        !unit ||
        !quantity
    ) {

        showMessage(
            "يرجى ملء جميع الحقول",
            "error"
        );

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await addDoc(
            collection(
                db,
                PURCHASES_COLLECTION
            ),
            {

                item: item,

                unit: unit,

                quantity: quantity,

                status: "pending",

                createdAt:
                    serverTimestamp(),

                completedAt: null

            }
        );

        itemInput.value = "";

        unitInput.value = "";

        quantityInput.value = "";

        closePurchaseForm();

        showMessage(
            "تمت إضافة الطلب بنجاح"
        );

        notify(
            "طلب شراء جديد",
            item + " - " + quantity + " " + unit,
            "purchase"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "خطأ إضافة الطلب:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إضافة الطلب: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

function renderPurchases() {

    const pendingContainer =
        document.getElementById(
            "pendingPurchases"
        );

    const completedContainer =
        document.getElementById(
            "completedPurchases"
        );

    const pendingCount =
        document.getElementById(
            "pendingPurchaseCount"
        );

    const completedCount =
        document.getElementById(
            "completedPurchaseCount"
        );

    const pending =
        purchasesCache.filter(
            purchase =>
                purchase.status !==
                "completed"
        );

    const completed =
        purchasesCache.filter(
            purchase =>
                purchase.status ===
                "completed"
        );

    if (pendingCount) {

        pendingCount.textContent =
            pending.length;

    }

    if (completedCount) {

        completedCount.textContent =
            completed.length;

    }

    if (pendingContainer) {

        if (pending.length === 0) {

            pendingContainer.innerHTML = `

                <div class="empty-purchases">

                    <div class="empty-purchases-icon">
                        🛒
                    </div>

                    <strong>
                        لا توجد طلبات شراء
                    </strong>

                    <span>
                        اضغط على "طلب شراء"
                        لإضافة مادة جديدة
                    </span>

                </div>

            `;

        } else {

            pendingContainer.innerHTML =
                pending
                    .map(
                        purchase =>
                            createPurchaseHTML(
                                purchase
                            )
                    )
                    .join("");

        }

    }

    if (completedContainer) {

        if (completed.length === 0) {

            completedContainer.innerHTML = `

                <div class="empty-purchases completed-empty">

                    <div class="empty-purchases-icon">
                        📦
                    </div>

                    <strong>
                        لا توجد مواد مجهزة
                    </strong>

                    <span>
                        الطلبات التي يتم شراؤها
                        ستظهر هنا
                    </span>

                </div>

            `;

        } else {

            completedContainer.innerHTML =
                completed
                    .map(
                        purchase =>
                            createCompletedPurchaseHTML(
                                purchase
                            )
                    )
                    .join("");

        }

    }

}

function createPurchaseHTML(
    purchase
) {

    return `

        <div style="
            background:white;
            border-radius:14px;
            padding:18px;
            margin-bottom:14px;
            box-shadow:0 3px 12px rgba(0,0,0,0.10);
            direction:rtl;
        ">

            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                ${escapeHTML(
                    purchase.item
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                الوحدة:
                ${escapeHTML(
                    purchase.unit
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                العدد:
                ${escapeHTML(
                    purchase.quantity
                )}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:12px;
            ">
                تاريخ الطلب:
                ${formatPurchaseDate(
                    purchase.createdAt
                )}
            </div>

            <button
                onclick="completePurchase('${purchase.id}')"
                style="
                    width:100%;
                    padding:12px;
                    border:0;
                    border-radius:10px;
                    background:#2e7d32;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                تم التجهيز
            </button>

        </div>

    `;

}

function createCompletedPurchaseHTML(
    purchase
) {

    return `

        <div style="
            background:#f1f8f1;
            border-radius:14px;
            padding:18px;
            margin-bottom:14px;
            border:1px solid #c8e6c9;
            direction:rtl;
        ">

            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                ${escapeHTML(
                    purchase.item
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                الوحدة:
                ${escapeHTML(
                    purchase.unit
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                العدد:
                ${escapeHTML(
                    purchase.quantity
                )}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:6px;
            ">
                تاريخ الطلب:
                ${formatPurchaseDate(
                    purchase.createdAt
                )}
            </div>

            <div style="
                color:#2e7d32;
                font-size:13px;
                margin-bottom:12px;
            ">
                تاريخ التجهيز:
                ${formatPurchaseDate(
                    purchase.completedAt
                )}
            </div>

            <button
                onclick="returnPurchase('${purchase.id}')"
                style="
                    width:100%;
                    padding:10px;
                    border:0;
                    border-radius:10px;
                    background:#777;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                إرجاع للطلبات
            </button>

        </div>

    `;

}

async function completePurchase(id) {

    if (!requireLoginForWrite(() => completePurchase(id))) return;

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                PURCHASES_COLLECTION,
                id
            ),
            {

                status: "completed",

                completedAt:
                    serverTimestamp()

            }
        );

        const purchase = purchasesCache.find(p => p.id === id);

        notify(
            "تم تجهيز طلب",
            "تم شراء وتجهيز: " + (purchase ? purchase.item : ""),
            "purchase"
        );

        showMessage(
            "تم نقل الطلب إلى تم تجهيزه"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "خطأ تحديث الطلب:",
            error
        );

        showMessage(
            "حدث خطأ أثناء تحديث الطلب",
            "error"
        );

    }

}

async function returnPurchase(id) {

    if (!requireLoginForWrite(() => returnPurchase(id))) return;

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                PURCHASES_COLLECTION,
                id
            ),
            {

                status: "pending",

                completedAt: null

            }
        );

        showMessage(
            "تم إرجاع الطلب"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "خطأ إرجاع الطلب:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إرجاع الطلب",
            "error"
        );

    }

}

function formatPurchaseDate(
    timestamp
) {

    if (!timestamp) {

        return "-";

    }

    try {

        let date;

        if (
            timestamp.toDate
        ) {

            date =
                timestamp.toDate();

        } else if (
            timestamp.seconds
        ) {

            date =
                new Date(
                    timestamp.seconds * 1000
                );

        } else {

            date =
                new Date(timestamp);

        }

        return date.toLocaleString(
            "ar-IQ",
            {

                year: "numeric",

                month: "2-digit",

                day: "2-digit",

                hour: "2-digit",

                minute: "2-digit"

            }
        );

    } catch (error) {

        return "-";

    }

}

// ============================================================
// ==================== المخازن والمطبخ (الجرد) ===============
// ============================================================

function openWarehouse(locationKey) {
    showInventory(locationKey);
}

function openKitchen() {
    showInventory("kitchen");
}

function showInventory(locationKey) {
    if (!INVENTORY_LOCATIONS[locationKey]) {
        showMessage("المكان غير موجود", "error");
        return;
    }

    currentLocation = locationKey;
    currentMaterialAction = "add";

    const location = INVENTORY_LOCATIONS[locationKey];

    showPage("inventoryPage");

    const title = document.getElementById("inventoryPageTitle");
    if (title) title.textContent = location.name;

    const sub = document.getElementById("inventoryPageSub");
    if (sub) sub.textContent = location.sub;

    const icon = document.getElementById("inventoryPageIcon");
    if (icon) icon.textContent = location.icon;

    const backButton = document.getElementById("inventoryBackButton");
    if (backButton) {
        if (locationKey === "kitchen") {
            backButton.textContent = "→ الرئيسية";
            backButton.setAttribute("onclick", "goHome()");
        } else {
            backButton.textContent = "→ المخازن";
            backButton.setAttribute("onclick", "openStorage()");
        }
    }

    closeMaterialForm();

    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("materialDate");
    if (dateInput) dateInput.value = today;

    getMaterials();
}

function openMaterialForm(actionType) {
    if (!currentLocation) {
        showMessage("اختر المخزن أو المطبخ أولاً", "error");
        return;
    }

    currentMaterialAction = actionType === "withdraw" ? "withdraw" : "add";

    const form = document.getElementById("materialForm");
    if (form) form.style.display = "block";

    const title = document.getElementById("materialFormTitle");
    if (title) {
        title.textContent = currentMaterialAction === "withdraw" ? "سحب مادة" : "إضافة مادة";
    }

    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("materialDate");
    if (dateInput) dateInput.value = today;

    const itemInput = document.getElementById("materialItem");
    if (itemInput) itemInput.focus();
}

function closeMaterialForm() {
    const form = document.getElementById("materialForm");
    if (form) form.style.display = "none";
}

async function getMaterials() {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const snapshot = await getDocs(collection(db, MATERIALS_COLLECTION));

        materialsCache = [];

        snapshot.forEach(doc => {
            materialsCache.push({
                id: doc.id,
                ...doc.data()
            });
        });

        materialsCache.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        renderInventory();

    } catch (error) {
        console.error("خطأ تحميل المواد:", error);
        showMessage("تعذر تحميل المواد", "error");
    }
}

async function saveMaterial() {
    if (!requireLoginForWrite(saveMaterial)) return;

    const itemInput = document.getElementById("materialItem");
    const unitInput = document.getElementById("materialUnit");
    const quantityInput = document.getElementById("materialQuantity");
    const dateInput = document.getElementById("materialDate");
    const notesInput = document.getElementById("materialNotes");

    if (!itemInput || !unitInput || !quantityInput || !dateInput || !notesInput) {
        showMessage("حقول المواد غير موجودة", "error");
        return;
    }

    const item = itemInput.value.trim();
    const unit = unitInput.value.trim();
    const quantity = quantityInput.value.trim();
    const actionDate = dateInput.value;
    const notes = notesInput.value.trim();

    if (!item || !unit || !quantity || !actionDate) {
        showMessage("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    if (parseFloat(quantity) <= 0) {
        showMessage("الكمية يجب أن تكون أكبر من صفر", "error");
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        await addDoc(collection(db, MATERIALS_COLLECTION), {
            location: currentLocation,
            item: item,
            unit: unit,
            quantity: quantity,
            actionType: currentMaterialAction,
            actionDate: actionDate,
            notes: notes,
            createdAt: serverTimestamp()
        });

        const locationName = INVENTORY_LOCATIONS[currentLocation]?.name || "المكان";
        const isWithdraw = currentMaterialAction === "withdraw";

        notify(
            isWithdraw ? "سحب مادة" : "إضافة مادة",
            locationName + ": " + item + " - " + (isWithdraw ? "-" : "+") + quantity + " " + unit,
            "material"
        );

        itemInput.value = "";
        unitInput.value = "";
        quantityInput.value = "";
        notesInput.value = "";

        closeMaterialForm();

        showMessage("تم حفظ العملية بنجاح");

        await getMaterials();

    } catch (error) {
        console.error("خطأ حفظ المادة:", error);
        showMessage("حدث خطأ أثناء حفظ العملية: " + (error.code || error.message || "خطأ غير معروف"), "error");
    }
}

async function deleteMaterial(id) {
    if (!requireLoginForWrite(() => deleteMaterial(id))) return;

    if (!confirm("هل تريد حذف هذه الحركة؟")) {
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        await deleteDoc(doc(db, MATERIALS_COLLECTION, id));

        showMessage("تم حذف الحركة");

        await getMaterials();

    } catch (error) {
        console.error("خطأ حذف المادة:", error);
        showMessage("حدث خطأ أثناء حذف الحركة", "error");
    }
}

function renderInventory() {
    const movements = materialsCache.filter(m => m.location === currentLocation);

    renderStockSummary(movements);
    renderMaterialsTable(movements);
}

function formatQuantity(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return "-";
    return String(Math.round(num * 100) / 100);
}

function renderStockSummary(movements) {
    const container = document.getElementById("stockSummary");
    if (!container) return;

    const stockMap = {};

    movements.forEach(m => {
        const key = (m.item || "").trim() + "|" + (m.unit || "").trim();
        if (!stockMap[key]) {
            stockMap[key] = { item: m.item, unit: m.unit, added: 0, withdrawn: 0 };
        }
        const qty = parseFloat(m.quantity) || 0;
        if (m.actionType === "withdraw") {
            stockMap[key].withdrawn += qty;
        } else {
            stockMap[key].added += qty;
        }
    });

    const entries = Object.values(stockMap);

    if (entries.length === 0) {
        container.innerHTML = "";
        return;
    }

    let rows = "";

    entries.forEach(item => {
        const balance = item.added - item.withdrawn;
        const balanceClass = balance > 0 ? "balance-positive" : (balance === 0 ? "balance-zero" : "balance-negative");
        rows += `
            <tr>
                <td class="td-item">${escapeHTML(item.item)}</td>
                <td>${escapeHTML(item.unit)}</td>
                <td>${formatQuantity(item.added)}</td>
                <td>${formatQuantity(item.withdrawn)}</td>
                <td class="${balanceClass}">${formatQuantity(balance)}</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="stock-summary-card">
            <div class="stock-summary-header">
                <h3>📦 الرصيد الحالي</h3>
                <span class="stock-badge">${entries.length}</span>
            </div>
            <div class="materials-table-wrap">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>المادة</th>
                            <th>الوحدة</th>
                            <th>المضاف</th>
                            <th>المسحوب</th>
                            <th>الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function formatMaterialDate(timestamp) {
    if (!timestamp) return "-";
    try {
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    } catch (error) {
        return "-";
    }
}

function renderMaterialsTable(movements) {
    const container = document.getElementById("materialsTableWrap");
    if (!container) return;

    if (movements.length === 0) {
        container.innerHTML = `
            <div class="empty-materials">
                <div class="empty-materials-icon">📦</div>
                <strong>لا توجد حركات بعد</strong>
                <span>استخدم "إضافة مادة" أو "سحب مادة" لتسجيل أول حركة</span>
            </div>
        `;
        return;
    }

    let rows = "";

    movements.forEach(m => {
        const isWithdraw = m.actionType === "withdraw";
        const badgeClass = isWithdraw ? "operation-withdraw" : "operation-add";
        const badgeText = isWithdraw ? "سحب" : "إضافة";
        const qtyClass = isWithdraw ? "qty-withdraw" : "qty-add";
        const qtySign = isWithdraw ? "-" : "+";

        rows += `
            <tr>
                <td class="td-item">${escapeHTML(m.item)}</td>
                <td>${escapeHTML(m.unit)}</td>
                <td><span class="operation-badge ${badgeClass}">${badgeText}</span></td>
                <td class="${qtyClass}">${qtySign}${formatQuantity(m.quantity)}</td>
                <td>${escapeHTML(m.actionDate || formatMaterialDate(m.createdAt))}</td>
                <td>
                    <button
                        type="button"
                        class="delete-material-button"
                        onclick="deleteMaterial('${m.id}')"
                    >حذف</button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>المادة</th>
                    <th>الوحدة</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th>تاريخ العملية</th>
                    <th>خيارات</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// ============================================================
// ========================= التقارير =========================
// ============================================================

async function getReports() {

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    REPORTS_COLLECTION
                )
            );

        reportsCache = [];

        snapshot.forEach(
            doc => {

                reportsCache.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );

        reportsCache.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds || 0;

                const dateB =
                    b.createdAt?.seconds || 0;

                return dateB - dateA;

            }
        );

        renderReports();

    } catch (error) {

        console.error(
            "خطأ تحميل التقارير:",
            error
        );

        showMessage(
            "تعذر تحميل التقارير",
            "error"
        );

    }

}

function openAddReport() {

    showPage(
        "addReportPage"
    );

    prepareReportForm();

}

function prepareReportForm() {

    populateReportDateOptions();

}

// بناء قائمة التاريخ المنسدلة بالأيام والتواريخ العربية
// قيمة كل خيار تبقى بصيغة ISO حتى لا تتغير البيانات المحفوظة في Firestore
const REPORT_DATE_DAYS_COUNT = 90;

function formatArabicDate(date) {

    const dayNames = [

        "الأحد",

        "الاثنين",

        "الثلاثاء",

        "الأربعاء",

        "الخميس",

        "الجمعة",

        "السبت"

    ];

    const monthNames = [

        "يناير",

        "فبراير",

        "مارس",

        "أبريل",

        "مايو",

        "يونيو",

        "يوليو",

        "أغسطس",

        "سبتمبر",

        "أكتوبر",

        "نوفمبر",

        "ديسمبر"

    ];

    return dayNames[date.getDay()] + " " + date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear();

}

function populateReportDateOptions() {

    const dateSelect =
        document.getElementById(
            "reportDate"
        );

    if (!dateSelect) return;

    const previousValue =
        dateSelect.value;

    const today =
        new Date();

    let optionsHtml =
        '<option value="">اختر التاريخ</option>';

    for (let i = 0; i < REPORT_DATE_DAYS_COUNT; i++) {

        const date =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - i
            );

        const isoValue =
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0");

        optionsHtml +=
            '<option value="' + isoValue + '">' +
            formatArabicDate(date) +
            "</option>";

    }

    dateSelect.innerHTML =
        optionsHtml;

    if (previousValue) {

        dateSelect.value =
            previousValue;

    } else {

        // الحفاظ على السلوك السابق: اليوم الحالي هو القيمة الافتراضية
        const todayIso =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        dateSelect.value =
            todayIso;

    }

    updateDayFromDate();

}

function updateDayFromDate() {

    const dateInput =
        document.getElementById(
            "reportDate"
        );

    const dayInput =
        document.getElementById(
            "reportDay"
        );

    if (
        !dateInput ||
        !dayInput
    ) return;

    if (!dateInput.value) {

        dayInput.value = "";

        return;

    }

    const date =
        new Date(
            dateInput.value +
            "T00:00:00"
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

    dayInput.value =
        days[
            date.getDay()
        ];

}

async function saveReport() {

    if (!requireLoginForWrite(saveReport)) return;

    const dateInput =
        document.getElementById(
            "reportDate"
        );

    const dayInput =
        document.getElementById(
            "reportDay"
        );

    const textInput =
        document.getElementById(
            "reportText"
        );

    if (
        !dateInput ||
        !dayInput ||
        !textInput
    ) {

        showMessage(
            "حقول التقرير غير موجودة",
            "error"
        );

        return;

    }

    const date =
        dateInput.value;

    const day =
        dayInput.value;

    const text =
        textInput.value.trim();

    if (
        !date ||
        !day ||
        !text
    ) {

        showMessage(
            "يرجى ملء جميع بيانات التقرير",
            "error"
        );

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await addDoc(
            collection(
                db,
                REPORTS_COLLECTION
            ),
            {

                date: date,

                day: day,

                text: text,

                createdAt:
                    serverTimestamp()

            }
        );

        textInput.value = "";

        showMessage(
            "تم حفظ التقرير بنجاح"
        );

        notify(
            "تقرير يومي جديد",
            "تم تسجيل تقرير يوم " + formatArabicDate(new Date(date + "T00:00:00")),
            "report"
        );

        openReports();

    } catch (error) {

        console.error(
            "خطأ حفظ التقرير:",
            error
        );

        showMessage(
            "حدث خطأ أثناء حفظ التقرير: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

function renderReports() {
    const container = document.getElementById("reportsList");
    if (!container) return;

    renderReportSummary();

    if (reportsCache.length === 0) {
        container.innerHTML = `
            <div class="empty-reports">
                <div class="empty-reports-icon">📋</div>
                <strong>لا توجد تقارير حالياً</strong>
                <span>اضغط على "إضافة تقرير" لإنشاء أول تقرير</span>
            </div>
        `;
        return;
    }

    // التأكد من أن التقرير المحدد موجود ضمن البيانات الحالية (افتراضياً الأحدث)
    if (!selectedReportId || !reportsCache.some(r => r.id === selectedReportId)) {
        selectedReportId = reportsCache[0].id;
    }

    const optionsHtml = reportsCache.map(report => {
        const dateObj = report.date ? new Date(report.date + "T00:00:00") : null;
        const label = dateObj
            ? `${getArabicDayName(dateObj)} — ${formatArabicDate(dateObj)}`
            : (report.day || "تقرير");
        const selected = report.id === selectedReportId ? " selected" : "";
        return `<option value="${escapeHTML(report.id)}"${selected}>${escapeHTML(label)}</option>`;
    }).join("");

    const selectedReport = reportsCache.find(r => r.id === selectedReportId);

    container.innerHTML = `
        <div class="report-day-picker form-group">
            <label for="reportDaySelect">اختر اليوم</label>
            <select id="reportDaySelect" onchange="onReportDayChange(this.value)">
                ${optionsHtml}
            </select>
        </div>
        <div id="selectedReportView">
            ${selectedReport ? createReportHTML(selectedReport, reportsCache.indexOf(selectedReport)) : ""}
        </div>
    `;
}

// تغيير اليوم المحدد من القائمة المنسدلة — يعرض محتوى التقرير المحفوظ لذلك اليوم
function onReportDayChange(reportId) {
    selectedReportId = reportId;
    renderReports();
}

function renderReportSummary() {
    const container = document.getElementById("reportsList");
    if (!container) return;

    const existing = container.querySelector(".report-summary");
    if (existing) existing.remove();

    const today = new Date().toISOString().split("T")[0];
    const todayCount = reportsCache.filter(r => r.date === today).length;

    const summary = document.createElement("div");
    summary.className = "report-summary";
    summary.innerHTML = `
        <div class="report-stat-box">
            <div class="report-stat-icon">📋</div>
            <div class="report-stat-text">
                <strong>${reportsCache.length}</strong>
                <span>إجمالي التقارير</span>
            </div>
        </div>
        <div class="report-stat-box">
            <div class="report-stat-icon">📅</div>
            <div class="report-stat-text">
                <strong>${todayCount}</strong>
                <span>تقارير اليوم</span>
            </div>
        </div>
    `;

    container.prepend(summary);
}

function createReportHTML(report, index) {
    const reportNumber = reportsCache.length - index;

    return `
        <div class="report-card">
            <div class="report-card-header">
                <div class="report-date-box">
                    <div class="report-date-icon">📋</div>
                    <div class="report-date-text">
                        <strong>${escapeHTML(report.day)}</strong>
                        <span>${escapeHTML(report.date ? formatArabicDate(new Date(report.date + "T00:00:00")) : "")}</span>
                    </div>
                </div>
                <button
                    type="button"
                    class="delete-report-button"
                    onclick="deleteReport('${report.id}')"
                    aria-label="حذف التقرير"
                >حذف</button>
            </div>
            <div class="report-body">
                <div class="report-body-title">تفاصيل التقرير</div>
                <div class="report-body-text">${escapeHTML(report.text)}</div>
            </div>
            <div class="report-card-footer">
                <span class="report-time">⏰ ${formatPurchaseDate(report.createdAt)}</span>
                <span class="report-time">رقم التقرير ${reportNumber}</span>
            </div>
        </div>
    `;
}

function formatDate(timestamp) {

    return formatPurchaseDate(
        timestamp
    );

}

async function deleteReport(id) {

    if (!requireLoginForWrite(() => deleteReport(id))) return;

    if (
        !confirm(
            "هل تريد حذف التقرير؟"
        )
    ) {

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            deleteDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await deleteDoc(
            doc(
                db,
                REPORTS_COLLECTION,
                id
            )
        );

        showMessage(
            "تم حذف التقرير"
        );

        await getReports();

    } catch (error) {

        console.error(
            "خطأ حذف التقرير:",
            error
        );

        showMessage(
            "حدث خطأ أثناء حذف التقرير",
            "error"
        );

    }

}

// ============================================================
// ========================= الإشعارات ========================
// ============================================================

function openNotifications() {
    showPage("notificationsPage");
    getNotifications();
}

async function getNotifications() {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, getDocs, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const snapshot = await getDocs(q);

        notificationsCache = [];

        snapshot.forEach(doc => {
            notificationsCache.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderNotifications();
        updateNotificationBadge();

    } catch (error) {
        console.error("خطأ تحميل الإشعارات:", error);
    }
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (notificationsCache.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-notifications-icon">🔔</div>
                <strong>لا توجد إشعارات بعد</strong>
                <span>ستظهر هنا التحديثات فور حدوثها</span>
            </div>
        `;
        return;
    }

    let html = "";

    notificationsCache.forEach(n => {
        const icon = getNotificationIcon(n.type);
        html += `
            <div class="notification-card">
                <div class="notification-icon">${icon}</div>
                <div class="notification-info">
                    <h4>${escapeHTML(n.title)}</h4>
                    <p>${escapeHTML(n.body)}</p>
                    <span class="notification-time">${formatNotificationTime(n.createdAt)}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getNotificationIcon(type) {
    if (type === "report") return "📋";
    if (type === "task") return "✅";
    if (type === "purchase") return "🛒";
    if (type === "material") return "📦";
if (type === "medical") return "🩺";
    return "🔔";
}

function formatNotificationTime(timestamp) {
    if (!timestamp) return "";
    try {
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleString("ar-IQ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (error) {
        return "";
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    const count = notificationsCache.length;
    badge.textContent = count > 99 ? "99+" : count;
}
async function notify(title, body, type = "general", meta = {}) {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const {
            collection,
            addDoc,
            getDocs,
            query,
            where,
            limit,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        // منع إرسال نفس الحدث أكثر من مرة — يعمل فقط عندما يُمرَّر eventId
        // (حاليًا لا يُمرَّر إلا من إشعارات الأجهزة الطبية، لذلك لا يُغيّر أي
        // سلوك لبقية الأنواع: المهام / المشتريات / التقارير / المواد).
        if (meta.eventId) {
            const dupCheck = await getDocs(
                query(
                    collection(db, NOTIFICATIONS_COLLECTION),
                    where("eventId", "==", meta.eventId),
                    limit(1)
                )
            );
            if (!dupCheck.empty) {
                console.log("تم تجاهل إشعار مكرر لنفس الحدث:", meta.eventId);
                return null;
            }
        }

        // حفظ الإشعار داخل Firestore
        const notificationDoc = {
            title: title,
            body: body,
            type: type,
            createdAt: serverTimestamp()
        };
        if (meta.eventId) notificationDoc.eventId = meta.eventId;
        if (meta.faultId) notificationDoc.faultId = meta.faultId;

        const ref = await addDoc(
            collection(db, NOTIFICATIONS_COLLECTION),
            notificationDoc
        );

        localNotifiedIds.add(ref.id);

        // إظهار الإشعار داخل التطبيق
        showToast(title, body);

        if (notificationsCache.length > 0) {
            notificationsCache.unshift({
                id: ref.id,
                title: title,
                body: body,
                type: type
            });

            updateNotificationBadge();
        }

        // إرسال Push لإشعارات المهام والمشتريات والأجهزة الطبية

if (type === "task" || type === "purchase" || type === "medical") {
        console.log("🔥 TASK PUSH START:", {
        title: title,
        body: body,
        type: type
    });

    try {
        console.log("📡 CALLING WORKER...");

        // الحمولة الأساسية (title/body) تبقى مطابقة تمامًا لما كانت عليه
        // من قبل لإشعارات المهام/المشتريات، حتى لا يتأثر سلوكها الحالي.
        // حقول eventId/data تُضاف فقط عند توفّرها (حاليًا: الأجهزة الطبية)
        // لتمكين الـ Worker من دعم منع التكرار والانتقال عند الضغط على
        // الإشعار، بدون كسر التوافق مع الحمولة القديمة.
        const workerPayload = {
            title: title,
            body: body
        };
        if (meta.eventId) workerPayload.eventId = meta.eventId;
        if (meta.faultId) workerPayload.data = { faultId: meta.faultId, type: type };

        const response = await fetch(
            "https://nawafth-notifications.yousifiraqas5.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workerPayload)
            }
        );

        console.log("📡 WORKER HTTP STATUS:", response.status);

        const result = await response.json();

        console.log("📦 WORKER RESULT:", result);

        if (!response.ok || !result.ok) {
            console.error(
                "❌ فشل إرسال Push:",
                result
            );
        } else {
            console.log(
                "✅ تم إرسال Push:",
                result
            );
        }

    } catch (pushError) {
        console.error(
            "❌ خطأ الاتصال بـ Cloudflare Worker:",
            pushError
        );
    }
}
        return ref.id;

    } catch (error) {
        console.error(
            "خطأ إرسال الإشعار:",
            error
        );

        return null;
    }
}
function showToast(title, body) {
    const oldToasts = document.querySelectorAll(".toast-message");
    oldToasts.forEach(t => t.remove());

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    const toast = document.createElement("div");
    toast.className = "toast-message";

    toast.innerHTML = `
        <div class="toast-icon">🔔</div>
        <div class="toast-content">
            <h4 class="toast-title">${escapeHTML(title)}</h4>
            <p class="toast-body">${escapeHTML(body)}</p>
        </div>
        <button type="button" class="toast-close" aria-label="إغلاق">×</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.remove();
    });

    document.body.appendChild(toast);

    toastTimer = setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 6000);
}

function startNotificationsListener() {
    const db = getFirestoreDB();
    if (!db) return;

    if (notificationsUnsubscribe) {
        return;
    }

    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js")
        .then(({ collection, query, orderBy, limit, onSnapshot }) => {
            const q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                orderBy("createdAt", "desc"),
                limit(50)
            );

            notificationsUnsubscribe = onSnapshot(q, snapshot => {
                const docs = [];

                snapshot.forEach(doc => {
                    docs.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                const newItems = docs.filter(d => !notificationsCache.some(c => c.id === d.id));

                notificationsCache = docs;

                renderNotifications();
                updateNotificationBadge();

                newItems.forEach(d => {
                    if (!localNotifiedIds.has(d.id)) {
                        showToast(d.title || "إشعار جديد", d.body || "");
                    }
                });
            });
        })
        .catch(error => {
            console.error("خطأ بدء مستمع الإشعارات:", error);
        });
}

async function setupMessagingForeground() {
    if (!window.firebaseApp) return;

    try {
        const { getMessaging, onMessage } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js");

        const messaging = getMessaging(window.firebaseApp);
        window.firebaseMessaging = messaging;

        onMessage(messaging, payload => {
            const title = payload.notification?.title || payload.data?.title || "إشعار جديد";
            const body = payload.notification?.body || payload.data?.body || "تحديث جديد من شركة نوافذ البناء";
            showToast(title, body);
        });

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("firebase-messaging-sw.js").catch(() => {});
        }
    } catch (error) {
        console.error("خطأ إعداد استقبال الإشعارات:", error);
    }
}

async function enablePushNotifications() {
    if (!requireLoginForWrite(enablePushNotifications)) return;

    if (!("Notification" in window)) {
        showMessage("المتصفح لا يدعم الإشعارات", "error");
        return;
    }

    if (Notification.permission === "denied") {
        showMessage("تم رفض إذن الإشعارات، قم بالسماح من إعدادات الموقع", "error");
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            showMessage("يرجى السماح بالإشعارات من إعدادات الموقع", "error");
            return;
        }
    } catch (error) {
        console.error("طلب إذن الإشعارات:", error);
        showMessage("يرجى السماح بالإشعارات من إعدادات الموقع", "error");
        return;
    }

    if (VAPID_KEY === "YOUR_VAPID_PUBLIC_KEY") {
        showMessage("يرجى إضافة مفتاح VAPID في ملف script.js أولاً", "error");
        return;
    }

    try {
        const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js");
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const messaging = getMessaging(window.firebaseApp);
        window.firebaseMessaging = messaging;

        const registration = await navigator.serviceWorker.register("firebase-messaging-sw.js");

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (!token) {
            showMessage("تعذر الحصول على رمز الإشعار", "error");
            return;
        }

        const db = getFirestoreDB();
        if (!db) return;

        await setDoc(doc(db, TOKENS_COLLECTION, token), {
            token: token,
            createdAt: serverTimestamp(),
            userAgent: navigator.userAgent
        });

        showMessage("تم تفعيل الإشعارات بنجاح 🔔");

    } catch (error) {
        console.error("خطأ تفعيل الإشعارات:", error);
        showMessage("حدث خطأ أثناء تفعيل الإشعارات: " + (error.message || "خطأ غير معروف"), "error");
    }
}

// ============================================================
// =========================== المهام ==========================
// ============================================================

// مهم:
// واجهة المهام موجودة مسبقاً في index.html.
// لا ننشئ نسخة ثانية من المهام هنا.

function createTasksInterface() {

    // لا شيء
    // صفحات المهام موجودة أصلاً في index.html.

}

// ============================================================
// فتح صفحة المهام
// ============================================================

async function openTasks() {

    showPage(
        "tasksPage"
    );

    renderEngineers();

    await loadTasksCache();

    updateEngineerStats();

}

// ============================================================
// عرض المهندسين
// ============================================================

function renderEngineers() {

    const container =
        document.querySelector(
            "#tasksPage .engineers-grid"
        );

    if (!container) {

        console.error(
            "قسم المهندسين غير موجود في index.html"
        );

        return;

    }

    // المهندسون موجودون أصلاً في index.html
    // لذلك لا نضيف بطاقات جديدة.

}

// ============================================================
// إحصائيات المهام لكل مهندس
// ============================================================

function updateEngineerStats() {

    const cards =
        document.querySelectorAll(
            ".engineer-card[data-engineer]"
        );

    cards.forEach(
        card => {

            const engineer =
                card.getAttribute(
                    "data-engineer"
                );

            const added =
                tasksCache.filter(
                    task =>
                        task.engineer ===
                        engineer
                ).length;

            const done =
                tasksCache.filter(
                    task =>
                        task.engineer ===
                        engineer &&
                        task.status ===
                        "completed"
                ).length;

            const addedEl =
                card.querySelector(
                    ".engineer-added-count"
                );

            if (addedEl) {
                addedEl.textContent =
                    added;
            }

            const doneEl =
                card.querySelector(
                    ".engineer-done-count"
                );

            if (doneEl) {
                doneEl.textContent =
                    done;
            }

        }
    );

}

// ============================================================
// فتح مهام المهندس
// ============================================================

async function openEngineerTasks(
    engineerName
) {

    currentEngineer =
        engineerName;

    showPage(
        "engineerTasksPage"
    );

    const title =
        document.getElementById(
            "selectedEngineerName"
        );

    if (title) {

        title.textContent =
            engineerName;

    }

    const formEngineer =
        document.getElementById(
            "taskFormEngineer"
        );

    if (formEngineer) {

        formEngineer.textContent =
            "المهمة للمهندس: " +
            engineerName;

    }

    closeTaskForm();

    await getTasks();

}

// ============================================================
// فتح نموذج المهمة
// ============================================================

function openTaskForm() {

    if (!currentEngineer) {

        showMessage(
            "يرجى اختيار المهندس أولاً",
            "error"
        );

        return;

    }

    const form =
        document.getElementById(
            "taskForm"
        );

    if (form) {

        form.style.display =
            "block";

    }

    const input =
        document.getElementById(
            "taskText"
        );

    if (input) {

        input.focus();

    }

}

// ============================================================
// إغلاق نموذج المهمة
// ============================================================

function closeTaskForm() {

    const form =
        document.getElementById(
            "taskForm"
        );

    if (form) {

        form.style.display =
            "none";

    }

}

// ============================================================
// جلب المهام من Firebase
// ============================================================

async function loadTasksCache() {

    const db =
        getFirestoreDB();

    if (!db) return false;

    try {

        const {
            collection,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    TASKS_COLLECTION
                )
            );

        tasksCache = [];

        snapshot.forEach(
            doc => {

                tasksCache.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );

        tasksCache.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds || 0;

                const dateB =
                    b.createdAt?.seconds || 0;

                return dateB - dateA;

            }
        );

        return true;

    } catch (error) {

        console.error(
            "خطأ تحميل المهام:",
            error
        );

        showMessage(
            "تعذر تحميل المهام: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

        return false;

    }

}

async function getTasks() {

    const ok =
        await loadTasksCache();

    if (!ok) return;

    renderEngineerTasks();

}

// ============================================================
// إضافة مهمة
// ============================================================

async function addTask() {

    if (!requireLoginForWrite(addTask)) return;

    const input =
        document.getElementById(
            "taskText"
        );

    if (!input) {

        showMessage(
            "حقل المهمة غير موجود",
            "error"
        );

        return;

    }

    const text =
        input.value.trim();

    if (!text) {

        showMessage(
            "اكتب المهمة أولاً",
            "error"
        );

        return;

    }

    if (!currentEngineer) {

        showMessage(
            "لم يتم تحديد المهندس",
            "error"
        );

        return;

    }

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await addDoc(
            collection(
                db,
                TASKS_COLLECTION
            ),
            {

                engineer:
                    currentEngineer,

                text:
                    text,

                status:
                    "pending",

                createdAt:
                    serverTimestamp(),

                completedAt:
                    null

            }
        );

        input.value = "";

        closeTaskForm();

        showMessage(
            "تمت إضافة المهمة بنجاح"
        );

        notify(
            "مهمة جديدة",
            "تمت إضافة مهمة للمهندس " + currentEngineer + ": " + text,
            "task"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إضافة المهمة:",
            error
        );

        console.error(
            "Firebase error code:",
            error.code
        );

        console.error(
            "Firebase error message:",
            error.message
        );

        let errorMessage =
            "حدث خطأ أثناء إضافة المهمة";

        if (
            error.code ===
            "permission-denied"
        ) {

            errorMessage =
                "Firebase رفض حفظ المهمة بسبب الصلاحيات";

        } else if (
            error.code ===
            "unauthenticated"
        ) {

            errorMessage =
                "يجب تسجيل الدخول إلى Firebase";

        } else if (
            error.code ===
            "failed-precondition"
        ) {

            errorMessage =
                "Firebase يحتاج إلى إعداد إضافي";

        } else if (
            error.message
        ) {

            errorMessage =
                "فشل حفظ المهمة: " +
                error.message;

        }

        showMessage(
            errorMessage,
            "error"
        );

    }

}

// ============================================================
// عرض مهام المهندس
// ============================================================

function renderEngineerTasks() {

    const pendingContainer =
        document.getElementById(
            "pendingTasks"
        );

    const completedContainer =
        document.getElementById(
            "completedTasks"
        );

    if (
        !pendingContainer ||
        !completedContainer
    ) {

        console.error(
            "عناصر المهام غير موجودة في index.html"
        );

        return;

    }

    const engineerTasks =
        tasksCache.filter(
            task =>
                task.engineer ===
                currentEngineer
        );

    const pending =
        engineerTasks.filter(
            task =>
                task.status !==
                "completed"
        );

    const completed =
        engineerTasks.filter(
            task =>
                task.status ===
                "completed"
        );

    // ========================================================
    // المهام الحالية
    // ========================================================

    if (
        pending.length === 0
    ) {

        pendingContainer.innerHTML = `

            <div class="empty-tasks">

                <div class="empty-tasks-icon">
                    📋
                </div>

                <strong>
                    لا توجد مهام حالياً
                </strong>

                <p>
                    اضغط على إضافة مهمة
                    لإنشاء مهمة جديدة
                </p>

            </div>

        `;

    } else {

        pendingContainer.innerHTML =
            pending
                .map(
                    task =>
                        createTaskHTML(
                            task
                        )
                )
                .join("");

    }

    const pendingCount =
        document.getElementById(
            "pendingTaskCount"
        );

    if (pendingCount) {

        pendingCount.textContent =
            pending.length;

    }

    // ========================================================
    // المهام المنجزة
    // ========================================================

    if (
        completed.length === 0
    ) {

        completedContainer.innerHTML = `

            <div class="empty-tasks">

                <div class="empty-tasks-icon">
                    ✅
                </div>

                <strong>
                    لا توجد مهام منجزة
                </strong>

                <p>
                    المهام المكتملة ستظهر هنا
                </p>

            </div>

        `;

    } else {

        completedContainer.innerHTML =
            completed
                .map(
                    task =>
                        createCompletedTaskHTML(
                            task
                        )
                )
                .join("");

    }

    const completedCount =
        document.getElementById(
            "completedTaskCount"
        );

    if (completedCount) {

        completedCount.textContent =
            completed.length;

    }

}

// ============================================================
// شكل المهمة الحالية
// ============================================================

function createTaskHTML(
    task
) {

    return `

        <div class="task-card">

            <div class="task-card-main">

                <div class="task-card-icon">
                    📋
                </div>

                <div class="task-card-info">

                    <h4>
                        ${escapeHTML(
                            task.text
                        )}
                    </h4>

                    <div class="task-date">

                        تاريخ الإضافة:
                        ${formatPurchaseDate(
                            task.createdAt
                        )}

                    </div>

                </div>

            </div>

            <button
                type="button"
                class="complete-task-button"
                onclick="completeTask('${task.id}')"
            >
                ✓ تم الإنجاز
            </button>

        </div>

    `;

}

// ============================================================
// شكل المهمة المنجزة
// ============================================================

function createCompletedTaskHTML(
    task
) {

    return `

        <div class="task-card completed-task">

            <div class="task-card-main">

                <div class="task-card-icon">
                    ✅
                </div>

                <div class="task-card-info">

                    <h4>
                        ${escapeHTML(
                            task.text
                        )}
                    </h4>

                    <div class="task-date">

                        تم الإنجاز:
                        ${formatPurchaseDate(
                            task.completedAt
                        )}

                    </div>

                </div>

            </div>

            <button
                type="button"
                class="return-task-button"
                onclick="returnTask('${task.id}')"
            >
                إرجاع للمهمات
            </button>

        </div>

    `;

}

// ============================================================
// إنجاز المهمة
// ============================================================

async function completeTask(
    id
) {

    if (!requireLoginForWrite(() => completeTask(id))) return;

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                TASKS_COLLECTION,
                id
            ),
            {

                status:
                    "completed",

                completedAt:
                    serverTimestamp()

            }
        );

        const task = tasksCache.find(t => t.id === id);

        notify(
            "تم إنجاز مهمة",
            "أنجز " + (task ? task.engineer : "") + ": " + (task ? task.text : ""),
            "task"
        );

        showMessage(
            "تم نقل المهمة إلى المنجزة"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إنجاز المهمة:",
            error
        );

        showMessage(
            "حدث خطأ أثناء تحديث المهمة: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

// ============================================================
// إرجاع المهمة من المنجزة
// ============================================================

async function returnTask(
    id
) {

    if (!requireLoginForWrite(() => returnTask(id))) return;

    const db =
        getFirestoreDB();

    if (!db) return;

    try {

        const {
            doc,
            updateDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await updateDoc(
            doc(
                db,
                TASKS_COLLECTION,
                id
            ),
            {

                status:
                    "pending",

                completedAt:
                    null

            }
        );

        showMessage(
            "تم إرجاع المهمة"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "خطأ إرجاع المهمة:",
            error
        );

        showMessage(
            "حدث خطأ أثناء إرجاع المهمة: " +
            (
                error.code ||
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}

// ============================================================
// =================== الأجهزة الطبية (Medical) ================
// ============================================================

// ملاحظة: MEDICAL_FAULTS_COLLECTION و MEDICAL_COUNTERS_COLLECTION
// معرّفتان مرة واحدة فقط في أعلى الملف (قسم الثوابت).

let medicalFaultsCache = [];
let medicalFaultsUnsubscribe = null;

// فلتر الأولوية النشط لقائمة الأعطال (null = عرض جميع الأعطال)
// القيم: CRITICAL / HIGH / MEDIUM / LOW — يُضبط من بطاقات Priority Overview.
// يؤثر على العرض فقط ولا يغيّر أي بيانات في Firestore.
let activeFaultPriorityFilter = null;

// فلتر الحالة النشط لقائمة الأعطال (null = عرض جميع الأعطال)
// القيم: NEW / IN PROGRESS / AWAITING PARTS / COMPLETE — يُضبط من بطاقات Status Summary.
// يؤثر على العرض فقط ولا يغيّر أي بيانات في Firestore، ويعمل بنفس آلية
// فلتر الأولوية الموجود.
let activeFaultStatusFilter = null;

// حالة إرسال نموذج العطل (لمنع الإرسال المزدوج من ضغطة واحدة)
let faultFormSubmitting = false;

// ملاحظة: لم تعد هناك قائمة أجهزة مكتوبة داخل الكود.
// قائمة أجهزة نموذج الأعطال تُبنى الآن من جرد Excel الحقيقي
// (نفس سجلات Device Inventory — مصدر واحد للحقيقة، بلا أجهزة وهمية).

const FAULT_STATUS_LABELS = {
    "NEW": "New",
    "IN PROGRESS": "In Progress",
    "AWAITING PARTS": "Awaiting Parts",
    "COMPLETE": "Completed"
};

const FAULT_STATUS_ORDER = ["NEW", "IN PROGRESS", "AWAITING PARTS", "COMPLETE"];

const FAULT_PRIORITY_LABELS = {
    "CRITICAL": "CRITICAL",
    "HIGH": "HIGH",
    "MEDIUM": "MEDIUM",
    "LOW": "LOW"
};

const FAULT_PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

// فتح قسم الأجهزة الطبية
function openMedicalDevices() {
    showPage("medicalDevicesPage");
    populateFaultDeviceSelect();
    populateFaultLocationSelect();
    loadFaultLocations();
    // عرض أحدث البيانات المتوفرة ثم بدء الاشتراك الحيّ لتحديث العدّادات تلقائياً
    getMedicalFaults();
    subscribeMedicalFaults();
}

// ============================================================
// ربط قائمة الأجهزة بنموذج الأعطال مع جرد Excel الحقيقي
// (نفس سجلات Device Inventory — مصدر واحد للحقيقة)
// ============================================================

// إرجاع سجل Excel الكامل المطابق للجهاز المختار حالياً
function getSelectedFaultInventoryRecord() {

    const select =
        document.getElementById("faultDevice");

    if (!select || !select.value) {

        return null;

    }

    return medicalInventoryState.records.find(
        record => record.id === select.value
    ) || null;

}

// أسماء تُستثنى من قائمة اختيار الجهاز في نموذج العطل فقط
// ("أجهزة مضافة" ليست جهازاً فعلياً — تبقى في جدول الجرد دون أن تظهر كمُحدِّد)
const FAULT_DEVICE_SELECTOR_EXCLUDED_NAMES = [
    normalizeMedicalText("اجهزة مضافة")
];

// نص الخيار يعرض اسم الجهاز فقط — دون ماركة أو منشأ أو كمية أو رقم صف
// (التكرار يُزال عند تطابق الثلاثية: الاسم + الماركة + المنشأ؛
//  كل مجموعة فريدة مرتبطة داخلياً بمعرّف سجل Excel الفعلي row-<excelRow>)
function buildFaultDeviceOptionLabel(record) {

    return record.name;

}

// ملء قائمة الأجهزة من جرد Excel (حالات: جاهز / تحميل / خطأ)
function populateFaultDeviceSelect() {

    const select =
        document.getElementById("faultDevice");

    if (!select) return;

    const hint =
        document.getElementById("faultDeviceHint");

    const state =
        medicalInventoryState;

    if (state.status === "ready" && state.records.length) {

        const previousValue =
            select.value;

        select.disabled =
            false;

        select.innerHTML =
            '<option value="">Select device...</option>';

        // خيارات المُحدِّد: اسم الجهاز فقط، مع استثناء "أجهزة مضافة"
        // وإزالة التكرار فقط عند تطابق الثلاثية (الاسم + الماركة + المنشأ) —
        // يُحتفظ بأول سجل Excel كمُمثل، وتبقى المجموعات المختلفة خيارات مستقلة
        const seenIdentityKeys = new Set();

        const selectorRecords = state.records
            .filter(record => FAULT_DEVICE_SELECTOR_EXCLUDED_NAMES.indexOf(record.searchName) === -1)
            .filter(record => {

                const identityKey =
                    record.searchName + "|" + record.searchBrand + "|" + record.searchOrigin;

                if (seenIdentityKeys.has(identityKey)) {

                    return false;

                }

                seenIdentityKeys.add(identityKey);

                return true;

            })
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }));

        // كل مجموعة فريدة (الاسم + الماركة + المنشأ) تُمثَّل بأول سجل Excel مطابق
        selectorRecords.forEach(record => {

            const option =
                document.createElement("option");

            option.value =
                record.id;

            option.textContent =
                buildFaultDeviceOptionLabel(record);

            select.appendChild(option);

        });

        // الحفاظ على الاختيار الحالي إن كان لا يزال صالحاً
        if (previousValue && selectorRecords.some(record => record.id === previousValue)) {

            select.value =
                previousValue;

        }

        if (hint) {

            hint.textContent =
                "";

        }

        return;

    }

    if (state.status === "loading") {

        select.disabled =
            true;

        select.innerHTML =
            '<option value="">Loading devices from Excel...</option>';

        if (hint) {

            hint.textContent =
                "Loading device inventory from the Excel file...";

        }

        onMedicalInventoryReady(() => populateFaultDeviceSelect());

        return;

    }

    if (state.status === "error") {

        select.disabled =
            true;

        select.innerHTML =
            '<option value="">Could not load devices</option>';

        if (hint) {

            hint.innerHTML =
                'The Excel device inventory failed to load. <a href="#" class="fault-device-retry" onclick="retryFaultDeviceLoad(event)">Retry</a>';

        }

        return;

    }

    // idle — بدء تحميل جرد Excel بنفس المحمّل المستخدم في Device Inventory
    select.disabled =
        true;

    select.innerHTML =
        '<option value="">Loading devices from Excel...</option>';

    if (hint) {

        hint.textContent =
            "Loading device inventory from the Excel file...";

    }

    loadMedicalInventory(false);

    onMedicalInventoryReady(() => populateFaultDeviceSelect());

}

// إعادة محاولة تحميل جرد Excel بعد فشل سابق
function retryFaultDeviceLoad(event) {

    if (event && typeof event.preventDefault === "function") {

        event.preventDefault();

    }

    loadMedicalInventory(true);

    populateFaultDeviceSelect();

}

// عند اختيار جهاز، تعبئة الماركة والمنشأ من سجل Excel المختار بالضبط
function onDeviceSelectChange() {

    const brandInput =
        document.getElementById("faultBrand");

    const originInput =
        document.getElementById("faultOrigin");

    const record =
        getSelectedFaultInventoryRecord();

    // القيم تأتي من نفس صف Excel المختار — لا اختراع ولا دمج للسجلات المكررة
    if (brandInput) {

        brandInput.value =
            record ? record.brand : "";

    }

    if (originInput) {

        originInput.value =
            record ? record.origin : "";

    }

}

// ============================================================
// إدارة المواقع (Location) داخل قسم Device Information
// ------------------------------------------------------------
// - القائمة الأساسية (9 مواقع) ثابتة داخل الكود وتظهر دائماً.
// - المواقع المحفوظة تُقرأ من مجموعة medical_locations في Firestore
//   وتُضاف إلى القائمة الأساسية (المجموعة تُنشأ تلقائياً عند أول
//   عملية حفظ — لا حاجة لإنشائها يدوياً).
// - "+ Add New Location": إدخال موقع جديد مع سؤال الحفظ
//   (نعم، حفظ => يُسجَّل في Firestore ويبقى في القائمة)
//   (لا، استخدام لهذا الجهاز فقط => لا يُكتب أي سجل في Firestore).
// ============================================================

// القائمة الأساسية الافتراضية — لا تُحذف ولا تُعدَّل
const DEFAULT_MEDICAL_LOCATIONS = [
    "ICU",
    "Radiology",
    "Emergency Room",
    "Operating Room",
    "VIP Ward",
    "MRI Suite",
    "Hemodialysis Unit",
    "NICU",
    "PICU"
];

// قيمة الخيار الخاص "+ Add New Location" داخل القائمة
const NEW_FAULT_LOCATION_VALUE = "__add_new_location__";

// ذاكرة المواقع المحفوظة في Firestore (أسماء نصية)
let faultLocationsCache = [];
let faultLocationsLoaded = false;
let faultLocationsLoadPromise = null;

// اسم الموقع الجديد المعلّق بانتظار رد المستخدم على سؤال الحفظ
let pendingNewFaultLocation = null;

// توحيد اسم الموقع للمقارنة (منع التكرار مهما اختلفت الحالة أو المسافات)
function normalizeFaultLocationName(name) {
    return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

// معرّف مستند ثابت مشتق من الاسم — يمنع التكرار حتى مع النقر المزدوج
function buildFaultLocationDocId(name) {
    return normalizeFaultLocationName(name).replace(/\//g, "__").slice(0, 140);
}

// هل الاسم موجود مسبقاً؟ (الأساسية + المحفوظة + الخيارات الحالية بالقائمة)
function isFaultLocationDuplicate(name) {

    const normalized =
        normalizeFaultLocationName(name);

    if (!normalized) {
        return false;
    }

    const existsInBase =
        DEFAULT_MEDICAL_LOCATIONS.some(
            location => normalizeFaultLocationName(location) === normalized
        );

    if (existsInBase) {
        return true;
    }

    const existsInSaved =
        faultLocationsCache.some(
            location => normalizeFaultLocationName(location) === normalized
        );

    if (existsInSaved) {
        return true;
    }

    const select =
        document.getElementById("faultLocation");

    if (select) {

        const existsInDom =
            Array.from(select.options).some(
                option => normalizeFaultLocationName(option.value) === normalized
            );

        if (existsInDom) {
            return true;
        }

    }

    return false;

}

// تحميل المواقع المحفوظة من medical_locations (مرة واحدة لكل جلسة فتح)
function loadFaultLocations() {

    if (faultLocationsLoaded) {
        return Promise.resolve();
    }

    if (faultLocationsLoadPromise) {
        return faultLocationsLoadPromise;
    }

    faultLocationsLoadPromise = (async () => {

        const db = getFirestoreDB();

        if (!db) {
            faultLocationsLoadPromise = null;
            return;
        }

        try {

            const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

            const snapshot =
                await getDocs(collection(db, MEDICAL_LOCATIONS_COLLECTION));

            faultLocationsCache = [];

            snapshot.forEach(docSnap => {

                const data = docSnap.data() || {};

                const name =
                    String(data.name || "").trim();

                if (name) {
                    faultLocationsCache.push(name);
                }

            });

            faultLocationsLoaded = true;

            // إعادة بناء القائمة لدمج المواقع المحفوظة مع الأساسية
            populateFaultLocationSelect();

        } catch (error) {

            console.error("Error loading saved locations:", error);

            // تبقى القائمة الأساسية تعمل — وتُعاد المحاولة عند الفتح القادم
            faultLocationsLoaded = false;

        } finally {

            faultLocationsLoadPromise = null;

        }

    })();

    return faultLocationsLoadPromise;

}

// بناء قائمة المواقع: الأساسية + المحفوظة (بدون تكرار) + "+ Add New Location"
function populateFaultLocationSelect() {

    const select =
        document.getElementById("faultLocation");

    if (!select) {
        return;
    }

    const previousValue =
        select.value;

    select.innerHTML =
        '<option value="">Select location...</option>';

    // 1) القائمة الأساسية الثابتة (بالترتيب المحدد — لا يتغير)
    DEFAULT_MEDICAL_LOCATIONS.forEach(name => {

        const option =
            document.createElement("option");

        option.value =
            name;

        option.textContent =
            name;

        select.appendChild(option);

    });

    // 2) المواقع المحفوظة في Firestore — بدون تكرار مع الأساسية أو فيما بينها
    const seenLocationKeys = new Set(
        DEFAULT_MEDICAL_LOCATIONS.map(normalizeFaultLocationName)
    );

    faultLocationsCache
        .filter(name => {

            const key =
                normalizeFaultLocationName(name);

            if (!key || seenLocationKeys.has(key)) {
                return false;
            }

            seenLocationKeys.add(key);

            return true;

        })
        .slice()
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }))
        .forEach(name => {

            const option =
                document.createElement("option");

            option.value =
                name;

            option.textContent =
                name;

            select.appendChild(option);

        });

    // 3) الحفاظ على اختيار حالي غير موجود بعد إعادة البناء
    //    (مثل موقع "استخدام لهذا الجهاز فقط" من الجلسة الحالية)
    if (previousValue && previousValue !== NEW_FAULT_LOCATION_VALUE) {

        const stillExists =
            Array.from(select.options).some(option => option.value === previousValue);

        if (!stillExists) {

            const tempOption =
                document.createElement("option");

            tempOption.value =
                previousValue;

            tempOption.textContent =
                previousValue + " (هذا الجهاز فقط)";

            select.appendChild(tempOption);

        }

        select.value =
            previousValue;

    }

    // 4) خيار إضافة موقع جديد — يبقى دائماً في نهاية القائمة
    const addNewOption =
        document.createElement("option");

    addNewOption.value =
        NEW_FAULT_LOCATION_VALUE;

    addNewOption.textContent =
        "+ Add New Location";

    select.appendChild(addNewOption);

    // استعادة وضع "إضافة موقع جديد" إن كان المستخدم فيه قبل إعادة البناء
    if (previousValue === NEW_FAULT_LOCATION_VALUE) {
        select.value = NEW_FAULT_LOCATION_VALUE;
    }

}

// إظهار/إخفاء حقل الإدخال وسؤال الحفظ عند تغيير اختيار الموقع
function onFaultLocationChange() {

    const select =
        document.getElementById("faultLocation");

    const newRow =
        document.getElementById("faultLocationNewRow");

    const question =
        document.getElementById("faultLocationSaveQuestion");

    if (!select || !newRow || !question) {
        return;
    }

    if (select.value === NEW_FAULT_LOCATION_VALUE) {

        pendingNewFaultLocation = null;

        question.style.display = "none";
        newRow.style.display = "flex";

        const input =
            document.getElementById("faultLocationNewName");

        if (input) {
            input.focus();
        }

        return;

    }

    // اختيار موقع عادي: إخفاء كل عناصر الإدخال والسؤال ومسح الحالة المعلّقة
    pendingNewFaultLocation = null;

    newRow.style.display = "none";
    question.style.display = "none";

    const input =
        document.getElementById("faultLocationNewName");

    if (input) {
        input.value = "";
        input.classList.remove("is-invalid");
    }

    const nameError =
        document.getElementById("error-faultLocationNewName");

    if (nameError) {
        nameError.textContent = "";
    }

}

// Enter = متابعة، Escape = إلغاء العودة للقائمة
function onFaultLocationNewNameKeydown(event) {

    if (event && event.key === "Enter") {
        event.preventDefault();
        proceedWithNewFaultLocation();
        return;
    }

    if (event && event.key === "Escape") {
        event.preventDefault();
        cancelNewFaultLocation();
    }

}

// إلغاء إدخال موقع جديد والعودة لحالة القائمة الافتراضية
function cancelNewFaultLocation() {

    pendingNewFaultLocation = null;

    const select =
        document.getElementById("faultLocation");

    if (select) {
        select.value = "";
    }

    const newRow =
        document.getElementById("faultLocationNewRow");

    if (newRow) {
        newRow.style.display = "none";
    }

    const question =
        document.getElementById("faultLocationSaveQuestion");

    if (question) {
        question.style.display = "none";
    }

    const input =
        document.getElementById("faultLocationNewName");

    if (input) {
        input.value = "";
        input.classList.remove("is-invalid");
    }

    const nameError =
        document.getElementById("error-faultLocationNewName");

    if (nameError) {
        nameError.textContent = "";
    }

}

// "متابعة": التحقق من الاسم ثم عرض سؤال الحفظ
function proceedWithNewFaultLocation() {

    const input =
        document.getElementById("faultLocationNewName");

    const name = input
        ? input.value.trim().replace(/\s+/g, " ")
        : "";

    // الحقل فارغ — رسالة مناسبة ولا يُسمح بالحفظ
    if (!name) {
        showFaultFieldError(
            "faultLocationNewName",
            "يرجى إدخال اسم الموقع الجديد أولاً."
        );
        if (input) input.focus();
        return;
    }

    // منع التكرار: ضمن الأساسية أو المحفوظة أو القائمة الحالية
    if (isFaultLocationDuplicate(name)) {
        showFaultFieldError(
            "faultLocationNewName",
            "هذا الموقع موجود مسبقاً في القائمة."
        );
        if (input) input.focus();
        return;
    }

    pendingNewFaultLocation = name;

    const newRow =
        document.getElementById("faultLocationNewRow");

    if (newRow) {
        newRow.style.display = "none";
    }

    const question =
        document.getElementById("faultLocationSaveQuestion");

    if (question) {
        question.style.display = "block";
    }

}

// "نعم، حفظ": إنشاء مجموعة medical_locations تلقائياً عند أول حفظ
async function saveNewFaultLocationToList() {

    const name =
        pendingNewFaultLocation;

    if (!name) {
        return;
    }

    // حماية من التكرار (نقرتين متتاليتين أو سباق مصدرين)
    if (isFaultLocationDuplicate(name)) {
        applyFaultLocationSelection(name, false);
        pendingNewFaultLocation = null;
        return;
    }

    // الكتابة إلى Firestore تتطلب تسجيل الدخول (نفس نظام الصلاحيات الحالي)
    if (!requireLoginForWrite(() => saveNewFaultLocationToList())) {
        return;
    }

    const db = getFirestoreDB();

    if (!db) {
        showMessage("تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.", "error");
        return;
    }

    try {

        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        // معرّف ثابت مشتق من الاسم => المستند نفسه لا يتكرر أبداً
        await setDoc(doc(db, MEDICAL_LOCATIONS_COLLECTION, buildFaultLocationDocId(name)), {
            name: name,
            createdAt: serverTimestamp()
        });

        // تحديث الذاكرة والقائمة فوراً — المجموعة أُنشئت تلقائياً بأول مستند
        if (!isFaultLocationDuplicate(name)) {
            faultLocationsCache.push(name);
        }

        applyFaultLocationSelection(name, false);

        pendingNewFaultLocation = null;

        showMessage("تم حفظ الموقع في القائمة المنسدلة.");

    } catch (error) {

        console.error("Error saving new location:", error);
        showMessage("تعذر حفظ الموقع الجديد. حاول مرة أخرى.", "error");

    }

}

// "لا، استخدام لهذا الجهاز فقط": بدون أي كتابة إلى Firestore
function useNewFaultLocationOnce() {

    const name =
        pendingNewFaultLocation;

    if (!name) {
        return;
    }

    applyFaultLocationSelection(name, true);

    pendingNewFaultLocation = null;

}

// تطبيق الموقع على القائمة (مع خيار مؤقت عند اختيار "هذا الجهاز فقط")
function applyFaultLocationSelection(name, temporary) {

    const select =
        document.getElementById("faultLocation");

    if (!select) {
        return;
    }

    const question =
        document.getElementById("faultLocationSaveQuestion");

    if (question) {
        question.style.display = "none";
    }

    const newRow =
        document.getElementById("faultLocationNewRow");

    if (newRow) {
        newRow.style.display = "none";
    }

    const input =
        document.getElementById("faultLocationNewName");

    if (input) {
        input.value = "";
    }

    let option =
        Array.from(select.options).find(candidate => candidate.value === name);

    if (!option) {

        option =
            document.createElement("option");

        option.value =
            name;

        option.textContent = temporary
            ? name + " (هذا الجهاز فقط)"
            : name;

        // الإدراج قبل "+ Add New Location" للحفاظ على ترتيب القائمة
        const addNewOption =
            Array.from(select.options).find(candidate => candidate.value === NEW_FAULT_LOCATION_VALUE);

        if (addNewOption) {
            select.insertBefore(option, addNewOption);
        } else {
            select.appendChild(option);
        }

    }

    select.value =
        name;

}

// القيمة الحالية للموقع (بدون الخيار الخاص "+ Add New Location")
function getFaultLocationValue() {

    const select =
        document.getElementById("faultLocation");

    if (!select || !select.value || select.value === NEW_FAULT_LOCATION_VALUE) {
        return "";
    }

    return select.value;

}

// إعادة حقل الموقع إلى حالته الافتراضية (عند إغلاق النموذج)
function resetFaultLocationUI() {

    pendingNewFaultLocation = null;

    const select =
        document.getElementById("faultLocation");

    if (select) {
        select.value = "";
        select.classList.remove("is-invalid");
    }

    const newRow =
        document.getElementById("faultLocationNewRow");

    if (newRow) {
        newRow.style.display = "none";
    }

    const question =
        document.getElementById("faultLocationSaveQuestion");

    if (question) {
        question.style.display = "none";
    }

    const input =
        document.getElementById("faultLocationNewName");

    if (input) {
        input.value = "";
        input.classList.remove("is-invalid");
    }

    const nameError =
        document.getElementById("error-faultLocationNewName");

    if (nameError) {
        nameError.textContent = "";
    }

    const locationError =
        document.getElementById("error-faultLocation");

    if (locationError) {
        locationError.textContent = "";
    }

}

// ============================================================
// نموذج تسجيل عطل جهاز طبي (Medical Device Fault Form)
// ============================================================

// الحقول المطلوبة ورسالة التحقق الإنجليزية الخاصة بكل حقل
const FAULT_REQUIRED_FIELDS = [
    { id: "faultDevice", message: "Device Name is required." },
    { id: "faultSerial", message: "Serial Number is required." },
    { id: "faultDescription", message: "Fault Description is required." },
    { id: "faultReportedBy", message: "Reported By is required." },
    { id: "faultPriority", message: "Priority is required." },
    { id: "faultStatus", message: "Status is required." }
];

// فتح النموذج بحالة نظيفة
function openFaultForm() {
    const form = document.getElementById("faultForm");
    if (!form) return;

    clearFaultFormErrors();
    setFaultFormBusy(false);

    // التأكد من أن قائمة الأجهزة جاهزة من جرد Excel (حالة تحميل/خطأ واضحة)
    populateFaultDeviceSelect();

    // تجهيز قائمة المواقع (الأساسية + المحفوظة في medical_locations)
    populateFaultLocationSelect();
    loadFaultLocations();

    // استخدام بيانات المُبلِّغ المتوفرة حالياً في التطبيق (إن وُجدت) دون إنشاء مستخدمين وهميين
    const reportedByInput = document.getElementById("faultReportedBy");
    if (reportedByInput && !String(reportedByInput.value).trim() && currentEngineer) {
        reportedByInput.value = currentEngineer;
    }

    form.style.display = "block";
}

// مسح كل رسائل التحقق وحالات الخطأ داخل النموذج
function clearFaultFormErrors() {
    document.querySelectorAll("#faultForm .field-error").forEach(el => {
        el.textContent = "";
    });

    document.querySelectorAll("#faultForm .medical-input").forEach(el => {
        el.classList.remove("is-invalid");
    });
}

// مسح خطأ حقل واحد (يُستدعى عند تصحيح المستخدم للقيمة)
function clearFaultFieldError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");

    const errorEl = document.getElementById("error-" + input.id);
    if (errorEl) errorEl.textContent = "";
}

// إظهار رسالة خطأ أسفل الحقل
function showFaultFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (input) input.classList.add("is-invalid");

    const errorEl = document.getElementById("error-" + fieldId);
    if (errorEl) errorEl.textContent = message;
}

// تعطيل/تمكين زر الإرسال لمنع الإرسال المزدوج من ضغطة واحدة
function setFaultFormBusy(isBusy) {
    faultFormSubmitting = isBusy;

    const button = document.getElementById("saveFaultBtn");
    if (button) {
        button.disabled = isBusy;
        button.textContent = isBusy ? "Saving..." : "Save Request";
    }
}

// التحقق من الحقول المطلوبة — يعيد true فقط عند اكتمال النموذج
function validateFaultForm() {
    clearFaultFormErrors();

    let valid = true;
    let firstInvalidId = "";

    FAULT_REQUIRED_FIELDS.forEach(field => {
        const el = document.getElementById(field.id);
        const value = el ? String(el.value).trim() : "";

        if (!value) {
            showFaultFieldError(field.id, field.message);
            if (!firstInvalidId) firstInvalidId = field.id;
            valid = false;
        }
    });

    if (firstInvalidId) {
        const firstInvalid = document.getElementById(firstInvalidId);
        if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
    }

    return valid;
}

function closeFaultForm() {
    const form = document.getElementById("faultForm");
    if (form) form.style.display = "none";

    // ريست للحقول النصية والقوائم
    ["faultDevice", "faultBrand", "faultOrigin", "faultSerial", "faultReportedBy", "faultDescription", "faultPriority", "faultStatus"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // إرجاع القيم الافتراضية الآمنة للقوائم (نفس قيم Firestore الحالية)
    const prioritySelect = document.getElementById("faultPriority");
    if (prioritySelect) prioritySelect.value = "MEDIUM";

    const statusSelect = document.getElementById("faultStatus");
    if (statusSelect) statusSelect.value = "NEW";

    // ريست حقل الموقع (القائمة + حقل الإدخال + سؤال الحفظ)
    resetFaultLocationUI();

    clearFaultFormErrors();
    setFaultFormBusy(false);

    // مسح حالة التحميل/الخطأ الخاصة بقائمة أجهزة Excel
    const faultDeviceHint = document.getElementById("faultDeviceHint");
    if (faultDeviceHint) faultDeviceHint.innerHTML = "";
}

// جلب الأعطال (قراءة أولية)
async function getMedicalFaults() {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");
        
        const q = query(collection(db, MEDICAL_FAULTS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        medicalFaultsCache = [];
        snapshot.forEach(doc => {
            medicalFaultsCache.push({ id: doc.id, ...doc.data() });
        });

        renderMedicalDevicesPage();
    } catch (error) {
        console.error("Error loading faults:", error);
        showMessage("Unable to load maintenance requests.", "error");
    }
}

// الاشتراك الحيّ في مجموعة الأعطال: تحديث العدّادات والقوائم تلقائياً
function subscribeMedicalFaults() {
    stopMedicalFaultsSubscription();

    const db = getFirestoreDB();
    if (!db) return;

    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js")
        .then(({ collection, query, orderBy, onSnapshot }) => {
            const q = query(collection(db, MEDICAL_FAULTS_COLLECTION), orderBy("createdAt", "desc"));

            medicalFaultsUnsubscribe = onSnapshot(q, snapshot => {
                medicalFaultsCache = [];
                snapshot.forEach(doc => {
                    medicalFaultsCache.push({ id: doc.id, ...doc.data() });
                });
                renderMedicalDevicesPage();
            }, error => {
                console.error("Error subscribing to faults:", error);
            });
        })
        .catch(error => {
            console.error("Error starting faults subscription:", error);
        });
}

// إيقاف الاشتراك (يُستخدم عند مغادرة القسم أو إعادة الاشتراك)
function stopMedicalFaultsSubscription() {
    if (typeof medicalFaultsUnsubscribe === "function") {
        medicalFaultsUnsubscribe();
    }
    medicalFaultsUnsubscribe = null;
}

// توليد Ticket ID متسلسل باستخدام Transaction
async function getNextTicketID(db) {
    const { doc, runTransaction, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");
    
    const counterDocRef = doc(db, MEDICAL_COUNTERS_COLLECTION, "faults_counter");
    const year = new Date().getFullYear();

    return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        let nextNumber = 1;

        if (counterDoc.exists()) {
            const data = counterDoc.data();
            if (data.year === year) {
                nextNumber = (data.lastNumber || 0) + 1;
            }
        }

        transaction.set(counterDocRef, {
            year: year,
            lastNumber: nextNumber,
            updatedAt: serverTimestamp()
        });

        const paddedNumber = String(nextNumber).padStart(3, '0');
        return `REQ-${year}-${paddedNumber}`;
    });
}

// إضافة عطل جديد (نفس مجموعة Firestore والبنية الحالية)
async function addFault() {
    // منع الإرسال المزدوج من ضغطة واحدة
    if (faultFormSubmitting) return;

    if (!requireLoginForWrite(addFault)) return;

    // التحقق من الحقول المطلوبة قبل الإرسال
    if (!validateFaultForm()) {
        showMessage("Please complete the required fields before submitting.", "error");
        return;
    }

    // التحقق من اختيار جهاز حقيقي من جرد Excel قبل الحفظ
    const selectedDeviceRecord =
        getSelectedFaultInventoryRecord();

    if (!selectedDeviceRecord) {

        showMessage(
            "Please select a device from the Excel inventory.",
            "error"
        );

        showFaultFieldError(
            "faultDevice",
            "Device Name is required."
        );

        return;

    }

    // الاسم يُحفظ كنص Excel الأصلي (نفس صيغة السجلات الحالية) لضمان التوافق،
    // بينما تأتي الماركة والمنشأ من نفس السجل المختار بالضبط
    const device =
        selectedDeviceRecord.name;

    const brand =
        selectedDeviceRecord.brand;

    const origin =
        selectedDeviceRecord.origin;

    const serial = document.getElementById("faultSerial").value.trim();
    const reportedBy = document.getElementById("faultReportedBy").value.trim();
    const priority = document.getElementById("faultPriority").value;
    const status = document.getElementById("faultStatus").value;
    const description = document.getElementById("faultDescription").value.trim();
    const location = getFaultLocationValue();

    const db = getFirestoreDB();
    if (!db) {
        showMessage("Unable to connect to the database. Please try again.", "error");
        return;
    }

    setFaultFormBusy(true);

    try {
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const ticketID = await getNextTicketID(db);

        const faultRef = await addDoc(collection(db, MEDICAL_FAULTS_COLLECTION), {
            ticketID,
            device,
            brand,
            origin,
            serial,
            reportedBy,
            priority,
            status,
            location,
            description,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            completedAt: status === "COMPLETE" ? serverTimestamp() : null
        });

        // إشعار بتسجيل جهاز طبي جديد — يُرسل مرة واحدة فقط بعد نجاح الحفظ
        // (لا يُرسل عند فشل الحفظ لأن الاستدعاء بعد addDoc مباشرة).
        // eventId مبني على معرّف العطل الفعلي في Firestore لضمان عدم تكرار
        // نفس الحدث حتى لو أُعيد تنفيذ الدالة لأي سبب.
        await notify(
            "الأجهزة الطبية",
            device
                ? "تم تسجيل جهاز طبي جديد: " + device
                : "تم تسجيل جهاز طبي جديد",
            "medical",
            {
                eventId: "medical_fault_created_" + faultRef.id,
                faultId: faultRef.id
            }
        );

        closeFaultForm();
        showMessage("Fault submitted successfully - Ticket: " + ticketID);
        await getMedicalFaults();
    } catch (error) {
        console.error("Error adding fault:", error);
        showMessage("Unable to submit the fault. Please try again.", "error");
    } finally {
        setFaultFormBusy(false);
    }
}

// تحديث لوحة الإحصائيات والقوائم
function renderMedicalDevicesPage() {
    renderDashboard();
    renderFaultsLists();
}

// توحيد قيمة الحالة القادمة من Firestore
// (يدعم البيانات القديمة التي كُتبت بحروف صغيرة أو بصيغة COMPLETED)
const FAULT_STATUS_ALIASES = {
    NEW: "NEW",
    "IN PROGRESS": "IN PROGRESS",
    "AWAITING PARTS": "AWAITING PARTS",
    COMPLETE: "COMPLETE",
    COMPLETED: "COMPLETE"
};

function normalizeFaultStatus(value) {
    const key = String(value || "").trim().toUpperCase().replace(/_/g, " ");
    return FAULT_STATUS_ALIASES[key] || key;
}

// توحيد قيمة الأولوية القادمة من Firestore
function normalizeFaultPriority(value) {
    return String(value || "").trim().toUpperCase().replace(/_/g, " ");
}

// ============================================================
// فلتر الأولوية من بطاقات Priority Overview
// (يعمل على نفس بيانات medicalFaultsCache — بلا collection جديد
//  وبلا بيانات وهمية، ولا يغيّر أي شيء في Firestore)
// ============================================================

// هل يطابق هذا العطل فلتر الأولوية النشط حالياً؟
// يقبل الصيغ المختلفة (CRITICAL / Critical / critical) لأنها تُوحَّد بنفس الدالة.
function matchesFaultPriorityFilter(fault) {
    if (!activeFaultPriorityFilter) return true;
    return normalizeFaultPriority(fault.priority) === activeFaultPriorityFilter;
}

// تسمية عرض ودّية للفلتر: CRITICAL → Critical
function getFaultPriorityDisplayLabel(priorityKey) {
    const label = FAULT_PRIORITY_LABELS[priorityKey] || priorityKey || "";
    return label ? label.charAt(0) + label.slice(1).toLowerCase() : "";
}

// تفعيل/إلغاء فلتر الأولوية عند الضغط على بطاقة أولوية
// الضغطة الثانية على نفس الفئة تعيد عرض جميع الأعطال.
function toggleFaultPriorityFilter(priority) {
    const normalized = normalizeFaultPriority(priority);
    if (!normalized) return;

    const wasActive = activeFaultPriorityFilter === normalized;
    activeFaultPriorityFilter = wasActive ? null : normalized;

    renderMedicalDevicesPage();

    // عند تفعيل الفلتر: مرّر المستخدم إلى قائمة الأعطال لرؤية النتائج مباشرة
    if (!wasActive) {
        const section = document.getElementById("maintenanceRequestsSection");
        if (section && typeof section.scrollIntoView === "function") {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
}

// إزالة فلتر الأولوية والعودة إلى عرض جميع الأعطال
function clearFaultPriorityFilter() {
    activeFaultPriorityFilter = null;
    renderMedicalDevicesPage();
}

// دعم لوحة المفاتيح لبطاقات الأولوية (Enter / Space)
function handlePriorityCardKeydown(event, priority) {
    if (event && (event.key === "Enter" || event.key === " " || event.key === "Spacebar")) {
        event.preventDefault();
        toggleFaultPriorityFilter(priority);
    }
}

// تحديث شريط الفلتر الحالي فوق قائمة الأعطال
// يعرض: Priority: <المستوى> + عدد النتائج مثل "Critical Faults (5)"
function updateFaultPriorityFilterBar(visibleCount) {
    const bar = document.getElementById("faultPriorityFilterBar");
    if (!bar) return;

    if (!activeFaultPriorityFilter) {
        bar.style.display = "none";
        return;
    }

    const displayLabel = getFaultPriorityDisplayLabel(activeFaultPriorityFilter);
    const labelEl = document.getElementById("faultPriorityFilterLabel");
    const countEl = document.getElementById("faultPriorityFilterCount");

    if (labelEl) labelEl.textContent = displayLabel;
    if (countEl) countEl.textContent = `${displayLabel} Faults (${visibleCount})`;

    bar.style.display = "flex";
}

// ============================================================
// فلتر الحالة من بطاقات Status Summary
// (نفس آلية Priority Overview — يعمل على medicalFaultsCache الحالية
//  بلا collection جديد، بلا بيانات وهمية، وبلا تغيير في Firestore)
// ============================================================

// هل يطابق هذا العطل فلتر الحالة النشط حالياً؟
// يقبل الصيغ المختلفة (NEW / New / new) لأنها تُوحَّد بنفس الدالة.
function matchesFaultStatusFilter(fault) {
    if (!activeFaultStatusFilter) return true;
    return normalizeFaultStatus(fault.status) === activeFaultStatusFilter;
}

// تسمية عرض ودّية للفلتر: NEW → New
function getFaultStatusDisplayLabel(statusKey) {
    const key = String(statusKey || "").trim().toUpperCase().replace(/_/g, " ");
    let label = null;
    // النص العربي حسب أولوية التصميم في صفحة الأجهزة الطبية
    if (key === "NEW") label = "New";
    else if (key === "IN PROGRESS") label = "In Progress";
    else if (key === "AWAITING PARTS") label = "Awaiting Parts";
    else if (key === "COMPLETE") label = "Completed";
    return label ? label.charAt(0) + label.slice(1).toLowerCase() : "";
}

// تفعيل/إلغاء فلتر الحالة عند الضغط على بطاقة Status Summary
// الضغطة الثانية على نفس الحالة تعيد عرض جميع الأعطال.
function toggleFaultStatusFilter(status) {
    const normalized = normalizeFaultStatus(status);
    if (!normalized) return;

    const wasActive = activeFaultStatusFilter === normalized;
    activeFaultStatusFilter = wasActive ? null : normalized;

    renderMedicalDevicesPage();

    // عند تفعيل الفلتر: مرّر المستخدم إلى قائمة الأعطال لرؤية النتائج مباشرة
    if (!wasActive) {
        const section = document.getElementById("maintenanceRequestsSection");
        if (section && typeof section.scrollIntoView === "function") {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
}

// إزالة فلتر الحالة والعودة إلى عرض جميع الأعطال
function clearFaultStatusFilter() {
    activeFaultStatusFilter = null;
    renderMedicalDevicesPage();
}

// دعم لوحة المفاتيح لبطاقات Status Summary (Enter / Space)
function handleStatusCardKeydown(event, status) {
    if (event && (event.key === "Enter" || event.key === " " || event.key === "Spacebar")) {
        event.preventDefault();
        toggleFaultStatusFilter(status);
    }
}

// تحديث شريط الفلتر الحالي فوق قائمة الأعطال (للفلتر Status)
// يعرض: Status: <المستوى> + عدد النتائج مثل "In Progress Faults (5)"
function updateFaultStatusFilterBar(visibleCount) {
    const bar = document.getElementById("faultStatusFilterBar");
    if (!bar) return;

    if (!activeFaultStatusFilter) {
        bar.style.display = "none";
        return;
    }

    const displayLabel = getFaultStatusDisplayLabel(activeFaultStatusFilter);
    const labelEl = document.getElementById("faultStatusFilterLabel");
    const countEl = document.getElementById("faultStatusFilterCount");

    if (labelEl) labelEl.textContent = displayLabel;
    if (countEl) countEl.textContent = `${displayLabel} Faults (${visibleCount})`;

    bar.style.display = "flex";
}

function renderDashboard() {
    // ملخص التذاكر (Ticket Summary) — إجمالي السجلات وسجلات الحالة الجديدة
    const totalTicketsEl = document.getElementById("stat-total-tickets");
    if (totalTicketsEl) {
        totalTicketsEl.textContent = medicalFaultsCache.length;
    }

    const newTicketsEl = document.getElementById("stat-new-tickets");
    if (newTicketsEl) {
        newTicketsEl.textContent = medicalFaultsCache.filter(
            f => normalizeFaultStatus(f.status) === "NEW"
        ).length;
    }

    // تحديث الحالات + تمييز البطاقة المختارة (فلتر الحالة النشط — Status Summary)
    // العدّ هنا يُحسب من السجلات التي تطابق فلتر Priority النشط فقط (إن وُجد)،
    // بحيث تعكس أرقام Status Summary الفلتر المطبَّق من القسم الآخر (تقاطع تراكمي).
    const statusCountBase = medicalFaultsCache.filter(f => matchesFaultPriorityFilter(f));
    FAULT_STATUS_ORDER.forEach(status => {
        const count = statusCountBase.filter(f => normalizeFaultStatus(f.status) === status).length;
        const el = document.getElementById(`stat-${status.toLowerCase().replace(" ", "_")}`);
        if (el) el.textContent = count;

        const card = el && el.closest ? el.closest(".summary-card") : null;
        if (card) {
            const isActive = activeFaultStatusFilter === status;
            card.classList.toggle("is-active", isActive);
            card.setAttribute("aria-pressed", isActive ? "true" : "false");
        }
    });

    // تحديث الأولويات + تمييز البطاقة المختارة (فلتر الأولوية النشط)
    // بنفس المنطق: العدّ يُحسب من السجلات التي تطابق فلتر Status النشط فقط (إن وُجد).
    const priorityCountBase = medicalFaultsCache.filter(f => matchesFaultStatusFilter(f));
    FAULT_PRIORITY_ORDER.forEach(priority => {
        const count = priorityCountBase.filter(f => normalizeFaultPriority(f.priority) === priority).length;
        const el = document.getElementById(`stat-${priority.toLowerCase()}`);
        if (el) el.textContent = count;

        const card = el && el.closest ? el.closest(".priority-card") : null;
        if (card) {
            const isActive = activeFaultPriorityFilter === priority;
            card.classList.toggle("is-active", isActive);
            card.setAttribute("aria-pressed", isActive ? "true" : "false");
        }
    });
}

function renderFaultsLists() {
    const pendingContainer = document.getElementById("pendingFaults");
    const completedContainer = document.getElementById("completedFaults");

    // فلتر الأولوية والحالة (إن كانا نشطين) يُطبَّقان على نفس مصدر البيانات الحالي
    const filtered = medicalFaultsCache.filter(f =>
        matchesFaultPriorityFilter(f) && matchesFaultStatusFilter(f)
    );

    const pending = filtered.filter(f => normalizeFaultStatus(f.status) !== "COMPLETE");
    const completed = filtered.filter(f => normalizeFaultStatus(f.status) === "COMPLETE");

    document.getElementById("pendingFaultCount").textContent = pending.length;
    document.getElementById("completedFaultCount").textContent = completed.length;

    // تحديث شريطي الفلتر الحاليين (يظهران فقط عند تفعيل كل فلتر على حدة)
    updateFaultPriorityFilterBar(filtered.length);
    updateFaultStatusFilterBar(filtered.length);

    const priorityLabel = activeFaultPriorityFilter ?
        getFaultPriorityDisplayLabel(activeFaultPriorityFilter) : "";
    const statusLabel = activeFaultStatusFilter ?
        getFaultStatusDisplayLabel(activeFaultStatusFilter) : "";

    const filterSummary = [priorityLabel, statusLabel].filter(Boolean).join(" / ") || "All";

    if (pending.length === 0) {
        const emptyTitle = filterSummary !== "All" ?
            `No ${filterSummary} maintenance requests found.` :
            "No maintenance requests found.";
        const emptyHint = filterSummary !== "All" ?
            "Use the clear buttons above to show all requests." :
            "Use “+ Add Fault” to register a new maintenance request.";

        pendingContainer.innerHTML = `
            <div class="requests-empty">
                <div class="requests-empty-icon">🛠️</div>
                <strong>${escapeHTML(emptyTitle)}</strong>
                <p>${escapeHTML(emptyHint)}</p>
            </div>`;
    } else {
        pendingContainer.innerHTML = pending.map(f => createFaultCardHTML(f)).join("");
    }

    if (completed.length === 0) {
        const emptyTitle = filterSummary !== "All" ?
            `No completed ${filterSummary} requests yet.` :
            "No completed requests yet.";
        const emptyHint = filterSummary !== "All" ?
            "Use the clear buttons above to show all requests." :
            "Serviced requests will appear here.";

        completedContainer.innerHTML = `
            <div class="requests-empty">
                <div class="requests-empty-icon">✅</div>
                <strong>${escapeHTML(emptyTitle)}</strong>
                <p>${escapeHTML(emptyHint)}</p>
            </div>`;
    } else {
        completedContainer.innerHTML = completed.map(f => createFaultCardHTML(f, true)).join("");
    }
}

// ============================================================
// طيّ/فتح قسم "Complete Request" — مطوي افتراضيًا، ولا يُفتح إلا
// عند الضغط على رأس القسم (نفس منطق الفتح/الإغلاق البسيط
// المستخدم في بقية بطاقات الصفحة، بدون أي مكتبة خارجية).
// ============================================================

function toggleCompletedRequestsSection() {
    const section = document.getElementById("completedRequestsSection");
    const container = document.getElementById("completedFaults");
    const toggle = document.getElementById("completedRequestsToggle");
    if (!section || !container) return;

    const isOpen = section.classList.toggle("is-open");
    container.classList.toggle("is-collapsed", !isOpen);
    if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

// دعم لوحة المفاتيح لرأس قسم "Complete Request" (Enter / Space)
function handleCompletedRequestsToggleKeydown(event) {
    if (event && (event.key === "Enter" || event.key === " " || event.key === "Spacebar")) {
        event.preventDefault();
        toggleCompletedRequestsSection();
    }
}

function createFaultCardHTML(fault, isCompleted = false) {
    const createdDate = fault.createdAt ? formatPurchaseDate(fault.createdAt) : "---";
    const completedDate = fault.completedAt ? formatPurchaseDate(fault.completedAt) : "";

    const statusKey = normalizeFaultStatus(fault.status);
    const priorityKey = normalizeFaultPriority(fault.priority);

    const statusLabel = FAULT_STATUS_LABELS[statusKey] || statusKey || "---";
    const priorityLabel = FAULT_PRIORITY_LABELS[priorityKey] || priorityKey || "---";

    const statusClass = "is-status-" + (statusKey.replace(/[^A-Z0-9]+/g, "-") || "UNKNOWN");
    const priorityClass = "is-priority-" + (priorityKey.replace(/[^A-Z0-9]+/g, "-") || "UNKNOWN");

    let actionsHTML = "";
    if (!isCompleted) {
        actionsHTML = `
            <button type="button" class="request-complete-btn" onclick="markAsComplete('${fault.id}')">
                Mark as Completed
            </button>`;
    }

    let completedMetaHTML = "";
    if (isCompleted) {
        completedMetaHTML = `
                <div class="request-meta-item">
                    <span class="request-meta-label">Completed At</span>
                    <span class="request-meta-value">${completedDate || "---"}</span>
                </div>`;
    }

    return `
        <article class="request-card" id="fault-card-${fault.id}">
            <button type="button" class="request-delete-icon-btn" onclick="deleteFault('${fault.id}')" aria-label="حذف العطل" title="حذف العطل">🗑️</button>
            <div class="request-card-top">
                <span class="request-id">${escapeHTML(fault.ticketID || "---")}</span>
                <span class="request-badges">
                    <span class="request-badge ${statusClass}">${escapeHTML(statusLabel)}</span>
                    <span class="request-badge ${priorityClass}">${escapeHTML(priorityLabel)}</span>
                </span>
            </div>

            <div class="request-device">
                <span class="request-device-name">${escapeHTML(fault.device || "Unnamed device")}</span>
                ${fault.serial ? `<span class="request-serial">SN: ${escapeHTML(fault.serial)}</span>` : ""}
            </div>

            <div class="request-meta">
                <div class="request-meta-item">
                    <span class="request-meta-label">Brand</span>
                    <span class="request-meta-value">${escapeHTML(fault.brand || "---")}</span>
                </div>
                <div class="request-meta-item">
                    <span class="request-meta-label">Origin</span>
                    <span class="request-meta-value">${escapeHTML(fault.origin || "---")}</span>
                </div>
                <div class="request-meta-item">
                    <span class="request-meta-label">Reported By</span>
                    <span class="request-meta-value">${escapeHTML(fault.reportedBy || "---")}</span>
                </div>
                <div class="request-meta-item">
                    <span class="request-meta-label">Created At</span>
                    <span class="request-meta-value">${createdDate}</span>
                </div>${completedMetaHTML}
            </div>

            <p class="request-desc">${escapeHTML(fault.description || "No description provided.")}</p>
            ${actionsHTML}
        </article>`;
}

async function markAsComplete(id) {
    if (!requireLoginForWrite(() => markAsComplete(id))) return;

    const db = getFirestoreDB();
    if (!db) return;

    // نلتقط بيانات العطل قبل التحديث لاستخدامها في نص الإشعار
    // (بعد التحديث يُعاد تحميل medicalFaultsCache فتُفقد الحالة القديمة).
    const faultBeforeUpdate = medicalFaultsCache.find(f => f.id === id);

    try {
        const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");
        
        await updateDoc(doc(db, MEDICAL_FAULTS_COLLECTION, id), {
            status: "COMPLETE",
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // إشعار بتغيير حالة العطل إلى مكتمل — eventId مبني على معرّف
        // العطل + نوع الحالة الجديدة، لمنع إرسال نفس الحدث مرتين.
        await notify(
            "تحديث حالة عطل جهاز طبي",
            faultBeforeUpdate
                ? "تم إنجاز صيانة: " + faultBeforeUpdate.device
                : "تم تحديث حالة عطل جهاز طبي إلى مكتمل",
            "medical",
            {
                eventId: "medical_fault_status_COMPLETE_" + id,
                faultId: id
            }
        );

        showMessage("Maintenance request completed.");
        await getMedicalFaults();
    } catch (error) {
        console.error("Error updating fault status:", error);
        showMessage("Unable to complete the maintenance request.", "error");
    }
}

// حذف عطل واحد فقط من نفس مصدر البيانات الحالي (MEDICAL_FAULTS_COLLECTION)
// لا يحذف الجهاز الطبي ولا أي عطل آخر، ولا يمس ملف Excel الأصلي.
async function deleteFault(id) {
    if (!requireLoginForWrite(() => deleteFault(id))) return;

    const confirmed = confirm("هل أنت متأكد من حذف هذا العطل؟");
    if (!confirmed) return;

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        await deleteDoc(doc(db, MEDICAL_FAULTS_COLLECTION, id));

        showMessage("تم حذف العطل بنجاح.");
        await getMedicalFaults();
    } catch (error) {
        console.error("Error deleting fault:", error);
        showMessage("تعذر حذف العطل. حاول مرة أخرى.", "error");
    }
}

// ============================================================
// حماية HTML
// ============================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

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

// ============================================================
// تهيئة التطبيق
// ============================================================

// ============================================================
// فتح عطل/جهاز طبي محدد مباشرة (Deep Link) — يُستخدم عند الضغط على
// إشعار Push (من الـ Service Worker) أو عند فتح رابط يحتوي faultId
// ============================================================

// يمرّر البحث عن البطاقة لأن renderFaultsLists() قد لا يكون انتهى بعد
function scrollToFaultCard(faultId, attempts = 0) {
    const card = document.getElementById("fault-card-" + faultId);
    if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("is-highlighted-fault");
        setTimeout(() => card.classList.remove("is-highlighted-fault"), 3000);
        return;
    }
    if (attempts < 10) {
        setTimeout(() => scrollToFaultCard(faultId, attempts + 1), 300);
    }
}

async function openMedicalFaultById(faultId) {
    if (!faultId) return;
    openMedicalDevices();
    await getMedicalFaults();
    scrollToFaultCard(faultId);
}

// عند فتح التطبيق برابط من إشعار Push (index.html?openMedical=1&faultId=...)
function handleMedicalDeepLinkFromURL() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("openMedical") !== "1") return;

        const faultId = params.get("faultId");
        if (faultId) {
            openMedicalFaultById(faultId);
        } else {
            openMedicalDevices();
        }

        // تنظيف الرابط بعد الفتح حتى لا يتكرر نفس الفتح عند إعادة التحميل
        const cleanURL = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanURL);
    } catch (error) {
        console.error("Error handling medical deep link:", error);
    }
}

function initializeCompanyApp() {

    console.log(
        "script.js loaded successfully"
    );

    console.log(
        "شركة نوافذ البناء - التطبيق بدأ"
    );

    startNotificationsListener();

    setupMessagingForeground();

    getNotifications();

    // فتح العطل الصحيح مباشرة عند الوصول من رابط إشعار Push
    handleMedicalDeepLinkFromURL();

    // استقبال رسالة من Service Worker عند الضغط على الإشعار والتبويب
    // مفتوح أصلاً (بدون فتح تبويب/نافذة جديدة)
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", event => {
            if (event.data && event.data.type === "OPEN_MEDICAL_FAULT" && event.data.faultId) {
                openMedicalFaultById(event.data.faultId);
            }
        });
    }

}

// ============================================================
// منع بعض مشاكل اللمس
// ============================================================

document.addEventListener(
    "touchstart",
    function () {},
    {
        passive: true
    }
);

// ============================================================
// بدء التطبيق
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCompanyApp
    );

} else {

    initializeCompanyApp();

}

// ============================================================
// MEDICAL DEVICE INVENTORY (Excel-driven) — قسم جرد الأجهزة الطبية
// المصدر: ملف Excel الحقيقي في جذر المشروع
// "Al-Fedhalyia medical  222 Final - 180.000.000.xlsx" (Sheet2)
// - لا توجد أجهزة وهمية (Brand X / Brand Y) في هذا القسم.
// - كل صف في Excel يبقى سجلاً مستقلاً حتى لو تكرر اسم الجهاز،
//   لأن هوية السجل هي: اسم الجهاز + الماركة + بلد المنشأ + رقم الصف.
// - هذا القسم مستقل ولا يعدّل أي قسم آخر في التطبيق.
// ============================================================

const MEDICAL_INVENTORY_EXCEL_FILE =
    "Al-Fedhalyia medical  222 Final - 180.000.000.xlsx";

const MEDICAL_INVENTORY_EXCEL_URL =
    encodeURI(MEDICAL_INVENTORY_EXCEL_FILE);

const MEDICAL_INVENTORY_SHEET_NAME = "Sheet2";

const MEDICAL_INVENTORY_LIBRARY_URL = "vendor/xlsx.full.min.js";

const MEDICAL_INVENTORY_NAME_HEADERS = [
    "room name / item name"
];

const MEDICAL_INVENTORY_QTY_HEADERS = [
    "qty.",
    "qty",
    "quantity"
];

const MEDICAL_INVENTORY_BRAND_HEADERS = [
    "brand"
];

const MEDICAL_INVENTORY_ORIGIN_HEADERS = [
    "origin",
    "country of origin"
];

// أمثلة للاختلافات الموجودة داخل ملف Excel نفسه: TUR / Turkey و PRC / China
const MEDICAL_INVENTORY_SEARCH_ALIASES = {
    "tur": ["turkey"],
    "turkey": ["tur"],
    "prc": ["china"],
    "china": ["prc"]
};

const medicalInventoryState = {
    status: "idle", // idle | loading | ready | error
    records: [],
    sheetName: "",
    totalCount: 0,
    brandCount: 0,
    countryCount: 0,
    query: "",
    loadToken: 0
};

let medicalInventoryLibraryPromise = null;

// مستمعو جهوزية الجرد — يُستدعون مرة واحدة عند نجاح التحميل
// (يستخدمهم نموذج الأعطال ليملء قائمة الأجهزة من نفس البيانات)
let medicalInventoryReadyListeners = [];

function onMedicalInventoryReady(callback) {

    if (typeof callback !== "function") {

        return;

    }

    if (medicalInventoryState.status === "ready") {

        callback();

        return;

    }

    medicalInventoryReadyListeners.push(callback);

}

function notifyMedicalInventoryReady() {

    const listeners =
        medicalInventoryReadyListeners;

    medicalInventoryReadyListeners = [];

    listeners.forEach(listener => {

        try {

            listener();

        } catch (error) {

            console.error(
                "Medical inventory ready listener failed:",
                error
            );

        }

    });

}

function clearMedicalInventoryReadyListeners() {

    medicalInventoryReadyListeners = [];

}

// ============================================================
// أدوات مساعدة للجرد
// ============================================================

function medicalInventoryGetElement(id) {

    return document.getElementById(id);

}

function normalizeMedicalText(value) {

    if (value === null || value === undefined) {

        return "";

    }

    return String(value)
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

}

function medicalInventoryToDisplay(value) {

    if (value === null || value === undefined) {

        return "";

    }

    return String(value)
        .replace(/\r?\n/g, " ")
        .trim();

}

function escapeMedicalHtml(value) {

    return String(
        value === null || value === undefined ? "" : value
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

}

function highlightMedicalMatch(rawText, query) {

    const escaped =
        escapeMedicalHtml(rawText);

    const trimmedQuery =
        (query || "").trim();

    if (!trimmedQuery) {

        return escaped;

    }

    // تجنّب الاستعلامات التي تحتوي محارف HTML
    if (/[<>&"'`]/.test(trimmedQuery)) {

        return escaped;

    }

    const pattern =
        trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    try {

        const regex =
            new RegExp("(" + pattern + ")", "giu");

        return escaped.replace(
            regex,
            '<mark class="inventory-hit">$1</mark>'
        );

    } catch (error) {

        return escaped;

    }

}

function findInventoryHeaderColumns(row) {

    const found = {
        ref: 0,
        name: -1,
        qty: -1,
        brand: -1,
        origin: -1
    };

    (row || []).forEach((cell, index) => {

        const text =
            normalizeMedicalText(cell);

        if (!text) {

            return;

        }

        if (
            found.name === -1 &&
            MEDICAL_INVENTORY_NAME_HEADERS.indexOf(text) !== -1
        ) {

            found.name = index;

        } else if (
            found.qty === -1 &&
            MEDICAL_INVENTORY_QTY_HEADERS.indexOf(text) !== -1
        ) {

            found.qty = index;

        } else if (
            found.brand === -1 &&
            MEDICAL_INVENTORY_BRAND_HEADERS.indexOf(text) !== -1
        ) {

            found.brand = index;

        } else if (
            found.origin === -1 &&
            MEDICAL_INVENTORY_ORIGIN_HEADERS.indexOf(text) !== -1
        ) {

            found.origin = index;

        }

    });

    if (found.name === -1) {

        return null;

    }

    return found;

}

// ============================================================
// تحليل ملف Excel وبناء سجلات الجرد
// ============================================================

function parseMedicalInventoryWorkbook(workbook) {

    const sheetName =
        workbook.SheetNames.indexOf(MEDICAL_INVENTORY_SHEET_NAME) !== -1
            ? MEDICAL_INVENTORY_SHEET_NAME
            : workbook.SheetNames[0];

    if (!sheetName) {

        throw new Error(
            "The Excel file does not contain any worksheet."
        );

    }

    const worksheet =
        workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: null,
        blankrows: true
    });

    if (!rows.length) {

        throw new Error(
            'Worksheet "' + sheetName + '" is empty.'
        );

    }

    // تحديد صف العناوين وأعمدة البيانات من ملف Excel الفعلي
    let columns = null;
    let headerIndex = 0;

    const scanLimit =
        Math.min(rows.length, 5);

    for (let i = 0; i < scanLimit; i++) {

        const found =
            findInventoryHeaderColumns(rows[i]);

        if (found) {

            columns = found;
            headerIndex = i;

            break;

        }

    }

    if (!columns) {

        // التخطيط المقاس أثناء فحص ملف Excel (A=المرجع، B=الاسم، C=الكمية، D=الماركة، E=المنشأ)
        columns = {
            ref: 0,
            name: 1,
            qty: 2,
            brand: 3,
            origin: 4
        };

    }

    const records = [];

    for (let i = headerIndex + 1; i < rows.length; i++) {

        const row =
            rows[i] || [];

        const excelRow =
            i + 1;

        const name =
            medicalInventoryToDisplay(row[columns.name]);

        // الصفوف التي لا تحتوي اسم جهاز يتم استبعادها (13 صف في ملف Excel الحالي)
        if (!name) {

            continue;

        }

        const ref =
            columns.ref >= 0
                ? medicalInventoryToDisplay(row[columns.ref])
                : "";

        const qty =
            columns.qty >= 0
                ? medicalInventoryToDisplay(row[columns.qty])
                : "";

        const brand =
            columns.brand >= 0
                ? medicalInventoryToDisplay(row[columns.brand])
                : "";

        const origin =
            columns.origin >= 0
                ? medicalInventoryToDisplay(row[columns.origin])
                : "";

        records.push({
            id: "row-" + excelRow,
            excelRow: excelRow,
            ref: ref,
            name: name,
            brand: brand,
            origin: origin,
            qty: qty,
            searchName: normalizeMedicalText(name),
            searchBrand: normalizeMedicalText(brand),
            searchOrigin: normalizeMedicalText(origin)
        });

    }

    records.forEach(record => {

        record.searchAll = normalizeMedicalText(
            record.name + " " + record.brand + " " + record.origin
        );

    });

    return {
        sheetName: sheetName,
        records: records,
        headerRow: headerIndex + 1
    };

}

function computeMedicalInventoryTotals(records) {

    const brands = new Set();
    const countries = new Set();

    records.forEach(record => {

        if (record.searchBrand) {

            brands.add(record.searchBrand);

        }

        if (record.searchOrigin) {

            countries.add(record.searchOrigin);

        }

    });

    return {
        total: records.length,
        brands: brands.size,
        countries: countries.size
    };

}

// ============================================================
// تحميل مكتبة قراءة Excel (SheetJS) عند الحاجة فقط
// ============================================================

function loadMedicalInventoryLibrary() {

    if (window.XLSX) {

        return Promise.resolve();

    }

    if (medicalInventoryLibraryPromise) {

        return medicalInventoryLibraryPromise;

    }

    medicalInventoryLibraryPromise = new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src =
            MEDICAL_INVENTORY_LIBRARY_URL;

        script.async = true;

        script.onload = function () {

            if (window.XLSX) {

                resolve();

            } else {

                medicalInventoryLibraryPromise = null;

                reject(new Error(
                    "The Excel reader library loaded but XLSX is unavailable."
                ));

            }

        };

        script.onerror = function () {

            medicalInventoryLibraryPromise = null;

            reject(new Error(
                "Could not load the Excel reader library (vendor/xlsx.full.min.js)."
            ));

        };

        document.head.appendChild(script);

    });

    return medicalInventoryLibraryPromise;

}

// ============================================================
// إدارة حالات الشاشة (تحميل / خطأ / فراغ / جدول)
// ============================================================

function showMedicalInventoryPane(pane) {

    const loading =
        medicalInventoryGetElement("inventoryLoading");

    const error =
        medicalInventoryGetElement("inventoryError");

    const empty =
        medicalInventoryGetElement("inventoryEmpty");

    const tableWrap =
        medicalInventoryGetElement("inventoryTableWrap");

    if (loading) {

        loading.style.display =
            pane === "loading" ? "flex" : "none";

    }

    if (error) {

        error.style.display =
            pane === "error" ? "flex" : "none";

    }

    if (empty) {

        empty.style.display =
            pane === "empty" ? "flex" : "none";

    }

    if (tableWrap) {

        tableWrap.style.display =
            pane === "table" ? "block" : "none";

    }

}

function showMedicalInventoryError(message) {

    const textElement =
        medicalInventoryGetElement("inventoryErrorText");

    let displayMessage =
        message || "Unknown error while reading the Excel file.";

    if (window.location.protocol === "file:") {

        displayMessage +=
            " Note: when the app is opened directly from a local file (file://), the browser blocks reading the Excel file. Open the app through GitHub Pages or a local web server.";

    }

    if (textElement) {

        textElement.textContent =
            displayMessage;

    }

    showMedicalInventoryPane("error");

}

// ============================================================
// البحث (غير حساس لحالة الأحرف ويتعامل مع TUR/Turkey و PRC/China)
// ============================================================

function matchesMedicalInventoryQuery(record, query) {

    const normalizedQuery =
        normalizeMedicalText(query);

    if (!normalizedQuery) {

        return true;

    }

    const fields = [
        record.searchName,
        record.searchBrand,
        record.searchOrigin,
        record.searchAll
    ];

    const directMatch =
        fields.some(field => field.indexOf(normalizedQuery) !== -1);

    if (directMatch) {

        return true;

    }

    const aliases =
        MEDICAL_INVENTORY_SEARCH_ALIASES[normalizedQuery] || [];

    return aliases.some(alias =>
        fields.some(field => field.indexOf(alias) !== -1)
    );

}

// ============================================================
// عرض الجدول
// ============================================================

function renderMedicalInventory() {

    const state =
        medicalInventoryState;

    if (state.status !== "ready") {

        showMedicalInventoryPane(
            state.status === "error" ? "error" : "loading"
        );

        return;

    }

    const totalCountElement =
        medicalInventoryGetElement("inventoryTotalCount");

    const brandCountElement =
        medicalInventoryGetElement("inventoryBrandCount");

    const countryCountElement =
        medicalInventoryGetElement("inventoryCountryCount");

    const countLabel =
        medicalInventoryGetElement("inventoryCountLabel");

    const resultHint =
        medicalInventoryGetElement("inventoryResultHint");

    const tableBody =
        medicalInventoryGetElement("inventoryTableBody");

    const sourceBadge =
        medicalInventoryGetElement("inventorySourceBadge");

    if (totalCountElement) {

        totalCountElement.textContent =
            String(state.totalCount);

    }

    if (brandCountElement) {

        brandCountElement.textContent =
            String(state.brandCount);

    }

    if (countryCountElement) {

        countryCountElement.textContent =
            String(state.countryCount);

    }

    if (sourceBadge) {

        sourceBadge.textContent =
            "Excel inventory" +
            (state.sheetName ? " • " + state.sheetName : "") +
            " • " + MEDICAL_INVENTORY_EXCEL_FILE;

        sourceBadge.title =
            MEDICAL_INVENTORY_EXCEL_FILE;

    }

    const query =
        state.query.trim();

    const filtered = query
        ? state.records.filter(record => matchesMedicalInventoryQuery(record, query))
        : state.records;

    if (countLabel) {

        countLabel.textContent =
            "Total Devices: " + state.totalCount;

    }

    if (resultHint) {

        resultHint.textContent = query
            ? "Showing " + filtered.length + " of " + state.totalCount + " matching devices"
            : "";

    }

    if (!tableBody) {

        return;

    }

    if (!filtered.length) {

        tableBody.innerHTML = "";

        showMedicalInventoryPane("empty");

        return;

    }

    const rowsHtml = filtered.map((record, index) => {

        const refText =
            record.ref ? record.ref : String(index + 1);

        return "" +
            "<tr data-excel-row=\"" + record.excelRow + "\">" +
            "<td class=\"inventory-row-index\">" + escapeMedicalHtml(refText) + "</td>" +
            "<td class=\"inventory-device-name\">" + highlightMedicalMatch(record.name, query) + "</td>" +
            "<td>" + (record.brand ? highlightMedicalMatch(record.brand, query) : "<span class=\"inventory-cell-muted\">—</span>") + "</td>" +
            "<td>" + (record.origin ? highlightMedicalMatch(record.origin, query) : "<span class=\"inventory-cell-muted\">—</span>") + "</td>" +
            "<td class=\"inventory-qty-cell\">" + (record.qty ? "<span class=\"inventory-qty\">" + escapeMedicalHtml(record.qty) + "</span>" : "<span class=\"inventory-cell-muted\">—</span>") + "</td>" +
            "</tr>";

    }).join("");

    tableBody.innerHTML =
        rowsHtml;

    showMedicalInventoryPane("table");

}

// ============================================================
// تحميل ملف Excel وبناء الجرد
// ============================================================

function loadMedicalInventory(forceReload) {

    const state =
        medicalInventoryState;

    if (state.status === "loading") {

        return;

    }

    state.status =
        "loading";

    state.loadToken =
        state.loadToken + 1;

    const loadToken =
        state.loadToken;

    showMedicalInventoryPane("loading");

    loadMedicalInventoryLibrary()
        .then(() => fetch(
            forceReload
                ? MEDICAL_INVENTORY_EXCEL_URL + "?t=" + Date.now()
                : MEDICAL_INVENTORY_EXCEL_URL
        ))
        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Excel file request failed (HTTP " + response.status + ")."
                );

            }

            return response.arrayBuffer();

        })
        .then(buffer => {

            const workbook =
                XLSX.read(new Uint8Array(buffer), { type: "array" });

            const parsed =
                parseMedicalInventoryWorkbook(workbook);

            if (loadToken !== medicalInventoryState.loadToken) {

                return null;

            }

            if (!parsed.records.length) {

                throw new Error(
                    'Worksheet "' + parsed.sheetName + '" contains no valid device records.'
                );

            }

            const totals =
                computeMedicalInventoryTotals(parsed.records);

            medicalInventoryState.records =
                parsed.records;

            medicalInventoryState.sheetName =
                parsed.sheetName;

            medicalInventoryState.totalCount =
                totals.total;

            medicalInventoryState.brandCount =
                totals.brands;

            medicalInventoryState.countryCount =
                totals.countries;

            medicalInventoryState.status =
                "ready";

            // إشعار المستمعين (نموذج الأعطال) بأن بيانات الجرد جاهزة
            notifyMedicalInventoryReady();

            renderMedicalInventory();

            console.info(
                "[DeviceInventory] Loaded " + totals.total +
                " devices from sheet \"" + parsed.sheetName + "\" (" +
                MEDICAL_INVENTORY_EXCEL_FILE + ")"
            );

            return null;

        })
        .catch(error => {

            if (loadToken !== medicalInventoryState.loadToken) {

                return;

            }

            console.error(
                "Medical device inventory failed to load:",
                error
            );

            medicalInventoryState.status =
                "error";

            showMedicalInventoryError(
                error && error.message
                    ? error.message
                    : "Unknown error while reading the Excel file."
            );

        });

}

// ============================================================
// أحداث الواجهة
// ============================================================

function onMedicalInventorySearch(value) {

    medicalInventoryState.query =
        String(value === null || value === undefined ? "" : value);

    if (medicalInventoryState.status === "ready") {

        renderMedicalInventory();

    }

}

function clearMedicalInventorySearch() {

    const input =
        medicalInventoryGetElement("inventorySearch");

    if (input) {

        input.value = "";

    }

    medicalInventoryState.query =
        "";

    if (medicalInventoryState.status === "ready") {

        renderMedicalInventory();

    }

}

function reloadMedicalInventory() {

    loadMedicalInventory(true);

}

// فتح صفحة جرد الأجهزة (لوحة الأجهزة الطبية تبقى الشاشة الافتراضية)
function openDeviceInventory() {

    showPage("deviceInventoryPage");

    const state =
        medicalInventoryState;

    if (state.status === "idle") {

        loadMedicalInventory(false);

    } else if (state.status === "ready") {

        renderMedicalInventory();

    }

}
;

// ============================================================
// خزانات الكاز (Fuel Tanks)
// ------------------------------------------------------------
// قسم مستقل تماماً عن باقي الأقسام. سبعة خزانات ثابتة.
// الحسابات الهندسية في fuel-calc.js (دوال نقية مختبرة).
// الحفظ في Firestore (مشروع Firebase الحالي، لا مشروع جديد):
//   fuelTanks/{tankId}        آخر قراءة صالحة + (config للخزانات بلا أبعاد)
//   fuelTanks/_settings       حدود التنبيهات (قابلة للتعديل)
//   fuelTankReadings/{auto}   سجل القراءات التاريخي (لا يُحذف ولا يُستبدل)
// المعرّفات القديمة (hospitalGenerator, complexGenerator, boiler1, boiler2)
// محفوظة كما هي لأن وثائقها موجودة في Firestore.
// ============================================================

const FUEL_READINGS_COLLECTION = "fuelTankReadings";
const FUEL_SETTINGS_DOC_ID = "_settings";
const FUEL_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const FUEL_SAVE_TIMEOUT_MS = 15000;
const FUEL_RELOAD_MIN_MS = 30000;
const FUEL_HISTORY_LIMIT = 100;
const FUEL_HISTORY_SHOWN = 50;

const FUEL_TANKS_DEFINITIONS = window.FuelCalc ? FuelCalc.DEFINITIONS : [];
const FUEL_TANKS_TOTAL_CAPACITY = window.FuelCalc ? FuelCalc.TOTAL_NOMINAL_L : 0;

// الحالة بعد التحميل من Firestore
let fuelDocs = {};            // { [tankId]: بيانات الوثيقة }
let fuelSettings = window.FuelCalc ? FuelCalc.mergeSettings(null) : {};
let fuelHistory = [];         // الأحدث أولاً
let fuelHistoryFailed = false;
let fuelTanksLoaded = false;
let fuelLastLoadAt = 0;
let fuelSelectedTankId = null;
let fuelSaving = false;

// ---------- مساعدات عامة ----------

function fuelEngineReady() {
    if (window.FuelCalc) return true;
    showMessage("تعذر تحميل ملف الحسابات fuel-calc.js", "error");
    return false;
}

function formatFuelLiters(value) {
    const number = Math.round(Number(value) || 0);
    return number.toLocaleString("en-US") + " لتر";
}

function formatFuelNumber(value) {
    return Math.round(Number(value) || 0).toLocaleString("en-US");
}

function formatFuelPercent(value) {
    if (value === null || value === undefined || !isFinite(value)) return "—";
    const rounded = Math.round(value * 10) / 10;
    return (Number.isInteger(rounded) ? rounded : rounded.toFixed(1)) + "%";
}

const FUEL_MONTHS = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function formatFuelTankDate(timestamp) {
    const date = window.FuelCalc ? FuelCalc.toDate(timestamp) : null;
    if (!date) return "لا يوجد تاريخ بعد";
    return date.getDate() + " " + FUEL_MONTHS[date.getMonth()] + " " + date.getFullYear();
}

function formatFuelDateTime(timestamp) {
    const date = window.FuelCalc ? FuelCalc.toDate(timestamp) : null;
    if (!date) return "—";
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return date.getDate() + " " + FUEL_MONTHS[date.getMonth()] + " " + date.getFullYear() +
        " — " + h12 + ":" + m + (h < 12 ? " ص" : " م");
}

function fuelUnitLabel(unit) {
    return unit === "m" ? "م" : "سم";
}

function fuelTankFullName(def) {
    return def.name + (def.note ? " — " + def.note : "");
}

function fuelFindDef(tankId) {
    return FUEL_TANKS_DEFINITIONS.find(function (d) { return d.id === tankId; });
}

function withFuelTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
        const timer = setTimeout(function () {
            const err = new Error("timeout");
            err.code = "timeout";
            reject(err);
        }, ms);
        promise.then(
            function (v) { clearTimeout(timer); resolve(v); },
            function (e) { clearTimeout(timer); reject(e); }
        );
    });
}

function fuelWho() {
    if (typeof currentUser !== "undefined" && currentUser) {
        return currentUser.displayName || currentUser.email || currentUser.uid || null;
    }
    return null;
}

// حالات جميع الخزانات (تُحسب من البيانات المحفوظة عند كل رسم)
function getFuelStates() {
    const now = new Date();
    return FUEL_TANKS_DEFINITIONS.map(function (def) {
        return FuelCalc.deriveTankState(def, fuelDocs[def.id], fuelSettings, now);
    });
}

// تصنيف اللون/الوصف حسب نسبة الامتلاء والإعدادات
function fuelFillClass(state) {
    if (state.status !== "ok") return "none";
    if (state.overflowL > 0) return "over";
    if (state.percent < fuelSettings.lowPercent) return "low";
    if (state.percent >= fuelSettings.highPercent) return "full";
    return state.percent < 50 ? "medium" : "good";
}

const FUEL_CLASS_LABELS = {
    none: "بلا قراءة", over: "تجاوز السعة", low: "منخفض",
    medium: "متوسط", good: "جيد", full: "شبه ممتلئ"
};
const FUEL_CLASS_COLORS = {
    none: "#cbd5e1", over: "#dc2626", low: "#ef4444",
    medium: "#f59e0b", good: "#10b981", full: "#0d9488"
};

// ============================================================
// فتح قسم خزانات الكاز
// ============================================================

async function openFuelTanks() {
    showPage("fuelTanksPage");
    if (!fuelEngineReady()) return;
    renderFuelDashboard();
    await getFuelTanks();
}

// ============================================================
// تحميل البيانات من Firestore
// (قراءتان فقط: الخزانات + السجل، ولا تتكرران خلال 30 ثانية)
// ============================================================

async function getFuelTanks(force) {
    if (!fuelEngineReady()) return;
    if (!force && fuelTanksLoaded && Date.now() - fuelLastLoadAt < FUEL_RELOAD_MIN_MS) return;

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const fs = await import(FUEL_FIRESTORE_URL);

        const snapshot = await fs.getDocs(fs.collection(db, FUEL_TANKS_COLLECTION));
        const docs = {};
        let settingsDoc = null;

        snapshot.forEach(function (docSnap) {
            if (docSnap.id === FUEL_SETTINGS_DOC_ID) {
                settingsDoc = docSnap.data();
            } else {
                docs[docSnap.id] = docSnap.data();
            }
        });

        fuelDocs = docs;
        fuelSettings = FuelCalc.mergeSettings(settingsDoc);
        fuelTanksLoaded = true;
        fuelLastLoadAt = Date.now();

        // السجل: فشله لا يمنع عرض الخزانات
        try {
            const q = fs.query(
                fs.collection(db, FUEL_READINGS_COLLECTION),
                fs.orderBy("createdAt", "desc"),
                fs.limit(FUEL_HISTORY_LIMIT)
            );
            const hs = await fs.getDocs(q);
            const rows = [];
            hs.forEach(function (d) { rows.push(Object.assign({ id: d.id }, d.data())); });
            fuelHistory = rows;
            fuelHistoryFailed = false;
        } catch (historyError) {
            console.error("تعذر تحميل سجل حركات الخزانات:", historyError);
            fuelHistoryFailed = true;
        }

        renderFuelDashboard();

    } catch (error) {
        console.error("خطأ تحميل خزانات الكاز:", error);
        showMessage("حدث خطأ أثناء تحميل بيانات خزانات الكاز", "error");
    }
}

// ============================================================
// رسم لوحة التحكم كاملة (تُستدعى بعد أي تحميل أو حفظ ناجح)
// ============================================================

function renderFuelDashboard() {
    if (!window.FuelCalc) return;
    const states = getFuelStates();
    const totals = FuelCalc.computeTotals(states);

    renderFuelSummary(totals);
    renderFuelAlerts(states);
    renderFuelTanksCards(states);
    renderFuelInventoryTable(states, totals);
    renderFuelReadingPanel(states);
    renderFuelHistory();
    fillFuelSettingsForm();
}

// ---------- بطاقات الملخص ----------

function renderFuelSummary(totals) {
    const grid = document.getElementById("fuelSummary");
    const banner = document.getElementById("fuelIncompleteBanner");
    if (!grid) return;

    const hasAny = totals.countedCount > 0;
    const provisional = hasAny && !totals.complete;

    const availableText = hasAny ? formatFuelNumber(totals.availableL) : "—";
    const emptyText = hasAny ? formatFuelNumber(totals.emptyL) : "—";
    const percentText = hasAny ? formatFuelPercent(totals.percent) : "—";
    const mark = provisional ? '<span class="fuel-prov" title="مجموع مؤقت">*</span>' : "";
    const pct = hasAny ? Math.max(0, Math.min(100, totals.percent)) : 0;

    const missing = totals.missingIds.length;
    const stale = totals.staleIds.length;
    const needs = missing + stale;

    grid.innerHTML =
        '<div class="fuel-sum-card is-available">' +
            '<span class="fuel-sum-label">⛽ الكاز المتوفر حالياً</span>' +
            '<span class="fuel-sum-value">' + availableText + mark + '<small>لتر</small></span>' +
        '</div>' +
        '<div class="fuel-sum-card is-empty">' +
            '<span class="fuel-sum-label">📉 السعة الخالية</span>' +
            '<span class="fuel-sum-value">' + emptyText + mark + '<small>لتر</small></span>' +
        '</div>' +
        '<div class="fuel-sum-card is-capacity">' +
            '<span class="fuel-sum-label">🛢️ السعة الكلية (اسمية)</span>' +
            '<span class="fuel-sum-value">' + formatFuelNumber(totals.nominalL) + '<small>لتر</small></span>' +
        '</div>' +
        '<div class="fuel-sum-card is-percent">' +
            '<span class="fuel-sum-label">📊 نسبة الامتلاء</span>' +
            '<span class="fuel-sum-value">' + percentText + mark + '</span>' +
            '<span class="fuel-sum-bar"><span style="width:' + pct + '%"></span></span>' +
        '</div>' +
        '<div class="fuel-sum-card is-count">' +
            '<span class="fuel-sum-label">🔢 عدد الخزانات</span>' +
            '<span class="fuel-sum-value">' + totals.tankCount + '</span>' +
        '</div>' +
        '<div class="fuel-sum-card is-status ' + (needs ? "has-issue" : "all-ok") + '">' +
            '<span class="fuel-sum-label">🕒 حالة القراءات</span>' +
            '<span class="fuel-sum-value fuel-sum-value-sm">' +
                totals.countedCount + ' من ' + totals.tankCount + ' لها قراءة' +
            '</span>' +
            '<span class="fuel-sum-sub">' +
                (needs ? needs + ' تحتاج تحديثاً' + (missing ? ' (' + missing + ' بلا قراءة' + (stale ? "، " + stale + ' قديمة' : '') + ')' : ' (قديمة)') : 'كلها محدّثة') +
            '</span>' +
        '</div>';

    if (banner) {
        if (!hasAny) {
            banner.hidden = false;
            banner.className = "fuel-banner is-warn";
            banner.textContent = "لا توجد أي قراءة صالحة بعد. أدخل قراءة لكل خزان ليظهر الإجمالي؛ الخزانات بلا قراءة لا تُحتسب فارغة.";
        } else if (provisional) {
            banner.hidden = false;
            banner.className = "fuel-banner is-warn";
            banner.textContent = "* الإجمالي مؤقت وغير مكتمل: محسوب من " + totals.countedCount + " خزانات من أصل " +
                totals.tankCount + ". نسبة الامتلاء محسوبة من سعة الخزانات التي لها قراءة (" +
                formatFuelLiters(totals.countedNominalL) + ").";
        } else {
            banner.hidden = true;
        }
    }
}

// ---------- التنبيهات ----------

function renderFuelAlerts(states) {
    const box = document.getElementById("fuelAlerts");
    if (!box) return;

    const alerts = FuelCalc.buildAlerts(states, fuelSettings, new Date());
    if (!alerts.length) {
        box.hidden = true;
        box.innerHTML = "";
        return;
    }

    const order = { error: 0, warn: 1, info: 2 };
    alerts.sort(function (a, b) { return order[a.level] - order[b.level]; });
    const icons = { error: "⛔", warn: "⚠️", info: "ℹ️" };

    box.hidden = false;
    box.innerHTML =
        '<h3 class="fuel-section-title">التنبيهات (' + alerts.length + ')</h3>' +
        '<ul class="fuel-alert-list">' +
        alerts.map(function (a) {
            return '<li class="fuel-alert is-' + a.level + '"><span>' + icons[a.level] + '</span><span>' +
                escapeHTML(a.text) + '</span></li>';
        }).join("") +
        '</ul>';
}

// ---------- الرسم المرئي للخزان (SVG بلا مكتبات) ----------

function fuelTankSVG(state) {
    const cls = fuelFillClass(state);
    const color = FUEL_CLASS_COLORS[cls];
    const geo = state.geo;
    const uid = "fuelsvg-" + state.id;

    if (!geo) {
        return '<svg class="fuel-svg" viewBox="0 0 120 120" role="img" aria-label="أبعاد الخزان غير مسجلة">' +
            '<rect x="14" y="26" width="92" height="68" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="3" stroke-dasharray="7 5"/>' +
            '<text x="60" y="72" text-anchor="middle" font-size="34" fill="#94a3b8">؟</text></svg>';
    }

    const frac = state.status === "ok"
        ? Math.max(0, Math.min(1, state.levelM / FuelCalc.maxLevelM(geo)))
        : 0;
    const aria = state.status === "ok"
        ? "مستوى الكاز " + formatFuelPercent(state.percent)
        : "لا توجد قراءة";

    if (geo.shape === "hcyl") {
        // مقطع دائري: السائل يُقصّ بدائرة الخزان فيتوافق مع الهندسة الحقيقية
        const top = 8, bottom = 112;
        const y = bottom - frac * (bottom - top);
        return '<svg class="fuel-svg" viewBox="0 0 120 120" role="img" aria-label="' + aria + '">' +
            '<defs><clipPath id="' + uid + '"><circle cx="60" cy="60" r="52"/></clipPath></defs>' +
            '<circle cx="60" cy="60" r="52" fill="#f1f5f9"/>' +
            (frac > 0
                ? '<g clip-path="url(#' + uid + ')"><rect x="0" y="' + y.toFixed(2) + '" width="120" height="120" fill="' + color + '" opacity="0.88"/>' +
                  '<line x1="0" x2="120" y1="' + y.toFixed(2) + '" y2="' + y.toFixed(2) + '" stroke="#ffffff" stroke-width="2" opacity="0.7"/></g>'
                : '') +
            '<circle cx="60" cy="60" r="52" fill="none" stroke="#475569" stroke-width="3.5"/>' +
            '</svg>';
    }

    // مستطيل: منظر جانبي بنسبة الطول إلى الارتفاع
    const maxW = 108, maxH = 76;
    let w = maxW, h = (maxW * geo.heightM) / geo.lengthM;
    if (h > maxH) { h = maxH; w = (maxH * geo.lengthM) / geo.heightM; }
    const x = (120 - w) / 2, yTop = (120 - h) / 2;
    const liquidH = frac * h;
    return '<svg class="fuel-svg" viewBox="0 0 120 120" role="img" aria-label="' + aria + '">' +
        '<defs><clipPath id="' + uid + '"><rect x="' + x.toFixed(2) + '" y="' + yTop.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" rx="4"/></clipPath></defs>' +
        '<rect x="' + x.toFixed(2) + '" y="' + yTop.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" rx="4" fill="#f1f5f9"/>' +
        (frac > 0
            ? '<g clip-path="url(#' + uid + ')"><rect x="' + x.toFixed(2) + '" y="' + (yTop + h - liquidH).toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + liquidH.toFixed(2) + '" fill="' + color + '" opacity="0.88"/>' +
              '<line x1="' + x.toFixed(2) + '" x2="' + (x + w).toFixed(2) + '" y1="' + (yTop + h - liquidH).toFixed(2) + '" y2="' + (yTop + h - liquidH).toFixed(2) + '" stroke="#ffffff" stroke-width="2" opacity="0.7"/></g>'
            : '') +
        '<rect x="' + x.toFixed(2) + '" y="' + yTop.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" rx="4" fill="none" stroke="#475569" stroke-width="3.5"/>' +
        '</svg>';
}

// وصف الشكل والأبعاد (إن توفرت)
function fuelGeometryText(state) {
    const g = state.geo;
    if (!g) return "الأبعاد غير مسجلة";
    if (g.shape === "hcyl") {
        return "أسطواني أفقي — الطول " + g.lengthM + " م، القطر " + g.diameterM + " م";
    }
    return "مستطيل — " + g.lengthM + " × " + g.widthM + " × " + g.heightM + " م";
}

function fuelMethodText(state) {
    if (state.def && state.def.alwaysFull) return "غير مطلوبة (ممتلئ دائماً)";
    return state.method && FuelCalc.METHODS[state.method]
        ? FuelCalc.METHODS[state.method].label
        : "غير محددة";
}

// ---------- بطاقات الخزانات ----------

function renderFuelTanksCards(statesArg) {
    const grid = document.getElementById("fuelTanksGrid");
    if (!grid || !window.FuelCalc) return;

    const states = statesArg || getFuelStates();
    grid.innerHTML = "";

    states.forEach(function (st) {
        const def = st.def;
        const cls = fuelFillClass(st);
        const ok = st.status === "ok";

        let statusLabel = FUEL_CLASS_LABELS[cls];
        let statusClass = cls;
        if (st.status === "no_geometry") { statusLabel = "بيانات ناقصة"; statusClass = "none"; }
        else if (st.status === "no_reading") { statusLabel = "بلا قراءة"; statusClass = "none"; }
        else if (st.stale) { statusLabel += " · قراءة قديمة"; }
        if (def.alwaysFull) { statusLabel = "ممتلئ دائماً"; }

        const card = document.createElement("div");
        card.className = "fuel-tank-card is-" + cls;
        card.id = "fuelTankCard-" + def.id;

        card.innerHTML =
            '<div class="fuel-tank-card-header">' +
                '<span class="fuel-tank-no">' + def.no + '</span>' +
                '<div class="fuel-tank-header-text">' +
                    '<div class="fuel-tank-name">' + escapeHTML(fuelTankFullName(def)) + '</div>' +
                    '<div class="fuel-tank-capline">السعة الكلية: <b>' + formatFuelLiters(st.nominalL) + '</b></div>' +
                '</div>' +
                '<span class="fuel-badge is-' + statusClass + '">' + escapeHTML(statusLabel) + '</span>' +
            '</div>' +

            '<div class="fuel-tank-body">' +
                '<div class="fuel-tank-visual">' + fuelTankSVG(st) +
                    '<div class="fuel-tank-percent">' + (ok ? formatFuelPercent(st.percent) : "—") + '</div>' +
                '</div>' +
                '<div class="fuel-tank-figures">' +
                    '<div class="fuel-figure"><span class="fuel-figure-label">الكاز المتوفر</span>' +
                        '<span class="fuel-figure-value">' + (ok ? formatFuelNumber(st.volumeL) + '<small> لتر</small>' : "—") + '</span></div>' +
                    '<div class="fuel-figure"><span class="fuel-figure-label">الكمية الفارغة</span>' +
                        '<span class="fuel-figure-value is-empty">' + (ok ? formatFuelNumber(st.emptyL) + '<small> لتر</small>' : "—") + '</span></div>' +
                '</div>' +
            '</div>' +



            (st.overflowL > 0
                ? '<div class="fuel-card-warn">⛔ الكمية المحسوبة تتجاوز السعة الاسمية بمقدار ' + formatFuelNumber(st.overflowL) + ' لتر — تحقق من القياس أو المعايرة</div>'
                : '') +

            (def.alwaysFull
                ? ''
                : '<button type="button" class="fuel-btn" onclick="selectFuelTankForReading(\'' + def.id + '\')">' +
                    (st.status === "no_geometry" ? "⚙️ إعداد الأبعاد وإدخال قراءة" : "📝 تحديث القراءة") +
                  '</button>');

        grid.appendChild(card);
    });
}

// ---------- جدول المخزون الإجمالي ----------

function renderFuelInventoryTable(states, totals) {
    const box = document.getElementById("fuelInventory");
    if (!box) return;

    const rows = states.map(function (st) {
        const ok = st.status === "ok";
        const reason = st.status === "no_geometry" ? "بيانات ناقصة" : "لا توجد قراءة";
        return '<tr>' +
            '<td data-label="الخزان">' + escapeHTML(st.def.name) + '</td>' +
            '<td data-label="السعة الاسمية">' + formatFuelLiters(st.nominalL) + '</td>' +
            '<td data-label="الكاز المتوفر">' + (ok ? formatFuelLiters(st.volumeL) : '<span class="fuel-muted">' + reason + '</span>') + '</td>' +
            '<td data-label="الكمية الفارغة">' + (ok ? formatFuelLiters(st.emptyL) : '<span class="fuel-muted">—</span>') + '</td>' +
            '<td data-label="نسبة الامتلاء">' + (ok ? formatFuelPercent(st.percent) : '<span class="fuel-muted">—</span>') + '</td>' +
        '</tr>';
    }).join("");

    const hasAny = totals.countedCount > 0;
    const prov = hasAny && !totals.complete ? " <span class=\"fuel-muted\">(مؤقت: " + totals.countedCount + " من " + totals.tankCount + ")</span>" : "";

    box.innerHTML =
        '<div class="fuel-table-wrap"><table class="fuel-table">' +
        '<thead><tr><th>الخزان</th><th>السعة الاسمية</th><th>الكاز المتوفر</th><th>الكمية الفارغة</th><th>نسبة الامتلاء</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '<tfoot><tr>' +
            '<td data-label="الخزان">الإجمالي' + prov + '</td>' +
            '<td data-label="السعة الاسمية">' + formatFuelLiters(totals.nominalL) + '</td>' +
            '<td data-label="الكاز المتوفر">' + (hasAny ? formatFuelLiters(totals.availableL) : "—") + '</td>' +
            '<td data-label="الكمية الفارغة">' + (hasAny ? formatFuelLiters(totals.emptyL) : "—") + '</td>' +
            '<td data-label="نسبة الامتلاء">' + (hasAny ? formatFuelPercent(totals.percent) : "—") + '</td>' +
        '</tr></tfoot></table></div>';
}

// ============================================================
// شاشة إدخال القراءة
// ============================================================

function renderFuelReadingPanel(statesArg) {
    const select = document.getElementById("fuelReadingTank");
    if (!select || !window.FuelCalc) return;

    const states = statesArg || getFuelStates();
    if (!fuelSelectedTankId || !fuelFindDef(fuelSelectedTankId)) {
        fuelSelectedTankId = FUEL_TANKS_DEFINITIONS[0] ? FUEL_TANKS_DEFINITIONS[0].id : null;
    }

    select.innerHTML = states.map(function (st) {
        return '<option value="' + st.id + '"' + (st.id === fuelSelectedTankId ? " selected" : "") + '>' +
            escapeHTML(fuelTankFullName(st.def)) + ' — ' + formatFuelNumber(st.nominalL) + ' لتر</option>';
    }).join("");

    renderFuelReadingForm();
}

function selectFuelTankForReading(tankId) {
    fuelSelectedTankId = tankId;
    const select = document.getElementById("fuelReadingTank");
    if (select) select.value = tankId;
    const input = document.getElementById("fuelReadingValue");
    if (input) input.value = "";
    renderFuelReadingForm();
    const panel = document.getElementById("fuelReadingPanel");
    if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onFuelReadingTankChange() {
    const select = document.getElementById("fuelReadingTank");
    if (!select) return;
    fuelSelectedTankId = select.value;
    const input = document.getElementById("fuelReadingValue");
    if (input) input.value = "";
    renderFuelReadingForm();
}

function getSelectedFuelState() {
    const def = fuelFindDef(fuelSelectedTankId);
    if (!def) return null;
    return FuelCalc.deriveTankState(def, fuelDocs[def.id], fuelSettings, new Date());
}

// يعيد بناء النموذج حسب الخزان المحدد (الشكل والأبعاد وطريقة القياس)
function renderFuelReadingForm() {
    const st = getSelectedFuelState();
    const info = document.getElementById("fuelReadingInfo");
    const cfgBox = document.getElementById("fuelConfigBox");
    const entry = document.getElementById("fuelReadingEntry");
    if (!st || !info || !cfgBox || !entry) return;

    const def = st.def;
    const needsConfig = !def.shape;

    info.innerHTML =
        '<div><b>' + escapeHTML(fuelTankFullName(def)) + '</b></div>' +
        '<div>السعة الاسمية: ' + formatFuelLiters(def.nominalL) + '</div>' +
        '<div>الشكل والأبعاد: ' + escapeHTML(fuelGeometryText(st)) + '</div>' +
        '<div>طريقة القياس: ' + escapeHTML(fuelMethodText(st)) + '</div>';

    // إعداد الأبعاد: فقط للخزانات التي لا أبعاد لها في الكود
    if (needsConfig) {
        const cfg = (fuelDocs[def.id] && fuelDocs[def.id].config) || {};
        cfgBox.hidden = false;
        cfgBox.innerHTML =
            '<h4>أبعاد الخزان (غير مسجلة — أدخلها من قياس فعلي)</h4>' +
            '<div class="fuel-form-grid">' +
                '<label>الشكل<select id="fuelCfgShape" onchange="onFuelConfigShapeChange()">' +
                    '<option value="rect"' + (cfg.shape !== "hcyl" ? " selected" : "") + '>مستطيل</option>' +
                    '<option value="hcyl"' + (cfg.shape === "hcyl" ? " selected" : "") + '>أسطواني أفقي</option>' +
                '</select></label>' +
                '<label>طريقة القياس<select id="fuelCfgMethod">' +
                    '<option value="level_height"' + (cfg.method !== "top_distance" ? " selected" : "") + '>ارتفاع الكاز من القاع</option>' +
                    '<option value="top_distance"' + (cfg.method === "top_distance" ? " selected" : "") + '>المسافة من أعلى الخزان إلى سطح الكاز</option>' +
                '</select></label>' +
                '<label>الطول (م)<input type="number" step="any" min="0" id="fuelCfgLength" value="' + (cfg.lengthM || "") + '"></label>' +
                '<label id="fuelCfgWidthWrap">العرض (م)<input type="number" step="any" min="0" id="fuelCfgWidth" value="' + (cfg.widthM || "") + '"></label>' +
                '<label id="fuelCfgHeightWrap">الارتفاع الداخلي (م)<input type="number" step="any" min="0" id="fuelCfgHeight" value="' + (cfg.heightM || "") + '"></label>' +
                '<label id="fuelCfgDiameterWrap">القطر (م)<input type="number" step="any" min="0" id="fuelCfgDiameter" value="' + (cfg.diameterM || "") + '"></label>' +
            '</div>' +
            '<button type="button" class="fuel-btn is-secondary" onclick="saveFuelTankConfig()">💾 حفظ الأبعاد</button>';
        onFuelConfigShapeChange();
    } else {
        cfgBox.hidden = true;
        cfgBox.innerHTML = "";
    }

    // خزان ممتلئ دائماً: لا إدخال قراءات
    if (def.alwaysFull) {
        cfgBox.hidden = true;
        cfgBox.innerHTML = "";
        entry.hidden = false;
        entry.innerHTML = '<p class="fuel-hint">هذا الخزان يُعتبر ممتلئاً دائماً (' + formatFuelLiters(def.nominalL) +
            ')، فلا يحتاج إلى قراءات. اختر خزاناً آخر لإدخال قراءة.</p>';
        return;
    }

    // حقل القراءة حسب طريقة القياس
    if (!st.geo) {
        entry.hidden = true;
        entry.innerHTML = '<p class="fuel-muted">احفظ أبعاد الخزان أولاً حتى يمكن حساب الكمية. لا تُعرض كمية تقديرية.</p>';
        entry.hidden = false;
        return;
    }

    const isTop = st.method === "top_distance";
    const prevUnit = (document.getElementById("fuelReadingUnit") || {}).value || "cm";

    entry.hidden = false;
    entry.innerHTML =
        '<label class="fuel-reading-label" for="fuelReadingValue">' +
            (isTop ? "المسافة من أعلى الخزان إلى سطح الكاز" : "ارتفاع الكاز من القاع") +
        '</label>' +
        '<div class="fuel-reading-row">' +
            '<input type="text" inputmode="decimal" autocomplete="off" id="fuelReadingValue" class="fuel-input" ' +
                'placeholder="' + (isTop ? "مثال: 85" : "مثال: 75") + '" oninput="updateFuelReadingPreview()">' +
            '<select id="fuelReadingUnit" class="fuel-unit" onchange="updateFuelReadingPreview()">' +
                '<option value="cm"' + (prevUnit === "cm" ? " selected" : "") + '>سم</option>' +
                '<option value="m"' + (prevUnit === "m" ? " selected" : "") + '>م</option>' +
            '</select>' +
        '</div>' +
        '<p class="fuel-hint">' +
            (isTop
                ? '⚠ هذه المسافة تُقاس من <b>أعلى</b> الخزان نزولاً إلى سطح الكاز، وليست ارتفاع الكاز من القاع. الحد المسموح: 0 – ' +
                  (Math.round(FuelCalc.maxLevelM(st.geo) * 1000) / 10) + ' سم.'
                : '⚠ هذا ارتفاع الكاز من <b>القاع</b> مباشرة (لا يُطرح من ارتفاع الخزان). الحد المسموح: 0 – ' +
                  (Math.round(FuelCalc.maxLevelM(st.geo) * 1000) / 10) + ' سم.') +
        '</p>' +
        '<div id="fuelReadingPreview" class="fuel-preview"></div>' +
        '<button type="button" id="fuelReadingSave" class="fuel-btn" onclick="saveFuelReading()">💾 حفظ القراءة</button>';

    updateFuelReadingPreview();
}

function onFuelConfigShapeChange() {
    const shapeEl = document.getElementById("fuelCfgShape");
    if (!shapeEl) return;
    const isCyl = shapeEl.value === "hcyl";
    const set = function (id, show) { const el = document.getElementById(id); if (el) el.style.display = show ? "" : "none"; };
    set("fuelCfgWidthWrap", !isCyl);
    set("fuelCfgHeightWrap", !isCyl);
    set("fuelCfgDiameterWrap", isCyl);
}

// معاينة فورية قبل الحفظ: الكمية، الفارغ، النسبة
function updateFuelReadingPreview() {
    const st = getSelectedFuelState();
    const box = document.getElementById("fuelReadingPreview");
    const input = document.getElementById("fuelReadingValue");
    const unitEl = document.getElementById("fuelReadingUnit");
    const saveBtn = document.getElementById("fuelReadingSave");
    if (!st || !box || !input || !unitEl) return null;

    if (input.value.trim() === "") {
        box.className = "fuel-preview";
        box.innerHTML = '<span class="fuel-muted">أدخل القراءة لعرض الكمية المحسوبة قبل الحفظ.</span>';
        if (saveBtn) saveBtn.disabled = true;
        return null;
    }

    const calc = FuelCalc.computeReading(st.geo, st.method, input.value, unitEl.value);
    if (!calc.ok) {
        box.className = "fuel-preview is-error";
        box.textContent = "⛔ " + calc.error;
        if (saveBtn) saveBtn.disabled = true;
        return null;
    }

    const nominal = st.nominalL;
    const empty = Math.max(0, nominal - calc.volumeL);
    const percent = (calc.volumeL / nominal) * 100;
    const over = calc.volumeL > nominal + 0.5;

    box.className = "fuel-preview" + (over ? " is-warn" : " is-ok");
    box.innerHTML =
        '<div class="fuel-preview-grid">' +
            '<div><span>ارتفاع الكاز من القاع</span><b>' + (Math.round(calc.levelM * 1000) / 10) + ' سم</b></div>' +
            '<div><span>الكاز المتوفر</span><b>' + formatFuelLiters(calc.volumeL) + '</b></div>' +
            '<div><span>الكمية الفارغة</span><b>' + formatFuelLiters(empty) + '</b></div>' +
            '<div><span>نسبة الامتلاء</span><b>' + formatFuelPercent(percent) + '</b></div>' +
        '</div>' +
        (over ? '<p class="fuel-card-warn">⛔ الكمية المحسوبة تتجاوز السعة الاسمية بمقدار ' + formatFuelNumber(calc.volumeL - nominal) + ' لتر — تحقق من القياس أو المعايرة قبل الحفظ.</p>' : '');

    if (saveBtn) saveBtn.disabled = false;
    return calc;
}

// ============================================================
// حفظ الأبعاد (للخزانات بلا أبعاد فقط) — يتطلب تسجيل الدخول
// ============================================================

async function saveFuelTankConfig() {
    if (!requireLoginForWrite(function () { saveFuelTankConfig(); })) return;
    if (!fuelEngineReady()) return;

    const def = fuelFindDef(fuelSelectedTankId);
    if (!def || def.shape) return;

    const num = function (id) {
        const el = document.getElementById(id);
        const p = el ? FuelCalc.parseInput(el.value) : { ok: false };
        return p.ok ? p.value : NaN;
    };

    const shape = document.getElementById("fuelCfgShape").value;
    const method = document.getElementById("fuelCfgMethod").value;
    const config = shape === "hcyl"
        ? { shape: "hcyl", lengthM: num("fuelCfgLength"), diameterM: num("fuelCfgDiameter"), method: method }
        : { shape: "rect", lengthM: num("fuelCfgLength"), widthM: num("fuelCfgWidth"), heightM: num("fuelCfgHeight"), method: method };

    if (!FuelCalc.validGeometry(config)) {
        showMessage("أدخل أبعاداً صحيحة أكبر من صفر لكل الحقول الظاهرة", "error");
        return;
    }

    const geomCap = FuelCalc.geometricCapacityL(config);
    const diffPct = Math.abs(geomCap - def.nominalL) / def.nominalL * 100;
    if (diffPct > 25 && !window.confirm(
        "السعة الهندسية من هذه الأبعاد (" + formatFuelNumber(geomCap) + " لتر) تختلف كثيراً عن السعة الاسمية (" +
        formatFuelNumber(def.nominalL) + " لتر). هل الأبعاد صحيحة؟")) {
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const fs = await import(FUEL_FIRESTORE_URL);
        await withFuelTimeout(fs.setDoc(fs.doc(db, FUEL_TANKS_COLLECTION, def.id), {
            name: fuelTankFullName(def),
            capacity: def.nominalL,
            config: config
        }, { merge: true }), FUEL_SAVE_TIMEOUT_MS);

        fuelDocs[def.id] = Object.assign({}, fuelDocs[def.id], { config: config });
        showMessage("تم حفظ أبعاد " + def.name);
        renderFuelDashboard();
    } catch (error) {
        handleFuelSaveError(error, "حفظ الأبعاد");
    }
}

// ============================================================
// حفظ قراءة جديدة (آخر قراءة + سجل تاريخي) — يتطلب تسجيل الدخول
// ============================================================

function handleFuelSaveError(error, what) {
    console.error("خطأ " + what + " (خزانات الكاز):", error);
    if (error && error.code === "timeout") {
        showMessage("تعذر إتمام " + what + ": الاتصال بطيء أو منقطع. تحقق من الإنترنت وأعد المحاولة (قد تُحفظ لاحقاً تلقائياً عند عودة الاتصال).", "error");
    } else {
        showMessage("حدث خطأ أثناء " + what + ": " + ((error && (error.code || error.message)) || "خطأ غير معروف"), "error");
    }
}

async function saveFuelReading() {
    if (fuelSaving) return;
    if (!requireLoginForWrite(function () { saveFuelReading(); })) return;
    if (!fuelEngineReady()) return;

    const st = getSelectedFuelState();
    const input = document.getElementById("fuelReadingValue");
    const unitEl = document.getElementById("fuelReadingUnit");
    if (!st || !input || !unitEl) return;

    const calc = FuelCalc.computeReading(st.geo, st.method, input.value, unitEl.value);
    if (!calc.ok) {
        showMessage(calc.error, "error");
        return;
    }

    if (calc.volumeL > st.nominalL + 0.5 &&
        !window.confirm("الكمية المحسوبة (" + formatFuelNumber(calc.volumeL) + " لتر) تتجاوز السعة الاسمية (" +
            formatFuelNumber(st.nominalL) + " لتر). هل أنت متأكد من القياس؟")) {
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    const def = st.def;
    if (def.alwaysFull) {
        showMessage("هذا الخزان يُعتبر ممتلئاً دائماً ولا يحتاج إلى قراءات", "error");
        return;
    }
    const parsed = FuelCalc.parseInput(input.value);
    const who = fuelWho();
    const reading = {
        value: parsed.value,
        unit: unitEl.value,
        method: st.method,
        levelM: calc.levelM,
        volumeL: calc.volumeL,
        geomCapacityL: calc.geomCapacityL
    };
    const prevVolume = st.status === "ok" ? st.volumeL : null;

    fuelSaving = true;
    const saveBtn = document.getElementById("fuelReadingSave");
    if (saveBtn) saveBtn.disabled = true;

    try {
        const fs = await import(FUEL_FIRESTORE_URL);

        // 1) آخر قراءة (merge: يحافظ على الحقول القديمة وعلى config)
        await withFuelTimeout(fs.setDoc(fs.doc(db, FUEL_TANKS_COLLECTION, def.id), {
            name: fuelTankFullName(def),
            capacity: def.nominalL,
            quantity: calc.volumeL,
            reading: reading,
            updatedAt: fs.serverTimestamp(),
            updatedBy: who
        }, { merge: true }), FUEL_SAVE_TIMEOUT_MS);

        // حدّث الحالة المحلية فوراً (دون إعادة قراءة كل شيء)
        const now = new Date();
        fuelDocs[def.id] = Object.assign({}, fuelDocs[def.id], {
            name: fuelTankFullName(def), capacity: def.nominalL, quantity: calc.volumeL,
            reading: reading, updatedAt: now, updatedBy: who
        });

        // 2) سجل القراءات (إضافة فقط، لا حذف ولا استبدال)
        const histEntry = {
            tankId: def.id, tankNo: def.no, tankName: def.name,
            value: reading.value, unit: reading.unit, method: reading.method,
            levelM: reading.levelM, volumeL: reading.volumeL,
            prevVolumeL: prevVolume,
            deltaL: prevVolume === null ? null : Math.round((calc.volumeL - prevVolume) * 10) / 10,
            createdBy: who
        };
        let historyOk = true;
        try {
            const ref = await withFuelTimeout(fs.addDoc(fs.collection(db, FUEL_READINGS_COLLECTION),
                Object.assign({}, histEntry, { createdAt: fs.serverTimestamp() })), FUEL_SAVE_TIMEOUT_MS);
            fuelHistory.unshift(Object.assign({ id: ref.id, createdAt: now }, histEntry));
        } catch (historyError) {
            historyOk = false;
            console.error("تعذر تسجيل القراءة في السجل:", historyError);
        }

        input.value = "";
        showMessage(historyOk
            ? "تم حفظ قراءة " + def.name + " بنجاح"
            : "تم حفظ القراءة لكن تعذر تسجيلها في سجل الحركات (تحقق من نشر قواعد Firestore)",
            historyOk ? "success" : "error");

        fuelLastLoadAt = Date.now();
        renderFuelDashboard();

    } catch (error) {
        handleFuelSaveError(error, "حفظ القراءة");
        const b = document.getElementById("fuelReadingSave");
        if (b) b.disabled = false;
    } finally {
        fuelSaving = false;
    }
}

// ============================================================
// سجل الحركات (القراءات السابقة)
// ============================================================

function renderFuelHistory() {
    const box = document.getElementById("fuelHistory");
    const filterEl = document.getElementById("fuelHistoryFilter");
    if (!box) return;

    if (filterEl && !filterEl.options.length) {
        filterEl.innerHTML = '<option value="">كل الخزانات</option>' +
            FUEL_TANKS_DEFINITIONS.map(function (d) {
                return '<option value="' + d.id + '">' + escapeHTML(d.name) + '</option>';
            }).join("");
    }
    const filter = filterEl ? filterEl.value : "";

    if (fuelHistoryFailed) {
        box.innerHTML = '<p class="fuel-muted">تعذر تحميل سجل الحركات. إن كان هذا أول استخدام، تأكد من نشر قواعد Firestore المحدّثة (firestore.rules).</p>';
        return;
    }

    const rows = fuelHistory.filter(function (h) { return !filter || h.tankId === filter; }).slice(0, FUEL_HISTORY_SHOWN);
    if (!rows.length) {
        box.innerHTML = '<p class="fuel-muted">لا توجد حركات مسجلة بعد. كل قراءة تُدخلها ستظهر هنا بتاريخها ووقتها.</p>';
        return;
    }

    const body = rows.map(function (h) {
        const methodLabel = FuelCalc.METHODS[h.method] ? FuelCalc.METHODS[h.method].short : "";
        const name = (fuelFindDef(h.tankId) || {}).name || h.tankName || h.tankId;

        // الحركة: الفرق بين هذه القراءة والتي قبلها
        let movement;
        if (typeof h.deltaL !== "number") {
            movement = '<span class="fuel-move is-first">أول قراءة</span>';
        } else if (h.deltaL > 0) {
            movement = '<span class="fuel-move is-up">▲ زيادة +' + formatFuelNumber(h.deltaL) + ' لتر</span>';
        } else if (h.deltaL < 0) {
            movement = '<span class="fuel-move is-down">▼ نقص −' + formatFuelNumber(Math.abs(h.deltaL)) + ' لتر</span>';
        } else {
            movement = '<span class="fuel-move">بلا تغيير</span>';
        }

        const readingText = escapeHTML(h.value) + ' ' + fuelUnitLabel(h.unit) +
            (methodLabel ? ' <span class="fuel-muted">(' + escapeHTML(methodLabel) + ')</span>' : '');

        return '<tr>' +
            '<td data-label="التاريخ والوقت">' + escapeHTML(formatFuelDateTime(h.createdAt)) + '</td>' +
            '<td data-label="الخزان">' + escapeHTML(name) + '</td>' +
            '<td data-label="القراءة المُدخلة">' + readingText + '</td>' +
            '<td data-label="الكمية السابقة">' + (typeof h.prevVolumeL === "number" ? formatFuelLiters(h.prevVolumeL) : '<span class="fuel-muted">—</span>') + '</td>' +
            '<td data-label="الحركة">' + movement + '</td>' +
            '<td data-label="الكمية بعد القراءة"><b>' + (typeof h.volumeL === "number" ? formatFuelLiters(h.volumeL) : "—") + '</b></td>' +
            '<td data-label="أدخلها">' + escapeHTML(h.createdBy || "—") + '</td>' +
        '</tr>';
    }).join("");

    box.innerHTML =
        '<div class="fuel-table-wrap"><table class="fuel-table">' +
        '<thead><tr><th>التاريخ والوقت</th><th>الخزان</th><th>القراءة المُدخلة</th><th>الكمية السابقة</th><th>الحركة</th><th>الكمية بعد القراءة</th><th>أدخلها</th></tr></thead>' +
        '<tbody>' + body + '</tbody></table></div>' +
        (fuelHistory.length >= FUEL_HISTORY_LIMIT || rows.length >= FUEL_HISTORY_SHOWN
            ? '<p class="fuel-muted">يعرض آخر ' + FUEL_HISTORY_SHOWN + ' حركة (السجل الكامل محفوظ في قاعدة البيانات).</p>' : '');
}

// ============================================================
// إعدادات التنبيهات (حدود قابلة للتعديل)
// ============================================================

function fillFuelSettingsForm() {
    const map = {
        fuelSetLow: "lowPercent", fuelSetHigh: "highPercent",
        fuelSetStale: "staleDays", fuelSetGeom: "geometryDiffPercent"
    };
    Object.keys(map).forEach(function (id) {
        const el = document.getElementById(id);
        if (el && document.activeElement !== el) el.value = fuelSettings[map[id]];
    });
}

async function saveFuelSettings() {
    if (!requireLoginForWrite(function () { saveFuelSettings(); })) return;
    if (!fuelEngineReady()) return;

    const read = function (id) {
        const el = document.getElementById(id);
        const p = el ? FuelCalc.parseInput(el.value) : { ok: false };
        return p.ok ? p.value : NaN;
    };
    const next = {
        lowPercent: read("fuelSetLow"), highPercent: read("fuelSetHigh"),
        staleDays: read("fuelSetStale"), geometryDiffPercent: read("fuelSetGeom")
    };

    if (Object.keys(next).some(function (k) { return !isFinite(next[k]); })) {
        showMessage("أدخل قيماً رقمية صحيحة في كل حقول الإعدادات", "error");
        return;
    }
    if (next.lowPercent > 100 || next.highPercent > 100 || next.lowPercent >= next.highPercent) {
        showMessage("حد الانخفاض يجب أن يكون أقل من حد قرب الامتلاء، وكلاهما بين 0 و100", "error");
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const fs = await import(FUEL_FIRESTORE_URL);
        await withFuelTimeout(fs.setDoc(fs.doc(db, FUEL_TANKS_COLLECTION, FUEL_SETTINGS_DOC_ID), next, { merge: true }), FUEL_SAVE_TIMEOUT_MS);
        fuelSettings = FuelCalc.mergeSettings(next);
        showMessage("تم حفظ إعدادات التنبيهات");
        renderFuelDashboard();
    } catch (error) {
        handleFuelSaveError(error, "حفظ الإعدادات");
    }
}

// ============================================================
// AUTH (Firebase Authentication — Email/Password)
// Reuses window.firebaseAuth initialized in the inline <script> module.
// ------------------------------------------------------------
// State
// ============================================================

let currentUser = null;
let authUserUid = null;

// ============================================================
// Auth gate: open a protected page only when signed in
// ============================================================

function getAuth() {
  return window.firebaseAuth || null;
}

function isAuthed() {
  return !!currentUser;
}

// ============================================================
// Navigation guard — kept for backward compatibility.
// التصفح أصبح مفتوحًا للجميع؛ هذه الدالة لم تعد تُستخدم لمنع فتح
// الصفحات، لكن أُبقيت لأنها قد تُستدعى من كود آخر.
// ============================================================

function ensureAuthed(pageId) {
  if (isAuthed()) {
    showPage(pageId);
    return true;
  }
  showPage("authPage");
  return false;
}

// Wrap a page opener so it is gated by auth.
function openAuthPage(pageId) {
  if (ensureAuthed(pageId)) {
    // page openers that load data will run normally
    return true;
  }
  return false;
}

// ============================================================
// حماية عمليات الكتابة (إضافة / تعديل / حذف) بتسجيل الدخول
// ------------------------------------------------------------
// القراءة والتصفح مفتوحان دائمًا لكل الزوار. أي عملية تكتب إلى
// Firestore يجب أن تبدأ باستدعاء requireLoginForWrite(...):
// - إذا كان المستخدم مسجّل الدخول: تُنفَّذ العملية مباشرة.
// - إذا لم يكن مسجّلاً: تظهر رسالة تنبيه، وتُفتح واجهة تسجيل
//   الدخول الموجودة حالياً، وتُحفظ العملية لإعادة تنفيذها تلقائياً
//   بعد نجاح تسجيل الدخول (بدون إعادة تحميل الصفحة).
// ============================================================

let pendingWriteAction = null;
let pageBeforeAuthPrompt = null;

function getCurrentVisiblePageId() {
  const pages = document.querySelectorAll(".page");
  for (const page of pages) {
    // نتحقق عبر getComputedStyle بدل الاعتماد فقط على inline style،
    // لأن بعض الصفحات (مثل homePage) تظهر افتراضياً عبر كلاس CSS
    // "active" قبل أول استدعاء لـ showPage()، وليس عبر inline style.
    // هذا يجعل الدالة تتعرف على الصفحة الظاهرة فعلياً في كل الحالات.
    if (getComputedStyle(page).display !== "none") {
      return page.id;
    }
  }
  return null;
}

function requireLoginForWrite(actionFn) {
  if (isAuthed()) {
    return true;
  }

  pendingWriteAction = typeof actionFn === "function" ? actionFn : null;

  showMessage(
    "يرجى تسجيل الدخول أولاً لإضافة أو تعديل البيانات.",
    "error"
  );

  openAuth();

  return false;
}

// ============================================================
// Auth state observer — called by the inline module's onAuthStateChanged
// ============================================================

function handleAuthStateChanged(user, authInstance) {
  currentUser = user || null;
  authUserUid = user ? user.uid : null;
  updateHeaderAuthUI();

  if (user) {
    // تسجيل الدخول نجح.
    // لا نغيّر صفحة المستخدم قسرًا؛ التصفح مفتوح أصلاً.
    // إن كانت هناك عملية كتابة معلّقة (تمت محاولتها قبل تسجيل الدخول)
    // نعيد المستخدم إلى صفحته السابقة وننفّذ العملية تلقائياً.
    if (pendingWriteAction) {
      const action = pendingWriteAction;
      const returnPageId = pageBeforeAuthPrompt;

      pendingWriteAction = null;
      pageBeforeAuthPrompt = null;

      if (returnPageId) {
        showPage(returnPageId);
      }

      action();
    } else if (getCurrentVisiblePageId() === "authPage") {
      // تم فتح صفحة تسجيل الدخول يدويًا (مثلاً من زر الهيدر)
      // بدون وجود عملية معلّقة — نعيد المستخدم لصفحته السابقة.
      showPage(pageBeforeAuthPrompt || "homePage");
      pageBeforeAuthPrompt = null;
    }
  }
  // عدم تسجيل الدخول (أو تسجيل الخروج) لا يغيّر الصفحة الحالية أبداً —
  // التصفح يبقى مفتوحًا دائمًا لكل الزوار.
}

// ============================================================
// Open / render auth page
// ============================================================

function openAuth() {
  if (pageBeforeAuthPrompt === null) {
    pageBeforeAuthPrompt = getCurrentVisiblePageId();
  }
  showPage("authPage");
  renderAuth();
}

// إغلاق واجهة تسجيل الدخول والعودة للتصفح بدون تسجيل دخول
// (يُلغي أي عملية كتابة كانت بانتظار تسجيل الدخول)
function closeAuthOverlay() {
  const target = pageBeforeAuthPrompt || "homePage";
  pendingWriteAction = null;
  pageBeforeAuthPrompt = null;
  showPage(target);
}

function renderAuth() {
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  if (title) title.textContent = "تسجيل الدخول";
  if (subtitle) subtitle.textContent = "سجّل دخولك للوصول إلى جميع خدمات النظام";
  clearAuthErrors();
}

// ============================================================
// Switch between login / register modes
// ============================================================

function switchAuthMode(isRegister) {
  const confirmField = document.getElementById("authConfirmField");
  const submitBtn = document.getElementById("authSubmitBtn");
  const toggleBtn = document.getElementById("authToggleBtn");
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const form = document.getElementById("authForm");

  const authMode = isRegister ? "register" : "login";
  if (form) form.dataset.authMode = authMode;

  if (confirmField) {
    confirmField.style.display = isRegister ? "block" : "none";
  }

  if (submitBtn) {
    submitBtn.textContent = isRegister ? "إنشاء حساب" : "تسجيل الدخول";
  }
  if (toggleBtn) {
    toggleBtn.textContent = isRegister ? "لديك حساب بالفعل؟ تسجيل الدخول" : "إنشاء حساب جديد";
  }
  if (title) title.textContent = isRegister ? "إنشاء حساب" : "تسجيل الدخول";
  if (subtitle) subtitle.textContent = isRegister
    ? "أنشئ حسابًا جديدًا للوصول إلى جميع خدمات النظام"
    : "سجّل دخولك للوصول إلى جميع خدمات النظام";

  clearAuthErrors();
}

// ============================================================
// تبديل الوضع عند الضغط على زر "إنشاء حساب" / "لدي حساب؟ سجل الدخول"
// ============================================================

function toggleAuthMode() {
  const form = document.getElementById("authForm");
  const isCurrentlyRegister = !!(form && form.dataset.authMode === "register");
  switchAuthMode(!isCurrentlyRegister);
}

// ============================================================
// Validation helpers
// ============================================================

function clearAuthErrors() {
  ["authEmail", "authPassword", "authConfirmPassword"].forEach(id => {
    const err = document.getElementById("error-" + id);
    if (err) err.textContent = "";
  });
  const box = document.getElementById("authErrorBox");
  if (box) box.style.display = "none";
  const text = document.getElementById("authErrorText");
  if (text) text.textContent = "";
}

function setAuthError(message) {
  const box = document.getElementById("authErrorBox");
  const el = document.getElementById("authErrorText");
  if (box && el) {
    el.textContent = message;
    box.style.display = "block";
  }
}

function validateAuthField(id, message) {
  const err = document.getElementById("error-" + id);
  if (err) err.textContent = message;
}

// ============================================================
// Email/Password auth actions
// ============================================================

async function authSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  clearAuthErrors();

  const email = (document.getElementById("authEmail").value || "").trim();
  const password = document.getElementById("authPassword").value || "";

  const isRegister =
    document.getElementById("authForm").dataset.authMode === "register";
  const confirm = isRegister
    ? (document.getElementById("authConfirmPassword").value || "")
    : "";

  let valid = true;

  if (!email) {
    validateAuthField("authEmail", "البريد الإلكتروني مطلوب");
    valid = false;
  }
  if (!password) {
    validateAuthField("authPassword", "كلمة المرور مطلوبة");
    valid = false;
  }
  if (isRegister && !confirm) {
    validateAuthField("authConfirmPassword", "يرجى تأكيد كلمة المرور");
    valid = false;
  }
  if (isRegister && password && confirm && password !== confirm) {
    validateAuthField("authConfirmPassword", "كلمتا المرور غير متطابقتين");
    valid = false;
  }

  if (!valid) return;

  let mode = isRegister ? "إنشاء الحساب" : "تسجيل الدخول";

  if (!getAuth()) {
    setAuthError("لم يتم تحميل Firebase بعد. يرجى إعادة المحاولة.");
    return;
  }

  const btn = document.getElementById("authSubmitBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = mode + "...";
  }

  try {
    const {
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signOut
    } = await import(
      "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
    );

    if (isRegister) {
      // Create account then auto-login (no email verification).
      await createUserWithEmailAndPassword(
        getAuth(),
        email,
        password
      );
    } else {
      await signInWithEmailAndPassword(getAuth(), email, password);
    }

    // onCreate / onLogin — onAuthStateChanged fires automatically.
    clearAuthErrors();
  } catch (error) {
    console.error("Auth error:", error);
    let msg = "حدث خطأ غير متوقع";

    if (error && error.code) {
      const code = error.code;

      if (code === "auth/invalid-email") {
        msg = "صيغة البريد الإلكتروني غير صحيحة";
      } else if (code === "auth/email-already-in-use") {
        msg = "هذا البريد مستخدم بالفعل. يرجى تسجيل الدخول";
      } else if (code === "auth/weak-password") {
        msg = "كلمة المرور ضعيفة (يجب ألا تقل عن 6 أحرف)";
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (code === "auth/missing-android-cred") {
        msg = "خطأ في إعداد Firebase Authentication";
      } else if (code === "auth/requires-recent-login") {
        msg = "يرجى تسجيل الدخول مرة أخرى";
      } else if (code === "auth/too-many-requests") {
        msg = "تم إيقاف المحاولات مؤقتًا بسبب كثرة المحاولات. حاول لاحقًا";
      } else if (code === "auth/network-request-failed") {
        msg = "تعذر الاتصال بالإنترنت. تحقق من الاتصال وحاول مرة أخرى";
      } else if (code === "auth/unauthorized-domain") {
        msg = "هذا النطاق غير مصرّح به في Firebase. يرجى التواصل مع الدعم";
      } else if (code === "auth/invalid-api-key") {
        msg = "مفتاح Firebase غير صحيح. يرجى التواصل مع الدعم";
      } else if (code === "auth/operation-not-allowed") {
        msg = "طريقة تسجيل الدخول غير مفعّلة. يرجى التواصل مع الدعم";
      } else if (code === "auth/user-disabled") {
        msg = "تم تعطيل هذا الحساب. يرجى التواصل مع الدعم";
      } else if (code === "auth/credential-already-in-use") {
        msg = "هذه البيانات مستخدمة لحساب آخر بالفعل";
      } else if (code === "auth/invalid-credential") {
        msg = "بيانات الدخول غير صحيحة";
      } else if (code === "auth/internal-error") {
        msg = "حدث خطأ من Firebase. يرجى المحاولة مرة أخرى";
      } else {
        msg = "حدث خطأ في المصادقة: " + (error.message || "خطأ غير معروف");
      }
    } else if (error && error.message) {
      msg = "حدث خطأ في المصادقة: " + error.message;
    }

    setAuthError(msg);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = isRegister ? "إنشاء حساب" : "تسجيل الدخول";
    }
  }
}

async function logoutUser() {
  const auth = getAuth();
  if (!auth) return;
  try {
    const { signOut } = await import(
      "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
    );
    await signOut(auth);
    currentUser = null;
    authUserUid = null;
    showPage("authPage");
    renderAuth();
  } catch (error) {
    console.error("Logout error:", error);
    showMessage("حدث خطأ أثناء تسجيل الخروج");
  }
}

// تحديث منطقة الهيدر حسب حالة تسجيل الدخول: عند تسجيل الدخول تُخفى
// أيقونة القفل ويظهر اسم المستخدم (الجزء قبل @ من البريد الإلكتروني)
// أسفل "الأقسام الرئيسية"، والضغط عليه يفتح خيار تسجيل الخروج.
function updateHeaderAuthUI() {
  const authBtn = document.getElementById("headerAuth");
  const userWrap = document.getElementById("headerUserWrap");
  const userNameEl = document.getElementById("headerUserName");

  if (currentUser) {
    if (authBtn) authBtn.style.display = "none";
    if (userWrap) userWrap.style.display = "block";
    if (userNameEl) {
      const email = currentUser.email || "";
      const namePart = email.includes("@") ? email.split("@")[0] : email;
      userNameEl.textContent = namePart || "المستخدم";
    }
  } else {
    if (authBtn) authBtn.style.display = "flex";
    if (userWrap) userWrap.style.display = "none";
    closeUserMenu();
  }
}

function toggleUserMenu() {
  const menu = document.getElementById("headerUserMenu");
  if (!menu) return;
  menu.classList.toggle("open");
}

function closeUserMenu() {
  const menu = document.getElementById("headerUserMenu");
  if (menu) menu.classList.remove("open");
}

document.addEventListener("click", function (e) {
  const wrap = document.getElementById("headerUserWrap");
  if (!wrap) return;
  if (!wrap.contains(e.target)) {
    closeUserMenu();
  }
});



// ============================================================
// ربط حدث تسجيل الدخول (مسؤولية JS فقط، بدون inline onsubmit)
// ------------------------------------------------------------
// ملاحظة مهمة: script.js يُحمَّل ديناميكيًا (عبر
// document.createElement("script") من الوحدة inline module في
// index.html)، وبالتالي فهو async بشكل افتراضي. هذا يعني أن حدث
// DOMContentLoaded يكون قد أُطلق بالفعل قبل أن يبدأ هذا الملف
// بالتنفيذ أصلاً — تمامًا مثل initializeCompanyApp أعلاه، الذي
// يتعامل مع هذا الأمر عبر فحص document.readyState.
// الاستماع المباشر لـ"DOMContentLoaded" هنا كان لا يُنفَّذ أبدًا،
// وبالتالي لم يكن يتم ربط submit على authForm إطلاقًا، فكان
// الفورم يُرسَل بالسلوك الافتراضي للمتصفح (لا حدث JS، لا Firebase)
// بدل استدعاء authSubmit — وهذا هو سبب فشل إنشاء الحساب/الدخول.
// ============================================================

function wireAuthForm() {
  const authForm = document.getElementById("authForm");
  if (!authForm) {
    console.error("AUTH FORM NOT FOUND");
    return;
  }
  authForm.addEventListener("submit", authSubmit);
  console.log("AUTH EVENT WIRED");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireAuthForm);
} else {
  wireAuthForm();
}

// ============================================================
// سحب بيانات الأجهزة الطبية من ملف Excel
// ============================================================

async function pullMedicalDevicesFromExcel() {
  // الكتابة إلى Firestore (مجموعة medical_device_maintenance) تتطلب
  // تسجيل الدخول، نفس سياسة باقي عمليات الكتابة في التطبيق.
  // عند عدم تسجيل الدخول: تُحفظ العملية وتُعاد تلقائيًا بعد النجاح.
  if (!requireLoginForWrite(pullMedicalDevicesFromExcel)) return;

  const statusEl = document.getElementById("excelPullStatus");
  if (!statusEl) return;

  // إخفاء زر التنزيل السابق عند بدء عملية سحب جديدة
  resetMedicalExcelExportUI();

  statusEl.textContent = "جارٍ التحميل...";

  try {
    // تحميل مكتبة XLSX إذا لم تكن محملة
    await loadMedicalInventoryLibrary();

    // جلب ملف Excel
    const response = await fetch(MEDICAL_INVENTORY_EXCEL_URL);
    if (!response.ok) {
      throw new Error("فشل في جلب ملف Excel (HTTP " + response.status + ")");
    }

    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });

    // استخدام نفس دالة التحليل المستخدمة في الجرد
    const parsed = parseMedicalInventoryWorkbook(workbook);

    if (!parsed.records.length) {
      throw new Error("لا توجد أجهزة طبية في ملف Excel");
    }

    // تاريخ اليوم
    const today = new Date();
    const dateStr = String(today.getDate()).padStart(2, "0") + "-" +
                    String(today.getMonth() + 1).padStart(2, "0") + "-" +
                    today.getFullYear();

    const title = "صيانة الأجهزة الطبية - " + dateStr;

    // بناء سجل الصيانة
    const maintenanceRecord = {
      title: title,
      date: dateStr,
      deviceCount: parsed.records.length,
      devices: parsed.records.map(r => ({
        excelRow: r.excelRow,
        ref: r.ref,
        name: r.name,
        brand: r.brand,
        origin: r.origin,
        qty: r.qty
      })),
      createdAt: new Date().toISOString()
    };

    // حفظ السجل في Firestore مجموعة medical_device_maintenance
    const db = getFirestoreDB();
    if (!db) {
      throw new Error("قاعدة البيانات غير متاحة");
    }

    const { collection, addDoc } = await import(
      "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
    );

    await addDoc(collection(db, "medical_device_maintenance"), maintenanceRecord);

    console.log("تم حفظ سجل الصيانة:", title);

    // تجهيز ملف Excel للتنزيل بنفس بنية الملف المرجعي
    // (Medical_Equipment_Maintenance_Tracker_v2.xlsx / Equipment Inventory)
    try {
      prepareMedicalDevicesExcelExport(parsed.records);
      statusEl.textContent =
        "تم سحب " + parsed.records.length + " جهازًا بنجاح — الملف جاهز للتنزيل";
    } catch (exportError) {
      console.error("خطأ في تجهيز ملف التصدير:", exportError);
      statusEl.textContent =
        "تم سحب " + parsed.records.length + " جهازًا بنجاح، لكن تعذر تجهيز ملف التصدير: " +
        (exportError.message || exportError);
    }

  } catch (error) {
    statusEl.textContent = "فشل: " + (error.message || error);
    console.error("خطأ في سحب بيانات الأجهزة من Excel:", error);
  }
}

// ============================================================
// تصدير الأجهزة الطبية إلى Excel بنفس بنية الملف المرجعي
// "Medical_Equipment_Maintenance_Tracker_v2.xlsx"
// (الورقة الرئيسية للمرجع: Equipment Inventory)
// ------------------------------------------------------------
// - أسماء الأعمدة السبعة الأولى وترتيبها مطابقة للمرجع حرفياً.
// - البيانات غير المتوفرة في النظام (Serial Number / Department /
//   Purchase Date / Warranty) تبقى خلايا فارغة بدون أي تخمين.
// - عمود "Quantity" أُضيف في النهاية فقط للحفاظ على بيانات الكمية
//   الموجودة فعلياً في النظام (المرجع لا يحتوي عمود كمية أصلاً).
// - العملية قراءة من الذاكرة فقط ولا تعدل أي بيانات في Firestore.
// ============================================================

const MEDICAL_EXPORT_SHEET_NAME = "Equipment Inventory";
const MEDICAL_EXPORT_TITLE = "Medical Equipment Inventory Database";
const MEDICAL_EXPORT_HEADERS = [
    "Equipment Code",
    "Equipment Name",
    "Serial Number (SN)",
    "Manufacturer / Brand",
    "Department / Location",
    "Purchase Date",
    "Warranty Status",
    "Quantity" // عمود إضافي: حفظ كمية النظام (المرجع لا يحتوي عمود كمية)
];
const MEDICAL_EXPORT_COL_WIDTHS = [18, 24, 22, 24, 25, 17, 19, 12];

let medicalExportFile = null;

// تحويل القيم الرقمية إلى أرقام حقيقية (نفس أنواع بيانات المصدر)
function medicalExportNumericOrText(value) {
    if (value === null || value === undefined) return null;

    const trimmed = String(value).trim();
    if (trimmed === "") return null;

    const num = Number(trimmed);
    return isNaN(num) ? trimmed : num;
}

// بناء مصنف Excel مطابق لبنية ورقة "Equipment Inventory" المرجعية:
// عنوان مدموج A1:H2 (المرجع A1:G2) ثم العناوين في الصف الرابع
function buildMedicalDevicesExportWorkbook(records) {
    const rows = [];

    // الصف 1: العنوان (مدموج عبر صفين مثل المرجع)
    rows.push([MEDICAL_EXPORT_TITLE]);

    // الصفان 2 و 3: فارغان (مثل المرجع)
    rows.push([]);
    rows.push([]);

    // الصف 4: العناوين بنفس أسماء المرجع وترتيبه
    rows.push(MEDICAL_EXPORT_HEADERS.slice());

    // الصف 5 وما بعده: بيانات الأجهزة من النظام
    (records || []).forEach(function (record) {
        rows.push([
            medicalExportNumericOrText(record.ref),
            record.name || null,
            null, // Serial Number (SN) غير متوفر في النظام
            record.brand || null,
            null, // Department / Location غير متوفر في بيانات الجرد
            null, // Purchase Date غير متوفر في النظام
            null, // Warranty Status غير متوفر في النظام
            medicalExportNumericOrText(record.qty)
        ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // دمج العنوان عبر كل الأعمدة (المرجع: A1:G2 — هنا A1:H2 لوجود عمود الكمية)
    worksheet["!merges"] = [{
        s: { r: 0, c: 0 },
        e: { r: 1, c: MEDICAL_EXPORT_HEADERS.length - 1 }
    }];

    // نفس عروض أعمدة المرجع (A-G) + عرض عمود الكمية
    worksheet["!cols"] = MEDICAL_EXPORT_COL_WIDTHS.map(function (w) {
        return { wch: w };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, MEDICAL_EXPORT_SHEET_NAME);
    return workbook;
}

// توليد ملف xlsx في الذاكرة وإظهار زر التنزيل (بدون تنزيل تلقائي)
function prepareMedicalDevicesExcelExport(records) {
    const workbook = buildMedicalDevicesExportWorkbook(records);

    const data = new Uint8Array(
        XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    );

    const now = new Date();
    const ymd = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    medicalExportFile = {
        data: data,
        filename: "Medical_Equipment_Maintenance_Tracker_Export_" + ymd + ".xlsx",
        count: (records || []).length
    };

    const btn = document.getElementById("excelDownloadBtn");
    if (btn) btn.style.display = "";
}

// إعادة ضبط حالة التصدير (تُستدعى عند بدء عملية سحب جديدة)
function resetMedicalExcelExportUI() {
    medicalExportFile = null;

    const btn = document.getElementById("excelDownloadBtn");
    if (btn) btn.style.display = "none";
}

// تنزيل الملف الجاهز عند ضغط المستخدم على زر "⬇️ تنزيل ملف Excel"
function downloadMedicalExportFile() {
    if (!medicalExportFile || !medicalExportFile.data) {
        const statusEl = document.getElementById("excelPullStatus");
        if (statusEl) {
            statusEl.textContent = "لا يوجد ملف جاهز. اضغط \"سحب ملف Excel\" أولاً.";
        }
        return;
    }

    const blob = new Blob([medicalExportFile.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = medicalExportFile.filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
}


// ============================================================
// ==================== قسم الميكانيك =========================
// ============================================================
// نظام إدارة الأنظمة الميكانيكية: المعدات، أوامر العمل والأعطال،
// الصيانة الوقائية، قطع الغيار المرتبطة، التقارير والبحث.
// المنطق النقي (حسابات/تحقق/تصدير) في mechanics-calc.js
// (window.MechanicsCalc = MC)، وهنا الربط بـ Firestore وDOM فقط.
// بنية الصفحة في index.html: #mechStats #mechFollowUp #mechDepts
// #mechStatView #mechTabHost(#mechTabTitle #mechTabs #mechTabContent
// #mechFormHost) و#mechState لرسائل التحميل/الخطأ.
// ============================================================

// بيانات المستخدم الحالي لسجل «من قام بالإضافة/التغيير»
function mechWho() {
    if (typeof currentUser !== "undefined" && currentUser) {
        return {
            name: currentUser.displayName || currentUser.email || "مستخدم",
            uid: currentUser.uid || null
        };
    }
    return { name: "زائر", uid: null };
}

// ---------- فتح القسم + تحميل البيانات ----------
function openMechanics() {
    showPage("mechanicsPage");
    mechActiveTab = "equipment";
    mechActiveOrderId = null;
    hideMechState();
    renderMechanicsDashboard();
    ensureMechData();
    subscribeMechData();
}

// قراءة أولية لجميع مجموعات الميكانيك (قراءة واحدة لكل مجموعة)
async function ensureMechData(force) {
    if (mechLoaded && !force) return;
    const db = getFirestoreDB();
    if (!db) { showMechState("loading", "جارٍ الاتصال بقاعدة البيانات…"); return; }
    showMechState("loading", "جارٍ تحميل بيانات الميكانيك…");
    try {
        const fs = await import(MECH_FIRESTORE_URL);
        // كل مجموعة تُحمَّل باستقلال: فشل مجموعة واحدة (مثل صلاحية ناقصة) لا يُسقط القسم كله
        const names = [MECH_EQUIPMENT_COLLECTION, MECH_ORDERS_COLLECTION, MECH_PM_PLANS_COLLECTION, MECH_PM_LOGS_COLLECTION, MECH_SPARES_COLLECTION, MECH_TYPES_COLLECTION];
        const results = await Promise.allSettled(names.map(n => fs.getDocs(fs.collection(db, n))));
        mechLoadFailures = [];
        mechLoadErrors = [];
        const docsOf = (i) => {
            const r = results[i];
            if (r.status === "fulfilled") return r.value.docs.map(d => ({ id: d.id, ...d.data() }));
            mechLoadFailures.push(names[i]);
            mechLoadErrors.push({ name: names[i], code: (r.reason && r.reason.code) || "", message: String((r.reason && r.reason.message) || r.reason || "") });
            console.error("Mechanics collection failed:", names[i], r.reason);
            return [];
        };
        const [eqDocs, ordDocs, pmDocs, pmLogDocs, spareDocs, typeDocs] = names.map((n, i) => docsOf(i));
        if (mechLoadFailures.length === names.length) throw new Error("all mechanics collections failed");
        mechEquipmentCache = eqDocs;
        mechOrdersCache = ordDocs;
        mechPmPlansCache = pmDocs;
        mechPmLogsCache = pmLogDocs;
        mechSparesCache = spareDocs;
        mechTypesCache = typeDocs;
        mechLoaded = true;
        mechLastLoadAt = Date.now();
        hideMechState();
    } catch (error) {
        console.error("Error loading mechanics data:", error);
        const first = mechLoadErrors[0];
        const detail = first
            ? " السبب: " + (first.code || first.message || "غير معروف") + " (المجموعة: " + first.name + ")."
            : " السبب: " + String((error && (error.code || error.message)) || error);
        const hint = first && /permission|insufficient/i.test(first.code + " " + first.message)
            ? " قواعد Firestore المنشورة لا تسمح بالقراءة؛ انسخ ملف firestore.rules إلى Firebase Console ثم Publish."
            : " تحقّق من الاتصال ثم أعد المحاولة.";
        showMechState("error", "تعذّر تحميل بيانات الميكانيك." + detail + hint);
        return;
    }
    try {
        renderMechanicsDashboard();
    } catch (renderError) {
        console.error("Error rendering mechanics dashboard:", renderError);
        showMechState("error", "تحمّلت البيانات لكن تعذّر رسم اللوحة: " + String(renderError && renderError.message || renderError));
    }
}

// اشتراك حيّ: تحديث الذاكرة وإعادة الرسم عند أي تغيير.
// نُحدّث المصفوفات العامة مباشرةً (بلا تمرير مراجع قديمة) حتى تبقى
// نفس المراجع التي تقرأها بقية الدوال محدّثة.
function subscribeMechData() {
    if (mechDataUnsubscribe) return;
    const db = getFirestoreDB();
    if (!db) return;
    import(MECH_FIRESTORE_URL).then(({ collection, onSnapshot }) => {
        const unsubs = [];
        const bind = (collName, setter) => {
            const arr = [];
            setter(arr);
            unsubs.push(onSnapshot(collection(db, collName), snap => {
                arr.length = 0;
                snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                mechLoaded = true;
                renderMechanicsDashboard();
                renderActiveMechView();
                renderFireFightingIfVisible();
            }, err => console.error("mech snapshot error", collName, err)));
        };
        bind(MECH_EQUIPMENT_COLLECTION, (arr) => { mechEquipmentCache = arr; });
        bind(MECH_ORDERS_COLLECTION, (arr) => { mechOrdersCache = arr; });
        bind(MECH_PM_PLANS_COLLECTION, (arr) => { mechPmPlansCache = arr; });
        bind(MECH_PM_LOGS_COLLECTION, (arr) => { mechPmLogsCache = arr; });
        bind(MECH_SPARES_COLLECTION, (arr) => { mechSparesCache = arr; });
        bind(MECH_TYPES_COLLECTION, (arr) => { mechTypesCache = arr; });
        mechDataUnsubscribe = unsubs;
    }).catch(err => console.error("mech subscribe import error", err));
}

function showMechState(kind, msg) {
    const el = document.getElementById("mechState");
    if (!el) return;
    el.hidden = false;
    el.className = "mech-state is-" + kind;
    el.textContent = msg;
}
function hideMechState() {
    const el = document.getElementById("mechState");
    if (el) { el.hidden = true; el.textContent = ""; }
}


// ---------- الهيكل الرئيسي: لوحة التحكم ----------
function renderMechanicsDashboard() {
    const stats = MC.computeStats({
        equipment: mechEquipmentCache,
        orders: mechOrdersCache,
        plans: mechPmPlansCache
    });

    const statsHost = document.getElementById("mechStats");
    if (statsHost) {
        const grp = (title, cls, cards) => `<div><div class="mech-stat-group-title">${title}</div><div class="mech-stat-grid ${cls || ""}">${cards.join("")}</div></div>`;
        statsHost.innerHTML = `<div class="mech-stat-groups">` + [
            grp("المعدات · Equipment", "is-three", [
                mechStatCard("إجمالي المعدات", stats.totalEquipment, "⚙️", "", "mechShowStat('all')", "Total equipment"),
                mechStatCard("معدات عاملة", stats.operationalEquipment, "✅", "is-ok", "mechShowStat('operational')", "Operational"),
                mechStatCard("معدات متوقفة", stats.stoppedEquipment, "⛔", stats.stoppedEquipment ? "is-danger" : "", "mechShowStat('stopped')", "Stopped")
            ]),
            grp("الصيانة · Maintenance", "", [
                mechStatCard("صيانة مستحقة", stats.dueMaintenance, "🗓️", stats.dueMaintenance ? "is-warn" : "", "mechShowStat('duePm')", "Due"),
                mechStatCard("صيانة متأخرة", stats.overdueMaintenance, "⚠️", stats.overdueMaintenance ? "is-danger" : "", "mechShowStat('overduePm')", "Overdue")
            ]),
            grp("الأعمال والأعطال · Work orders", "", [
                mechStatCard("أعطال مفتوحة", stats.openOrders, "🔴", stats.openOrders ? "is-danger" : "", "mechShowStat('openOrders')", "Open faults"),
                mechStatCard("مهام قيد التنفيذ", stats.tasksInProgress, "🔧", "", "mechShowStat('inProgress')", "In progress"),
                mechStatCard("بانتظار القطع", stats.tasksAwaitingParts, "⏳", stats.tasksAwaitingParts ? "is-warn" : "", "mechShowStat('awaitingParts')", "Awaiting parts"),
                mechStatCard("أعمال مكتملة", stats.completedOrders, "✔️", "is-ok", "mechShowStat('completed')", "Completed")
            ])
        ].join("") + `</div>`;
    }

    const followHost = document.getElementById("mechFollowUp");
    if (followHost) {
        const followUp = MC.buildFollowUpList({
            equipment: mechEquipmentCache, orders: mechOrdersCache, plans: mechPmPlansCache
        }).slice(0, 12);
        followHost.innerHTML = followUp.length ? followUp.map(mechFollowRow).join("")
            : `<div class="mech-empty"><div class="mech-empty-icon">✅</div>لا توجد أعمال تحتاج إلى متابعة حالياً.</div>`;
    }

    const deptHost = document.getElementById("mechDepts");
    if (deptHost) deptHost.innerHTML = MC.DEPARTMENTS.map(mechDeptCard).join("");
}

function mechStatCard(label, value, icon, cls, onclick, labelEn) {
    return `<button type="button" class="mech-stat ${cls || ""}" onclick="${onclick}">
        <div class="mech-stat-top"><span class="mech-stat-icon">${icon}</span><span class="mech-stat-label">${label}${labelEn ? `<small>${labelEn}</small>` : ""}</span></div>
        <span class="mech-stat-val">${value}</span></button>`;
}

function mechDeptCard(d) {
    const eq = mechEquipmentCache.filter(e => e.department === d.id);
    const open = mechOrdersCache.filter(o => o.department === d.id && o.status !== "COMPLETE").length;
    const plans = mechPmPlansCache.filter(p => p.department === d.id && p.active !== false);
    const overdue = plans.filter(p => MC.pmStatus(p.nextDue) === "OVERDUE").length;
    return `<button type="button" class="mech-dept" onclick="mechOpenDept('${d.id}')">
        <div class="mech-dept-top">
            <div class="mech-dept-icon">${d.icon}</div>
            <div>
                <div class="mech-dept-name">${d.name}</div>
                <div class="mech-dept-en">${d.nameEn}</div>
            </div>
        </div>
        <div class="mech-dept-counts">
            <span class="mech-count">عدد المعدات <b>${eq.length}</b></span>
            <span class="mech-count ${open ? "is-danger" : ""}">أعطال مفتوحة <b>${open}</b></span>
            <span class="mech-count ${overdue ? "is-warn" : ""}">صيانة متأخرة <b>${overdue}</b></span>
        </div>
    </button>`;
}

function mechFollowRow(it) {
    const pr = it.priority ? `p-${it.priority}` : "p-MEDIUM";
    return `<div class="mech-followup-item">
        <div class="mech-followup-title">
            <span class="mech-pill ${pr}">${MC.priorityLabel(it.priority)}</span>
            ${escapeHTML(it.title)}
        </div>
        <div class="mech-followup-meta">
            ${escapeHTML(it.system)} · ${escapeHTML(it.equipment)} · ${escapeHTML(it.location)} · الاستحقاق: ${MC.formatDateShort(it.dueDate)}
        </div>
    </div>`;
}

// ---------- فتح قسم فرعي من بطاقات الأقسام ----------
function mechOpenDept(deptId) {
    // منظومة مكافحة الحريق لها واجهة مخصّصة داخل الميكانيك
    if (deptId === "fire-fighting") {
        openFireFighting();
        return;
    }
    mechActiveDept = deptId;
    mechActiveTab = "equipment";
    mechActiveOrderId = null;
    closeMechFormHost();
    hideMechState();
    renderMechView();
}

// ---------- الضغط على بطاقة إحصائية: عرض السجلات المرتبطة ----------
function mechShowStat(kind) {
    mechActiveOrderId = null;
    // أعِد ضبط الفلاتر حسب نوع الإحصائية
    mechOrderStatusFilter = "";
    mechOrderPriorityFilter = "";
    mechEquipStatusFilter = "";
    mechEquipCriticalityFilter = "";
    mechEquipSearch = "";
    mechOrderSearch = "";

    if (kind === "all" || kind === "operational" || kind === "stopped") {
        if (kind === "operational") mechEquipStatusFilter = "OPERATIONAL";
        if (kind === "stopped") mechEquipStatusFilter = "STOPPED";
        mechActiveTab = "equipment";
    } else if (kind === "openOrders") {
        mechActiveTab = "orders"; // تُعرض كل الأوامر المفتوحة أدناه
    } else if (kind === "duePm" || kind === "overduePm") {
        mechActiveTab = "pm";
    } else if (kind === "inProgress") {
        mechOrderStatusFilter = "IN PROGRESS";
        mechActiveTab = "orders";
    } else if (kind === "awaitingParts") {
        mechOrderStatusFilter = "AWAITING PARTS";
        mechActiveTab = "orders";
    } else if (kind === "completed") {
        mechOrderStatusFilter = "COMPLETE";
        mechActiveTab = "orders";
    }
    closeMechFormHost();
    renderMechView();
}

// ---------- إعادة رسم العرض النشط (عند تحديث الاشتراك الحيّ) ----------
function renderActiveMechView() {
    if (!mechLoaded) return;
    if (mechActiveTab === "dashboard") renderMechanicsDashboard();
    else if (document.getElementById("mechTabHost") && !document.getElementById("mechTabHost").hidden) {
        renderMechView();
    } else {
        renderMechanicsDashboard();
    }
}

// ---------- الرجوع إلى لوحة التحكم الرئيسية ----------
function mechGoDashboard() {
    mechActiveTab = "dashboard";
    mechActiveOrderId = null;
    const host = document.getElementById("mechTabHost");
    if (host) host.hidden = true;
    const statsView = document.getElementById("mechStatView");
    if (statsView) statsView.hidden = true;
    renderMechanicsDashboard();
}

// ---------- تبديل التبويب داخل القسم ----------
function mechSwitchTab(tab) {
    mechActiveTab = tab;
    mechActiveOrderId = null;
    closeMechFormHost();
    renderMechView();
}



// ---------- الرسم الرئيسي للتبويب النشط ----------
function renderMechView() {
    const dashHost = document.getElementById("mechDashboardView");
    const tabHost = document.getElementById("mechTabHost");
    const statView = document.getElementById("mechStatView");

    if (mechActiveTab === "dashboard") {
        if (dashHost) dashHost.hidden = false;
        if (tabHost) tabHost.hidden = true;
        if (statView) statView.hidden = true;
        renderMechanicsDashboard();
        return;
    }

    if (dashHost) dashHost.hidden = true;
    if (statView) statView.hidden = true;
    if (!tabHost) return;
    tabHost.hidden = false;

    const titleMap = {
        equipment: "المعدات والأصول", orders: "أوامر العمل والأعطال",
        pm: "الصيانة الوقائية", spares: "قطع الغيار", reports: "التقارير"
    };
    const titleEl = document.getElementById("mechTabTitle");
    if (titleEl) titleEl.textContent = titleMap[mechActiveTab] || "";

    // شريط التبويبات
    const tabsHost = document.getElementById("mechTabs");
    if (tabsHost) {
        const tabs = [
            ["equipment", "المعدات"], ["orders", "أوامر العمل"], ["pm", "الصيانة الوقائية"],
            ["spares", "قطع الغيار"], ["reports", "التقارير"]
        ];
        tabsHost.innerHTML = tabs.map(t =>
            `<button type="button" class="mech-tab ${t[0] === mechActiveTab ? "is-active" : ""}" onclick="mechSwitchTab('${t[0]}')">${t[1]}</button>`
        ).join("");
    }

    // شارة القسم النشط
    const deptBadge = document.getElementById("mechTabDept");
    if (deptBadge) deptBadge.textContent = MC.deptName(mechActiveDept) + " — " + MC.deptNameEn(mechActiveDept);

    const content = document.getElementById("mechTabContent");
    if (!content) return;

    if (mechActiveOrderId) {
        content.innerHTML = renderMechOrderDetail(mechActiveOrderId);
        return;
    }

    if (mechActiveTab === "equipment") content.innerHTML = renderMechEquipmentTab(mechActiveDept);
    else if (mechActiveTab === "orders") content.innerHTML = renderMechOrdersTab(mechActiveDept);
    else if (mechActiveTab === "pm") content.innerHTML = renderMechPmTab(mechActiveDept);
    else if (mechActiveTab === "spares") content.innerHTML = renderMechSparesTab(mechActiveDept);
    else if (mechActiveTab === "reports") content.innerHTML = renderMechReportsTab();
}

function closeMechFormHost() {
    const host = document.getElementById("mechFormHost");
    if (host) { host.innerHTML = ""; host.setAttribute("data-open", "0"); host.removeAttribute("data-edit-id"); }
}


// ============================================================
// محتوى التبويبات — دوال مطلوبة من renderMechView()
// تعرض ما هو مسجل فقط في الذاكرة (mech*Cache)، دون استعلامات
// جديدة، وبأصناف CSS الموجودة في صفحة الميكانيك.
// ============================================================

// تبويب المعدات: قائمة معدات القسم المختار
function renderMechEquipmentTab(deptId) {
    const eq = mechEquipmentCache.filter(e => e.department === deptId);
    if (!eq.length) {
        return `<div class="mech-empty"><div class="mech-empty-icon">⚙️</div>لا توجد معدات مسجلة في قسم ${escapeHTML(MC.deptName(deptId))} بعد.</div>`;
    }
    return eq.map(e => `
        <div class="mech-card">
            <h4 class="mech-card-title">${escapeHTML(e.name || "—")}</h4>
            <div class="mech-card-meta">
                ${e.tagNumber ? "الرمز: " + escapeHTML(e.tagNumber) + " · " : ""}
                ${e.type ? escapeHTML(e.type) + " · " : ""}
                ${e.location ? "الموقع: " + escapeHTML(e.location) + " · " : ""}
                الحالة: ${escapeHTML(MC.equipStatusLabel(e.status))}
            </div>
        </div>`).join("");
}

// تبويب أوامر العمل: أوامر القسم مرتبة من الأحدث
function renderMechOrdersTab(deptId) {
    const orders = mechOrdersCache
        .filter(o => o.department === deptId)
        .sort((a, b) => {
            const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
        });
    if (!orders.length) {
        return `<div class="mech-empty"><div class="mech-empty-icon">📋</div>لا توجد أوامر عمل مسجلة في قسم ${escapeHTML(MC.deptName(deptId))} بعد.</div>`;
    }
    return orders.map(o => `
        <div class="mech-card">
            <h4 class="mech-card-title">${escapeHTML(o.orderNumber || "—")} — ${escapeHTML(o.title || "بدون عنوان")}</h4>
            <div class="mech-card-meta">
                ${o.equipmentName ? "المعدة: " + escapeHTML(o.equipmentName) + " · " : ""}
                ${o.location ? "الموقع: " + escapeHTML(o.location) + " · " : ""}
                الحالة: ${escapeHTML(MC.statusLabel(o.status))}
                ${o.dueDate ? " · الاستحقاق: " + MC.formatDateShort(o.dueDate) : ""}
            </div>
            <div class="mech-tagline">
                <span class="mech-pill p-${escapeHTML(o.priority || "MEDIUM")}">${escapeHTML(MC.priorityLabel(o.priority))}</span>
            </div>
        </div>`).join("");
}

// تبويب الصيانة الوقائية: خطط القسم مع حالة الاستحقاق
function renderMechPmTab(deptId) {
    const plans = mechPmPlansCache.filter(p => p.department === deptId || (p.equipmentId && mechEquipmentCache.some(e => e.id === p.equipmentId && e.department === deptId)));
    if (!plans.length) {
        return `<div class="mech-empty"><div class="mech-empty-icon">🗓️</div>لا توجد خطط صيانة وقائية لقسم ${escapeHTML(MC.deptName(deptId))} بعد.</div>`;
    }
    return plans.map(p => {
        const eq = mechEquipmentCache.find(e => e.id === p.equipmentId);
        const st = MC.pmStatus(p.nextDue);
        return `
        <div class="mech-card">
            <h4 class="mech-card-title">${escapeHTML(eq ? eq.name : (p.equipmentName || "—"))}</h4>
            <div class="mech-card-meta">
                الفترة: ${escapeHTML(MC.pmPeriodLabel(p.period))} ·
                آخر تنفيذ: ${MC.formatDateShort(p.lastDone)} ·
                الاستحقاق القادم: ${MC.formatDateShort(p.nextDue)} ·
                الحالة: ${escapeHTML(MC.pmStatusLabel(st))}
            </div>
        </div>`;
    }).join("");
}

// تبويب قطع الغيار: غير مفعّل حالياً في شريط التبويبات —
// يعرض حالة فارغة بدل إلقاء ReferenceError.
function renderMechSparesTab() {
    return `<div class="mech-empty"><div class="mech-empty-icon">📦</div>إدارة قطع الغيار غير مفعّلة في الواجهة الحالية.</div>`;
}

// تبويب التقارير: غير مكتمل بعد — يعرض إشعاراً بدل الخطأ،
// والإحصائيات متاحة في لوحة المعلومات الرئيسية.
function renderMechReportsTab() {
    return `<div class="mech-empty"><div class="mech-empty-icon">📄</div>قسم التقارير قيد الإعداد، ويمكن متابعة الإحصائيات من لوحة المعلومات.</div>`;
}

// ============================================================
// ================= منظومة مكافحة الحريق (FF) =================
// واجهة متكاملة واحترافية لإدارة معدات مكافحة الحريق،
// والمضخات، والفحوصات، والصيانة، والأعطال، وأوامر العمل.
// جميع الأرقام والإحصائيات تُحسب فعلياً من الذاكرة الحالية (Firestore).
// ============================================================
let ffActiveView = "groups";    // "groups" | "tracker" | "orders"
let ffActiveGroup = null;       // null = نظرة عامة | "pump-set" | "extinguishers" | "fixed"
let ffDetail = null;            // null | { kind: "pump"|"unit"|"type", id, tab: "info"|"inspections"|"maintenance"|"faults"|"orders"|"changes" }
let ffSearch = "";
let ffGroupFilter = "";
let ffStatusFilter = "";
let ffTypeFilter = "";
let ffTrackerFilter = "all";    // "all" | "uninspected" | "due_soon" | "overdue" | "faults" | "ongoing" | "completed"
let ffOrderFilterStatus = "";
let ffOrderFilterPriority = "";
let ffOrderFilterType = "";
let ffFacilityFilter = "hospital"; // hospital | complex | unassigned (لا دمج بين الجهات)
let ffMaintFilter = "";          // "" | needs | faults | ok
let ffInspFilter = "";           // "" | overdue | soon | never | ok
let ffRegisterBusy = false;

// ---------- فتح واجهة منظومة مكافحة الحريق ----------
function openFireFighting() {
    showPage("fireFightingPage");
    ffActiveView = "groups";
    ffActiveGroup = null;
    ffDetail = null;
    ffSearch = "";
    ffGroupFilter = "";
    ffStatusFilter = "";
    ffTypeFilter = "";
    ffFacilityFilter = "hospital";
    ffMaintFilter = "";
    ffInspFilter = "";
    ffTrackerFilter = "all";
    ffOrderFilterStatus = "";
    ffOrderFilterPriority = "";
    ffOrderFilterType = "";
    ffCloseModal();

    const searchEl = document.getElementById("ffSearch");
    if (searchEl) searchEl.value = "";
    const groupEl = document.getElementById("ffGroupFilter");
    if (groupEl) groupEl.value = "";
    ["ffMaint", "ffInsp"].forEach(function (id) { const el = document.getElementById(id); if (el) el.value = ""; });

    ffFillToolbar();
    ffUpdateSubnavButtons();
    ffShowState("loading", "جارٍ تحميل بيانات منظومة مكافحة الحريق…");
    renderFFStats();
    renderFFContent();

    Promise.resolve(ensureMechData()).then(function () {
        if (mechLoaded && mechLoadFailures.length) {
            ffShowState("error", "تعذّر تحميل جزء من البيانات (" + mechLoadErrors.map(e => e.name + (e.code ? ": " + e.code : "")).join("، ") + "). السبب الأرجح: قواعد Firestore المنشورة لا تتضمن هذه المجموعات؛ انسخ ملف firestore.rules إلى Firebase Console ثم اضغط Publish.", true);
        } else if (mechLoaded) {
            ffHideState();
        } else {
            ffShowState("error", "تعذّر تحميل البيانات." + (mechLoadErrors[0] ? " السبب: " + (mechLoadErrors[0].code || mechLoadErrors[0].message) + " (" + mechLoadErrors[0].name + ")." : "") + " تحقّق من الاتصال وقواعد Firestore ثم أعد المحاولة.", true);
        }
        renderFFStats();
        renderFFContent();
    });
    subscribeMechData();
}

function ffShowState(kind, msg, retry) {
    const el = document.getElementById("ffState");
    if (!el) return;
    el.hidden = false;
    el.className = "ff-state is-" + kind;
    el.innerHTML = escapeHTML(msg) + (retry ? `<br><button type="button" class="ff-retry" onclick="openFireFighting()">إعادة المحاولة</button>` : "");
}
function ffHideState() {
    const el = document.getElementById("ffState");
    if (el) { el.hidden = true; el.innerHTML = ""; }
}

// تبديل العرض الرئيسي: المجموعات / متابعة الفحص والصيانة / أوامر العمل
function ffSwitchView(viewName) {
    ffActiveView = viewName || "groups";
    ffDetail = null;
    ffUpdateSubnavButtons();
    renderFFContent();
    const host = document.getElementById("ffContent");
    if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ffUpdateSubnavButtons() {
    const tabs = ["groups", "tracker", "orders"];
    tabs.forEach(t => {
        const btn = document.getElementById("ffTabBtn-" + t);
        if (btn) {
            if (t === ffActiveView && !ffDetail) btn.classList.add("is-active");
            else btn.classList.remove("is-active");
        }
    });
}

// استخراج بيانات مكافحة الحريق (كل الجهات) من الذاكرة الحالية
function ffFireDataAll() {
    const eq = (mechEquipmentCache || []).filter(e => e.department === "fire-fighting");
    const ids = {};
    eq.forEach(e => { ids[e.id] = 1; });
    const orders = (mechOrdersCache || []).filter(o => o.department === "fire-fighting" || (o.equipmentId && ids[o.equipmentId]));
    const plans = (mechPmPlansCache || []).filter(p => p.department === "fire-fighting" || (p.equipmentId && ids[p.equipmentId]));
    const pmLogs = (mechPmLogsCache || []).filter(l => l.department === "fire-fighting" || (l.equipmentId && ids[l.equipmentId]));
    const types = (mechTypesCache || []).filter(t => t.department === "fire-fighting");
    return { equipment: eq, orders: orders, plans: plans, pmLogs: pmLogs, types: types };
}

// بيانات الجهة المختارة فقط (المستشفى أو المجمع) — تُستخدم في الإحصائيات والعروض
function ffFireData() {
    return MC.ffScopeData(ffFireDataAll(), ffFacilityFilter);
}

function ffFacilityMeta(id) {
    return MC.FF_FACILITIES.find(f => f.id === id) || MC.FF_UNASSIGNED_FACILITY;
}
function ffCatalogOf(e) {
    return e && e.catalogTypeId ? (MC.FF_CATALOG_SEED.find(c => c.id === e.catalogTypeId) || null) : null;
}
function ffModeLabel(mode) {
    if (mode === "portable") return "محمولة (Portable)";
    if (mode === "automatic") return "أوتوماتيكية (Automatic)";
    return "";
}
function ffModeBadge(mode) {
    if (!mode) return "";
    return `<span class="ff-mode-badge ${mode === "automatic" ? "is-auto" : ""}">${escapeHTML(ffModeLabel(mode))}</span>`;
}
function ffGroupMeta(id) {
    return MC.FF_GROUPS.find(g => g.id === id) || MC.FF_GROUPS[MC.FF_GROUPS.length - 1];
}

// خرائط الأعطال المفتوحة وسجلات الفحص (من كل الجهات؛ مفتاحها معرّف المعدة)
function ffIssueMaps() {
    const all = ffFireDataAll();
    const faults = {}, corrective = {}, inspected = {};
    all.orders.forEach(o => {
        if (!o.equipmentId) return;
        if (o.status !== "COMPLETE" && o.type === "BREAKDOWN") faults[o.equipmentId] = 1;
        if (o.status !== "COMPLETE" && (o.type === "BREAKDOWN" || o.type === "CORRECTIVE")) corrective[o.equipmentId] = 1;
        if (o.type === "INSPECTION" && o.status === "COMPLETE") inspected[o.equipmentId] = 1;
    });
    all.pmLogs.forEach(l => {
        if (l.equipmentId && (l.type === "INSPECTION" || l.type === "فحص")) inspected[l.equipmentId] = 1;
    });
    return { faults: faults, corrective: corrective, inspected: inspected };
}

// تطبيق البحث والفلاتر (الاسم عربي/إنجليزي، النوع، المجموعة، الحالة، الصيانة، موعد الفحص)
function ffApplyFilters(list) {
    const q = (ffSearch || "").trim().toLowerCase();
    const maps = (ffMaintFilter || ffInspFilter) ? ffIssueMaps() : null;
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 86400000);
    return (list || []).filter(function (e) {
        if (ffGroupFilter && MC.ffGroupOf(e) !== ffGroupFilter) return false;
        if (ffStatusFilter && e.status !== ffStatusFilter) return false;
        if (ffTypeFilter) {
            const cat = ffCatalogOf(e);
            if (e.type !== ffTypeFilter && !(cat && cat.name === ffTypeFilter)) return false;
        }
        if (ffMaintFilter) {
            const needs = e.status === "STOPPED" || e.status === "UNDER_MAINTENANCE" || !!maps.corrective[e.id];
            if (ffMaintFilter === "needs" && !needs) return false;
            if (ffMaintFilter === "faults" && !maps.faults[e.id]) return false;
            if (ffMaintFilter === "ok" && needs) return false;
        }
        if (ffInspFilter) {
            const dueStr = e.nextInspectionDue || e.nextDue;
            const due = dueStr ? MC.toDate(dueStr) : null;
            const hasDue = !!(due && !isNaN(due.getTime()));
            const everInspected = !!(e.lastInspectionDate || maps.inspected[e.id]);
            if (ffInspFilter === "never" && everInspected) return false;
            if (ffInspFilter === "overdue" && !(hasDue && due <= now)) return false;
            if (ffInspFilter === "soon" && !(hasDue && due > now && due <= in14)) return false;
            if (ffInspFilter === "ok" && !(hasDue && due > in14)) return false;
        }
        if (q) {
            const cat = ffCatalogOf(e);
            const grp = ffGroupMeta(MC.ffGroupOf(e));
            const hay = [
                e.name, e.nameAr, e.tagNumber, e.internalCode, e.type, e.location,
                e.manufacturer, e.model, e.serialNumber, e.notes,
                cat ? cat.name : "", cat ? cat.nameAr : "", grp.name, grp.nameEn,
                ffFacilityMeta(MC.ffFacilityOf(e)).name
            ].join(" ").toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        return true;
    });
}

function ffFiltersActive() {
    return !!(ffSearch || ffGroupFilter || ffStatusFilter || ffTypeFilter || ffMaintFilter || ffInspFilter);
}

// مطابقة نوع كتالوج مع البحث/النوع/المجموعة الحالية
function ffCatalogMatches(t) {
    if (ffGroupFilter && t.ffGroup !== ffGroupFilter) return false;
    if (ffTypeFilter && t.name !== ffTypeFilter) return false;
    const q = (ffSearch || "").trim().toLowerCase();
    if (q) {
        const hay = [t.name, t.nameAr, t.notes, t.sourceDescription, ffGroupMeta(t.ffGroup).name, ffGroupMeta(t.ffGroup).nameEn].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
    }
    return true;
}

// ---------- اختيار الجهة (المستشفى / المجمع) ----------
function renderFFFacilityBar() {
    const host = document.getElementById("ffFacilityBar");
    if (!host) return;
    const un = MC.ffScopeData(ffFireDataAll(), "unassigned");
    const hasUnassigned = un.equipment.length > 0 || un.orders.length > 0;
    if (!hasUnassigned && ffFacilityFilter === "unassigned") ffFacilityFilter = "hospital";
    const facs = MC.FF_FACILITIES.slice();
    if (hasUnassigned) facs.push(MC.FF_UNASSIGNED_FACILITY);
    const icons = { hospital: "🏥", complex: "🏢", unassigned: "❔" };
    host.innerHTML = facs.map(f => `
        <button type="button" role="tab" aria-selected="${f.id === ffFacilityFilter}" class="ff-fac-btn ${f.id === ffFacilityFilter ? "is-active" : ""}" onclick="ffSetFacility('${f.id}')">
            ${icons[f.id] || ""} ${escapeHTML(f.name)} <small>${escapeHTML(f.nameEn)}</small>
        </button>`).join("") +
        `<p class="ff-fac-note" style="flex-basis:100%;margin:4px 2px 0;">الأرقام والإحصائيات أدناه تخص <b>${escapeHTML(ffFacilityMeta(ffFacilityFilter).name)}</b> فقط، ولا تُجمع مع الجهة الأخرى.` +
        (hasUnassigned ? ` تظهر تبويبة «غير محددة الجهة» لوجود سجلات لم تُحدَّد جهتها بعد.` : "") + `</p>`;
}

function ffSetFacility(id) {
    ffFacilityFilter = id || "hospital";
    ffDetail = null;
    ffActiveGroup = null;
    ffFillToolbar();
    renderFFStats();
    renderFFContent();
}

// ============================================================
// بطاقات الإحصائيات الفعلية من قاعدة البيانات (لا أرقام وهمية)
// 1. إجمالي أنواع المعدات
// 2. إجمالي الوحدات المسجلة
// 3. الوحدات التي تم فحصها
// 4. الوحدات التي تحتاج إلى صيانة
// 5. أوامر العمل المفتوحة
// 6. الفحوصات المستحقة
// 7. المعدات التي سُجلت عليها أعطال
// ============================================================
function renderFFStats() {
    renderFFFacilityBar();
    const host = document.getElementById("ffStats");
    if (!host) return;
    const data = ffFireData();

    // الكمية المعتمدة للجهة (من الكتالوج المعتمد؛ لا تُقدَّر لجهة «غير محددة»)
    const approvedTotal = ffFacilityFilter === "unassigned" ? null : MC.ffApprovedTotals(ffFacilityFilter).total;

    // الوحدات المسجلة فعلياً في Firestore لهذه الجهة
    const totalUnits = data.equipment.length;

    // العاملة: حالتها التشغيلية OPERATIONAL فقط (غير المفحوصة لا تُعدّ عاملة)
    const operationalUnits = data.equipment.filter(e => e.status === "OPERATIONAL").length;

    // الوحدات التي تم فحصها فعلياً (لا نفترض فحص أي معدة دون سجل فحص مثبت)
    const inspectedUnits = data.equipment.filter(e => {
        const hasInspectionOrder = data.orders.some(o => o.equipmentId === e.id && o.type === "INSPECTION" && o.status === "COMPLETE");
        const hasInspectionDate = !!e.lastInspectionDate;
        const hasInspectionLog = data.pmLogs.some(l => l.equipmentId === e.id && (l.type === "INSPECTION" || l.type === "فحص"));
        return hasInspectionOrder || hasInspectionDate || hasInspectionLog;
    }).length;

    // تحتاج إلى صيانة (متوقفة، تحت الصيانة، أو عليها أعطال/صيانة تصحيحية غير مكتملة)
    const needingMaintenance = data.equipment.filter(e => {
        if (e.status === "STOPPED" || e.status === "UNDER_MAINTENANCE") return true;
        return data.orders.some(o => o.equipmentId === e.id && o.status !== "COMPLETE" && (o.type === "BREAKDOWN" || o.type === "CORRECTIVE"));
    }).length;

    const openOrders = data.orders.filter(o => o.status !== "COMPLETE").length;

    // الفحوصات المستحقة (متأخرة أو خلال 14 يوماً — فقط للمعدات ذات موعد مسجل)
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 86400000);
    const dueInspections = data.equipment.filter(e => {
        const dueStr = e.nextInspectionDue || e.nextDue;
        if (!dueStr) return false;
        const dueDate = MC.toDate(dueStr);
        if (!dueDate || isNaN(dueDate.getTime())) return false;
        return dueDate <= in14Days;
    }).length;

    const equipmentWithFaults = data.equipment.filter(e => {
        return data.orders.some(o => o.equipmentId === e.id && o.type === "BREAKDOWN" && o.status !== "COMPLETE");
    }).length;

    const card = (label, labelEn, value, icon, cls, clickFn) => `
        <button type="button" class="ff-stat ${cls || ""}" onclick="${clickFn}" title="${label} — ${labelEn}">
            <div class="ff-stat-top"><span class="ff-stat-icon">${icon}</span><span>${label}<br><small style="font-weight:600;opacity:.75;">${labelEn}</small></span></div>
            <span class="ff-stat-val">${value}</span>
        </button>`;

    const cards = [];
    if (approvedTotal !== null) cards.push(card("الكمية المعتمدة", "Approved qty", approvedTotal, "📋", "is-blue", "ffSwitchView('groups')"));
    cards.push(
        card("الوحدات المسجلة فردياً", "Registered units", totalUnits, "⚙️", "", "ffSwitchView('groups')"),
        card("وحدات عاملة", "Operational", operationalUnits, "🟢", operationalUnits ? "is-ok" : "", "ffSwitchView('groups')"),
        card("تحتاج إلى صيانة", "Need maintenance", needingMaintenance, "⚠️", needingMaintenance ? "is-warn" : "", "ffFilterTracker('ongoing')"),
        card("الفحوصات المستحقة", "Inspections due", dueInspections, "🗓️", dueInspections ? "is-warn" : "", "ffFilterTracker('due_soon')"),
        card("أوامر العمل المفتوحة", "Open work orders", openOrders, "🔴", openOrders ? "is-danger" : "", "ffSwitchView('orders')"),
        card("أعطال مفتوحة", "Open faults", equipmentWithFaults, "🚨", equipmentWithFaults ? "is-danger" : "", "ffFilterTracker('faults')"),
        card("وحدات تم فحصها", "Inspected", inspectedUnits, "✅", inspectedUnits ? "is-ok" : "", "ffFilterTracker('completed')")
    );
    host.innerHTML = cards.join("");
}

function ffFilterTracker(type) {
    ffActiveView = "tracker";
    ffTrackerFilter = type;
    ffDetail = null;
    ffUpdateSubnavButtons();
    renderFFContent();
}

// ---------- شريط البحث والتصفية ----------
function ffFillToolbar() {
    const statusEl = document.getElementById("ffStatus");
    if (statusEl) {
        statusEl.innerHTML = `<option value="">كل الحالات التشغيلية</option>` +
            MC.EQUIPMENT_STATUSES.map(s => `<option value="${s}">${MC.equipStatusLabel(s)}</option>`).join("");
        statusEl.value = ffStatusFilter;
    }
    const typeEl = document.getElementById("ffType");
    if (typeEl) {
        const opts = [];
        const seen = {};
        const add = (value, label) => { if (value && !seen[value]) { seen[value] = 1; opts.push({ value: value, label: label }); } };
        (MC.deptTypes("fire-fighting") || []).forEach(t => add(t, t));
        MC.FF_CATALOG_SEED.filter(c => ffFacilityFilter === "unassigned" || c.facility === ffFacilityFilter)
            .forEach(c => add(c.name, c.nameAr ? c.name + " — " + c.nameAr : c.name));
        typeEl.innerHTML = `<option value="">كل الأنواع</option>` +
            opts.map(o => `<option value="${escapeHTML(o.value)}">${escapeHTML(o.label)}</option>`).join("");
        typeEl.value = ffTypeFilter;
    }
    const mEl = document.getElementById("ffMaint"); if (mEl) mEl.value = ffMaintFilter;
    const iEl = document.getElementById("ffInsp"); if (iEl) iEl.value = ffInspFilter;
}

function ffOnSearch(v) { ffSearch = v || ""; renderFFContent(); }
function ffOnGroupFilter(v) { ffGroupFilter = v || ""; renderFFContent(); }
function ffOnStatus(v) { ffStatusFilter = v || ""; renderFFContent(); }
function ffOnType(v) { ffTypeFilter = v || ""; renderFFContent(); }
function ffOnMaint(v) { ffMaintFilter = v || ""; renderFFContent(); }
function ffOnInsp(v) { ffInspFilter = v || ""; renderFFContent(); }
function ffResetFilters() {
    ffSearch = "";
    ffGroupFilter = "";
    ffStatusFilter = "";
    ffTypeFilter = "";
    ffMaintFilter = "";
    ffInspFilter = "";
    ["ffSearch", "ffGroupFilter", "ffStatus", "ffType", "ffMaint", "ffInsp"].forEach(function (id) {
        const el = document.getElementById(id); if (el) el.value = "";
    });
    renderFFContent();
}

// ---------- رسم المحتوى الرئيسي ----------
function renderFFContent() {
    const host = document.getElementById("ffContent");
    if (!host) return;

    if (ffDetail) {
        if (ffDetail.kind === "pump" || ffDetail.kind === "unit") {
            host.innerHTML = renderFFUnitDetail(ffDetail.id);
        } else if (ffDetail.kind === "type") {
            host.innerHTML = renderFFTypeDetail(ffDetail.id);
        }
        return;
    }

    if (ffActiveView === "tracker") {
        host.innerHTML = renderFFTrackerView();
    } else if (ffActiveView === "orders") {
        host.innerHTML = renderFFOrdersView();
    } else {
        if (!ffActiveGroup) {
            host.innerHTML = renderFFGroups();
        } else {
            host.innerHTML = renderFFGroupView(ffActiveGroup);
        }
    }
}

// ============================================================
// العرض 1: نظرة عامة على مجموعات الجهة المختارة
// ============================================================
function renderFFGroups() {
    const data = ffFireData();
    const fac = ffFacilityFilter;
    const facName = ffFacilityMeta(fac).name;
    const totals = fac === "unassigned" ? { byGroup: {}, total: 0 } : MC.ffApprovedTotals(fac);
    const hint = ffFiltersActive()
        ? `<p class="ff-section-subtitle">الأرقام أدناه مصفاة حسب البحث أو التصفية الحالية (${escapeHTML(facName)}).</p>`
        : `<p class="ff-section-subtitle">معدات مكافحة الحريق — ${escapeHTML(facName)}، مقسّمة إلى مجموعات واضحة.</p>`;

    const visible = MC.FF_GROUPS.filter(g => g.id !== "fixed" || data.equipment.some(e => MC.ffGroupOf(e) === "fixed"));
    const cards = visible.map(function (g) {
        const groupEqs = data.equipment.filter(e => MC.ffGroupOf(e) === g.id);
        const eqs = ffApplyFilters(groupEqs);
        const eqIds = {};
        eqs.forEach(e => { eqIds[e.id] = 1; });
        const openFaults = data.orders.filter(o => o.status !== "COMPLETE" && o.equipmentId && eqIds[o.equipmentId]).length;
        const operational = eqs.filter(e => e.status === "OPERATIONAL").length;
        const approved = totals.byGroup[g.id] || 0;
        const muted = approved === 0 && groupEqs.length === 0;

        let note;
        if (muted) note = "لا توجد كمية مسجلة لهذه الجهة";
        else if (g.id === "pump-set" && fac === "hospital") note = "الكهربائية • الديزل • الجوكي + الصمامات والحساسات والمقاييس";
        else if (g.id === "pump-set" && fac === "complex") note = "العدد مسجل؛ الأنواع والمواصفات غير محددة بعد";
        else if (g.id === "extinguishers" && fac === "complex") note = "العدد مسجل؛ الأنواع والسعات غير محددة بعد";
        else note = "";

        return `
        <button type="button" class="ff-group ${muted ? "is-muted" : ""}" onclick="ffOpenGroup('${g.id}')">
            <div class="ff-group-top">
                <div class="ff-group-icon">${g.icon}</div>
                <div>
                    <div class="ff-group-name">${escapeHTML(g.name)}</div>
                    <div class="ff-group-en">${escapeHTML(g.nameEn)}</div>
                    ${note ? `<div style="font-size:11px;color:var(--ff-muted);margin-top:2px;line-height:1.5;">${escapeHTML(note)}</div>` : ""}
                </div>
            </div>
            <div class="ff-group-counts">
                <span class="ff-count">الكمية المعتمدة <b>${approved || "—"}</b></span>
                <span class="ff-count">مسجلة فردياً <b>${eqs.length}</b></span>
                <span class="ff-count">عاملة <b>${operational}</b></span>
                <span class="ff-count ${openFaults ? "is-danger" : ""}">أعطال مفتوحة <b>${openFaults}</b></span>
            </div>
        </button>`;
    }).join("");

    const actionsBar = `
        <div style="display:flex;flex-wrap:wrap;gap:10px;padding:16px 16px 8px;">
            <button type="button" class="ff-btn is-primary" id="ffRegisterBtn" onclick="ffRegisterApprovedCatalog()" ${ffRegisterBusy ? "disabled" : ""}>📋 تسجيل الأنواع والكميات المعتمدة</button>
            <button type="button" class="ff-btn" onclick="ffOpenUnitModal(null, null, null)">➕ تسجيل وحدة فردية جديدة</button>
        </div>
        <p class="ff-section-subtitle" style="margin-top:2px;">
            تسجيل الأنواع والكميات المعتمدة يُسجل مواصفات جدول التجهيز والمضخات مرة واحدة دون تكرار. الوحدات الجديدة تُسجَّل بحالة «غير مفحوصة» حتى يوثَّق فحص فعلي.
        </p>`;

    return `<h3 class="ff-section-title">🏢 مجموعات المعدات — ${escapeHTML(facName)}</h3>${hint}<div class="ff-groups">${cards}</div>${actionsBar}`;
}

// بطاقة نوع معتمد واحد من الكتالوج
function ffRenderTypeCard(t, group, c) {
    const approvedQty = t.approvedQuantity;
    const hasQty = approvedQty !== null && approvedQty !== undefined;
    const remaining = hasQty ? Math.max(0, approvedQty - c.registered) : "غير محدد";
    const noteText = (t.sourceDescription || t.notes)
        ? `<div style="font-size:11px;color:#92400e;background:var(--ff-amber-bg);padding:4px 8px;border-radius:6px;margin-top:4px;">${t.sourceDescription ? `وصف المصدر الأصلي: «${escapeHTML(t.sourceDescription)}» — ` : ""}${escapeHTML(t.notes || "")}</div>`
        : "";
    return `
    <div class="ff-type-card">
        <div class="ff-type-top">
            <div>
                <div class="ff-type-title">${escapeHTML(t.nameAr || t.name)}${ffModeBadge(t.ffMode)}</div>
                <div class="ff-type-meta">${escapeHTML(t.name)} · ${escapeHTML(group.name)}</div>
            </div>
            <span class="ff-pill st-NEW">معتمد</span>
        </div>
        <div class="ff-qty-bar">
            <span><i>الكمية المعتمدة</i><b>${hasQty ? approvedQty + " " + (t.unit === "pcs" ? "قطعة" : (t.unit || "")) : "—"}</b></span>
            <span><i>مسجل فردياً</i><b>${c.registered}</b></span>
            <span><i>المتبقي</i><b>${remaining === "غير محدد" ? "—" : remaining}</b></span>
        </div>
        <div style="font-size:11.5px;color:var(--ff-muted);">
            <span class="ff-mi">ذوو فحص موثق: <b>${c.withInspections}</b></span><span class="ff-mi">أعطال مفتوحة: <b>${c.withOpenFaults}</b></span>
        </div>
        ${noteText}
        <div class="ff-type-actions">
            <button type="button" class="ff-btn-sm is-primary" onclick="ffOpenType('${t.id}')">عرض الوحدات المسجلة (${c.registered}) ←</button>
            <button type="button" class="ff-btn-sm" onclick="ffOpenUnitModal(null, '${group.id}', '${t.id}')">➕ تسجيل وحدة</button>
        </div>
    </div>`;
}

// ============================================================
// العرض 2: تفاصيل مجموعة واحدة ضمن الجهة المختارة
// ============================================================
function renderFFGroupView(groupId) {
    const group = MC.FF_GROUPS.find(g => g.id === groupId);
    if (!group) return renderFFGroups();
    const data = ffFireData();
    const fac = ffFacilityFilter;
    const facName = ffFacilityMeta(fac).name;
    const allGroupEqs = data.equipment.filter(e => MC.ffGroupOf(e) === group.id);
    const eqs = ffApplyFilters(allGroupEqs)
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar"));

    const backBtn = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 16px 4px;">
            <button type="button" class="ff-back" style="margin:0;" onclick="ffOpenGroup(null)">→ كل المجموعات</button>
            <button type="button" class="ff-btn is-primary" onclick="ffOpenUnitModal(null, '${group.id}', null)">➕ تسجيل وحدة فردية</button>
        </div>`;

    const title = `
        <h3 class="ff-section-title">${group.icon} ${escapeHTML(group.name)}</h3>
        <div class="ff-title-sub">${escapeHTML(group.nameEn)} · ${escapeHTML(facName)}</div>
        <p class="ff-section-subtitle">الوحدات الفردية المسجلة في هذه المجموعة لدى ${escapeHTML(facName)}: <b>${allGroupEqs.length}</b> وحدة.</p>`;

    // ---- مضخات المستشفى (بطاقات مستقلة بالمواصفات الفنية) ----
    let pumpSetHtml = "";
    if (group.id === "pump-set" && fac === "hospital") {
        const pumpAr = { "ff-pump-electric": "المضخة الكهربائية", "ff-pump-diesel": "مضخة الديزل", "ff-pump-jockey": "مضخة الجوكي" };
        const pumpCards = MC.FF_PUMP_SEED.filter(seed => ffCatalogMatchesPump(seed)).map(function (seed) {
            const unit = data.equipment.find(e => e.id === seed.id) || null;
            const status = unit ? (unit.status || "UNVERIFIED") : "NOT_REGISTERED";
            const stLabel = unit ? MC.equipStatusLabel(status) : "لم تسجل بعد في قاعدة البيانات";
            const stClass = unit ? `st-${status}` : "st-OUT_OF_SERVICE";
            const tech = seed.techData || {};
            const noteHtml = seed.id === "ff-pump-diesel" ? `
                <div class="ff-review-note">
                    ⚠️ <b>ملاحظة للمراجعة الفنية:</b> مواصفات محرك الديزل الكهربائية (القدرة 75 kW، الجهد 400 V، التردد 50 Hz) مسجلة حسب جدول التجهيز كما وردت دون تغيير، وتتطلب مراجعة وتأكيداً فنياً.
                </div>` : "";
            const clickAction = unit ? `onclick="ffOpenPump('${unit.id}')"` : `onclick="ffRegisterApprovedCatalog()"`;
            const last = unit && unit.lastInspectionDate ? MC.formatDateShort(unit.lastInspectionDate) : "لم تُفحص بعد";
            const next = unit && unit.nextInspectionDue ? MC.formatDateShort(unit.nextInspectionDue) : "غير محدد";
            return `
            <div class="ff-pump-card" ${clickAction}>
                <div class="ff-pump-top">
                    <div>
                        <div class="ff-pump-name">⚡ ${escapeHTML(pumpAr[seed.id] || seed.name)}</div>
                        <div class="ff-pump-en">${escapeHTML(seed.name)}</div>
                    </div>
                    <span class="ff-pill ${stClass}">${escapeHTML(stLabel)}</span>
                </div>
                <div class="ff-specs-grid">
                    <div class="ff-spec-item"><span class="ff-spec-lbl">الضغط (Head)</span><span class="ff-spec-val">${escapeHTML(tech.head || "—")}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">التصريف (Flow)</span><span class="ff-spec-val">${escapeHTML(tech.flow || "—")}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">القدرة (Power)</span><span class="ff-spec-val">${escapeHTML(tech.power || "—")}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">الجهد (Voltage)</span><span class="ff-spec-val">${escapeHTML(tech.voltage || "—")}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">التردد (Frequency)</span><span class="ff-spec-val">${escapeHTML(tech.frequency || "—")}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">رقم المعدة / Tag</span><span class="ff-spec-val">${unit && unit.tagNumber ? escapeHTML(unit.tagNumber) : "—"}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">آخر فحص</span><span class="ff-spec-val">${escapeHTML(last)}</span></div>
                    <div class="ff-spec-item"><span class="ff-spec-lbl">الفحص القادم</span><span class="ff-spec-val">${escapeHTML(next)}</span></div>
                </div>
                ${noteHtml}
                <div class="ff-pump-footer">
                    <span>${unit ? "عرض السجل والتفاصيل الفنية وسجل الصيانة" : "اضغط للتسجيل الأولي"}</span>
                    <span>←</span>
                </div>
            </div>`;
        }).join("");

        pumpSetHtml = `
        <div class="ff-pumpset-box">
            <div class="ff-pumpset-head">
                <div class="ff-pumpset-head-icon">🚒</div>
                <div>
                    <div class="ff-pumpset-title">مضخات الحريق — Fire Pumps</div>
                    <div class="ff-pumpset-sub">ثلاث مضخات بسجلات مستقلة (فحص وصيانة وأعطال لكل مضخة).</div>
                </div>
            </div>
            <div class="ff-pump-grid">${pumpCards || `<div class="ff-empty">لا توجد مضخات مطابقة للبحث الحالي.</div>`}</div>
            <div class="ff-accessories-box">
                <div class="ff-accessories-title">⚙️ الصمامات والحساسات وأجهزة القياس والتحكم (Valves, Sensors, Gauges & Controls)</div>
                <div class="ff-accessories-chips">
                    <span class="ff-chip">Valves — الصمامات</span>
                    <span class="ff-chip">Sensors — الحساسات</span>
                    <span class="ff-chip">Pressure Gauges — مقاييس الضغط</span>
                    <span class="ff-chip">Other Accessories — أجهزة القياس والتحكم الأخرى</span>
                </div>
                <p class="ff-accessories-note">
                    ℹ️ مواصفات وأعداد هذه الملحقات غير واردة في المصدر؛ سُجلت أنواعها دون اختراع أعداد، وتُضاف الوحدات الفردية عند توفر البيانات.
                </p>
            </div>
        </div>`;
    }

    // ---- ملاحظة بيانات لمطافئ المستشفى (الأعداد كما وردت دون تعديل) ----
    let dataNote = "";
    if (group.id === "extinguishers" && fac === "hospital") {
        dataNote = `<div class="ff-data-note">ℹ️ أعداد أنواع المطافئ (221 / 14 / 38 قطعة) مسجلة كما وردت في المصدر الحالي ولم تُعدَّل. إن وُجد سجل أحدث بأعداد مختلفة فيجب مطابقته قبل اعتماد أي تغيير.</div>`;
    }

    // ---- الأنواع والكميات المعتمدة للجهة ----
    let catalogHtml = "";
    const catTypes = fac === "unassigned" ? [] : MC.FF_CATALOG_SEED.filter(t => t.ffGroup === group.id && t.facility === fac && ffCatalogMatches(t));
    if (catTypes.length) {
        const counts = MC.ffCatalogCounts(catTypes, data.equipment, data.orders);
        const cardOf = t => ffRenderTypeCard(t, group, counts[t.id] || { registered: 0, withInspections: 0, withOpenFaults: 0 });
        let inner;
        if (group.id === "extinguishers") {
            const sections = [
                ["portable", "المطافئ المحمولة — Portable"],
                ["automatic", "المطافئ الأوتوماتيكية — Automatic"],
                [null, "غير محددة النوع في المصدر — Unspecified"]
            ];
            inner = sections.map(function (sec) {
                const list = catTypes.filter(t => (t.ffMode || null) === sec[0]);
                return list.length ? `<h5 class="ff-subgroup-title">${sec[1]}</h5><div class="ff-catalog-grid">${list.map(cardOf).join("")}</div>` : "";
            }).join("");
        } else {
            inner = `<div class="ff-catalog-grid">${catTypes.map(cardOf).join("")}</div>`;
        }
        catalogHtml = `<h4 class="ff-section-title">📋 الأنواع والكميات المعتمدة</h4>${inner}`;
    }

    // ---- الوحدات المسجلة فردياً ----
    let rowsHtml = "";
    if (eqs.length) {
        const rows = eqs.map(function (e) {
            const isPump = MC.FF_PUMP_SEED.some(p => p.id === e.id);
            const openFn = isPump ? `ffOpenPump('${e.id}')` : `ffOpenUnit('${e.id}')`;
            const stCls = "st-" + (e.status || "UNVERIFIED");
            const cat = ffCatalogOf(e);
            const tagStr = e.tagNumber
                ? `<span style="font-weight:700;color:var(--ff-dark);">Tag: ${escapeHTML(e.tagNumber)}</span>`
                : (e.internalCode ? `<span style="color:var(--ff-muted);">رمز داخلي: ${escapeHTML(e.internalCode)} <small>(غير رسمي)</small></span>` : `<span style="color:var(--ff-muted);">بدون رمز</span>`);
            return `
            <div class="ff-row" onclick="${openFn}">
                <div class="ff-row-title">
                    <span>${isPump ? "⚡" : group.icon} ${escapeHTML(e.name || "معدة بدون اسم")}${ffModeBadge(cat && cat.ffMode)}</span>
                    <span class="ff-pill ${stCls}">${escapeHTML(MC.equipStatusLabel(e.status))}</span>
                </div>
                <div class="ff-row-meta">
                    <span class="ff-mi">${tagStr}</span>
                    <span class="ff-mi">النوع: ${escapeHTML(e.type || "—")}</span>
                    <span class="ff-mi">الموقع: ${e.location ? escapeHTML(e.location) : "غير محدد"}</span>
                    <span class="ff-mi">آخر فحص: ${e.lastInspectionDate ? MC.formatDateShort(e.lastInspectionDate) : "لم تُفحص بعد"}</span>
                    ${e.nextInspectionDue ? `<span class="ff-mi">الفحص القادم: ${MC.formatDateShort(e.nextInspectionDue)}</span>` : ""}
                </div>
                <div style="font-size:11.5px;color:var(--ff-green);font-weight:700;margin-top:4px;">افتح صفحة التفاصيل والسجلات ←</div>
            </div>`;
        }).join("");
        rowsHtml = `<h4 class="ff-section-title">⚙️ الوحدات المسجلة فردياً (${eqs.length})</h4>${rows}`;
    } else {
        rowsHtml = `
            <div class="ff-empty">
                <div class="ff-empty-icon">📦</div>
                ${ffFiltersActive() ? "لا توجد وحدات مطابقة للتصفية الحالية." : "لم تُسجَّل وحدات فردية تفصيلية لهذه المجموعة بعد. يمكنك تسجيلها تدريجياً عند توفر أرقامها ومواقعها."}
            </div>`;
    }

    return `${backBtn}${title}${pumpSetHtml}${dataNote}${catalogHtml}${rowsHtml}`;
}

// مطابقة مضخة معتمدة مع البحث/النوع الحالي (بطاقات مضخات المستشفى)
function ffCatalogMatchesPump(seed) {
    if (ffTypeFilter && seed.type !== ffTypeFilter && seed.name !== ffTypeFilter) return false;
    const q = (ffSearch || "").trim().toLowerCase();
    if (!q) return true;
    const ar = { "ff-pump-electric": "المضخة الكهربائية", "ff-pump-diesel": "مضخة الديزل", "ff-pump-jockey": "مضخة الجوكي" }[seed.id] || "";
    return [seed.name, ar, seed.type].join(" ").toLowerCase().indexOf(q) !== -1;
}

function ffOpenGroup(groupId) {
    ffActiveGroup = groupId || null;
    ffDetail = null;
    renderFFContent();
    const host = document.getElementById("ffContent");
    if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// العرض 3: صفحة تفاصيل المعدة الفردية (مضخة أو وحدة مسجلة)
// تشمل: المعلومات الأساسية، الفحوصات، الصيانة، الأعطال، أوامر العمل، وسجل التغييرات.
// ============================================================
function ffOpenPump(pumpId) {
    ffDetail = { kind: "pump", id: pumpId, tab: "info" };
    renderFFContent();
    const host = document.getElementById("ffContent");
    if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ffOpenUnit(unitId) {
    ffDetail = { kind: "unit", id: unitId, tab: "info" };
    renderFFContent();
    const host = document.getElementById("ffContent");
    if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ffCloseDetail() {
    ffDetail = null;
    renderFFContent();
}

function ffSwitchDetailTab(tabName) {
    if (!ffDetail) return;
    ffDetail.tab = tabName || "info";
    renderFFContent();
}

function ffOpenType(typeId) {
    ffDetail = { kind: "type", id: typeId, tab: "units" };
    renderFFContent();
    const host = document.getElementById("ffContent");
    if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFFUnitDetail(unitId) {
    const data = ffFireDataAll();
    let eq = data.equipment.find(e => e.id === unitId);

    // إذا كانت مضخة مسجلة كبذرة ولم تُحفظ بعد في Firestore
    const pumpSeed = MC.FF_PUMP_SEED.find(p => p.id === unitId);
    if (!eq && pumpSeed) {
        eq = {
            id: pumpSeed.id,
            name: pumpSeed.name,
            department: "fire-fighting",
            type: pumpSeed.type,
            status: "UNVERIFIED",
            techData: pumpSeed.techData,
            notes: pumpSeed.notes || "",
            location: "غرفة مضخات الحريق"
        };
    }

    if (!eq) {
        return `
        <div class="ff-detail-page">
            <button type="button" class="ff-back" onclick="ffCloseDetail()">→ عودة</button>
            <div class="ff-empty"><div class="ff-empty-icon">⚠️</div>لم يتم العثور على سجل لهذه المعدة.</div>
        </div>`;
    }

    const currentTab = (ffDetail && ffDetail.tab) || "info";
    const status = eq.status || "UNVERIFIED";
    const stPill = `<span class="ff-pill st-${status}">${escapeHTML(MC.equipStatusLabel(status))}</span>`;
    const logs = MC.ffUnitLogs(data.orders, data.pmLogs, eq.id);

    // التحقق من نوع المعدة والمواصفات
    const isPump = MC.FF_PUMP_SEED.some(p => p.id === eq.id);
    const techData = eq.techData || {};
    const techKeys = Object.keys(techData);

    const backAction = ffActiveGroup ? `ffOpenGroup('${ffActiveGroup}')` : `ffCloseDetail()`;

    // ---------------- زر إجراءات المعدة ----------------
    const heroActions = `
        <div class="ff-detail-actions">
            <button type="button" class="ff-btn is-primary" onclick="ffOpenInspectionModal('${eq.id}')">🔍 تسجيل فحص جديد</button>
            <button type="button" class="ff-btn" onclick="ffOpenMaintenanceModal('${eq.id}')">🔧 تسجيل صيانة جديدة</button>
            <button type="button" class="ff-btn is-danger" onclick="ffOpenFaultModal('${eq.id}')">⚠️ تسجيل عطل</button>
            <button type="button" class="ff-btn" onclick="ffOpenOrderModal('${eq.id}')">📋 أمر عمل جديد</button>
            <button type="button" class="ff-btn" onclick="ffOpenEditEquipmentModal('${eq.id}')">✏️ تعديل بيانات المعدة</button>
        </div>`;

    // ---------------- تبويبات تفاصيل المعدة ----------------
    const tabBtn = (t, label, count) => `
        <button type="button" class="ff-detail-tab-btn ${currentTab === t ? "is-active" : ""}" onclick="ffSwitchDetailTab('${t}')">
            ${label} ${count !== undefined ? `(${count})` : ""}
        </button>`;

    const detailTabs = `
        <div class="ff-detail-tabs">
            ${tabBtn("info", "المعلومات الفنية")}
            ${tabBtn("inspections", "سجل الفحوصات", logs.inspections.length)}
            ${tabBtn("maintenance", "سجل الصيانة", logs.maintenance.length)}
            ${tabBtn("faults", "سجل الأعطال", logs.faults.length)}
            ${tabBtn("orders", "أوامر العمل المرتبطة", logs.workOrders.length)}
            ${tabBtn("changes", "سجل التغييرات", (eq.changeLog || []).length)}
        </div>`;

    // ---------------- محتوى التبويب النشط ----------------
    let tabContent = "";

    // 1. تبويب المعلومات الفنية
    if (currentTab === "info") {
        let specsRows = "";
        if (techKeys.length) {
            specsRows = `
            <div class="ff-specs-grid" style="grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;padding:12px;margin:12px 0;">
                ${techKeys.map(k => `
                    <div class="ff-spec-item">
                        <span class="ff-spec-lbl">${escapeHTML(MC.techLabel(k))}</span>
                        <span class="ff-spec-val" style="font-size:13.5px;">${escapeHTML(techData[k])}</span>
                    </div>`).join("")}
            </div>`;
        }

        let dieselAlert = "";
        if (eq.id === "ff-pump-diesel" || (eq.notes && eq.notes.includes("مراجعة فنية"))) {
            dieselAlert = `
            <div class="ff-review-note" style="margin:12px 0;padding:12px 14px;font-size:12px;">
                ⚠️ <b>ملاحظة للمراجعة الفنية:</b> القدرة 75 kW والجهد 400 V والتردد 50 Hz مسجّلة حسب جدول التجهيز كما وردت دون تغيير، ومواصفات محرك الديزل الكهربائية تحتاج إلى مراجعة فنية قبل الاعتماد النهائي.
            </div>`;
        }

        tabContent = `
        <div style="background:#fff;border:1px solid var(--ff-border);border-radius:16px;padding:16px;text-align:right;">
            <h4 style="margin:0 0 10px;font-size:15px;color:var(--ff-dark);">المواصفات والبيانات التشغيلية</h4>
            <div class="ff-info-grid">
                <div class="ff-info-item"><span class="ff-info-lbl">الجهة التابعة</span><span class="ff-info-val">${escapeHTML(ffFacilityMeta(MC.ffFacilityOf(eq)).name)} (${escapeHTML(ffFacilityMeta(MC.ffFacilityOf(eq)).nameEn)})</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">التصنيف</span><span class="ff-info-val">${escapeHTML(eq.type || "—")} — ${escapeHTML(ffGroupMeta(MC.ffGroupOf(eq)).name)} (${escapeHTML(ffGroupMeta(MC.ffGroupOf(eq)).nameEn)})${ffModeBadge((ffCatalogOf(eq) || {}).ffMode)}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">الموقع</span><span class="ff-info-val">${eq.location ? escapeHTML(eq.location) : "<span style='color:var(--ff-muted);'>غير محدد بدقة</span>"}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">رقم المعدة (Tag)</span><span class="ff-info-val">${eq.tagNumber ? escapeHTML(eq.tagNumber) : "<span style='color:var(--ff-muted);'>غير متوفر</span>"}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">الرمز الداخلي</span><span class="ff-info-val">${eq.internalCode ? escapeHTML(eq.internalCode) + " <small style='color:var(--ff-muted);'>(رمز داخلي مؤقت غير رسمي)</small>" : "<span style='color:var(--ff-muted);'>—</span>"}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">الرقم التسلسلي (Serial)</span><span class="ff-info-val">${eq.serialNumber ? escapeHTML(eq.serialNumber) : "<span style='color:var(--ff-muted);'>غير مسجل</span>"}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">الشركة المصنعة / الموديل</span><span class="ff-info-val">${[eq.manufacturer, eq.model].filter(Boolean).join(" - ") || "<span style='color:var(--ff-muted);'>غير مسجل</span>"}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">آخر فحص موثق</span><span class="ff-info-val">${eq.lastInspectionDate ? MC.formatDateShort(eq.lastInspectionDate) : "<span style='color:var(--ff-muted);'>لم يُجرَ فحص موثق بعد</span>"}</span></div>
                <div class="ff-info-item"><span class="ff-info-lbl">موعد الفحص القادم</span><span class="ff-info-val">${eq.nextInspectionDue ? MC.formatDateShort(eq.nextInspectionDue) : "<span style='color:var(--ff-muted);'>غير محدد</span>"}</span></div>
            </div>
            ${specsRows}
            ${dieselAlert}
            ${eq.notes ? `<div style="margin-top:10px;font-size:12.5px;color:var(--ff-muted);background:#f8fafc;padding:10px;border-radius:10px;"><b>ملاحظات فنية:</b> ${escapeHTML(eq.notes)}</div>` : ""}
        </div>`;
    }

    // 2. تبويب سجل الفحوصات
    else if (currentTab === "inspections") {
        const inspList = logs.inspections.sort((a,b) => (MC.toDate(b.createdAt||b.performedAt)||0) - (MC.toDate(a.createdAt||a.performedAt)||0));
        const items = inspList.map(i => {
            const dateStr = MC.formatDateShort(i.completedAt || i.performedAt || i.createdAt);
            const nextDueStr = i.nextDue ? MC.formatDateShort(i.nextDue) : "غير محدد";
            return `
            <div class="ff-row" style="cursor:default;">
                <div class="ff-row-title">
                    <span>🔍 فحص بتاريخ: ${dateStr}</span>
                    <span class="ff-pill st-COMPLETE">${escapeHTML(i.inspectionResult || "سليم")}</span>
                </div>
                <div class="ff-row-meta">
                    ${i.inspectorName || i.performedBy ? "الفاحص: <b>" + escapeHTML(i.inspectorName || i.performedBy) + "</b> · " : ""}
                    موعد الفحص القادم: <b>${nextDueStr}</b>
                    ${i.orderNumber ? " · أمر العمل: " + escapeHTML(i.orderNumber) : ""}
                </div>
                ${i.notes ? `<div style="font-size:12px;margin-top:5px;color:var(--ff-ink);"><b>الملاحظات:</b> ${escapeHTML(i.notes)}</div>` : ""}
                ${i.requiredActions ? `<div style="font-size:12px;margin-top:3px;color:var(--ff-amber);"><b>الإجراءات المطلوبة:</b> ${escapeHTML(i.requiredActions)}</div>` : ""}
            </div>`;
        }).join("");

        tabContent = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h4 style="margin:0;font-size:15px;color:var(--ff-dark);">سجلات الفحص الموثقة</h4>
                <button type="button" class="ff-btn is-primary" onclick="ffOpenInspectionModal('${eq.id}')">➕ تسجيل فحص جديد</button>
            </div>
            ${inspList.length ? items : `<div class="ff-empty"><div class="ff-empty-icon">🔍</div>لم يتم توثيق أي فحص لهذه المعدة حتى الآن. المعدة لا تُعتبر مفحوصة ما لم يتوفر سجل يثبت ذلك.</div>`}`;
    }

    // 3. تبويب سجل الصيانة
    else if (currentTab === "maintenance") {
        const maintList = logs.maintenance.sort((a,b) => (MC.toDate(b.performedAt||b.createdAt)||0) - (MC.toDate(a.performedAt||a.createdAt)||0));
        const items = maintList.map(m => {
            const dateStr = MC.formatDateShort(m.performedAt || m.createdAt);
            const partsStr = (m.parts && m.parts.length)
                ? m.parts.map(p => `${p.name} (عدد ${p.quantity || p.qty || 1})`).join("، ")
                : "لا توجد قطع مستبدلة";
            return `
            <div class="ff-row" style="cursor:default;">
                <div class="ff-row-title">
                    <span>🔧 صيانة (${escapeHTML(MC.pmTypeLabel ? MC.pmTypeLabel(m.type) : m.type)}) بتاريخ: ${dateStr}</span>
                    <span class="ff-pill st-COMPLETE">${escapeHTML(m.status || "COMPLETE")}</span>
                </div>
                <div class="ff-row-meta">
                    ${m.performedBy ? "الفني المسؤول: <b>" + escapeHTML(m.performedBy) + "</b> · " : ""}
                    ${m.cost ? "التكلفة: <b>" + Number(m.cost).toLocaleString() + " د.ع</b> · " : ""}
                    القطع: ${escapeHTML(partsStr)}
                </div>
                ${m.description ? `<div style="font-size:12px;margin-top:5px;color:var(--ff-ink);"><b>وصف العمل:</b> ${escapeHTML(m.description)}</div>` : ""}
                ${m.notes ? `<div style="font-size:12px;margin-top:3px;color:var(--ff-muted);"><b>ملاحظات:</b> ${escapeHTML(m.notes)}</div>` : ""}
            </div>`;
        }).join("");

        tabContent = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h4 style="margin:0;font-size:15px;color:var(--ff-dark);">سجلات الصيانة المنفذة</h4>
                <button type="button" class="ff-btn is-primary" onclick="ffOpenMaintenanceModal('${eq.id}')">➕ تسجيل صيانة جديدة</button>
            </div>
            ${maintList.length ? items : `<div class="ff-empty"><div class="ff-empty-icon">🔧</div>لا توجد عمليات صيانة مسجلة لهذه المعدة بعد.</div>`}`;
    }

    // 4. تبويب سجل الأعطال
    else if (currentTab === "faults") {
        const faultList = logs.faults.sort((a,b) => (MC.toDate(b.createdAt)||0) - (MC.toDate(a.createdAt)||0));
        const items = faultList.map(f => {
            const dateStr = MC.formatDateShort(f.createdAt);
            const isResolved = f.status === "COMPLETE";
            const closeBtn = isResolved
                ? `<span style="font-size:11.5px;color:var(--ff-green);font-weight:700;">تم الإغلاق بتاريخ: ${MC.formatDateShort(f.completedAt)}</span>`
                : `<button type="button" class="ff-btn-sm is-primary" onclick="ffOpenResolveFaultModal('${f.id}')">معالجة وإغلاق العطل</button>`;
            return `
            <div class="ff-row" style="cursor:default;">
                <div class="ff-row-title">
                    <span>⚠️ ${escapeHTML(f.title || f.description || "عطل")}</span>
                    <div>
                        <span class="ff-pill p-${escapeHTML(f.priority || "MEDIUM")}">${escapeHTML(MC.priorityLabel(f.priority))}</span>
                        <span class="ff-pill st-${escapeHTML(f.status || "NEW")}">${escapeHTML(MC.statusLabel(f.status))}</span>
                    </div>
                </div>
                <div class="ff-row-meta">
                    تاريخ التسجيل: <b>${dateStr}</b>
                    ${f.orderNumber ? " · رقم الأمر: " + escapeHTML(f.orderNumber) : ""}
                    ${f.assignedTo ? " · المسؤول: " + escapeHTML(f.assignedTo) : ""}
                </div>
                ${f.description ? `<div style="font-size:12px;margin-top:5px;color:var(--ff-ink);"><b>تفاصيل العطل:</b> ${escapeHTML(f.description)}</div>` : ""}
                ${f.actionTaken ? `<div style="font-size:12px;margin-top:3px;color:var(--ff-muted);"><b>الإجراء المتخذ:</b> ${escapeHTML(f.actionTaken)}</div>` : ""}
                ${f.resolution ? `<div style="font-size:12px;margin-top:3px;color:var(--ff-green);"><b>المعالجة:</b> ${escapeHTML(f.resolution)}</div>` : ""}
                <div style="margin-top:8px;display:flex;justify-content:flex-end;">${closeBtn}</div>
            </div>`;
        }).join("");

        tabContent = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h4 style="margin:0;font-size:15px;color:var(--ff-dark);">سجل الأعطال والمشاكل الفنية</h4>
                <button type="button" class="ff-btn is-danger" onclick="ffOpenFaultModal('${eq.id}')">➕ تسجيل عطل جديد</button>
            </div>
            ${faultList.length ? items : `<div class="ff-empty"><div class="ff-empty-icon">✅</div>لا توجد أعطال مسجلة على هذه المعدة.</div>`}`;
    }

    // 5. تبويب أوامر العمل
    else if (currentTab === "orders") {
        const orderList = logs.workOrders.sort((a,b) => (MC.toDate(b.createdAt)||0) - (MC.toDate(a.createdAt)||0));
        const items = orderList.map(o => {
            const dateStr = MC.formatDateShort(o.createdAt);
            const reqLabel = MC.requestTypeLabel ? MC.requestTypeLabel(o.type) : o.type;
            return `
            <div class="ff-row" style="cursor:default;">
                <div class="ff-row-title">
                    <span>📋 ${escapeHTML(o.orderNumber || "—")} — ${escapeHTML(o.title || "أمر عمل")}</span>
                    <div>
                        <span class="ff-pill st-NEW">${escapeHTML(reqLabel)}</span>
                        <span class="ff-pill p-${escapeHTML(o.priority || "MEDIUM")}">${escapeHTML(MC.priorityLabel(o.priority))}</span>
                        <span class="ff-pill st-${escapeHTML(o.status || "NEW")}">${escapeHTML(MC.statusLabel(o.status))}</span>
                    </div>
                </div>
                <div class="ff-row-meta">
                    تاريخ الإنشاء: <b>${dateStr}</b>
                    ${o.assignedTo ? " · المسؤول: " + escapeHTML(o.assignedTo) : ""}
                    ${o.dueDate ? " · الاستحقاق: " + MC.formatDateShort(o.dueDate) : ""}
                </div>
                ${o.description ? `<div style="font-size:12px;margin-top:4px;color:var(--ff-ink);">${escapeHTML(o.description)}</div>` : ""}
            </div>`;
        }).join("");

        tabContent = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h4 style="margin:0;font-size:15px;color:var(--ff-dark);">أوامر العمل المرتبطة بهذه المعدة</h4>
                <button type="button" class="ff-btn is-primary" onclick="ffOpenOrderModal('${eq.id}')">➕ أمر عمل جديد</button>
            </div>
            ${orderList.length ? items : `<div class="ff-empty"><div class="ff-empty-icon">📋</div>لا توجد أوامر عمل مرتبطة بهذه المعدة.</div>`}`;
    }

    // 6. تبويب سجل التغييرات (Audit / Change Log)
    else if (currentTab === "changes") {
        const changes = (eq.changeLog || []).slice().reverse();
        const items = changes.map(c => `
            <div class="ff-row" style="cursor:default;">
                <div class="ff-row-title">
                    <span>تعديل في حقل: <b>${escapeHTML(c.field)}</b></span>
                    <span style="font-size:11px;color:var(--ff-muted);">${c.at ? MC.formatDateShort(c.at) : ""}</span>
                </div>
                <div class="ff-row-meta">
                    بواسطة: <b>${escapeHTML(c.by || "مستخدم")}</b>
                    <br>
                    القيمة السابقة: <code style="background:#fee2e2;padding:2px 6px;border-radius:4px;">${escapeHTML(String(c.previous || "فارغ"))}</code>
                    ←
                    القيمة الجديدة: <code style="background:#d1fae5;padding:2px 6px;border-radius:4px;">${escapeHTML(String(c.current || "فارغ"))}</code>
                </div>
            </div>`).join("");

        tabContent = `
            <h4 style="margin:0 0 10px;font-size:15px;color:var(--ff-dark);">سجل تعديل المعلومات الحساسة والأثر الإداري</h4>
            ${changes.length ? items : `<div class="ff-empty"><div class="ff-empty-icon">🕒</div>لم تسجل تعديلات على بيانات هذه المعدة بعد.</div>`}`;
    }

    return `
    <div class="ff-detail-page">
        <button type="button" class="ff-back" onclick="${backAction}">→ رجوع للقائمة</button>
        <div class="ff-detail-hero">
            <div class="ff-detail-hero-top">
                <div>
                    <h3 class="ff-detail-title">${isPump ? "⚡" : "🧯"} ${escapeHTML(eq.name || "—")}</h3>
                    <div class="ff-detail-subtitle">
                        ${eq.tagNumber ? "Tag: " + escapeHTML(eq.tagNumber) + " · " : ""}
                        ${eq.type ? escapeHTML(eq.type) + " · " : ""}
                        ${eq.location ? "الموقع: " + escapeHTML(eq.location) : "الموقع غير محدد"}
                    </div>
                </div>
                ${stPill}
            </div>
            ${heroActions}
        </div>
        ${detailTabs}
        <div style="margin-top:10px;">${tabContent}</div>
    </div>`;
}

// ============================================================
// العرض 4: صفحة تفاصيل نوع المعدة (مثل 6kg Dry Powder أو Fire Hydrant)
// تعرض الكمية المعتمدة مقابل المسجل فردياً + قائمة الوحدات المسجلة تحته
// ============================================================
function renderFFTypeDetail(typeId) {
    const data = ffFireData();
    const typeObj = MC.FF_CATALOG_SEED.find(t => t.id === typeId) || data.types.find(t => t.id === typeId);
    if (!typeObj) {
        return `
        <div class="ff-detail-page">
            <button type="button" class="ff-back" onclick="ffCloseDetail()">→ عودة</button>
            <div class="ff-empty">لم يتم العثور على هذا النوع في سجل الأنواع المعتمدة.</div>
        </div>`;
    }

    const units = data.equipment.filter(e => e.catalogTypeId ? e.catalogTypeId === typeId : e.type === typeObj.name);
    const approvedQty = typeObj.approvedQuantity;
    const remaining = (approvedQty !== null && approvedQty !== undefined) ? Math.max(0, approvedQty - units.length) : "غير محدد";

    const unitRows = units.map(u => {
        const stCls = "st-" + (u.status || "UNVERIFIED");
        return `
        <div class="ff-row" onclick="ffOpenUnit('${u.id}')">
            <div class="ff-row-title">
                <span>🧯 ${escapeHTML(u.name || "وحدة")}</span>
                <span class="ff-pill ${stCls}">${escapeHTML(MC.equipStatusLabel(u.status))}</span>
            </div>
            <div class="ff-row-meta">
                <span class="ff-mi">${u.tagNumber ? "Tag: <b>" + escapeHTML(u.tagNumber) + "</b>" : (u.internalCode ? "رمز داخلي: " + escapeHTML(u.internalCode) : "بدون رمز")}</span>
                <span class="ff-mi">الموقع: ${u.location ? escapeHTML(u.location) : "غير محدد"}</span>
                <span class="ff-mi">آخر فحص: ${u.lastInspectionDate ? MC.formatDateShort(u.lastInspectionDate) : "غير مفحوصة"}</span>
            </div>
            <div style="font-size:11.5px;color:var(--ff-green);font-weight:700;margin-top:4px;">افتح تفاصيل الوحدة ←</div>
        </div>`;
    }).join("");

    return `
    <div class="ff-detail-page">
        <button type="button" class="ff-back" onclick="ffCloseDetail()">→ عودة للمجموعات</button>
        <div class="ff-detail-hero">
            <div class="ff-detail-hero-top">
                <div>
                    <h3 class="ff-detail-title">📋 ${escapeHTML(typeObj.nameAr || typeObj.name)}${ffModeBadge(typeObj.ffMode)}</h3>
                    <div class="ff-detail-subtitle">${escapeHTML(typeObj.name)} · ${escapeHTML(ffFacilityMeta(typeObj.facility || ffFacilityFilter).name)} — سجل النوع المعتمد في جدول التجهيز</div>
                </div>
            </div>
            <div class="ff-qty-bar" style="margin-top:10px;">
                <span><i>الكمية المعتمدة</i><b>${approvedQty !== null && approvedQty !== undefined ? approvedQty + " " + (typeObj.unit === "pcs" ? "قطعة" : (typeObj.unit || "")) : "—"}</b></span>
                <span><i>المسجل فردياً</i><b>${units.length}</b></span>
                <span><i>المتبقي للتسجيل</i><b>${remaining === "غير محدد" ? "—" : remaining}</b></span>
            </div>
            ${typeObj.sourceDescription ? `<div style="margin-top:8px;font-size:12px;color:#92400e;background:var(--ff-amber-bg);padding:8px 10px;border-radius:9px;"><b>وصف المصدر الأصلي:</b> «${escapeHTML(typeObj.sourceDescription)}» ${typeObj.notes ? `— ${escapeHTML(typeObj.notes)}` : ""}</div>` : ""}
            <div class="ff-detail-actions" style="margin-top:12px;">
                <button type="button" class="ff-btn is-primary" onclick="ffOpenUnitModal(null, '${typeObj.ffGroup}', '${typeObj.id}')">➕ تسجيل وحدة فردية جديدة من هذا النوع</button>
            </div>
        </div>

        <h4 class="ff-section-title">الوحدات المسجلة فردياً تحت هذا النوع (${units.length})</h4>
        ${units.length ? unitRows : `
            <div class="ff-empty">
                <div class="ff-empty-icon">🧯</div>
                لم تُسجَّل وحدات فردية بهذا النوع بعد. الكمية المعتمدة (${approvedQty || 0}) محفوظة، ويمكن تسجيل أرقام Tag والمواقع تدريجياً عبر زر «تسجيل وحدة فردية جديدة».
            </div>`}
    </div>`;
}

// ============================================================
// العرض 5: لوحة متابعة الفحص والصيانة (Inspection & Maintenance Tracker)
// ============================================================
function renderFFTrackerView() {
    const data = ffFireData();
    data.equipment = ffApplyFilters(data.equipment);
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 86400000);

    const uninspected = data.equipment.filter(e => {
        const hasInspection = data.orders.some(o => o.equipmentId === e.id && o.type === "INSPECTION" && o.status === "COMPLETE") || e.lastInspectionDate;
        return !hasInspection || e.status === "UNVERIFIED";
    });

    const dueSoon = data.equipment.filter(e => {
        const dueStr = e.nextInspectionDue || e.nextDue;
        if (!dueStr) return false;
        const d = MC.toDate(dueStr);
        if (!d) return false;
        return d > now && d <= in14Days;
    });

    const overdue = data.equipment.filter(e => {
        const dueStr = e.nextInspectionDue || e.nextDue;
        if (!dueStr) return false;
        const d = MC.toDate(dueStr);
        if (!d) return false;
        return d <= now;
    });

    const withFaults = data.equipment.filter(e => {
        return data.orders.some(o => o.equipmentId === e.id && o.type === "BREAKDOWN" && o.status !== "COMPLETE");
    });

    const ongoingMaint = data.orders.filter(o => o.status === "IN PROGRESS" || o.status === "AWAITING PARTS");
    const completedMaint = data.orders.filter(o => o.status === "COMPLETE");

    const activeF = ffTrackerFilter || "all";
    const filterBtn = (id, label, count) => `
        <button type="button" class="ff-detail-tab-btn ${activeF === id ? "is-active" : ""}" onclick="ffSetTrackerFilter('${id}')">
            ${label} <b style="margin-right:4px;">(${count})</b>
        </button>`;

    const filtersHtml = `
        <div class="ff-detail-tabs" style="padding:0 16px 8px;margin-bottom:8px;">
            ${filterBtn("all", "نظرة عامة", data.equipment.length)}
            ${filterBtn("uninspected", "لم تُفحص بعد", uninspected.length)}
            ${filterBtn("due_soon", "اقترب موعد الفحص", dueSoon.length)}
            ${filterBtn("overdue", "تجاوزت موعد الفحص", overdue.length)}
            ${filterBtn("faults", "أعطال مفتوحة", withFaults.length)}
            ${filterBtn("ongoing", "صيانة جارية", ongoingMaint.length)}
            ${filterBtn("completed", "صيانة مكتملة", completedMaint.length)}
        </div>`;

    let contentHtml = "";

    if (activeF === "uninspected") {
        contentHtml = uninspected.length
            ? uninspected.map(e => ffTrackerEquipRow(e, "لم يُجرَ فحص موثق بعد", "is-warn", "🔍 تسجيل فحص", `ffOpenInspectionModal('${e.id}')`)).join("")
            : `<div class="ff-empty"><div class="ff-empty-icon">✅</div>جميع المعدات المسجلة تم فحصها وتوثيقها.</div>`;
    } else if (activeF === "due_soon") {
        contentHtml = dueSoon.length
            ? dueSoon.map(e => ffTrackerEquipRow(e, "موعد الفحص: " + MC.formatDateShort(e.nextInspectionDue || e.nextDue), "is-warn", "🔍 فحص الآن", `ffOpenInspectionModal('${e.id}')`)).join("")
            : `<div class="ff-empty"><div class="ff-empty-icon">🗓️</div>لا توجد معدات يقترب موعد فحصها خلال الـ 14 يوماً القادمة.</div>`;
    } else if (activeF === "overdue") {
        contentHtml = overdue.length
            ? overdue.map(e => ffTrackerEquipRow(e, "تأخرت عن موعدها المحدد: " + MC.formatDateShort(e.nextInspectionDue || e.nextDue), "is-danger", "🔍 فحص عاجل", `ffOpenInspectionModal('${e.id}')`)).join("")
            : `<div class="ff-empty"><div class="ff-empty-icon">✅</div>لا توجد معدات تجاوزت موعد الفحص المحدد.</div>`;
    } else if (activeF === "faults") {
        contentHtml = withFaults.length
            ? withFaults.map(e => ffTrackerEquipRow(e, "يوجد عطل مفتوح بحاجة إلى معالجة", "is-danger", "⚠️ فتح السجل", `ffOpenUnit('${e.id}')`)).join("")
            : `<div class="ff-empty"><div class="ff-empty-icon">✅</div>لا توجد معدات مسجل عليها أعطال مفتوحة حالياً.</div>`;
    } else if (activeF === "ongoing") {
        contentHtml = ongoingMaint.length
            ? ongoingMaint.map(o => ffTrackerOrderRow(o)).join("")
            : `<div class="ff-empty"><div class="ff-empty-icon">🔧</div>لا توجد أعمال صيانة قيد التنفيذ حالياً.</div>`;
    } else if (activeF === "completed") {
        contentHtml = completedMaint.length
            ? completedMaint.map(o => ffTrackerOrderRow(o)).join("")
            : `<div class="ff-empty"><div class="ff-empty-icon">✔️</div>لا توجد أعمال صيانة مكتملة مسجلة بعد.</div>`;
    } else {
        contentHtml = `
            <div style="padding:0 16px;">
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px;margin-bottom:14px;">
                    <div style="background:#fff;border:1px solid var(--ff-border);border-radius:14px;padding:12px;border-top:3px solid var(--ff-purple);">
                        <div style="font-size:12px;color:var(--ff-muted);">معدات لم تُفحص بعد</div>
                        <div style="font-size:22px;font-weight:850;color:var(--ff-purple);">${uninspected.length}</div>
                        <div style="font-size:11px;color:var(--ff-muted);margin-top:2px;">بحاجة إلى أول فحص ميداني موثق</div>
                    </div>
                    <div style="background:#fff;border:1px solid var(--ff-border);border-radius:14px;padding:12px;border-top:3px solid var(--ff-amber);">
                        <div style="font-size:12px;color:var(--ff-muted);">فحوصات مستحقة قريباً</div>
                        <div style="font-size:22px;font-weight:850;color:var(--ff-amber);">${dueSoon.length}</div>
                        <div style="font-size:11px;color:var(--ff-muted);margin-top:2px;">خلال الـ 14 يوماً القادمة</div>
                    </div>
                    <div style="background:#fff;border:1px solid var(--ff-border);border-radius:14px;padding:12px;border-top:3px solid var(--ff-red);">
                        <div style="font-size:12px;color:var(--ff-muted);">تجاوزت موعد الفحص</div>
                        <div style="font-size:22px;font-weight:850;color:var(--ff-red);">${overdue.length}</div>
                        <div style="font-size:11px;color:var(--ff-muted);margin-top:2px;">بناءً على المواعيد المحددة</div>
                    </div>
                    <div style="background:#fff;border:1px solid var(--ff-border);border-radius:14px;padding:12px;border-top:3px solid var(--ff-blue);">
                        <div style="font-size:12px;color:var(--ff-muted);">صيانة جارية</div>
                        <div style="font-size:22px;font-weight:850;color:var(--ff-blue);">${ongoingMaint.length}</div>
                        <div style="font-size:11px;color:var(--ff-muted);margin-top:2px;">مهام قيد التنفيذ أو انتظار قطع</div>
                    </div>
                </div>
            </div>
            <h4 class="ff-section-title">المعدات التي تحتاج إلى متابعة عاجلة</h4>
            ${[...overdue, ...withFaults].length ? [...new Set([...overdue, ...withFaults])].map(e => ffTrackerEquipRow(e, e.status === "STOPPED" ? "المعدة متوقفة" : "تتطلب متابعة", "is-danger", "عرض التفاصيل", `ffOpenUnit('${e.id}')`)).join("") : `<div class="ff-empty"><div class="ff-empty-icon">✅</div>حالة المنظومة مستقرة ولا توجد تأخيرات حرجة مسجلة.</div>`}
        `;
    }

    return `
    <div>
        <h3 class="ff-section-title">📊 لوحة متابعة الفحص والصيانة</h3>
        <p class="ff-section-subtitle">متابعة الفحوصات المستحقة، المعدات المتأخرة، والأعطال الجارية وفق التواريخ المسجلة فعلياً.</p>
        ${filtersHtml}
        ${contentHtml}
    </div>`;
}

function ffSetTrackerFilter(f) {
    ffTrackerFilter = f || "all";
    renderFFContent();
}

function ffTrackerEquipRow(e, alertText, alertCls, btnLabel, btnAction) {
    const isPump = MC.FF_PUMP_SEED.some(p => p.id === e.id);
    const eqIcon = isPump ? "⚡" : (e.type === "Fire Hydrants" ? "🚰" : ((e.type === "Fire Hose Cabinets" || e.type === "Fire Hose Cabinet") ? "🗄️" : "🧯"));
    return `
    <div class="ff-row" style="cursor:default;">
        <div class="ff-row-title">
            <span>${eqIcon} ${escapeHTML(e.name || "—")}</span>
            <span class="ff-pill st-${escapeHTML(e.status || "UNVERIFIED")}">${escapeHTML(MC.equipStatusLabel(e.status))}</span>
        </div>
        <div class="ff-row-meta">
            ${e.tagNumber ? "Tag: " + escapeHTML(e.tagNumber) + " · " : ""}
            النوع: ${escapeHTML(e.type || "—")} ·
            الموقع: ${e.location ? escapeHTML(e.location) : "غير محدد"}
            <div style="color:${alertCls === 'is-danger' ? 'var(--ff-red)' : 'var(--ff-amber)'};font-weight:700;margin-top:3px;">
                ${escapeHTML(alertText)}
            </div>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:flex-end;gap:6px;">
            <button type="button" class="ff-btn-sm" onclick="ffOpenUnit('${e.id}')">التفاصيل الكاملة</button>
            <button type="button" class="ff-btn-sm is-primary" onclick="${btnAction}">${escapeHTML(btnLabel)}</button>
        </div>
    </div>`;
}

function ffTrackerOrderRow(o) {
    return `
    <div class="ff-row" style="cursor:default;">
        <div class="ff-row-title">
            <span>📋 ${escapeHTML(o.orderNumber || "—")} — ${escapeHTML(o.title || "أمر عمل")}</span>
            <span class="ff-pill st-${escapeHTML(o.status || "NEW")}">${escapeHTML(MC.statusLabel(o.status))}</span>
        </div>
        <div class="ff-row-meta">
            المعدة: <b>${escapeHTML(o.equipmentName || "—")}</b> ·
            النوع: ${escapeHTML(MC.requestTypeLabel ? MC.requestTypeLabel(o.type) : o.type)} ·
            الأولوية: <span class="ff-pill p-${escapeHTML(o.priority || "MEDIUM")}">${escapeHTML(MC.priorityLabel(o.priority))}</span> ·
            المسؤول: ${o.assignedTo ? escapeHTML(o.assignedTo) : "غير محدد"}
        </div>
        ${o.description ? `<div style="font-size:12px;margin-top:4px;color:var(--ff-ink);">${escapeHTML(o.description)}</div>` : ""}
    </div>`;
}

// ============================================================
// العرض 6: أوامر العمل (Fire Fighting Work Orders)
// ============================================================
function renderFFOrdersView() {
    const data = ffFireData();
    let list = data.orders.slice().sort((a,b) => (MC.toDate(b.createdAt)||0) - (MC.toDate(a.createdAt)||0));

    if (ffOrderFilterStatus) list = list.filter(o => o.status === ffOrderFilterStatus);
    if (ffOrderFilterPriority) list = list.filter(o => o.priority === ffOrderFilterPriority);
    if (ffOrderFilterType) list = list.filter(o => o.type === ffOrderFilterType);

    const q = (ffSearch || "").trim().toLowerCase();
    if (q) {
        list = list.filter(o => {
            const hay = [o.orderNumber, o.title, o.description, o.equipmentName, o.assignedTo, o.type, o.status].join(" ").toLowerCase();
            return hay.indexOf(q) !== -1;
        });
    }

    const toolbar = `
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 12px;">
            <select style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;font-size:12.5px;background:#fff;" onchange="ffOnOrderFilterStatus(this.value)">
                <option value="">كل حالات الأوامر</option>
                <option value="NEW" ${ffOrderFilterStatus==="NEW"?"selected":""}>NEW — جديد</option>
                <option value="IN PROGRESS" ${ffOrderFilterStatus==="IN PROGRESS"?"selected":""}>IN PROGRESS — قيد التنفيذ</option>
                <option value="AWAITING PARTS" ${ffOrderFilterStatus==="AWAITING PARTS"?"selected":""}>AWAITING PARTS — بانتظار القطع</option>
                <option value="COMPLETE" ${ffOrderFilterStatus==="COMPLETE"?"selected":""}>COMPLETE — مكتمل</option>
            </select>
            <select style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;font-size:12.5px;background:#fff;" onchange="ffOnOrderFilterPriority(this.value)">
                <option value="">كل الأولويات</option>
                <option value="LOW" ${ffOrderFilterPriority==="LOW"?"selected":""}>منخفضة (LOW)</option>
                <option value="MEDIUM" ${ffOrderFilterPriority==="MEDIUM"?"selected":""}>متوسطة (MEDIUM)</option>
                <option value="HIGH" ${ffOrderFilterPriority==="HIGH"?"selected":""}>عالية (HIGH)</option>
                <option value="CRITICAL" ${ffOrderFilterPriority==="CRITICAL"?"selected":""}>حرجة (CRITICAL)</option>
            </select>
            <select style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;font-size:12.5px;background:#fff;" onchange="ffOnOrderFilterType(this.value)">
                <option value="">كل أنواع الطلبات</option>
                <option value="INSPECTION" ${ffOrderFilterType==="INSPECTION"?"selected":""}>فحص (INSPECTION)</option>
                <option value="PREVENTIVE" ${ffOrderFilterType==="PREVENTIVE"?"selected":""}>صيانة وقائية (PREVENTIVE)</option>
                <option value="CORRECTIVE" ${ffOrderFilterType==="CORRECTIVE"?"selected":""}>صيانة تصحيحية (CORRECTIVE)</option>
                <option value="BREAKDOWN" ${ffOrderFilterType==="BREAKDOWN"?"selected":""}>عطل (BREAKDOWN)</option>
                <option value="TESTING" ${ffOrderFilterType==="TESTING"?"selected":""}>اختبار (TESTING)</option>
            </select>
            <button type="button" class="ff-btn is-primary" style="margin-right:auto;" onclick="ffOpenOrderModal(null)">➕ إنشاء أمر عمل جديد</button>
        </div>`;

    const items = list.map(o => {
        const dateStr = MC.formatDateShort(o.createdAt);
        const reqLabel = MC.requestTypeLabel ? MC.requestTypeLabel(o.type) : o.type;

        let statusControls = "";
        if (o.status === "NEW") {
            statusControls = `
                <button type="button" class="ff-btn-sm" onclick="ffUpdateOrderStatus('${o.id}', 'IN PROGRESS')">بدء التنفيذ</button>
                <button type="button" class="ff-btn-sm" onclick="ffUpdateOrderStatus('${o.id}', 'AWAITING PARTS')">طلب قطع غيار</button>
                <button type="button" class="ff-btn-sm is-primary" onclick="ffOpenResolveFaultModal('${o.id}')">إنجاز الأمر</button>`;
        } else if (o.status === "IN PROGRESS") {
            statusControls = `
                <button type="button" class="ff-btn-sm" onclick="ffUpdateOrderStatus('${o.id}', 'AWAITING PARTS')">بانتظار قطع</button>
                <button type="button" class="ff-btn-sm is-primary" onclick="ffOpenResolveFaultModal('${o.id}')">إنجاز الأمر</button>`;
        } else if (o.status === "AWAITING PARTS") {
            statusControls = `
                <button type="button" class="ff-btn-sm" onclick="ffUpdateOrderStatus('${o.id}', 'IN PROGRESS')">استئناف العمل</button>
                <button type="button" class="ff-btn-sm is-primary" onclick="ffOpenResolveFaultModal('${o.id}')">إنجاز الأمر</button>`;
        }

        return `
        <div class="ff-row" style="cursor:default;">
            <div class="ff-row-title">
                <span>📋 ${escapeHTML(o.orderNumber || "—")} — ${escapeHTML(o.title || "بدون عنوان")}</span>
                <div>
                    <span class="ff-pill st-NEW">${escapeHTML(reqLabel)}</span>
                    <span class="ff-pill p-${escapeHTML(o.priority || "MEDIUM")}">${escapeHTML(MC.priorityLabel(o.priority))}</span>
                    <span class="ff-pill st-${escapeHTML(o.status || "NEW")}">${escapeHTML(MC.statusLabel(o.status))}</span>
                </div>
            </div>
            <div class="ff-row-meta">
                المعدة المرتبطة: <b>${escapeHTML(o.equipmentName || "غير محددة")}</b>
                ${o.equipmentTag ? " (" + escapeHTML(o.equipmentTag) + ")" : ""} ·
                تاريخ الإنشاء: <b>${dateStr}</b>
                ${o.assignedTo ? " · المسؤول: <b>" + escapeHTML(o.assignedTo) + "</b>" : ""}
                ${o.dueDate ? " · الاستحقاق: <b>" + MC.formatDateShort(o.dueDate) + "</b>" : ""}
            </div>
            ${o.description ? `<div style="font-size:12.5px;margin-top:6px;color:var(--ff-ink);line-height:1.6;">${escapeHTML(o.description)}</div>` : ""}
            ${o.notes ? `<div style="font-size:11.5px;margin-top:3px;color:var(--ff-muted);">ملاحظات: ${escapeHTML(o.notes)}</div>` : ""}
            ${o.resolution ? `<div style="font-size:12px;margin-top:4px;color:var(--ff-green);font-weight:700;">المعالجة: ${escapeHTML(o.resolution)} (${MC.formatDateShort(o.completedAt)})</div>` : ""}
            ${statusControls ? `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #e2e8f0;display:flex;justify-content:flex-end;gap:6px;">${statusControls}</div>` : ""}
        </div>`;
    }).join("");

    return `
    <div>
        <h3 class="ff-section-title">📋 أوامر العمل الخاصة بمكافحة الحريق</h3>
        <p class="ff-section-subtitle">إدارة أوامر الفحص والصيانة الوقائية والتصحيحية والأعطال لحفظ الأثر التشغيلي.</p>
        ${toolbar}
        ${list.length ? items : `<div class="ff-empty"><div class="ff-empty-icon">📋</div>لا توجد أوامر عمل مطابقة للبحث أو التصفية الحالية.</div>`}
    </div>`;
}

function ffOnOrderFilterStatus(v) { ffOrderFilterStatus = v || ""; renderFFContent(); }
function ffOnOrderFilterPriority(v) { ffOrderFilterPriority = v || ""; renderFFContent(); }
function ffOnOrderFilterType(v) { ffOrderFilterType = v || ""; renderFFContent(); }

// ============================================================
// توليد أرقام أوامر العمل متسلسلة عبر عداد Firestore
// ============================================================
async function getNextMechOrderNumber(db, prefix = "FF") {
    try {
        const fs = await import(MECH_FIRESTORE_URL);
        const year = new Date().getFullYear();
        const docId = `orders_${prefix.toLowerCase()}_${year}`;
        const counterRef = fs.doc(db, MECH_COUNTERS_COLLECTION, docId);
        return await fs.runTransaction(db, async (tx) => {
            const snap = await tx.get(counterRef);
            let nextNum = 1;
            if (snap.exists()) {
                const data = snap.data();
                nextNum = (data.lastNumber || 0) + 1;
            }
            tx.set(counterRef, {
                prefix: prefix,
                year: year,
                lastNumber: nextNum,
                updatedAt: fs.serverTimestamp()
            });
            return MC.buildOrderNumber(prefix, nextNum, year);
        });
    } catch (e) {
        console.warn("Counter transaction fallback:", e);
        const year = new Date().getFullYear();
        const fireOrders = (mechOrdersCache || []).filter(o => (o.orderNumber || "").startsWith(prefix));
        return MC.buildOrderNumber(prefix, fireOrders.length + 1, year);
    }
}

// ============================================================
// تسجيل الأنواع والكميات المعتمدة (Idempotent - لا تكرار)
// ============================================================
async function ffRegisterApprovedCatalog() {
    if (ffRegisterBusy) return;
    if (!requireLoginForWrite(ffRegisterApprovedCatalog)) return;
    ffRegisterBusy = true;
    const btn = document.getElementById("ffRegisterBtn");
    if (btn) btn.disabled = true;
    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        let createdPumps = 0, createdTypes = 0, skipped = 0;

        // 1. تسجيل المضخات الثلاث كسجلات فردية بحالة «غير مفحوصة»
        for (const p of MC.FF_PUMP_SEED) {
            const ref = fs.doc(db, MECH_EQUIPMENT_COLLECTION, p.id);
            const snap = await fs.getDoc(ref);
            if (snap.exists()) { skipped++; continue; }
            await fs.setDoc(ref, {
                name: p.name,
                nameAr: p.id === "ff-pump-electric" ? "المضخة الكهربائية" : (p.id === "ff-pump-diesel" ? "مضخة الديزل" : "مضخة الجوكي"),
                department: "fire-fighting",
                type: p.type,
                ffGroup: "pump-set",
                facility: "hospital",
                pumpSet: "main",
                tagNumber: p.id === "ff-pump-electric" ? "FP-ELEC-01" : (p.id === "ff-pump-diesel" ? "FP-DSL-01" : "FP-JCK-01"),
                location: "غرفة مضخات الحريق",
                status: "UNVERIFIED",
                techData: p.techData,
                notes: p.notes || "",
                createdBy: who.name,
                createdAt: fs.serverTimestamp(),
                changeLog: []
            });
            createdPumps++;
        }

        // 2. تسجيل كتالوج الأنواع والكميات المعتمدة
        for (const t of MC.FF_CATALOG_SEED) {
            const ref = fs.doc(db, MECH_TYPES_COLLECTION, t.id);
            const snap = await fs.getDoc(ref);
            if (snap.exists()) { skipped++; continue; }
            const docData = {
                department: "fire-fighting",
                name: t.name,
                facility: t.facility || "hospital",
                ffGroup: t.ffGroup,
                ffMode: t.ffMode || null,
                approvedQuantity: t.approvedQuantity,
                unit: t.unit,
                sourceDescription: t.sourceDescription || "",
                notes: t.notes || "",
                createdBy: who.name,
                createdAt: fs.serverTimestamp()
            };
            if (t.nameAr) docData.nameAr = t.nameAr;
            await fs.setDoc(ref, docData);
            createdTypes++;
        }

        showMessage(
            `اكتمل التسجيل: ${createdPumps} مضخات و${createdTypes} أنواع معتمدة` +
            (skipped ? ` — تم تخطي ${skipped} مستنداً مسجلاً مسبقاً.` : "."),
            "success"
        );
        renderFFStats();
        renderFFContent();
    } catch (error) {
        console.error("ff register error:", error);
        showMessage("تعذّر إتمام التسجيل. تحقّق من الاتصال وصلاحياتك ثم أعد المحاولة.", "error");
    } finally {
        ffRegisterBusy = false;
        const b = document.getElementById("ffRegisterBtn");
        if (b) b.disabled = false;
    }
}

// ============================================================
// النوافذ المنبثقة (Modals) ونماذج الإدخال الموثوقة
// ============================================================
// عند تغيير الجهة في نموذج الوحدة: إظهار أنواع تلك الجهة فقط
function ffOnUnitFacilityChange() {
    const fac = (document.getElementById("ffUnitFacility") || {}).value || "";
    const sel = document.getElementById("ffUnitTypeId");
    if (!sel) return;
    let firstOk = null;
    Array.prototype.forEach.call(sel.options, function (o) {
        const ok = !fac || o.getAttribute("data-facility") === fac;
        o.hidden = !ok; o.disabled = !ok;
        if (ok && !firstOk) firstOk = o;
    });
    const cur = sel.options[sel.selectedIndex];
    if (!cur || cur.disabled) { if (firstOk) sel.value = firstOk.value; }
}

function ffCloseModal() {
    const host = document.getElementById("ffModalHost");
    if (host) host.innerHTML = "";
}

// ---------------- 1. تسجيل / تعديل وحدة فردية ----------------
function ffOpenUnitModal(editUnitId, presetGroupId, presetTypeId) {
    if (!requireLoginForWrite(() => ffOpenUnitModal(editUnitId, presetGroupId, presetTypeId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;

    const data = ffFireDataAll();
    const editUnit = editUnitId ? data.equipment.find(e => e.id === editUnitId) : null;

    const groupTypes = MC.FF_CATALOG_SEED;
    const presetType = presetTypeId ? groupTypes.find(t => t.id === presetTypeId) : null;
    const startFacility = editUnit
        ? (MC.ffFacilityOf(editUnit) === "unassigned" ? "" : MC.ffFacilityOf(editUnit))
        : (presetType ? presetType.facility : ((ffFacilityFilter === "hospital" || ffFacilityFilter === "complex") ? ffFacilityFilter : ""));
    const selectedGroup = presetGroupId || (editUnit ? MC.ffGroupOf(editUnit) : (presetType ? presetType.ffGroup : "extinguishers"));
    const existingCodes = data.equipment.map(e => e.internalCode || e.tagNumber).filter(Boolean);
    const prefixes = { "pump-set": "FF-PUMP", extinguishers: "FF-EXT", hydrants: "FF-HYD", "hose-cabinets": "FF-HOSE", foam: "FF-FOAM", fixed: "FF-FIX" };
    const autoCode = MC.ffNextInternalCode(existingCodes, prefixes[selectedGroup] || "FF-UNIT", editUnit ? editUnit.internalCode : null);

    const typeOptions = groupTypes.map(t => {
        const isSel = (presetTypeId && t.id === presetTypeId) || (editUnit && (editUnit.catalogTypeId === t.id || (!editUnit.catalogTypeId && editUnit.type === t.name)));
        const hide = startFacility && t.facility !== startFacility;
        return `<option value="${t.id}" data-group="${t.ffGroup}" data-facility="${t.facility}" data-name="${escapeHTML(t.name)}" ${isSel ? "selected" : ""} ${hide ? "hidden disabled" : ""}>${escapeHTML(t.nameAr ? t.nameAr + " — " + t.name : t.name)}</option>`;
    }).join("");

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">${editUnit ? "✏️ تعديل بيانات الوحدة" : "➕ تسجيل وحدة فردية جديدة"}</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form id="ffUnitForm" onsubmit="ffSaveUnit(event, '${editUnit ? editUnit.id : ""}')">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">الجهة التابعة (Facility) *</label>
                        <select class="ff-form-select" id="ffUnitFacility" required onchange="ffOnUnitFacilityChange()">
                            <option value="" ${startFacility ? "" : "selected"}>— اختر الجهة —</option>
                            <option value="hospital" ${startFacility === "hospital" ? "selected" : ""}>المستشفى (Hospital)</option>
                            <option value="complex" ${startFacility === "complex" ? "selected" : ""}>المجمع (Complex)</option>
                        </select>
                        <span class="ff-form-hint">تُفصل بيانات المستشفى عن المجمع ولا تُدمج أعدادهما.</span>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">نوع المعدة المعتمد *</label>
                        <select class="ff-form-select" id="ffUnitTypeId" required>
                            ${typeOptions}
                        </select>
                        <span class="ff-form-hint">تظهر أنواع الجهة المختارة فقط، وهي مرتبطة بجدول التجهيز لحساب الكميات.</span>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">اسم المعدة / التسمية الفردية</label>
                        <input type="text" class="ff-form-input" id="ffUnitName" value="${editUnit ? escapeHTML(editUnit.name || "") : ""}" placeholder="مثال: مطفأة باودر رقم 1 - طابق أرضي">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">رقم المعدة الرسمي (Tag Number)</label>
                        <input type="text" class="ff-form-input" id="ffUnitTag" value="${editUnit ? escapeHTML(editUnit.tagNumber || "") : ""}" placeholder="مثال: FE-P-001 (إن وجد في الموقع)">
                        <span class="ff-form-hint">يُسجل إذا توفر رقم Tag فعلي. يُمنع تكرار رقم Tag نفسه.</span>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الرمز الداخلي المؤقت</label>
                        <input type="text" class="ff-form-input" id="ffUnitCode" value="${editUnit ? escapeHTML(editUnit.internalCode || "") : autoCode}" readonly style="background:#f8fafc;">
                        <span class="ff-form-hint">رمز داخلي مؤقت (غير رسمي) لتتبع الوحدة قبل صدور رقم Tag الرسمي.</span>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الموقع الفعلي (Location)</label>
                        <input type="text" class="ff-form-input" id="ffUnitLocation" value="${editUnit ? escapeHTML(editUnit.location || "") : ""}" placeholder="مثال: مبنى أ - الطابق الأول - ممر العمليات">
                        <span class="ff-form-hint">لا تخترع موقعاً إن لم يكن معروفاً بدقة؛ اتركه فارغاً وسيظهر «غير محدد».</span>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الحالة التشغيلية الأولية</label>
                        <select class="ff-form-select" id="ffUnitStatus">
                            <option value="UNVERIFIED" ${(!editUnit || editUnit.status === "UNVERIFIED") ? "selected" : ""}>غير مفحوصة (UNVERIFIED) — الافتراضي</option>
                            <option value="OPERATIONAL" ${(editUnit && editUnit.status === "OPERATIONAL") ? "selected" : ""}>عاملة (OPERATIONAL)</option>
                            <option value="STOPPED" ${(editUnit && editUnit.status === "STOPPED") ? "selected" : ""}>متوقفة (STOPPED)</option>
                            <option value="UNDER_MAINTENANCE" ${(editUnit && editUnit.status === "UNDER_MAINTENANCE") ? "selected" : ""}>تحت الصيانة (UNDER_MAINTENANCE)</option>
                            <option value="OUT_OF_SERVICE" ${(editUnit && editUnit.status === "OUT_OF_SERVICE") ? "selected" : ""}>خارج الخدمة (OUT_OF_SERVICE)</option>
                        </select>
                        <span class="ff-form-hint">إنشاء السجل لا يُعتبر فحصاً للمعدة؛ تبقى بحالة «غير مفحوصة» حتى يوثَّق فحص فعلي.</span>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الرقم التسلسلي للقطعة (Serial Number)</label>
                        <input type="text" class="ff-form-input" id="ffUnitSerial" value="${editUnit ? escapeHTML(editUnit.serialNumber || "") : ""}" placeholder="الرقم المصنعي إن وجد">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">ملاحظات إضافية</label>
                        <textarea class="ff-form-textarea" id="ffUnitNotes" placeholder="أي تفاصيل أو متطلبات فنية خاصة بالوحدة">${editUnit ? escapeHTML(editUnit.notes || "") : ""}</textarea>
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-primary">حفظ الوحدة</button>
                </div>
            </form>
        </div>
    </div>`;
}

async function ffSaveUnit(e, editUnitId) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const typeSelect = document.getElementById("ffUnitTypeId");
    if (!typeSelect) return;

    const typeId = typeSelect.value;
    const selectedOption = typeSelect.options[typeSelect.selectedIndex];
    const typeName = selectedOption ? selectedOption.getAttribute("data-name") : "";
    const groupName = selectedOption ? selectedOption.getAttribute("data-group") : "extinguishers";
    const typeFacility = selectedOption ? selectedOption.getAttribute("data-facility") : "";
    const facility = (document.getElementById("ffUnitFacility").value || "").trim();
    if (!facility) {
        showMessage("اختر الجهة التابعة (المستشفى أو المجمع).", "error");
        return;
    }
    if (typeFacility && typeFacility !== facility) {
        showMessage("نوع المعدة المختار لا يتبع الجهة المحددة. اختر نوعاً من أنواع هذه الجهة.", "error");
        return;
    }

    const name = (document.getElementById("ffUnitName").value || "").trim() || typeName;
    const tag = (document.getElementById("ffUnitTag").value || "").trim();
    const code = (document.getElementById("ffUnitCode").value || "").trim();
    const location = (document.getElementById("ffUnitLocation").value || "").trim();
    const status = document.getElementById("ffUnitStatus").value || "UNVERIFIED";
    const serial = (document.getElementById("ffUnitSerial").value || "").trim();
    const notes = (document.getElementById("ffUnitNotes").value || "").trim();

    // التحقق من تكرار رقم Tag
    if (tag) {
        const dup = MC.ffFindDuplicateTag(mechEquipmentCache, tag, editUnitId);
        if (dup) {
            showMessage(`رقم الـ Tag «${tag}» مستخدم بالفعل في المعدة «${dup.name}». يرجى استخدام رقم فريد.`, "error");
            return;
        }
    }

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();

        if (editUnitId) {
            const ref = fs.doc(db, MECH_EQUIPMENT_COLLECTION, editUnitId);
            const oldUnit = mechEquipmentCache.find(u => u.id === editUnitId) || {};
            const changeRes = MC.ffLogEquipmentChange(editUnitId, {
                name: name, name_old: oldUnit.name,
                tagNumber: tag, tagNumber_old: oldUnit.tagNumber,
                location: location, location_old: oldUnit.location,
                status: status, status_old: oldUnit.status,
                facility: facility, facility_old: MC.ffFacilityOf(oldUnit),
                serialNumber: serial, serialNumber_old: oldUnit.serialNumber,
                notes: notes, notes_old: oldUnit.notes,
                by: who.name
            });

            const nextChanges = [...(oldUnit.changeLog || []), ...changeRes.changes];

            await fs.updateDoc(ref, {
                name: name,
                tagNumber: tag || null,
                location: location || null,
                status: status,
                serialNumber: serial || null,
                facility: facility,
                notes: notes || "",
                updatedBy: who.name,
                updatedAt: fs.serverTimestamp(),
                changeLog: nextChanges
            });
            showMessage("تم تحديث بيانات المعدة بنجاح.", "success");
        } else {
            await fs.addDoc(fs.collection(db, MECH_EQUIPMENT_COLLECTION), {
                name: name,
                department: "fire-fighting",
                type: typeName,
                catalogTypeId: typeId,
                ffGroup: groupName,
                tagNumber: tag || null,
                internalCode: code,
                location: location || null,
                status: status,
                serialNumber: serial || null,
                facility: facility,
                notes: notes || "",
                createdBy: who.name,
                createdAt: fs.serverTimestamp(),
                changeLog: []
            });
            showMessage("تم تسجيل الوحدة الفردية بنجاح وحفظها في قاعدة البيانات.", "success");
        }
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Save unit error:", err);
        showMessage("تعذّر حفظ بيانات المعدة. يرجى التحقق من الاتصال والمحاولة مجدداً.", "error");
    }
}

// ---------------- 2. نافذة تسجيل فحص جديد ----------------
function ffOpenInspectionModal(equipmentId) {
    if (!requireLoginForWrite(() => ffOpenInspectionModal(equipmentId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;
    const data = ffFireDataAll();
    const eq = data.equipment.find(e => e.id === equipmentId);
    if (!eq) return;

    const who = mechWho();
    const todayStr = new Date().toISOString().slice(0, 10);

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">🔍 تسجيل فحص جديد — ${escapeHTML(eq.name)}</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form onsubmit="ffSaveInspection(event, '${eq.id}')">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">المعدة المستهدفة</label>
                        <input type="text" class="ff-form-input" value="${escapeHTML(eq.name)} (${eq.tagNumber || eq.internalCode || 'بدون رمز'})" readonly style="background:#f8fafc;">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">تاريخ الفحص *</label>
                        <input type="date" class="ff-form-input" id="ffInspDate" value="${todayStr}" required>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">اسم الفاحص / المهندس المسؤول *</label>
                        <input type="text" class="ff-form-input" id="ffInspInspector" value="${escapeHTML(who.name || '')}" required placeholder="اسم من قام بالفحص">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">نتيجة الفحص الفني *</label>
                        <select class="ff-form-select" id="ffInspResult" required>
                            <option value="سليم ومطابق للمواصفات">سليم ومطابق للمواصفات (PASS)</option>
                            <option value="ملاحظات طفيفة لا تمنع التشغيل">ملاحظات طفيفة لا تمنع التشغيل (MINOR NOTES)</option>
                            <option value="يحتاج إلى صيانة ومعالجة">يحتاج إلى صيانة ومعالجة (NEEDS MAINTENANCE)</option>
                            <option value="فاشل - متوقف عن العمل">فاشل - متوقف عن العمل (FAIL)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">تحديث الحالة التشغيلية للمعدة</label>
                        <select class="ff-form-select" id="ffInspNewStatus">
                            <option value="OPERATIONAL">عاملة (OPERATIONAL) — سليم</option>
                            <option value="STOPPED">متوقفة (STOPPED) — عاطلة</option>
                            <option value="UNDER_MAINTENANCE">تحت الصيانة (UNDER_MAINTENANCE)</option>
                            <option value="UNVERIFIED">إبقاء الحالة الحالية (${escapeHTML(MC.equipStatusLabel(eq.status))})</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الملاحظات الفنية وتقرير الفحص *</label>
                        <textarea class="ff-form-textarea" id="ffInspNotes" required placeholder="سجل قراءات الضغط، سلامة الصمامات، فحص الأختام، الخرطوم، المانوميتر..."></textarea>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الإجراءات والتدابير المطلوبة</label>
                        <input type="text" class="ff-form-input" id="ffInspActions" placeholder="مثال: إعادة تعبئة، استبدال مانوميتر، اختبار ضغط، لا توجد إجراءات">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">موعد الفحص القادم المقترح</label>
                        <input type="date" class="ff-form-input" id="ffInspNextDue">
                        <span class="ff-form-hint">يُحدد وفقاً لمعايير المنشأة وتعليمات المصنع المعتمدة دون افتراض فترات تلقائية.</span>
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-primary">حفظ وتوثيق الفحص</button>
                </div>
            </form>
        </div>
    </div>`;
}

async function ffSaveInspection(e, equipmentId) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const date = document.getElementById("ffInspDate").value;
    const inspector = (document.getElementById("ffInspInspector").value || "").trim();
    const result = document.getElementById("ffInspResult").value;
    const newStatusChoice = document.getElementById("ffInspNewStatus").value;
    const notes = (document.getElementById("ffInspNotes").value || "").trim();
    const actions = (document.getElementById("ffInspActions").value || "").trim();
    const nextDue = document.getElementById("ffInspNextDue").value || null;

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        const eqRef = fs.doc(db, MECH_EQUIPMENT_COLLECTION, equipmentId);
        const eqSnap = await fs.getDoc(eqRef);
        const eqData = eqSnap.exists() ? eqSnap.data() : {};

        const orderNum = await getNextMechOrderNumber(db, "FF-INSP");

        await fs.addDoc(fs.collection(db, MECH_ORDERS_COLLECTION), {
            department: "fire-fighting",
            equipmentId: equipmentId,
            equipmentName: eqData.name || "معدة مكافحة حريق",
            equipmentTag: eqData.tagNumber || eqData.internalCode || null,
            orderNumber: orderNum,
            type: "INSPECTION",
            title: `فحص دوري: ${result}`,
            description: notes,
            inspectionResult: result,
            inspectorName: inspector,
            requiredActions: actions || null,
            priority: result.includes("فاشل") ? "HIGH" : "MEDIUM",
            status: "COMPLETE",
            nextDue: nextDue,
            performedAt: date,
            completedAt: date,
            createdBy: who.name,
            createdAt: fs.serverTimestamp()
        });

        const finalStatus = (newStatusChoice === "UNVERIFIED" && eqData.status) ? eqData.status : newStatusChoice;
        const changeRes = MC.ffLogEquipmentChange(equipmentId, {
            status: finalStatus, status_old: eqData.status,
            lastInspectionDate: date, lastInspectionDate_old: eqData.lastInspectionDate,
            nextInspectionDue: nextDue, nextInspectionDue_old: eqData.nextInspectionDue,
            by: who.name
        });

        await fs.updateDoc(eqRef, {
            status: finalStatus,
            lastInspectionDate: date,
            lastInspectionResult: result,
            nextInspectionDue: nextDue,
            updatedBy: who.name,
            updatedAt: fs.serverTimestamp(),
            changeLog: [...(eqData.changeLog || []), ...changeRes.changes]
        });

        showMessage("تم تسجيل وتوثيق الفحص بنجاح، وتحديث حالة المعدة.", "success");
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Save inspection error:", err);
        showMessage("تعذّر حفظ سجل الفحص. تحقّق من الاتصال وحاول مجدداً.", "error");
    }
}

// ---------------- 3. نافذة تسجيل صيانة جديدة ----------------
function ffOpenMaintenanceModal(equipmentId) {
    if (!requireLoginForWrite(() => ffOpenMaintenanceModal(equipmentId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;
    const data = ffFireDataAll();
    const eq = data.equipment.find(e => e.id === equipmentId);
    if (!eq) return;

    const who = mechWho();
    const todayStr = new Date().toISOString().slice(0, 10);

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">🔧 تسجيل صيانة — ${escapeHTML(eq.name)}</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form onsubmit="ffSaveMaintenance(event, '${eq.id}')">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">المعدة</label>
                        <input type="text" class="ff-form-input" value="${escapeHTML(eq.name)} (${eq.tagNumber || eq.internalCode || 'بدون رمز'})" readonly style="background:#f8fafc;">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">تاريخ الصيانة *</label>
                        <input type="date" class="ff-form-input" id="ffMaintDate" value="${todayStr}" required>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">نوع الصيانة *</label>
                        <select class="ff-form-select" id="ffMaintType" required>
                            <option value="ROUTINE">دورية (ROUTINE)</option>
                            <option value="PREVENTIVE">وقائية (PREVENTIVE)</option>
                            <option value="CORRECTIVE">تصحيحية (CORRECTIVE)</option>
                            <option value="EMERGENCY">طارئة (EMERGENCY)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الفني / الجهة المنفذة *</label>
                        <input type="text" class="ff-form-input" id="ffMaintTech" value="${escapeHTML(who.name || '')}" required placeholder="اسم الفني أو الشركة المنفذة">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">وصف أعمال الصيانة المنفذة *</label>
                        <textarea class="ff-form-textarea" id="ffMaintDesc" required placeholder="تفاصيل الأعمال: تغيير زيوت، فحص سدادات، تبديل بطاريات، تشحيم، معايرة ضغط..."></textarea>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">القطع المستبدلة (اسم القطعة والكمية)</label>
                        <div id="ffMaintPartsHost" style="display:flex;flex-direction:column;gap:6px;">
                            <div class="ff-part-row" style="display:flex;gap:6px;">
                                <input type="text" class="ff-form-input ff-part-name" placeholder="اسم القطعة المستبدلة">
                                <input type="number" class="ff-form-input ff-part-qty" style="max-width:80px;" placeholder="العدد" min="1" value="1">
                            </div>
                        </div>
                        <button type="button" class="ff-btn-sm" style="margin-top:4px;align-self:flex-start;" onclick="ffAddPartRow()">➕ إضافة قطعة أخرى</button>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">التكلفة المالية (إن وجدت)</label>
                        <input type="number" class="ff-form-input" id="ffMaintCost" placeholder="المبلغ بالدينار العراقي (اختياري)">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">تحديث حالة المعدة بعد الصيانة</label>
                        <select class="ff-form-select" id="ffMaintStatus">
                            <option value="OPERATIONAL">عاملة وجاهزة للخدمة (OPERATIONAL)</option>
                            <option value="UNDER_MAINTENANCE">تحت الصيانة (UNDER_MAINTENANCE)</option>
                            <option value="STOPPED">متوقفة (STOPPED)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">ملاحظات إضافية</label>
                        <input type="text" class="ff-form-input" id="ffMaintNotes" placeholder="أي توصيات أو مواعيد صيانة لاحقة">
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-primary">حفظ سجل الصيانة</button>
                </div>
            </form>
        </div>
    </div>`;
}

function ffAddPartRow() {
    const host = document.getElementById("ffMaintPartsHost");
    if (!host) return;
    const div = document.createElement("div");
    div.className = "ff-part-row";
    div.style = "display:flex;gap:6px;";
    div.innerHTML = `
        <input type="text" class="ff-form-input ff-part-name" placeholder="اسم القطعة المستبدلة">
        <input type="number" class="ff-form-input ff-part-qty" style="max-width:80px;" placeholder="العدد" min="1" value="1">
        <button type="button" class="ff-btn-sm is-danger" onclick="this.parentElement.remove()">✕</button>`;
    host.appendChild(div);
}

async function ffSaveMaintenance(e, equipmentId) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const date = document.getElementById("ffMaintDate").value;
    const type = document.getElementById("ffMaintType").value;
    const tech = (document.getElementById("ffMaintTech").value || "").trim();
    const desc = (document.getElementById("ffMaintDesc").value || "").trim();
    const cost = document.getElementById("ffMaintCost").value;
    const status = document.getElementById("ffMaintStatus").value;
    const notes = (document.getElementById("ffMaintNotes").value || "").trim();

    const parts = [];
    document.querySelectorAll("#ffMaintPartsHost .ff-part-row").forEach(row => {
        const nameEl = row.querySelector(".ff-part-name");
        const qtyEl = row.querySelector(".ff-part-qty");
        if (nameEl && nameEl.value.trim()) {
            parts.push({
                name: nameEl.value.trim(),
                quantity: Number(qtyEl ? qtyEl.value : 1) || 1
            });
        }
    });

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        const eqRef = fs.doc(db, MECH_EQUIPMENT_COLLECTION, equipmentId);
        const eqSnap = await fs.getDoc(eqRef);
        const eqData = eqSnap.exists() ? eqSnap.data() : {};

        await fs.addDoc(fs.collection(db, MECH_PM_LOGS_COLLECTION), {
            department: "fire-fighting",
            equipmentId: equipmentId,
            equipmentName: eqData.name || "معدة مكافحة حريق",
            type: type,
            description: desc,
            performedBy: tech,
            parts: parts,
            cost: cost ? Number(cost) : null,
            status: "COMPLETE",
            notes: notes || "",
            performedAt: date,
            createdBy: who.name,
            createdAt: fs.serverTimestamp()
        });

        const orderNum = await getNextMechOrderNumber(db, "FF-MAINT");
        await fs.addDoc(fs.collection(db, MECH_ORDERS_COLLECTION), {
            department: "fire-fighting",
            equipmentId: equipmentId,
            equipmentName: eqData.name || "معدة مكافحة حريق",
            orderNumber: orderNum,
            type: type === "CORRECTIVE" ? "CORRECTIVE" : "PREVENTIVE",
            title: `صيانة: ${desc.slice(0, 40)}`,
            description: desc,
            assignedTo: tech,
            status: "COMPLETE",
            priority: "MEDIUM",
            completedAt: date,
            createdBy: who.name,
            createdAt: fs.serverTimestamp()
        });

        const changeRes = MC.ffLogEquipmentChange(equipmentId, {
            status: status, status_old: eqData.status,
            by: who.name
        });
        await fs.updateDoc(eqRef, {
            status: status,
            lastMaintenanceDate: date,
            updatedBy: who.name,
            updatedAt: fs.serverTimestamp(),
            changeLog: [...(eqData.changeLog || []), ...changeRes.changes]
        });

        showMessage("تم حفظ وتوثيق سجل الصيانة بنجاح.", "success");
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Save maintenance error:", err);
        showMessage("تعذّر حفظ سجل الصيانة. تحقّق من الاتصال وحاول مجدداً.", "error");
    }
}

// ---------------- 4. نافذة تسجيل عطل جديد ----------------
function ffOpenFaultModal(equipmentId) {
    if (!requireLoginForWrite(() => ffOpenFaultModal(equipmentId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;
    const data = ffFireDataAll();
    const eq = data.equipment.find(e => e.id === equipmentId);
    if (!eq) return;

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">⚠️ تسجيل عطل — ${escapeHTML(eq.name)}</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form onsubmit="ffSaveFault(event, '${eq.id}')">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">المعدة المعطلة</label>
                        <input type="text" class="ff-form-input" value="${escapeHTML(eq.name)} (${eq.tagNumber || eq.internalCode || 'بدون رمز'})" readonly style="background:#f8fafc;">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">عنوان العطل أو المشكلة *</label>
                        <input type="text" class="ff-form-input" id="ffFaultTitle" required placeholder="مثال: تسريب ماء من الصمام الرئيسي، هبوط مفاجئ في الضغط...">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">درجة الأولوية والخطورة *</label>
                        <select class="ff-form-select" id="ffFaultPriority" required>
                            <option value="CRITICAL">حرجة (CRITICAL) — توقف كلي للنظام</option>
                            <option value="HIGH">عالية (HIGH) — خطر على منظومة الإطفاء</option>
                            <option value="MEDIUM" selected>متوسطة (MEDIUM) — عطل جزئي</option>
                            <option value="LOW">منخفضة (LOW) — ملاحظة صيانة</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">وصف تفصيلي للعطل والأعراض *</label>
                        <textarea class="ff-form-textarea" id="ffFaultDesc" required placeholder="اشرح ما حدث بدقة وكيف تم اكتشاف العطل..."></textarea>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الإجراء المتخذ فورياً</label>
                        <input type="text" class="ff-form-input" id="ffFaultAction" placeholder="مثال: تم إغلاق المحبس، تم عزل المضخة، قيد الفحص">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">تحديث حالة المعدة</label>
                        <select class="ff-form-select" id="ffFaultNewStatus">
                            <option value="STOPPED">متوقفة عن العمل (STOPPED)</option>
                            <option value="UNDER_MAINTENANCE">تحت الصيانة (UNDER_MAINTENANCE)</option>
                            <option value="OUT_OF_SERVICE">خارج الخدمة (OUT_OF_SERVICE)</option>
                        </select>
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-danger">تسجيل العطل وإنشاء أمر العمل</button>
                </div>
            </form>
        </div>
    </div>`;
}

async function ffSaveFault(e, equipmentId) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const title = (document.getElementById("ffFaultTitle").value || "").trim();
    const priority = document.getElementById("ffFaultPriority").value || "MEDIUM";
    const desc = (document.getElementById("ffFaultDesc").value || "").trim();
    const action = (document.getElementById("ffFaultAction").value || "").trim();
    const newStatus = document.getElementById("ffFaultNewStatus").value;

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        const eqRef = fs.doc(db, MECH_EQUIPMENT_COLLECTION, equipmentId);
        const eqSnap = await fs.getDoc(eqRef);
        const eqData = eqSnap.exists() ? eqSnap.data() : {};

        const orderNum = await getNextMechOrderNumber(db, "FF-FLT");

        await fs.addDoc(fs.collection(db, MECH_ORDERS_COLLECTION), {
            department: "fire-fighting",
            equipmentId: equipmentId,
            equipmentName: eqData.name || "معدة مكافحة حريق",
            equipmentTag: eqData.tagNumber || eqData.internalCode || null,
            orderNumber: orderNum,
            type: "BREAKDOWN",
            title: title,
            description: desc,
            actionTaken: action || null,
            priority: priority,
            status: "NEW",
            createdBy: who.name,
            createdAt: fs.serverTimestamp()
        });

        const changeRes = MC.ffLogEquipmentChange(equipmentId, {
            status: newStatus, status_old: eqData.status,
            by: who.name
        });
        await fs.updateDoc(eqRef, {
            status: newStatus,
            updatedBy: who.name,
            updatedAt: fs.serverTimestamp(),
            changeLog: [...(eqData.changeLog || []), ...changeRes.changes]
        });

        showMessage(`تم تسجيل العطل برقم الأمر ${orderNum} وتحديث حالة المعدة.`, "success");
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Save fault error:", err);
        showMessage("تعذّر تسجيل العطل. يرجى التحقق من الاتصال والمحاولة مجدداً.", "error");
    }
}

// ---------------- 5. نافذة معالجة وإغلاق العطل / أمر العمل ----------------
function ffOpenResolveFaultModal(orderId) {
    if (!requireLoginForWrite(() => ffOpenResolveFaultModal(orderId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;
    const data = ffFireDataAll();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">✔️ معالجة وإغلاق أمر العمل — ${escapeHTML(order.orderNumber || "")}</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form onsubmit="ffSaveResolveFault(event, '${order.id}')">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">المشكلة / العطل</label>
                        <input type="text" class="ff-form-input" value="${escapeHTML(order.title || order.description || '')}" readonly style="background:#f8fafc;">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الإجراء المتخذ وتفاصيل الحل *</label>
                        <textarea class="ff-form-textarea" id="ffResolveText" required placeholder="اشرح بالتفصيل كيف تمت المعالجة، والقطع المستبدلة، ونتيجة الاختبار بعد الإصلاح..."></textarea>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">إعادة تشغيل المعدة المرتبطة؟</label>
                        <select class="ff-form-select" id="ffResolveEquipStatus">
                            <option value="OPERATIONAL">إعادة المعدة للخدمة (OPERATIONAL — عاملة)</option>
                            <option value="KEEP">إبقاء حالة المعدة كما هي دون تغيير</option>
                        </select>
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-primary">إغلاق الأمر بنجاح</button>
                </div>
            </form>
        </div>
    </div>`;
}

async function ffSaveResolveFault(e, orderId) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const resolution = (document.getElementById("ffResolveText").value || "").trim();
    const equipStatusChoice = document.getElementById("ffResolveEquipStatus").value;

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        const orderRef = fs.doc(db, MECH_ORDERS_COLLECTION, orderId);
        const orderSnap = await fs.getDoc(orderRef);
        const orderData = orderSnap.exists() ? orderSnap.data() : {};

        await fs.updateDoc(orderRef, {
            status: "COMPLETE",
            resolution: resolution,
            completedAt: new Date().toISOString().slice(0, 10),
            closedBy: who.name,
            updatedAt: fs.serverTimestamp()
        });

        await fs.addDoc(fs.collection(db, MECH_ORDER_HISTORY_COLLECTION), {
            orderId: orderId,
            fromStatus: orderData.status || "NEW",
            toStatus: "COMPLETE",
            by: who.name,
            notes: resolution,
            at: fs.serverTimestamp()
        });

        if (equipStatusChoice === "OPERATIONAL" && orderData.equipmentId) {
            const eqRef = fs.doc(db, MECH_EQUIPMENT_COLLECTION, orderData.equipmentId);
            const eqSnap = await fs.getDoc(eqRef);
            if (eqSnap.exists()) {
                const oldEq = eqSnap.data();
                const changeRes = MC.ffLogEquipmentChange(orderData.equipmentId, {
                    status: "OPERATIONAL", status_old: oldEq.status,
                    by: who.name
                });
                await fs.updateDoc(eqRef, {
                    status: "OPERATIONAL",
                    updatedBy: who.name,
                    updatedAt: fs.serverTimestamp(),
                    changeLog: [...(oldEq.changeLog || []), ...changeRes.changes]
                });
            }
        }

        showMessage("تم إغلاق أمر العمل ومعالجة العطل بنجاح.", "success");
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Resolve fault error:", err);
        showMessage("تعذّر إغلاق أمر العمل. تحقّق من الاتصال وحاول مجدداً.", "error");
    }
}

// ---------------- 6. نافذة إنشاء أمر عمل جديد ----------------
function ffOpenOrderModal(equipmentId) {
    if (!requireLoginForWrite(() => ffOpenOrderModal(equipmentId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;
    const data = ffFireDataAll();

    const equipOptions = data.equipment.filter(e => e.id === equipmentId || MC.ffFacilityOf(e) === ffFacilityFilter).map(e => {
        const isSel = equipmentId && e.id === equipmentId;
        return `<option value="${e.id}" ${isSel ? "selected" : ""}>${escapeHTML(e.name)} (${e.tagNumber || e.internalCode || 'بدون رمز'})</option>`;
    }).join("");

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">📋 إنشاء أمر عمل جديد — مكافحة الحريق</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form onsubmit="ffSaveOrder(event)">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">المعدة المرتبطة</label>
                        <select class="ff-form-select" id="ffOrderEquipId">
                            <option value="">— غير مرتبطة بمعدة محددة (أمر عام) —</option>
                            ${equipOptions}
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">نوع الطلب *</label>
                        <select class="ff-form-select" id="ffOrderType" required>
                            <option value="INSPECTION">فحص دوري (INSPECTION)</option>
                            <option value="PREVENTIVE">صيانة وقائية (PREVENTIVE)</option>
                            <option value="CORRECTIVE">صيانة تصحيحية (CORRECTIVE)</option>
                            <option value="BREAKDOWN">عطل وتوقف (BREAKDOWN)</option>
                            <option value="TESTING">اختبار وتشغيل تجريبي (TESTING)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">عنوان أمر العمل *</label>
                        <input type="text" class="ff-form-input" id="ffOrderTitle" required placeholder="مثال: فحص صمامات سيت المضخات، تبديل مانوميتر...">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">درجة الأولوية *</label>
                        <select class="ff-form-select" id="ffOrderPriority" required>
                            <option value="LOW">منخفضة (LOW)</option>
                            <option value="MEDIUM" selected>متوسطة (MEDIUM)</option>
                            <option value="HIGH">عالية (HIGH)</option>
                            <option value="CRITICAL">حرجة (CRITICAL)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">وصف العمل المطلوب *</label>
                        <textarea class="ff-form-textarea" id="ffOrderDesc" required placeholder="اكتب تفاصيل ومحددات العمل المطلوب تنفيذه..."></textarea>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">المسؤول عن التنفيذ (الفني أو الجهة)</label>
                        <input type="text" class="ff-form-input" id="ffOrderAssignee" placeholder="اسم الفني أو المقاول المسند إليه العمل">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">تاريخ الاستحقاق المستهدف</label>
                        <input type="date" class="ff-form-input" id="ffOrderDueDate">
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-primary">إنشاء أمر العمل</button>
                </div>
            </form>
        </div>
    </div>`;
}

async function ffSaveOrder(e) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const equipId = document.getElementById("ffOrderEquipId").value || null;
    const type = document.getElementById("ffOrderType").value;
    const title = (document.getElementById("ffOrderTitle").value || "").trim();
    const priority = document.getElementById("ffOrderPriority").value;
    const desc = (document.getElementById("ffOrderDesc").value || "").trim();
    const assignee = (document.getElementById("ffOrderAssignee").value || "").trim();
    const dueDate = document.getElementById("ffOrderDueDate").value || null;

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();

        let equipName = null;
        let equipTag = null;
        let orderFacility = (ffFacilityFilter === "hospital" || ffFacilityFilter === "complex") ? ffFacilityFilter : null;
        if (equipId) {
            const eq = (mechEquipmentCache || []).find(x => x.id === equipId);
            if (eq) {
                equipName = eq.name;
                equipTag = eq.tagNumber || eq.internalCode || null;
                const f = MC.ffFacilityOf(eq);
                orderFacility = f === "unassigned" ? null : f;
            }
        }

        const prefix = type === "INSPECTION" ? "FF-INSP" : (type === "BREAKDOWN" ? "FF-FLT" : "FF-ORD");
        const orderNum = await getNextMechOrderNumber(db, prefix);

        await fs.addDoc(fs.collection(db, MECH_ORDERS_COLLECTION), {
            department: "fire-fighting",
            facility: orderFacility,
            equipmentId: equipId,
            equipmentName: equipName,
            equipmentTag: equipTag,
            orderNumber: orderNum,
            type: type,
            title: title,
            description: desc,
            priority: priority,
            assignedTo: assignee || null,
            dueDate: dueDate,
            status: "NEW",
            createdBy: who.name,
            createdAt: fs.serverTimestamp()
        });

        showMessage(`تم إنشاء أمر العمل برقم ${orderNum} بنجاح.`, "success");
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Save order error:", err);
        showMessage("تعذّر إنشاء أمر العمل. تحقّق من الاتصال وحاول مجدداً.", "error");
    }
}

async function ffUpdateOrderStatus(orderId, newStatus) {
    if (!requireLoginForWrite(() => ffUpdateOrderStatus(orderId, newStatus))) return;
    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        const ref = fs.doc(db, MECH_ORDERS_COLLECTION, orderId);
        const snap = await fs.getDoc(ref);
        const oldStatus = snap.exists() ? snap.data().status : "NEW";

        await fs.updateDoc(ref, {
            status: newStatus,
            updatedBy: who.name,
            updatedAt: fs.serverTimestamp()
        });

        await fs.addDoc(fs.collection(db, MECH_ORDER_HISTORY_COLLECTION), {
            orderId: orderId,
            fromStatus: oldStatus,
            toStatus: newStatus,
            by: who.name,
            at: fs.serverTimestamp()
        });

        showMessage(`تم تحديث حالة أمر العمل إلى ${MC.statusLabel(newStatus)}.`, "success");
        renderFFContent();
        renderFFStats();
    } catch (err) {
        console.error("Update order status error:", err);
        showMessage("تعذّر تحديث حالة أمر العمل.", "error");
    }
}

// ---------------- 7. نافذة تعديل بيانات المعدة الأساسية ----------------
function ffOpenEditEquipmentModal(equipmentId) {
    if (!requireLoginForWrite(() => ffOpenEditEquipmentModal(equipmentId))) return;
    const host = document.getElementById("ffModalHost");
    if (!host) return;
    const data = ffFireDataAll();
    const eq = data.equipment.find(e => e.id === equipmentId);
    if (!eq) return;

    host.innerHTML = `
    <div class="ff-modal-overlay" onclick="if(event.target===this) ffCloseModal()">
        <div class="ff-modal">
            <div class="ff-modal-head">
                <h3 class="ff-modal-title">✏️ تعديل بيانات المعدة — ${escapeHTML(eq.name)}</h3>
                <button type="button" class="ff-modal-close" onclick="ffCloseModal()">✕</button>
            </div>
            <form onsubmit="ffSaveEditEquipment(event, '${eq.id}')">
                <div class="ff-modal-body">
                    <div class="ff-form-group">
                        <label class="ff-form-label">اسم المعدة *</label>
                        <input type="text" class="ff-form-input" id="ffEditName" value="${escapeHTML(eq.name || '')}" required>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">رقم المعدة الرسمي (Tag Number)</label>
                        <input type="text" class="ff-form-input" id="ffEditTag" value="${escapeHTML(eq.tagNumber || '')}" placeholder="Tag Number إن وجد">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الموقع (Location)</label>
                        <input type="text" class="ff-form-input" id="ffEditLocation" value="${escapeHTML(eq.location || '')}" placeholder="الموقع الفعلي في المبنى">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الحالة التشغيلية *</label>
                        <select class="ff-form-select" id="ffEditStatus" required>
                            <option value="OPERATIONAL" ${eq.status==='OPERATIONAL'?'selected':''}>عاملة (OPERATIONAL)</option>
                            <option value="STOPPED" ${eq.status==='STOPPED'?'selected':''}>متوقفة (STOPPED)</option>
                            <option value="UNDER_MAINTENANCE" ${eq.status==='UNDER_MAINTENANCE'?'selected':''}>تحت الصيانة (UNDER_MAINTENANCE)</option>
                            <option value="OUT_OF_SERVICE" ${eq.status==='OUT_OF_SERVICE'?'selected':''}>خارج الخدمة (OUT_OF_SERVICE)</option>
                            <option value="UNVERIFIED" ${eq.status==='UNVERIFIED'?'selected':''}>غير مفحوصة (UNVERIFIED)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الجهة التابعة (Facility)</label>
                        <select class="ff-form-select" id="ffEditFacility">
                            <option value="" ${MC.ffFacilityOf(eq) === "unassigned" ? "selected" : ""}>غير محددة</option>
                            <option value="hospital" ${MC.ffFacilityOf(eq) === "hospital" ? "selected" : ""}>المستشفى (Hospital)</option>
                            <option value="complex" ${MC.ffFacilityOf(eq) === "complex" ? "selected" : ""}>المجمع (Complex)</option>
                        </select>
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الرقم التسلسلي (Serial Number)</label>
                        <input type="text" class="ff-form-input" id="ffEditSerial" value="${escapeHTML(eq.serialNumber || '')}">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الشركة المصنعة (Manufacturer)</label>
                        <input type="text" class="ff-form-input" id="ffEditManufacturer" value="${escapeHTML(eq.manufacturer || '')}">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الطراز (Model)</label>
                        <input type="text" class="ff-form-input" id="ffEditModel" value="${escapeHTML(eq.model || '')}">
                    </div>
                    <div class="ff-form-group">
                        <label class="ff-form-label">الملاحظات الفنية</label>
                        <textarea class="ff-form-textarea" id="ffEditNotes">${escapeHTML(eq.notes || '')}</textarea>
                    </div>
                </div>
                <div class="ff-modal-foot">
                    <button type="button" class="ff-btn" onclick="ffCloseModal()">إلغاء</button>
                    <button type="submit" class="ff-btn is-primary">حفظ التعديلات</button>
                </div>
            </form>
        </div>
    </div>`;
}

async function ffSaveEditEquipment(e, equipmentId) {
    e.preventDefault();
    if (!requireLoginForWrite(() => {})) return;
    const name = (document.getElementById("ffEditName").value || "").trim();
    const tag = (document.getElementById("ffEditTag").value || "").trim();
    const location = (document.getElementById("ffEditLocation").value || "").trim();
    const status = document.getElementById("ffEditStatus").value;
    const notes = (document.getElementById("ffEditNotes").value || "").trim();
    const facility = (document.getElementById("ffEditFacility").value || "").trim();
    const serial = (document.getElementById("ffEditSerial").value || "").trim();
    const manufacturer = (document.getElementById("ffEditManufacturer").value || "").trim();
    const model = (document.getElementById("ffEditModel").value || "").trim();

    if (tag) {
        const dup = MC.ffFindDuplicateTag(mechEquipmentCache, tag, equipmentId);
        if (dup) {
            showMessage(`رقم الـ Tag «${tag}» مستخدم بالفعل في المعدة «${dup.name}». يرجى استخدام رقم فريد.`, "error");
            return;
        }
    }

    try {
        const db = getFirestoreDB();
        const fs = await import(MECH_FIRESTORE_URL);
        const who = mechWho();
        const ref = fs.doc(db, MECH_EQUIPMENT_COLLECTION, equipmentId);
        const snap = await fs.getDoc(ref);
        const old = snap.exists() ? snap.data() : {};

        const changeRes = MC.ffLogEquipmentChange(equipmentId, {
            name: name, name_old: old.name,
            tagNumber: tag, tagNumber_old: old.tagNumber,
            location: location, location_old: old.location,
            status: status, status_old: old.status,
            facility: facility, facility_old: MC.ffFacilityOf(Object.assign({ id: equipmentId }, old)) === "unassigned" ? "" : MC.ffFacilityOf(Object.assign({ id: equipmentId }, old)),
            serialNumber: serial, serialNumber_old: old.serialNumber || "",
            manufacturer: manufacturer, manufacturer_old: old.manufacturer || "",
            model: model, model_old: old.model || "",
            notes: notes, notes_old: old.notes,
            by: who.name
        });

        await fs.updateDoc(ref, {
            name: name,
            tagNumber: tag || null,
            location: location || null,
            facility: facility || null,
            serialNumber: serial || null,
            manufacturer: manufacturer || null,
            model: model || null,
            status: status,
            notes: notes || "",
            updatedBy: who.name,
            updatedAt: fs.serverTimestamp(),
            changeLog: [...(old.changeLog || []), ...changeRes.changes]
        });

        showMessage("تم تحديث بيانات المعدة وتسجيل أثر التعديل بنجاح.", "success");
        ffCloseModal();
        renderFFStats();
        renderFFContent();
    } catch (err) {
        console.error("Save edit equipment error:", err);
        showMessage("تعذّر حفظ التعديلات على المعدة.", "error");
    }
}

// ---------- رجوع إلى لوحة الميكانيك الرئيسية ----------
function ffBack() {
    openMechanics();
    mechGoDashboard();
}

// ---------- إعادة رسم الواجهة عند تحديث Firestore الحي ----------
function renderFireFightingIfVisible() {
    const page = document.getElementById("fireFightingPage");
    if (!page || getComputedStyle(page).display === "none") return;
    renderFFStats();
    renderFFContent();
}

// ============================================================
// ابنية المستشفى (Hospital Buildings)
// الطوابق والبنايات ثابتة في الكود؛ الحالة والملاحظات تُحفظ في Firestore
// (مجموعة hospital_buildings، المعرّف = <floor>_<kind>_<num>)
// ============================================================
const HB_COLLECTION = "hospital_buildings";
const HB_RANGE = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
// أسماء البنايات في الطابق الأرضي (التي لم يُذكر لها اسم تبقى بلا اسم)
const HB_GROUND_NAMES = {
    3: "الممر الرئيسي",
    4: "باطنية طوارئ",
    5: "العلاج الطبعي",
    7: "المخزن",
    8: "الإحصاء",
    9: "اللاندري",
    10: "المطبخ",
    11: "صالة الطعام",
    12: "الصيدلية المركزية",
    13: "الإدارة",
    15: "دار الأطباء نساء",
    16: "دار الأطباء رجال"
};
const HB_FIRST_NAMES = {
    4: "أطفال خدج",
    5: "نسائية وتوليد",
    7: "جراحية نساء",
    8: "جراحية نساء",
    9: "جراحية رجال",
    10: "جراحية رجال",
    11: "ردهة الأطفال",
    13: "الإدارة"
};
const HB_SECOND_NAMES = {
    8: "غسيل الكلى",
    11: "باطنية نساء",
    12: "باطنية رجال",
    13: "الناضور"
};
const HB_B = (nums, names) => nums.map(n => ({ num: n, kind: "b", name: (names && names[n]) || "" }));
const HB_R = (nums) => nums.map(n => ({ num: n, kind: "r" }));
const HB_FLOORS = [
    { key: "ground", nameAr: "الطابق الأرضي", nameEn: "Ground Floor",
      items: HB_B(["1A", "1B", "1C"].concat(HB_RANGE(2, 17)), HB_GROUND_NAMES) },
    { key: "first", nameAr: "الطابق الأول", nameEn: "First Floor",
      items: HB_B(["1A", "1B", "1C"].concat(HB_RANGE(2, 16)), HB_FIRST_NAMES) },
    { key: "second", nameAr: "الطابق الثاني", nameEn: "Second Floor",
      items: HB_B(["1B", "1C", 2, 3], HB_SECOND_NAMES)
          .concat(HB_R(["1A", 4, 5, 6, 7]))
          .concat(HB_B(HB_RANGE(8, 14), HB_SECOND_NAMES))
          .concat(HB_R([15, 16])) },
    { key: "roof", nameAr: "السطح", nameEn: "Roof",
      items: HB_R(["1B", "1C", "1D", 2, 3, 8, 9, 10, 11, 12, 13, 14]) }
];
const HB_PUMP_LABEL = { label: "مخدومة من قبل دافعة رقم", en: "Served by Pump No." };
const HB_STATUS_LABEL = { label: "الحالة", en: "Status" };
const HB_NOTES_LABEL = { label: "ملاحظات", en: "Notes" };
const HB_STATUSES = {
    "": "غير محددة",
    ok: "جيدة",
    maint: "قيد الصيانة",
    issue: "بها مشكلة"
};
// الحقول العددية داخل كل بناية (فارغ = لم يُدخل بعد)
// سجل الفان كويلات (CF) — على السطوح. loc = موقعها على البناية (null = غير محدد في المصدر)
const HB_FC_UNITS = [
    { id: "CF-1.1", duct: "250x300", air: 1300, loc: "1B" },
    { id: "CF-1.2", duct: "250x200", air: 740, loc: "1C" },
    { id: "CF-1.3", duct: "250x200", air: 1140, loc: "1C" },
    { id: "CF-1.4", duct: "300x350", air: 2030, loc: "1A" },
    { id: "CF-1.5", duct: "400x400", air: 2700, loc: "1A" },
    { id: "CF-1.6", duct: "400x300", air: 2180, loc: "1B" },
    { id: "CF-1.7", duct: "450x400", air: 3350, loc: "1D" },
    { id: "CF-4.1", duct: "500x300", air: 2540, loc: "4" },
    { id: "CF-5.1", duct: "350x250", air: 1460, loc: "5" },
    { id: "CF-6.1", duct: "150x150", air: 370, loc: "6" },
    { id: "CF-6.2", duct: "300x250", air: 1200, loc: "6" },
    { id: "CF-7.1", duct: "200x250", air: 870, loc: "7" },
    { id: "CF-8.1", duct: "400x300", air: 2280, loc: "8" },
    { id: "CF-9.1", duct: "450x450", air: 3420, loc: "9" },
    { id: "CF-10.1", duct: "450x300", air: 2330, loc: "10" },
    { id: "CF-10.4", duct: "1000x600", air: 16800, loc: null, notes: "(دفع للمطبخ) sand trap with filter" },
    { id: "CF-10.6", duct: "1300x1000", air: 23900, loc: "11", notes: "سحب للمطبخ" },
    { id: "CF-11.1", duct: "300x250", air: 1340, loc: "11" },
    { id: "CF-12.1", duct: "250x200", air: 920, loc: "12" },
    { id: "CF-13.1", duct: "400x300", air: 2130, loc: "13" },
    { id: "CF-15.1", duct: "800x400", air: 5430, loc: "15" },
    { id: "CF-16.1", duct: "800x400", air: 5430, loc: "16" }
];
const HB_UNIT_STATUSES = { "": "غير محددة", working: "شغال", faulty: "عاطل" };
function hbUnitStatus(floorKey, item, unitId) {
    const rec = hbData[hbId(floorKey, item)] || {};
    return (rec.unitStatus && rec.unitStatus[unitId]) || "";
}
// وحدات مناولة الهواء (AHU / FAHU) على السطوح — من مخططات HVAC (طابق ثانٍ/ثالث). AHU = هواء مختلط، FAHU = هواء نقي
const HB_AHU_UNITS = [
    { id: "AHU-9", loc: "4" }, { id: "FAHU-10", loc: "4" },
    { id: "AHU-4", loc: "5" }, { id: "FAHU-8", loc: "5" },
    { id: "FAHU-7", loc: "6" },
    { id: "FAHU-6", loc: "7" },
    { id: "FAHU-5", loc: "8" }, { id: "FAHU-41", loc: "8" }, { id: "AHU-12", loc: "8" },
    { id: "AHU-47", loc: "9" }, { id: "AHU-14", loc: "9" }, { id: "FAHU-3", loc: "9" },
    { id: "AHU-49", loc: "10" }, { id: "AHU-50", loc: "10" }, { id: "FAHU-11", loc: "10" },
    { id: "FAHU-13", loc: "11" }, { id: "AHU-51", loc: "11" },
    { id: "FAHU-15", loc: "12" }, { id: "AHU-46", loc: "12" }, { id: "FAHU-48", loc: "12" },
    { id: "FAHU-16", loc: "13" }, { id: "AHU-20", loc: "13" },
    // جناح E2 (المخطط يغطي 1C و1D و2): التوزيع بين الأسطح الثلاثة حسب موقع الوحدات على المخطط، يحتاج تأكيد
    { id: "AHU-21", loc: "1C" }, { id: "AHU-22", loc: "1C" }, { id: "AHU-33", loc: "1C" }, { id: "FAHU-43", loc: "1C" }, { id: "AHU-17", loc: "1C" },
    { id: "FAHU-19", loc: "1D" }, { id: "FAHU-2", loc: "1D" },
    { id: "AHU-34", loc: "1D" }, { id: "AHU-38", loc: "1D" },
    // جناح E3 (سطح 1B): من مخطط E3، وحدتا AHU-34 وAHU-38 تظهران فيه أيضاً عند ملتقى الجناحين (سطح 2)
    { id: "FAHU-18", loc: "1B" }, { id: "FAHU-23", loc: "1B" }, { id: "FAHU-1", loc: "1B" }, { id: "AHU-28", loc: "1B" },
    // سطح 1A: من مخطط E1 (الطابق الثاني)
    { id: "AHU-24", loc: "1A" }, { id: "AHU-25", loc: "1A" }, { id: "AHU-26", loc: "1A" }, { id: "AHU-27", loc: "1A" },
    { id: "AHU-30", loc: "1A" }, { id: "AHU-31", loc: "1A" }, { id: "AHU-32", loc: "1A" }, { id: "AHU-35", loc: "1A" },
    { id: "AHU-36", loc: "1A" }, { id: "AHU-37", loc: "1A" }, { id: "AHU-39", loc: "1A" }
];
// مواصفات الدافعات (AHU/FAHU) — من ملف المورّد SEM (Offer 22-0860، مشروع Fathila Hospital، 460 صفحة).
// m الموديل، sa/ra هواء التغذية/الراجع m³/h، w/l/h/kg الأبعاد mm والوزن، sf/rf مروحة التغذية/الراجع (z الحجم، q التدفق، p الضغط الستاتيكي الخارجي Pa، k القدرة المركّبة kW، a القدرة الممتصة kW)،
// hc/cc قدرات ملفات التسخين/التبريد kW، hr استرجاع الحرارة (t النوع، e الكفاءة %، k القدرة kW)، ps التغذية الكهربائية
const HB_AHU_SPECS = {"AHU-17":{"m":"MYHC 2.5","sa":6300,"ra":5700,"w":1617,"l":3735,"h":1616,"kg":909,"rf":{"z":"TE 355 S4","q":5700,"p":230,"k":2.2,"a":1.5},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":6300,"p":260,"k":3.0,"a":2.4},"hc":[11.5],"cc":[41.4],"hr":{"t":"cross flow","e":64.52,"k":7.67}},"FAHU-18":{"m":"MYHC 4.5","sa":10600,"ra":7015,"w":1923,"l":4600,"h":2216,"kg":1600,"rf":{"z":"TE 355 S4","q":7015,"p":360,"k":3.0,"a":2.5},"ps":"400V/3ph/50Hz","sf":{"z":"NPA450S4","q":10600,"p":370,"k":7.5,"a":4.6},"hc":[80.8],"cc":[137.1],"hr":{"t":"cross flow","e":67.66,"k":43.53}},"FAHU-19":{"m":"MYHC 2.5","sa":5700,"ra":2800,"w":1617,"l":3820,"h":1616,"kg":954,"rf":{"z":"TE 280 S4","q":2800,"p":410,"k":1.1,"a":0.8},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":5700,"p":390,"k":3.0,"a":2.7},"hc":[42.1],"cc":[71.8],"hr":{"t":"cross flow","e":63.86,"k":18.09}},"AHU-21":{"m":"MYHC 2","sa":4610,"ra":4450,"w":1314,"l":4190,"h":1616,"kg":911,"rf":{"z":"GR40I 116895/A01","q":4450,"p":290,"k":2.1,"a":1.2},"ps":"400V/3ph/50Hz","sf":{"z":"GR31I 116890/A01","q":4610,"p":670,"k":3.0,"a":2.5},"hc":[22.6,8.2],"cc":[59.3],"hr":{"t":"cross flow","e":60.82,"k":19.22}},"AHU-22":{"m":"MYHC 5","sa":13000,"ra":10400,"w":1617,"l":4940,"h":2828,"kg":1943,"rf":{"z":"NPA450S4","q":10400,"p":300,"k":4.0,"a":3.1},"ps":"400V/3ph/50Hz","sf":{"z":"NPA500S4","q":13000,"p":290,"k":7.5,"a":5.6},"hc":[55.1],"cc":[168.8],"hr":{"t":"cross flow","e":67.96,"k":57.45}},"FAHU-23":{"m":"MYHC 2","sa":4900,"ra":3410,"w":1314,"l":3820,"h":1616,"kg":822,"rf":{"z":"TE 280 S4","q":3410,"p":280,"k":1.1,"a":1.0},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":4900,"p":300,"k":3.0,"a":2.1},"hc":[34.4],"cc":[58.6],"hr":{"t":"cross flow","e":64.4,"k":19.94}},"AHU-24":{"m":"MYHC 3","sa":7115,"ra":6350,"w":1314,"l":5060,"h":2216,"kg":1273,"rf":{"z":"GR35I 116892/A01","q":6350,"p":300,"k":2.5,"a":1.9},"ps":"400V/3ph/50Hz","sf":{"z":"GR45I 116903/A01","q":7115,"p":660,"k":5.0,"a":4.3},"hc":[34.5,17.2],"cc":[105.7],"hr":{"t":"cross flow","e":64.29,"k":30.68}},"AHU-25":{"m":"MYHC 3","sa":6655,"ra":6655,"w":1314,"l":4560,"h":2216,"kg":1199,"rf":{"z":"GR35I 116893/A01","q":6655,"p":260,"k":3.3,"a":2.2},"ps":"400V/3ph/50Hz","sf":{"z":"GR45I 116903/A01","q":6655,"p":670,"k":5.0,"a":3.9},"hc":[31.0,16.7],"cc":[99.1],"hr":{"t":"cross flow","e":63.86,"k":30.18}},"AHU-26":{"m":"MYHC 1.5","sa":3435,"ra":3050,"w":1008,"l":4400,"h":1616,"kg":819,"rf":{"z":"GR35I 116892/A01","q":3050,"p":270,"k":2.5,"a":0.8},"ps":"400V/3ph/50Hz","sf":{"z":"GR35I 116892/A01","q":3435,"p":380,"k":2.5,"a":1.7},"hc":[15.7,8.8],"cc":[50.5],"hr":{"t":"cross flow","e":63.93,"k":15.01}},"AHU-27":{"m":"MYHC 2","sa":3895,"ra":3550,"w":1314,"l":4400,"h":1616,"kg":926,"rf":{"z":"GR35I 116892/A01","q":3550,"p":280,"k":2.5,"a":0.9},"ps":"400V/3ph/50Hz","sf":{"z":"GR35I 116892/A01","q":3895,"p":370,"k":2.5,"a":1.7},"hc":[18.7,8.8],"cc":[58.2],"hr":{"t":"cross flow","e":63.82,"k":17.1}},"AHU-28":{"m":"MYHC 1.5","sa":3000,"ra":2600,"w":1008,"l":4370,"h":1616,"kg":790,"rf":{"z":"GR25I 116883/A01","q":2600,"p":270,"k":0.78,"a":0.7},"ps":"400V/3ph/50Hz","sf":{"z":"GR35I 116892/A01","q":3000,"p":280,"k":2.5,"a":1.2},"hc":[13.9,4.0],"cc":[40.1],"hr":{"t":"cross flow","e":63.94,"k":12.99}},"AHU-30":{"m":"MYHC 1.5","sa":2220,"ra":1400,"w":1008,"l":3580,"h":1616,"kg":667,"rf":{"z":"TE 225 S4","q":1400,"p":220,"k":0.75,"a":0.3},"ps":"400V/3ph/50Hz","sf":{"z":"TE 250 S4","q":2220,"p":210,"k":1.1,"a":0.8},"hc":[12.3],"cc":[29.1],"hr":{"t":"cross flow","e":66.59,"k":8.97}},"AHU-31":{"m":"MYHC 3.5","sa":9200,"ra":6350,"w":1617,"l":4870,"h":2216,"kg":1412,"rf":{"z":"TE 355 S4","q":6350,"p":310,"k":3.0,"a":2.0},"ps":"400V/3ph/50Hz","sf":{"z":"NPA450S4","q":9200,"p":300,"k":4.0,"a":3.5},"hc":[46.6],"cc":[122.6],"hr":{"t":"cross flow","e":65.19,"k":37.16}},"AHU-32":{"m":"MYHC 3.5","sa":7850,"ra":6500,"w":1617,"l":4470,"h":2216,"kg":1302,"rf":{"z":"TE 355 S4","q":6500,"p":320,"k":3.0,"a":2.2},"ps":"400V/3ph/50Hz","sf":{"z":"NPA450S4","q":7850,"p":290,"k":4.0,"a":2.8},"hc":[35.4],"cc":[93.7],"hr":{"t":"cross flow","e":67.15,"k":34.36}},"AHU-33":{"m":"MYHC 6","sa":14150,"ra":10830,"w":1923,"l":4750,"h":2828,"kg":2152,"rf":{"z":"GR50I 116906/A01","q":10830,"p":220,"k":4.8,"a":2.4},"ps":"400V/3ph/50Hz","sf":{"z":"GR56C 116180/A01","q":14150,"p":220,"k":6.0,"a":5.5},"hc":[68.6,7.3],"cc":[183.7],"hr":{"t":"cross flow","e":68.77,"k":62.7}},"AHU-34":{"m":"MYHC 2","sa":3900,"ra":3100,"w":1314,"l":3620,"h":1616,"kg":815,"rf":{"z":"GR28I 116885/A01","q":3100,"p":230,"k":0.78,"a":0.7},"ps":"400V/3ph/50Hz","sf":{"z":"GR35I 116892/A01","q":3900,"p":270,"k":2.5,"a":1.2},"hc":[18.0,2.0],"cc":[50.2],"hr":{"t":"cross flow","e":65.15,"k":16.73}},"AHU-35":{"m":"MYHC 3","sa":6655,"ra":5850,"w":1314,"l":4940,"h":2216,"kg":1241,"rf":{"z":"GR31I 116889/A01","q":5850,"p":280,"k":2.4,"a":1.9},"ps":"400V/3ph/50Hz","sf":{"z":"GR40I 116897/A01","q":6655,"p":660,"k":3.7,"a":3.5},"hc":[31.1,18.4],"cc":[100.3],"hr":{"t":"cross flow","e":64.64,"k":28.69}},"AHU-36":{"m":"MYHC 2","sa":3600,"ra":3270,"w":1314,"l":3720,"h":1616,"kg":795,"rf":{"z":"TE 280 S4","q":3270,"p":260,"k":1.1,"a":0.9},"ps":"400V/3ph/50Hz","sf":{"z":"TE 280 S4","q":3600,"p":270,"k":2.2,"a":1.5},"hc":[16.6],"cc":[52.6],"hr":{"t":"cross flow","e":64.49,"k":15.96}},"AHU-37":{"m":"MYHC 1.5","sa":3100,"ra":3150,"w":1008,"l":3690,"h":1616,"kg":688,"rf":{"z":"TE 280 S4","q":3150,"p":240,"k":1.1,"a":0.9},"ps":"400V/3ph/50Hz","sf":{"z":"TE 280 S4","q":3100,"p":270,"k":1.5,"a":1.2},"hc":[14.1],"cc":[41.0],"hr":{"t":"cross flow","e":60.52,"k":13.39}},"AHU-38":{"m":"MYHC 1.5","sa":2300,"ra":2070,"w":1008,"l":3490,"h":1616,"kg":690,"rf":{"z":"GR28I 116884/A01","q":2070,"p":260,"k":0.5,"a":0.5},"ps":"230V/1ph/50Hz","sf":{"z":"GR25I 116883/A01","q":2300,"p":280,"k":0.78,"a":0.8},"hc":[10.6,5.2],"cc":[34.3],"hr":{"t":"cross flow","e":64.34,"k":10.17}},"AHU-39":{"m":"MYHC 5","sa":10200,"ra":6200,"w":1617,"l":4510,"h":2828,"kg":1761,"rf":{"z":"TE 355 S4","q":6200,"p":310,"k":2.2,"a":1.8},"ps":"400V/3ph/50Hz","sf":{"z":"NPA400S4","q":10200,"p":310,"k":5.5,"a":4.5},"hc":[50.6],"cc":[136.4],"hr":{"t":"cross flow","e":67.95,"k":40.05}},"FAHU-43":{"m":"MYHC 2","sa":3800,"ra":2950,"w":1314,"l":3660,"h":1616,"kg":791,"rf":{"z":"TE 250 S4","q":2950,"p":260,"k":1.5,"a":1.1},"ps":"400V/3ph/50Hz","sf":{"z":"TE 280 S4","q":3800,"p":270,"k":2.2,"a":1.8},"hc":[27.7],"cc":[47.2],"hr":{"t":"cross flow","e":66.01,"k":16.36}},"FAHU-1":{"m":"MYHC 5","sa":12000,"ra":6000,"w":1617,"l":5260,"h":2828,"kg":2079,"rf":{"z":"NPA400S4","q":6000,"p":480,"k":2.2,"a":1.6},"ps":"400V/3ph/50Hz","sf":{"z":"NPA500S4","q":12000,"p":430,"k":7.5,"a":5.5},"hc":[87.9],"cc":[149.4],"hr":{"t":"cross flow","e":73.58,"k":48.04}},"FAHU-2":{"m":"MYHC 4","sa":10000,"ra":8900,"w":1314,"l":4630,"h":2828,"kg":1607,"rf":{"z":"NPA450S4","q":8900,"p":460,"k":4.0,"a":2.9},"ps":"400V/3ph/50Hz","sf":{"z":"NPA450S4","q":10000,"p":450,"k":7.5,"a":4.8},"hc":[73.2],"cc":[124.5],"hr":{"t":"cross flow","e":64.16,"k":43.51}},"AHU-4":{"m":"MYHC 1","sa":1930,"ra":1960,"w":708,"l":3330,"h":1616,"kg":559,"rf":{"z":"NPL280S4","q":1960,"p":240,"k":0.75,"a":0.5},"ps":"400V/3ph/50Hz","sf":{"z":"TE 250 S4","q":1930,"p":180,"k":1.1,"a":0.7},"hc":[9.3],"cc":[23.1],"hr":{"t":"cross flow","e":61.28,"k":8.44}},"FAHU-8":{"m":"MYHC 2","sa":4680,"ra":3240,"w":1314,"l":4110,"h":1616,"kg":870,"rf":{"z":"TE 280 S4","q":3240,"p":310,"k":1.1,"a":0.9},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":4680,"p":310,"k":3.0,"a":1.9},"hc":[33.2],"cc":[56.2],"hr":{"t":"cross flow","e":70.55,"k":20.25}},"AHU-9":{"m":"MYHC 4.5","sa":11840,"ra":8570,"w":1923,"l":4780,"h":2216,"kg":1712,"rf":{"z":"GR45I 116901/A01","q":8570,"p":320,"k":2.4,"a":2.2},"ps":"400V/3ph/50Hz","sf":{"z":"GR56C 116180/A01","q":11840,"p":300,"k":6.0,"a":4.9},"hc":[61.3,7.1],"cc":[153.7],"hr":{"t":"cross flow","e":70.52,"k":51.88}},"FAHU-10":{"m":"MYHC 1.5","sa":2170,"ra":1070,"w":1008,"l":3610,"h":1616,"kg":690,"rf":{"z":"TE 250 S4","q":1070,"p":220,"k":0.75,"a":0.2},"ps":"400V/3ph/50Hz","sf":{"z":"TE 250 S4","q":2170,"p":260,"k":1.1,"a":0.8},"hc":[20.8],"cc":[33.1],"hr":{"t":"cross flow","e":67.34,"k":6.91}},"FAHU-7":{"m":"MYHC 1.5","sa":2660,"ra":1965,"w":1008,"l":3610,"h":1616,"kg":671,"rf":{"z":"TE 225 S4","q":1965,"p":270,"k":0.75,"a":0.7},"ps":"400V/3ph/50Hz","sf":{"z":"TE 250 S4","q":2660,"p":250,"k":1.5,"a":1.2},"hc":[19.1],"cc":[32.5],"hr":{"t":"cross flow","e":64.42,"k":9.6}},"FAHU-6":{"m":"MYHC 2","sa":4630,"ra":3290,"w":1314,"l":3820,"h":1616,"kg":841,"rf":{"z":"TE 280 S4","q":3290,"p":270,"k":1.1,"a":0.9},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":4630,"p":310,"k":3.0,"a":2.0},"hc":[34.3],"cc":[58.3],"hr":{"t":"cross flow","e":68.32,"k":19.96}},"FAHU-5":{"m":"MYHC 1.5","sa":2770,"ra":1700,"w":1008,"l":3700,"h":1616,"kg":702,"rf":{"z":"TE 225 S4","q":1700,"p":350,"k":0.75,"a":0.5},"ps":"400V/3ph/50Hz","sf":{"z":"NPL315S4","q":2770,"p":350,"k":1.5,"a":1.0},"hc":[20.1],"cc":[35.5],"hr":{"t":"cross flow","e":68.66,"k":10.98}},"AHU-12":{"m":"MYHC 1","sa":780,"ra":730,"w":708,"l":3130,"h":1616,"kg":507,"rf":{"z":"ER22C-2DN.A7.1R","q":730,"p":230,"k":0.55,"a":0.1},"ps":"400V/3ph/50Hz","sf":{"z":"ER22C-2DN.A7.1R","q":780,"p":230,"k":0.55,"a":0.2},"hc":[2.9],"cc":[8.0],"hr":{"t":"cross flow","e":57.28,"k":3.1}},"FAHU-41":{"m":"MYHC 2","sa":4500,"ra":3700,"w":1314,"l":3730,"h":1616,"kg":816,"rf":{"z":"TE 280 S4","q":3700,"p":280,"k":1.5,"a":1.2},"ps":"400V/3ph/50Hz","sf":{"z":"NPL315S4","q":4500,"p":340,"k":2.2,"a":1.9},"hc":[32.1],"cc":[56.1],"hr":{"t":"cross flow","e":64.64,"k":19.42}},"FAHU-3":{"m":"MYHC 2.25","sa":5300,"ra":3900,"w":1008,"l":4710,"h":2216,"kg":1033,"rf":{"z":"TE 315 S4","q":3900,"p":300,"k":1.5,"a":1.0},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":5300,"p":360,"k":3.0,"a":2.4},"hc":[40.7],"cc":[69.3],"hr":{"t":"cross flow","e":69.13,"k":23.05}},"AHU-14":{"m":"MYHC 1","sa":1460,"ra":1560,"w":708,"l":3110,"h":1616,"kg":513,"rf":{"z":"TE 225 S4","q":1560,"p":320,"k":0.75,"a":0.5},"ps":"400V/3ph/50Hz","sf":{"z":"TE 225 S4","q":1460,"p":330,"k":0.75,"a":0.5},"hc":[6.1],"cc":[16.1],"hr":{"t":"cross flow","e":52.63,"k":4.76}},"AHU-47":{"m":"MYHC 3","sa":6400,"ra":6200,"w":1314,"l":3790,"h":2216,"kg":1021,"rf":{"z":"TE 355 S4","q":6200,"p":230,"k":3.0,"a":1.9},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":6400,"p":270,"k":3.0,"a":2.6},"hc":[46.7],"cc":[69.0],"hr":{"t":"cross flow","e":59.07,"k":26.56}},"FAHU-11":{"m":"MYHC 2","sa":4800,"ra":3130,"w":1314,"l":3820,"h":1616,"kg":837,"rf":{"z":"TE 280 S4","q":3130,"p":290,"k":1.1,"a":0.8},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":4800,"p":280,"k":3.0,"a":2.0},"hc":[35.2],"cc":[61.6],"hr":{"t":"cross flow","e":66.69,"k":19.71}},"AHU-49":{"m":"MYHC 7","sa":17805,"ra":10935,"w":2224,"l":5230,"h":2828,"kg":2478,"rf":{"z":"NPA500S4","q":10935,"p":350,"k":4.0,"a":2.7},"ps":"400V/3ph/50Hz","sf":{"z":"NPL560S4","q":17805,"p":380,"k":11.0,"a":8.6},"hc":[168.3],"cc":[230.5],"hr":{"t":"cross flow","e":68.8,"k":70.9}},"AHU-50":{"m":"MYHC 2","sa":4200,"ra":4500,"w":1314,"l":3720,"h":1616,"kg":793,"rf":{"z":"TE 315 S4","q":4500,"p":220,"k":2.2,"a":1.4},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":4200,"p":250,"k":2.2,"a":1.4},"hc":[37.7],"cc":[31.4],"hr":{"t":"cross flow","e":59.47,"k":18.19}},"FAHU-13":{"m":"MYHC 2","sa":4190,"ra":3050,"w":1314,"l":3690,"h":1616,"kg":799,"rf":{"z":"TE 250 S4","q":3050,"p":290,"k":1.5,"a":1.1},"ps":"400V/3ph/50Hz","sf":{"z":"TE 280 S4","q":4190,"p":330,"k":2.2,"a":1.9},"hc":[30.7],"cc":[53.6],"hr":{"t":"cross flow","e":64.73,"k":17.27}},"AHU-51":{"m":"MYHC 3.5","sa":7700,"ra":6720,"w":1617,"l":4230,"h":2216,"kg":1250,"rf":{"z":"TE 355 S4","q":6720,"p":260,"k":3.0,"a":2.1},"ps":"400V/3ph/50Hz","sf":{"z":"TE 450 S4","q":7700,"p":270,"k":3.0,"a":2.6},"hc":[16.0],"cc":[64.7],"hr":{"t":"cross flow","e":64.84,"k":33.21}},"FAHU-15":{"m":"MYHC 2.25","sa":5290,"ra":4000,"w":1008,"l":4430,"h":2216,"kg":963,"rf":{"z":"TE 315 S4","q":4000,"p":340,"k":1.5,"a":1.1},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":5290,"p":360,"k":3.0,"a":2.4},"hc":[41.6],"cc":[71.1],"hr":{"t":"cross flow","e":67.94,"k":22.56}},"AHU-46":{"m":"MYHC 1.5","sa":2190,"ra":2340,"w":1008,"l":3410,"h":1616,"kg":647,"rf":{"z":"TE 250 S4","q":2340,"p":380,"k":1.1,"a":0.8},"ps":"400V/3ph/50Hz","sf":{"z":"TE 250 S4","q":2190,"p":340,"k":1.1,"a":0.9},"hc":[9.1],"cc":[24.7],"hr":{"t":"cross flow","e":55.2,"k":8.77}},"FAHU-48":{"m":"MYHC 1","sa":1885,"ra":1690,"w":708,"l":3670,"h":1616,"kg":579,"rf":{"z":"TE 225 S4","q":1690,"p":280,"k":0.75,"a":0.5},"ps":"400V/3ph/50Hz","sf":{"z":"NPL280S4","q":1885,"p":330,"k":1.1,"a":0.7},"hc":[17.2],"cc":[29.2],"hr":{"t":"cross flow","e":60.63,"k":7.83}},"FAHU-16":{"m":"MYHC 2.5","sa":5520,"ra":4350,"w":1617,"l":3820,"h":1616,"kg":980,"rf":{"z":"TE 280 S4","q":4350,"p":430,"k":2.2,"a":1.8},"ps":"400V/3ph/50Hz","sf":{"z":"TE 355 S4","q":5520,"p":380,"k":3.0,"a":2.4},"hc":[40.4],"cc":[69.1],"hr":{"t":"cross flow","e":64.58,"k":23.38}},"AHU-20":{"m":"MYHC 3","sa":6840,"ra":5290,"w":1314,"l":4520,"h":2216,"kg":1191,"rf":{"z":"GR35I 116892/A01","q":5290,"p":300,"k":2.5,"a":1.3},"ps":"400V/3ph/50Hz","sf":{"z":"GR35I 116893/A01","q":6840,"p":280,"k":3.3,"a":2.9},"hc":[34.5,4.3],"cc":[89.5],"hr":{"t":"cross flow","e":61.67,"k":27.11}}};
// البناية الفرعية (1A/1B/1C) لوحدات بناية 1: من السطح الذي تقف عليه الوحدة، وسطح 1D لا توجد له بناية في الطوابق فتبقى غير محددة
const HB_SUB_OVERRIDE = { "AHU-38": "1A" };
function hbSubBuilding(id, loc) {
    if (HB_SUB_OVERRIDE[id]) return HB_SUB_OVERRIDE[id];
    const l = String(loc || "").toUpperCase();
    return /^1[A-C]$/.test(l) ? l : "";
}
const HB_SUB_UNKNOWN = "بناية 1 (1A أو 1B أو 1C — غير محدد)";
const HB_AHU_SERVES = {"AHU-17":["1",[2]],"FAHU-23":["1",[2]],"FAHU-43":["1",[2]],"FAHU-18":["1",[0,1]],"FAHU-19":["1",[0]],"AHU-21":["1",[0]],"AHU-22":["1",[0]],"AHU-28":["1",[1]],"AHU-24":["1",[1]],"AHU-25":["1",[1]],"AHU-26":["1",[1]],"AHU-27":["1",[1]],"AHU-30":["1",[1]],"AHU-31":["1",[1]],"AHU-32":["1",[1]],"AHU-33":["1",[1]],"AHU-34":["1",[1]],"AHU-35":["1",[1]],"AHU-36":["1",[1]],"AHU-37":["1",[1]],"AHU-38":["1",[1]],"AHU-39":["1",[1]],"FAHU-1":["2، 3، 14",[0,1,2]],"FAHU-2":["2، 3، 14",[0,1,2]],"AHU-4":["5",[1]],"FAHU-8":["5",[0,1]],"AHU-9":["4",[1]],"FAHU-10":["4",[0]],"FAHU-7":["6",[0,1]],"FAHU-6":["7",[0,1]],"FAHU-5":["8",[2]],"AHU-12":["8",[1]],"FAHU-41":["8",[0,1]],"FAHU-3":["9",[0,1,2]],"AHU-14":["9",[1,2]],"AHU-47":["9",[0]],"FAHU-11":["10",[0,1,2]],"AHU-49":["10",[0]],"AHU-50":["10",[0]],"FAHU-13":["11",[1,2]],"AHU-51":["11",[0]],"FAHU-15":["12",[1,2]],"AHU-46":["12",[1,2]],"FAHU-48":["12",[0]],"FAHU-16":["13",[0,1,2]],"AHU-20":["13",[2]]};
function hbServesHtml(id) {
    const d = HB_AHU_SERVES[id];
    if (!d) return "";
    const names = ["الطابق الأرضي", "الطابق الأول", "الطابق الثاني"];
    const lv = d[1].map(n => names[n]).join(" + ");
    let label = "بناية " + d[0];
    if (d[0] === "1") {
        const u = HB_AHU_UNITS.find(x => x.id === id);
        const sub = hbSubBuilding(id, u && u.loc);
        label = sub ? "بناية " + sub : HB_SUB_UNKNOWN;
    }
    return `<span><em>تخدم · Serves</em><i>${escapeHTML(label + " — " + lv)}</i></span>`;
}
function hbServingUnits(floorKey, item) {
    // الدافعات التي تخدم هذه البناية في هذا الطابق (من جداول وفروع مخططات الرايزر)
    if (!item || item.kind === "r") return [];
    const lvl = { ground: 0, first: 1, second: 2 }[floorKey];
    if (lvl == null) return [];
    const num = String(item.num).toUpperCase();
    const out = [];
    Object.keys(HB_AHU_SERVES).forEach(id => {
        const d = HB_AHU_SERVES[id];
        if (d[1].indexOf(lvl) < 0) return;
        const blds = d[0].split("،").map(x => x.trim());
        if (blds[0] === "1") {
            const u = HB_AHU_UNITS.find(x => x.id === id);
            if (hbSubBuilding(id, u && u.loc) === num) out.push(id);
        } else if (blds.indexOf(String(item.num)) >= 0) {
            out.push(id);
        }
    });
    return out;
}
const HB_CF_SERVES = {"CF-1.1":["1",[2]],"CF-1.2":["1",[2]],"CF-1.3":["1",[1]],"CF-1.4":["1",[2]],"CF-1.5":["1",[1]],"CF-1.6":["1",[0]],"CF-1.7":["1",[0]],"CF-4.1":["4",[0,1]],"CF-5.1":["5",[0,1]],"CF-6.1":["6",[1]],"CF-6.2":["6",[0]],"CF-7.1":["7",[0,1]],"CF-8.1":["8",[1,2]],"CF-9.1":["9",[0,1,2]],"CF-10.1":["10",[0,1,2]],"CF-10.4":["10",[0]],"CF-10.6":["11",[0]],"CF-11.1":["11",[1,2]],"CF-12.1":["12",[1,2]],"CF-13.1":["13",[0,1,2]],"CF-15.1":["15",[0,1]],"CF-16.1":["16",[0,1]]};
function hbCfServesHtml(id) {
    const d = HB_CF_SERVES[id];
    if (!d) return "";
    const names = ["الطابق الأرضي", "الطابق الأول", "الطابق الثاني"];
    let label = "بناية " + d[0];
    if (d[0] === "1") {
        const u = HB_FC_UNITS.find(x => x.id === id);
        const sub = hbSubBuilding(id, u && u.loc);
        label = sub ? "بناية " + sub : HB_SUB_UNKNOWN;
    }
    return `<span><em>تخدم · Serves</em><i>${escapeHTML(label + " — " + d[1].map(n => names[n]).join(" + "))}</i></span>`;
}
function hbServingCf(floorKey, item) {
    // الساحبات (CF) التي تخدم هذه البناية في هذا الطابق
    if (!item || item.kind === "r") return [];
    const lvl = { ground: 0, first: 1, second: 2 }[floorKey];
    if (lvl == null) return [];
    const num = String(item.num).toUpperCase();
    const out = [];
    Object.keys(HB_CF_SERVES).forEach(id => {
        const d = HB_CF_SERVES[id];
        if (d[1].indexOf(lvl) < 0) return;
        if (d[0] === "1") {
            const u = HB_FC_UNITS.find(x => x.id === id);
            if (hbSubBuilding(id, u && u.loc) === num) out.push(id);
        } else if (d[0] === String(item.num)) {
            out.push(id);
        }
    });
    return out;
}
function hbSpecHtml(id) {
    const d = HB_AHU_SPECS[id];
    if (!d) return "";
    const row = (ar, en, v) => `<div class="hb-spec-row"><span>${escapeHTML(ar)}<small>${escapeHTML(en)}</small></span><b class="hb-ltr">${escapeHTML(String(v))}</b></div>`;
    const fan = (f) => `${f.z} · ${f.q} m³/h · ${f.p} Pa · ${f.k} kW`;
    const kw = (arr) => arr.join(" + ") + " kW";
    // طن تبريد (TR) = kW ÷ 3.517
    const tr = (arr) => arr.map(v => (v / 3.517).toFixed(1)).join(" + ") + "\u00a0TR";
    return `<details class="hb-specs"><summary>المواصفات · Specifications</summary>
        ${row("الموديل", "Model", d.m)}
        ${row("مروحة التغذية", "Supply Fan", fan(d.sf))}
        ${row("مروحة الراجع", "Return Fan", fan(d.rf))}
        ${row("ملف التبريد", "Cooling Coil", kw(d.cc) + " · " + tr(d.cc))}
        ${row("ملف التسخين", "Heating Coil", kw(d.hc))}
        ${d.hr ? row("استرجاع الحرارة", "Heat Recovery", d.hr.t + (d.hr.e != null ? " · " + d.hr.e + "%" : "") + (d.hr.k != null ? " · " + d.hr.k + " kW" : "")) : ""}
        ${row("الأبعاد (عرض×طول×ارتفاع)", "Dimensions W×L×H", d.w + " × " + d.l + " × " + d.h + "\u00a0mm")}
        ${row("الوزن", "Weight", d.kg + " kg")}
        ${row("التغذية الكهربائية", "Power Supply", d.ps)}
    </details>`;
}
function hbUnitPump(floorKey, item, unitId) {
    const rec = hbData[hbId(floorKey, item)] || {};
    return (rec.unitPump && rec.unitPump[unitId]) || "";
}
function hbAhuUnits(item) {
    if (item.kind !== "r") return [];
    return HB_AHU_UNITS.filter(u => String(u.loc).toUpperCase() === String(item.num).toUpperCase());
}
function hbFanUnits(floorKey, item) {
    // الفان كويلات منصوبة على السطوح: تظهر مع السطح الذي يحمل رقم/حرف موقعها (في الطابق الثاني أو قسم السطح)
    if (item.kind !== "r") return [];
    return HB_FC_UNITS.filter(u => u.loc != null && String(u.loc).toUpperCase() === String(item.num).toUpperCase());
}
const HB_COUNT_FIELDS = [
    { key: "fanCoils", label: "الفان كويلات", en: "Fan Coils" },
    { key: "extinguishers", label: "الطفايات", en: "Extinguishers" },
    { key: "hoseCabinets", label: "الكابينات", en: "Hose Cabinets" },
    { key: "washbasins", label: "المغاسل", en: "Washbasins" },
    { key: "sinks", label: "السنك", en: "Sinks" },
    { key: "toilets", label: "التواليت", en: "Toilets" }
];
// أعداد الكابينات والطفايات المستخرجة من مخططات الإطفاء (FF.FP) — طفايات البودرة 6كغ وCO2 5كغ.
// القيمة المحفوظة يدوياً تتغلّب عليها. بنايات 2 و3 و14 و17 لم تُستخرج بعد فتبقى فارغة.
const HB_FF_COUNTS = {
    "ground_b_1A": { hoseCabinets: 3, extinguishers: 8 },
    "ground_b_1B": { hoseCabinets: 3, extinguishers: 5 },
    "ground_b_1C": { hoseCabinets: 5, extinguishers: 14 },
    "ground_b_4": { hoseCabinets: 1, extinguishers: 5 },
    "ground_b_5": { hoseCabinets: 2, extinguishers: 3 },
    "ground_b_6": { hoseCabinets: 1, extinguishers: 11 },
    "ground_b_7": { hoseCabinets: 2, extinguishers: 3 },
    "ground_b_8": { hoseCabinets: 2, extinguishers: 4 },
    "ground_b_9": { hoseCabinets: 3, extinguishers: 5 },
    "ground_b_10": { hoseCabinets: 4, extinguishers: 4 },
    "ground_b_11": { hoseCabinets: 1, extinguishers: 6 },
    "ground_b_12": { hoseCabinets: 1, extinguishers: 3 },
    "ground_b_13": { hoseCabinets: 2, extinguishers: 3 },
    "ground_b_15": { hoseCabinets: 3, extinguishers: 7 },
    "ground_b_16": { hoseCabinets: 3, extinguishers: 7 },
    "first_b_1A": { hoseCabinets: 2, extinguishers: 9 },
    "first_b_1B": { hoseCabinets: 4, extinguishers: 7 },
    "first_b_1C": { hoseCabinets: 6, extinguishers: 12 },
    "first_b_4": { hoseCabinets: 1, extinguishers: 3 },
    "first_b_5": { hoseCabinets: 1, extinguishers: 3 },
    "first_b_6": { hoseCabinets: 1, extinguishers: 4 },
    "first_b_7": { hoseCabinets: 1, extinguishers: 4 },
    "first_b_8": { hoseCabinets: 3, extinguishers: 3 },
    "first_b_9": { hoseCabinets: 3, extinguishers: 4 },
    "first_b_10": { hoseCabinets: 2, extinguishers: 3 },
    "first_b_11": { hoseCabinets: 3, extinguishers: 4 },
    "first_b_12": { hoseCabinets: 2, extinguishers: 4 },
    "first_b_13": { hoseCabinets: 2, extinguishers: 3 },
    "first_b_15": { hoseCabinets: 3, extinguishers: 8 },
    "first_b_16": { hoseCabinets: 3, extinguishers: 7 },
    "second_b_1B": { hoseCabinets: 3, extinguishers: 3 },
    "second_b_1C": { hoseCabinets: 3, extinguishers: 6 },
    "second_b_8": { hoseCabinets: 1, extinguishers: 4 },
    "second_b_9": { hoseCabinets: 2, extinguishers: 4 },
    "second_b_10": { hoseCabinets: 2, extinguishers: 3 },
    "second_b_11": { hoseCabinets: 3, extinguishers: 4 },
    "second_b_12": { hoseCabinets: 3, extinguishers: 4 },
    "second_b_13": { hoseCabinets: 3, extinguishers: 2 }
};
function hbCountVal(floorKey, item, key) {
    const rec = hbData[hbId(floorKey, item)] || {};
    if (rec[key] !== undefined && rec[key] !== null && rec[key] !== "") return rec[key];
    const d = HB_FF_COUNTS[hbId(floorKey, item)];
    return d && d[key] !== undefined ? d[key] : null;
}
let hbActiveFloor = "ground";
let hbActiveItem = null;
let hbEditing = false;
let hbData = {};

function hbLabel(item) {
    return (item.kind === "r" ? "سطح " : "بناية ") + item.num;
}
function hbId(floorKey, item) {
    return floorKey + "_" + item.kind + "_" + item.num;
}

async function openHospitalBuildings() {
    showPage("hospitalBuildingsPage");
    hbActiveItem = null;
    renderHospitalBuildings();
    await hbLoad();
}

async function hbLoad() {
    const state = document.getElementById("hbState");
    const db = getFirestoreDB();
    if (!db) return;
    try {
        const fs = await import(MECH_FIRESTORE_URL);
        const snap = await fs.getDocs(fs.collection(db, HB_COLLECTION));
        hbData = {};
        snap.docs.forEach(d => { hbData[d.id] = d.data(); });
        if (state) state.hidden = true;
        renderHospitalBuildings();
    } catch (e) {
        console.error("hospital_buildings:", e);
        if (state) {
            state.hidden = false;
            state.textContent = "تعذّر تحميل حالة البنايات (" + (e && e.code ? e.code : "خطأ") + "). القائمة معروضة بدون الحالات المحفوظة.";
        }
    }
}

function hbSetFloor(key) {
    hbActiveFloor = key;
    hbEditing = false;
    hbActiveItem = null;
    renderHospitalBuildings();
}

function renderHospitalBuildings() {
    const floorsEl = document.getElementById("hbFloors");
    const gridEl = document.getElementById("hbGrid");
    const subEl = document.getElementById("hbSub");
    const detailEl = document.getElementById("hbDetail");
    if (!floorsEl || !gridEl) return;

    floorsEl.innerHTML = HB_FLOORS.map(f => `
        <button type="button" class="hb-floor${f.key === hbActiveFloor ? " is-active" : ""}" onclick="hbSetFloor('${f.key}')">
            <b>${escapeHTML(f.nameAr)}</b>
            <span>${escapeHTML(f.nameEn)} · ${f.items.length}</span>
        </button>`).join("");

    const floor = HB_FLOORS.find(f => f.key === hbActiveFloor) || HB_FLOORS[0];
    const hbSum = key => {
        let total = 0, filled = 0;
        floor.items.forEach(it => {
            const v = hbCountVal(floor.key, it, key);
            if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) { total += Number(v); filled++; }
        });
        return { total, filled };
    };
    const hbCab = hbSum("hoseCabinets"), hbExt = hbSum("extinguishers");
    const hbTot = (label, en, r) => `<span style="display:inline-block;margin:6px 0 0 14px"><b>${escapeHTML(label)}</b> · ${escapeHTML(en)}: <b>${r.filled ? r.total : "—"}</b> <small>(${r.filled}/${floor.items.length})</small></span>`;
    subEl.innerHTML = escapeHTML(floor.nameAr + " — " + floor.items.length + " " + (floor.key === "roof" ? "سطح" : "بناية/سطح"))
        + (floor.key === "roof" ? "" : "<br>" + hbTot("الكابينات", "Hose Cabinets", hbCab) + hbTot("الطفايات", "Extinguishers", hbExt));
    gridEl.innerHTML = floor.items.map(it => {
        const st = (hbData[hbId(floor.key, it)] || {}).status || "";
        const cls = st ? " st-" + st : "";
        return `<button type="button" class="hb-bld${cls}" onclick="hbOpenItem('${it.kind}','${it.num}')">
            <span class="hb-ico">${it.kind === "r" ? "🏠" : "🏢"}</span>
            <b>${escapeHTML(hbLabel(it))}</b>
            ${it.name ? `<span class="hb-name">${escapeHTML(it.name)}</span>` : ""}
            <small>${escapeHTML(HB_STATUSES[st] || HB_STATUSES[""])}</small>
        </button>`;
    }).join("");

    if (!hbActiveItem) { detailEl.hidden = true; return; }
    const rec = hbData[hbId(floor.key, hbActiveItem)] || {};
    detailEl.hidden = false;
    if (!hbEditing) {
        const row = (f, value) => `<div class="hb-row"><span class="hb-k">${escapeHTML(f.label)}<small>${escapeHTML(f.en)}</small></span><span class="hb-v${value ? "" : " is-empty"}">${value ? escapeHTML(value) : "—"}</span></div>`;
        const rows = [];
        if (hbActiveItem.kind !== "r") {
            const units = hbFanUnits(floor.key, hbActiveItem);
            HB_COUNT_FIELDS.forEach(f => {
                const cv = hbCountVal(floor.key, hbActiveItem, f.key);
                let v = cv == null ? "" : String(cv);
                if (f.key === "fanCoils" && v === "" && units.length) v = String(units.length);
                rows.push(row(f, v));
            });
            // دافعة رقم: القيمة المكتوبة يدوياً إن وُجدت، وإلا الدافعات المستخرجة من المخططات
            const autoAhu = hbServingUnits(floor.key, hbActiveItem);
            if (rec.pump || !autoAhu.length) rows.push(row(HB_PUMP_LABEL, rec.pump || ""));
            else rows.push(`<div class="hb-row"><span class="hb-k">${escapeHTML(HB_PUMP_LABEL.label)}<small>${escapeHTML(HB_PUMP_LABEL.en)}</small></span><span class="hb-v">${autoAhu.map(id => `<b class="hb-ltr">${escapeHTML(id)}</b>`).join(" · ")}</span></div>`);
        }
        if (hbActiveItem.kind !== "r") {
            const cfs = hbServingCf(floor.key, hbActiveItem);
            rows.push(`<div class="hb-row"><span class="hb-k">مخدومة من قبل ساحبة رقم<small>Served by Exhaust Fan No.</small></span><span class="hb-v${cfs.length ? "" : " is-empty"}">${cfs.length ? cfs.map(id => `<b class="hb-ltr">${escapeHTML(id)}</b>`).join(" · ") : "—"}</span></div>`);
        }
        rows.push(row(HB_STATUS_LABEL, rec.status ? HB_STATUSES[rec.status] : ""));
        rows.push(row(HB_NOTES_LABEL, rec.notes || ""));
        detailEl.innerHTML = `
            <h3>${escapeHTML(hbLabel(hbActiveItem))}${hbActiveItem.name ? " — " + escapeHTML(hbActiveItem.name) : ""} — ${escapeHTML(floor.nameAr)}</h3>
            <div class="hb-rows">${rows.join("")}</div>
            ${hbFanUnits(floor.key, hbActiveItem).length ? `
            <div class="hb-units-title">الفان كويلات المسجلة <small>Fan Coil Units</small></div>
            <div class="hb-units">${hbFanUnits(floor.key, hbActiveItem).map(u => `
                <div class="hb-unit${hbUnitStatus(floor.key, hbActiveItem, u.id) ? " us-" + hbUnitStatus(floor.key, hbActiveItem, u.id) : ""}">
                    <b class="hb-ltr">${escapeHTML(u.id)}</b>
                    <span><em>الحالة · Status</em><select class="hb-unit-status" onchange="hbSetUnitStatus('${u.id}', this.value)">${Object.keys(HB_UNIT_STATUSES).map(k =>
                        `<option value="${k}"${hbUnitStatus(floor.key, hbActiveItem, u.id) === k ? " selected" : ""}>${escapeHTML(HB_UNIT_STATUSES[k])}</option>`).join("")}</select></span>
                    ${hbCfServesHtml(u.id)}
                    <span><em>الدكت الخارجي · Duct</em><i class="hb-ltr">${escapeHTML(u.duct)}</i></span>
                    <span><em>كمية الهواء · Air Flow</em><i class="hb-ltr">${escapeHTML(String(u.air))} m³/h</i></span>
                    ${u.notes ? `<span class="hb-unit-note"><em>ملاحظات · Notes</em><i>${escapeHTML(u.notes)}</i></span>` : ""}
                </div>`).join("")}</div>` : ""}
            ${hbAhuUnits(hbActiveItem).length ? `
            <div class="hb-units-title">وحدات مناولة الهواء <small>Air Handling Units</small></div>
            <div class="hb-units">${hbAhuUnits(hbActiveItem).map(u => {
                return `<div class="hb-unit">
                    <b class="hb-ltr">${escapeHTML(u.id)}</b>
                    ${HB_AHU_SPECS[u.id] ? `<span><em>هواء التغذية · Supply Air</em><i class="hb-ltr">${HB_AHU_SPECS[u.id].sa} m³/h</i></span>
                    <span><em>هواء الراجع · Return Air</em><i class="hb-ltr">${HB_AHU_SPECS[u.id].ra} m³/h</i></span>` : ""}
                    ${hbServesHtml(u.id)}
                    <span><em>مخدومة من قبل دافعة رقم · Served by Pump No.</em><input type="text" class="hb-unit-pump" value="${escapeHTML(hbUnitPump(floor.key, hbActiveItem, u.id))}" placeholder="—" onchange="hbSetUnitPump('${u.id}', this.value)"></span>
                    ${hbSpecHtml(u.id)}
                </div>`;
            }).join("")}</div>` : ""}
            <div class="hb-actions">
                <button type="button" class="hb-save" onclick="hbStartEdit()">تعديل</button>
                <button type="button" onclick="hbCloseItem()">إغلاق</button>
            </div>`;
        return;
    }
    detailEl.innerHTML = `
        <h3>${escapeHTML(hbLabel(hbActiveItem))}${hbActiveItem.name ? " — " + escapeHTML(hbActiveItem.name) : ""} — ${escapeHTML(floor.nameAr)}</h3>
        ${hbActiveItem.kind === "r" ? "" : `<div class="hb-fields">
            ${HB_COUNT_FIELDS.map(f => `<div><label for="hbf_${f.key}">${escapeHTML(f.label)} · ${escapeHTML(f.en)}</label>
                <input type="number" min="0" step="1" inputmode="numeric" id="hbf_${f.key}" value="${hbCountVal(floor.key, hbActiveItem, f.key) == null ? "" : escapeHTML(String(hbCountVal(floor.key, hbActiveItem, f.key)))}"></div>`).join("")}
            <div class="hb-wide"><label for="hbf_pump">${escapeHTML(HB_PUMP_LABEL.label)} · ${escapeHTML(HB_PUMP_LABEL.en)}</label>
                <input type="text" id="hbf_pump" value="${escapeHTML(rec.pump || "")}" placeholder="مثال: 1 أو 1 و2"></div>
        </div>`}
        <label for="hbStatus">الحالة · Status</label>
        <select id="hbStatus">${Object.keys(HB_STATUSES).map(k =>
            `<option value="${k}"${(rec.status || "") === k ? " selected" : ""}>${escapeHTML(HB_STATUSES[k])}</option>`).join("")}</select>
        <label for="hbNotes">ملاحظات · Notes</label>
        <textarea id="hbNotes" rows="3">${escapeHTML(rec.notes || "")}</textarea>
        <div class="hb-actions">
            <button type="button" class="hb-save" onclick="hbSave()">حفظ</button>
            <button type="button" onclick="hbEditing=false;renderHospitalBuildings()">إلغاء</button>
        </div>`;
}

function hbOpenItem(kind, num) {
    const fl = HB_FLOORS.find(f => f.key === hbActiveFloor);
    hbEditing = false;
    hbActiveItem = (fl && fl.items.find(i => i.kind === kind && String(i.num) === String(num))) || { kind, num };
    renderHospitalBuildings();
    const el = document.getElementById("hbDetail");
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function hbSetUnitPump(unitId, value) {
    if (!hbActiveItem) return;
    if (!requireLoginForWrite()) { renderHospitalBuildings(); return; }
    const db = getFirestoreDB();
    if (!db) { renderHospitalBuildings(); return; }
    const id = hbId(hbActiveFloor, hbActiveItem);
    const v = String(value || "").trim();
    try {
        const fs = await import(MECH_FIRESTORE_URL);
        await fs.setDoc(fs.doc(db, HB_COLLECTION, id), {
            floor: hbActiveFloor, kind: hbActiveItem.kind, number: hbActiveItem.num,
            unitPump: { [unitId]: v },
            updatedAt: new Date().toISOString()
        }, { merge: true });
        const rec = hbData[id] || (hbData[id] = {});
        rec.unitPump = Object.assign({}, rec.unitPump, { [unitId]: v });
        renderHospitalBuildings();
    } catch (e) {
        console.error("hbSetUnitPump:", e);
        showMessage("تعذّر حفظ رقم الدافعة: " + (e && e.code ? e.code : "خطأ"), "error");
        renderHospitalBuildings();
    }
}

async function hbSetUnitStatus(unitId, value) {
    if (!hbActiveItem) return;
    if (!requireLoginForWrite()) { renderHospitalBuildings(); return; }
    const db = getFirestoreDB();
    if (!db) { renderHospitalBuildings(); return; }
    const id = hbId(hbActiveFloor, hbActiveItem);
    try {
        const fs = await import(MECH_FIRESTORE_URL);
        await fs.setDoc(fs.doc(db, HB_COLLECTION, id), {
            floor: hbActiveFloor, kind: hbActiveItem.kind, number: hbActiveItem.num,
            unitStatus: { [unitId]: value },
            updatedAt: new Date().toISOString()
        }, { merge: true });
        const rec = hbData[id] || (hbData[id] = {});
        rec.unitStatus = Object.assign({}, rec.unitStatus, { [unitId]: value });
        renderHospitalBuildings();
    } catch (e) {
        console.error("hbSetUnitStatus:", e);
        showMessage("تعذّر حفظ حالة الوحدة: " + (e && e.code ? e.code : "خطأ"), "error");
        renderHospitalBuildings();
    }
}

function hbStartEdit() {
    hbEditing = true;
    renderHospitalBuildings();
}

function hbCloseItem() {
    hbActiveItem = null;
    hbEditing = false;
    renderHospitalBuildings();
}

async function hbSave() {
    if (!hbActiveItem) return;
    if (!requireLoginForWrite(hbSave)) return;
    const db = getFirestoreDB();
    if (!db) return;
    const id = hbId(hbActiveFloor, hbActiveItem);
    const payload = {
        floor: hbActiveFloor,
        kind: hbActiveItem.kind,
        number: hbActiveItem.num,
        status: document.getElementById("hbStatus").value,
        notes: document.getElementById("hbNotes").value.trim(),
        updatedAt: new Date().toISOString()
    };
    // السطوح بلا حقول عددية ولا دافعة (الحالة والملاحظات فقط)
    if (hbActiveItem.kind !== "r") payload.pump = document.getElementById("hbf_pump").value.trim();
    for (const f of (hbActiveItem.kind === "r" ? [] : HB_COUNT_FIELDS)) {
        const raw = document.getElementById("hbf_" + f.key).value.trim();
        if (raw === "") { payload[f.key] = null; continue; }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0) {
            showMessage(f.label + ": أدخل عدداً صحيحاً صفراً أو أكثر.", "error");
            return;
        }
        payload[f.key] = n;
    }
    try {
        const fs = await import(MECH_FIRESTORE_URL);
        await fs.setDoc(fs.doc(db, HB_COLLECTION, id), payload, { merge: true });
        hbData[id] = Object.assign({}, hbData[id], payload);
        hbEditing = false;
        renderHospitalBuildings();
        showMessage("تم حفظ بيانات البناية.", "success");
    } catch (e) {
        console.error("hbSave:", e);
        showMessage("تعذّر الحفظ: " + (e && e.code ? e.code : "خطأ") + (e && e.code === "permission-denied" ? " — أضف قاعدة hospital_buildings في Firestore ثم Publish." : ""), "error");
    }
}

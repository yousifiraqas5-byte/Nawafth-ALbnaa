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
            console.error("تعذر تحميل سجل قراءات الخزانات:", historyError);
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
            '<span class="fuel-sum-label">📉 الكاز الفارغ</span>' +
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

        let lastReading = "لا توجد قراءة";
        if (ok && st.source === "reading") {
            lastReading = (st.method === "top_distance" ? "المسافة من الأعلى: " : "الارتفاع: ") +
                st.rawValue + " " + fuelUnitLabel(st.unit);
        } else if (ok && st.source === "always_full") {
            lastReading = "ثابت — يُعتبر ممتلئاً دائماً (بلا قراءات)";
        } else if (ok && st.source === "legacy") {
            lastReading = "قيمة مسجلة سابقاً باللتر مباشرة (قبل نظام القياس)";
        }

        const geomDiff = st.geomCapacityL
            ? formatFuelLiters(st.geomCapacityL) +
              (Math.abs(st.geomCapacityL - st.nominalL) >= 1
                  ? " (" + (st.geomCapacityL > st.nominalL ? "+" : "−") + formatFuelNumber(Math.abs(st.geomCapacityL - st.nominalL)) + " عن الاسمية)"
                  : " (تطابق الاسمية)")
            : "غير متاحة";

        const card = document.createElement("div");
        card.className = "fuel-tank-card is-" + cls;
        card.id = "fuelTankCard-" + def.id;

        card.innerHTML =
            '<div class="fuel-tank-card-header">' +
                '<span class="fuel-tank-no">' + def.no + '</span>' +
                '<div class="fuel-tank-header-text">' +
                    '<div class="fuel-tank-name">' + escapeHTML(def.name) + '</div>' +
                    (def.note ? '<div class="fuel-tank-note">' + escapeHTML(def.note) + '</div>' : '') +
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

            '<dl class="fuel-tank-meta">' +
                '<div><dt>السعة الاسمية</dt><dd>' + formatFuelLiters(st.nominalL) + '</dd></div>' +
                '<div><dt>الشكل والأبعاد</dt><dd>' + escapeHTML(fuelGeometryText(st)) + '</dd></div>' +
                '<div><dt>طريقة القياس</dt><dd>' + escapeHTML(fuelMethodText(st)) + '</dd></div>' +
                '<div><dt>آخر قراءة</dt><dd>' + escapeHTML(lastReading) + '</dd></div>' +
                '<div><dt>ارتفاع الكاز الفعلي</dt><dd>' + (ok ? (Math.round(st.levelM * 1000) / 10) + " سم" : "—") + '</dd></div>' +
                '<div><dt>السعة الهندسية</dt><dd>' + escapeHTML(geomDiff) + '</dd></div>' +
                '<div><dt>تاريخ ووقت القراءة</dt><dd>' + (st.updatedAt ? escapeHTML(formatFuelDateTime(st.updatedAt)) : "—") + '</dd></div>' +
            '</dl>' +

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
            : "تم حفظ القراءة لكن تعذر تسجيلها في سجل القراءات (تحقق من نشر قواعد Firestore)",
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
// سجل القراءات السابقة
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
        box.innerHTML = '<p class="fuel-muted">تعذر تحميل سجل القراءات. إن كان هذا أول استخدام، تأكد من نشر قواعد Firestore المحدّثة (firestore.rules).</p>';
        return;
    }

    const rows = fuelHistory.filter(function (h) { return !filter || h.tankId === filter; }).slice(0, FUEL_HISTORY_SHOWN);
    if (!rows.length) {
        box.innerHTML = '<p class="fuel-muted">لا توجد قراءات مسجلة في السجل بعد.</p>';
        return;
    }

    const body = rows.map(function (h) {
        const methodLabel = FuelCalc.METHODS[h.method] ? FuelCalc.METHODS[h.method].short : "—";
        const delta = typeof h.deltaL === "number"
            ? '<span class="' + (h.deltaL > 0 ? "fuel-up" : h.deltaL < 0 ? "fuel-down" : "") + '">' +
              (h.deltaL > 0 ? "+" : h.deltaL < 0 ? "−" : "") + formatFuelNumber(Math.abs(h.deltaL)) + ' لتر</span>'
            : '<span class="fuel-muted">—</span>';
        return '<tr>' +
            '<td data-label="التاريخ والوقت">' + escapeHTML(formatFuelDateTime(h.createdAt)) + '</td>' +
            '<td data-label="الخزان">' + escapeHTML(h.tankName || h.tankId) + '</td>' +
            '<td data-label="القراءة">' + escapeHTML(h.value) + ' ' + fuelUnitLabel(h.unit) + '</td>' +
            '<td data-label="طريقة القياس">' + escapeHTML(methodLabel) + '</td>' +
            '<td data-label="ارتفاع الكاز">' + (typeof h.levelM === "number" ? (Math.round(h.levelM * 1000) / 10) + " سم" : "—") + '</td>' +
            '<td data-label="الكمية">' + (typeof h.volumeL === "number" ? formatFuelLiters(h.volumeL) : "—") + '</td>' +
            '<td data-label="الفرق عن السابقة">' + delta + '</td>' +
            '<td data-label="أدخلها">' + escapeHTML(h.createdBy || "—") + '</td>' +
        '</tr>';
    }).join("");

    box.innerHTML =
        '<div class="fuel-table-wrap"><table class="fuel-table">' +
        '<thead><tr><th>التاريخ والوقت</th><th>الخزان</th><th>القراءة</th><th>طريقة القياس</th><th>ارتفاع الكاز</th><th>الكمية</th><th>الفرق عن السابقة</th><th>أدخلها</th></tr></thead>' +
        '<tbody>' + body + '</tbody></table></div>' +
        (fuelHistory.length >= FUEL_HISTORY_LIMIT || rows.length >= FUEL_HISTORY_SHOWN
            ? '<p class="fuel-muted">يعرض آخر ' + FUEL_HISTORY_SHOWN + ' قراءة (السجل الكامل محفوظ في قاعدة البيانات).</p>' : '');
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

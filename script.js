// ============================================================
// ???? ????? ?????? - script.js
// ????????? + ???????? ??????? + ??????
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

// ???: ?? ??? ????? VAPID ????? ??
// Firebase Console > Project settings > Cloud Messaging > Web push certificates
const VAPID_KEY = "BHbv8qWWjW8vpXgOUwauTqEev2HCJSAtpXsOiR9_YRKNWY2LwBXbiZwn_SnIpRNNL0vkvIFM0yVHkBoD-DsCfp4";

// ============================================================
// ?????????
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
// ????? ?????????
// ============================================================

const ENGINEERS = [
    "?. ????",
    "?. ????",
    "?. ????",
    "?. ????",
    "?. ????",
    "?. ???????",
    "?. ???"
];

// ============================================================
// ????? ??????? ?????? (?? ?????? ??????? ??????)
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
// ????? ????? (??????? + ??????)
// ============================================================

const INVENTORY_LOCATIONS = {
    containers: { name: "????????", icon: "??", sub: "???? ????????" },
    hall: { name: "??????", icon: "??", sub: "???? ??????" },
    building6: { name: "???? ????? 6", icon: "??", sub: "???? ????? 6" },
    kitchen: { name: "??????", icon: "???", sub: "????? ??????? ??????" }
};

// ============================================================
// ?????? ??? Firebase
// ============================================================

function getFirestoreDB() {

    if (!window.firebaseDb) {

        console.error(
            "Firebase Firestore ??? ?????"
        );

        showMessage(
            "??? ??? ?? ??????? ?????? ????????",
            "error"
        );

        return null;
    }

    return window.firebaseDb;
}

// ============================================================
// ?????? ??? ???????
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
            "?????? ??? ??????:",
            pageId
        );

    }

}

// ============================================================
// ?????? ????????
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

// ??????: openMedicalDevices ??? ??????? ??? ????? ??? ???? ??? ??????? ??????.

// ============================================================
// ?????
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
// ========================= ????????? ========================
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
            "??? ????? ?????????:",
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
                "??? ??????? ??????:",
                secondError
            );

            showMessage(
                "???? ????? ?????????",
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
            "???? ????????? ??? ??????",
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
            "???? ??? ???? ??????",
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
            "??? ????? ????? ?????"
        );

        notify(
            "??? ???? ????",
            item + " - " + quantity + " " + unit,
            "purchase"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "??? ????? ?????:",
            error
        );

        showMessage(
            "??? ??? ????? ????? ?????: " +
            (
                error.code ||
                error.message ||
                "??? ??? ?????"
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
                        ??
                    </div>

                    <strong>
                        ?? ???? ????? ????
                    </strong>

                    <span>
                        ???? ??? "??? ????"
                        ?????? ???? ?????
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
                        ??
                    </div>

                    <strong>
                        ?? ???? ???? ?????
                    </strong>

                    <span>
                        ??????? ???? ??? ??????
                        ????? ???
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
                ??????:
                ${escapeHTML(
                    purchase.unit
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                ?????:
                ${escapeHTML(
                    purchase.quantity
                )}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:12px;
            ">
                ????? ?????:
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
                ?? ???????
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
                ??????:
                ${escapeHTML(
                    purchase.unit
                )}
            </div>

            <div style="
                color:#555;
                margin-bottom:6px;
            ">
                ?????:
                ${escapeHTML(
                    purchase.quantity
                )}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-bottom:6px;
            ">
                ????? ?????:
                ${formatPurchaseDate(
                    purchase.createdAt
                )}
            </div>

            <div style="
                color:#2e7d32;
                font-size:13px;
                margin-bottom:12px;
            ">
                ????? ???????:
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
                ????? ???????
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
            "?? ????? ???",
            "?? ???? ??????: " + (purchase ? purchase.item : ""),
            "purchase"
        );

        showMessage(
            "?? ??? ????? ??? ?? ??????"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "??? ????? ?????:",
            error
        );

        showMessage(
            "??? ??? ????? ????? ?????",
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
            "?? ????? ?????"
        );

        await getPurchases();

    } catch (error) {

        console.error(
            "??? ????? ?????:",
            error
        );

        showMessage(
            "??? ??? ????? ????? ?????",
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
// ==================== ??????? ??????? (?????) ===============
// ============================================================

function openWarehouse(locationKey) {
    showInventory(locationKey);
}

function openKitchen() {
    showInventory("kitchen");
}

function showInventory(locationKey) {
    if (!INVENTORY_LOCATIONS[locationKey]) {
        showMessage("?????? ??? ?????", "error");
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
            backButton.textContent = "? ????????";
            backButton.setAttribute("onclick", "goHome()");
        } else {
            backButton.textContent = "? ???????";
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
        showMessage("???? ?????? ?? ?????? ?????", "error");
        return;
    }

    currentMaterialAction = actionType === "withdraw" ? "withdraw" : "add";

    const form = document.getElementById("materialForm");
    if (form) form.style.display = "block";

    const title = document.getElementById("materialFormTitle");
    if (title) {
        title.textContent = currentMaterialAction === "withdraw" ? "??? ????" : "????? ????";
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
        console.error("??? ????? ??????:", error);
        showMessage("???? ????? ??????", "error");
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
        showMessage("???? ?????? ??? ??????", "error");
        return;
    }

    const item = itemInput.value.trim();
    const unit = unitInput.value.trim();
    const quantity = quantityInput.value.trim();
    const actionDate = dateInput.value;
    const notes = notesInput.value.trim();

    if (!item || !unit || !quantity || !actionDate) {
        showMessage("???? ??? ???? ?????? ????????", "error");
        return;
    }

    if (parseFloat(quantity) <= 0) {
        showMessage("?????? ??? ?? ???? ???? ?? ???", "error");
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

        const locationName = INVENTORY_LOCATIONS[currentLocation]?.name || "??????";
        const isWithdraw = currentMaterialAction === "withdraw";

        notify(
            isWithdraw ? "??? ????" : "????? ????",
            locationName + ": " + item + " - " + (isWithdraw ? "-" : "+") + quantity + " " + unit,
            "material"
        );

        itemInput.value = "";
        unitInput.value = "";
        quantityInput.value = "";
        notesInput.value = "";

        closeMaterialForm();

        showMessage("?? ??? ??????? ?????");

        await getMaterials();

    } catch (error) {
        console.error("??? ??? ??????:", error);
        showMessage("??? ??? ????? ??? ???????: " + (error.code || error.message || "??? ??? ?????"), "error");
    }
}

async function deleteMaterial(id) {
    if (!requireLoginForWrite(() => deleteMaterial(id))) return;

    if (!confirm("?? ???? ??? ??? ???????")) {
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        await deleteDoc(doc(db, MATERIALS_COLLECTION, id));

        showMessage("?? ??? ??????");

        await getMaterials();

    } catch (error) {
        console.error("??? ??? ??????:", error);
        showMessage("??? ??? ????? ??? ??????", "error");
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
                <h3>?? ?????? ??????</h3>
                <span class="stock-badge">${entries.length}</span>
            </div>
            <div class="materials-table-wrap">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>??????</th>
                            <th>??????</th>
                            <th>??????</th>
                            <th>???????</th>
                            <th>??????</th>
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
                <div class="empty-materials-icon">??</div>
                <strong>?? ???? ????? ???</strong>
                <span>?????? "????? ????" ?? "??? ????" ?????? ??? ????</span>
            </div>
        `;
        return;
    }

    let rows = "";

    movements.forEach(m => {
        const isWithdraw = m.actionType === "withdraw";
        const badgeClass = isWithdraw ? "operation-withdraw" : "operation-add";
        const badgeText = isWithdraw ? "???" : "?????";
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
                    >???</button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>??????</th>
                    <th>??????</th>
                    <th>?????</th>
                    <th>??????</th>
                    <th>????? ???????</th>
                    <th>??????</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// ============================================================
// ========================= ???????? =========================
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
            "??? ????? ????????:",
            error
        );

        showMessage(
            "???? ????? ????????",
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

// ???? ????? ??????? ???????? ??????? ????????? ???????
// ???? ?? ???? ???? ????? ISO ??? ?? ????? ???????? ???????? ?? Firestore
const REPORT_DATE_DAYS_COUNT = 90;

function formatArabicDate(date) {

    const dayNames = [

        "?????",

        "???????",

        "????????",

        "????????",

        "??????",

        "??????",

        "?????"

    ];

    const monthNames = [

        "?????",

        "??????",

        "????",

        "?????",

        "????",

        "?????",

        "?????",

        "?????",

        "??????",

        "??????",

        "??????",

        "??????"

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
        '<option value="">???? ???????</option>';

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

        // ?????? ??? ?????? ??????: ????? ?????? ?? ?????? ??????????
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

        "?????",

        "???????",

        "????????",

        "????????",

        "??????",

        "??????",

        "?????"

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
            "???? ??????? ??? ??????",
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
            "???? ??? ???? ?????? ???????",
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
            "?? ??? ??????? ?????"
        );

        notify(
            "????? ???? ????",
            "?? ????? ????? ??? " + formatArabicDate(new Date(date + "T00:00:00")),
            "report"
        );

        openReports();

    } catch (error) {

        console.error(
            "??? ??? ???????:",
            error
        );

        showMessage(
            "??? ??? ????? ??? ???????: " +
            (
                error.code ||
                error.message ||
                "??? ??? ?????"
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
                <div class="empty-reports-icon">??</div>
                <strong>?? ???? ?????? ??????</strong>
                <span>???? ??? "????? ?????" ?????? ??? ?????</span>
            </div>
        `;
        return;
    }

    // ?????? ?? ?? ??????? ?????? ????? ??? ???????? ??????? (????????? ??????)
    if (!selectedReportId || !reportsCache.some(r => r.id === selectedReportId)) {
        selectedReportId = reportsCache[0].id;
    }

    const optionsHtml = reportsCache.map(report => {
        const dateObj = report.date ? new Date(report.date + "T00:00:00") : null;
        const label = dateObj
            ? `${getArabicDayName(dateObj)} � ${formatArabicDate(dateObj)}`
            : (report.day || "?????");
        const selected = report.id === selectedReportId ? " selected" : "";
        return `<option value="${escapeHTML(report.id)}"${selected}>${escapeHTML(label)}</option>`;
    }).join("");

    const selectedReport = reportsCache.find(r => r.id === selectedReportId);

    container.innerHTML = `
        <div class="report-day-picker form-group">
            <label for="reportDaySelect">???? ?????</label>
            <select id="reportDaySelect" onchange="onReportDayChange(this.value)">
                ${optionsHtml}
            </select>
        </div>
        <div id="selectedReportView">
            ${selectedReport ? createReportHTML(selectedReport, reportsCache.indexOf(selectedReport)) : ""}
        </div>
    `;
}

// ????? ????? ?????? ?? ??????? ???????? � ???? ????? ??????? ??????? ???? ?????
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
            <div class="report-stat-icon">??</div>
            <div class="report-stat-text">
                <strong>${reportsCache.length}</strong>
                <span>?????? ????????</span>
            </div>
        </div>
        <div class="report-stat-box">
            <div class="report-stat-icon">??</div>
            <div class="report-stat-text">
                <strong>${todayCount}</strong>
                <span>?????? ?????</span>
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
                    <div class="report-date-icon">??</div>
                    <div class="report-date-text">
                        <strong>${escapeHTML(report.day)}</strong>
                        <span>${escapeHTML(report.date ? formatArabicDate(new Date(report.date + "T00:00:00")) : "")}</span>
                    </div>
                </div>
                <button
                    type="button"
                    class="delete-report-button"
                    onclick="deleteReport('${report.id}')"
                    aria-label="??? ???????"
                >???</button>
            </div>
            <div class="report-body">
                <div class="report-body-title">?????? ???????</div>
                <div class="report-body-text">${escapeHTML(report.text)}</div>
            </div>
            <div class="report-card-footer">
                <span class="report-time">? ${formatPurchaseDate(report.createdAt)}</span>
                <span class="report-time">??? ??????? ${reportNumber}</span>
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
            "?? ???? ??? ????????"
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
            "?? ??? ???????"
        );

        await getReports();

    } catch (error) {

        console.error(
            "??? ??? ???????:",
            error
        );

        showMessage(
            "??? ??? ????? ??? ???????",
            "error"
        );

    }

}

// ============================================================
// ========================= ????????? ========================
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
        console.error("??? ????? ?????????:", error);
    }
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (notificationsCache.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-notifications-icon">??</div>
                <strong>?? ???? ??????? ???</strong>
                <span>????? ??? ????????? ??? ??????</span>
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
    if (type === "report") return "??";
    if (type === "task") return "?";
    if (type === "purchase") return "??";
    if (type === "material") return "??";
    return "??";
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
async function notify(title, body, type = "general") {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const {
            collection,
            addDoc,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        // ??? ??????? ???? Firestore
        const ref = await addDoc(
            collection(db, NOTIFICATIONS_COLLECTION),
            {
                title: title,
                body: body,
                type: type,
                createdAt: serverTimestamp()
            }
        );

        localNotifiedIds.add(ref.id);

        // ????? ??????? ???? ???????
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

        // ????? Push ??? ???????? ??????

if (type === "task" || type === "purchase") {
        console.log("?? TASK PUSH START:", {
        title: title,
        body: body,
        type: type
    });

    try {
        console.log("?? CALLING WORKER...");

        const response = await fetch(
            "https://nawafth-notifications.yousifiraqas5.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    body: body
                })
            }
        );

        console.log("?? WORKER HTTP STATUS:", response.status);

        const result = await response.json();

        console.log("?? WORKER RESULT:", result);

        if (!response.ok || !result.ok) {
            console.error(
                "? ??? ????? Push:",
                result
            );
        } else {
            console.log(
                "? ?? ????? Push:",
                result
            );
        }

    } catch (pushError) {
        console.error(
            "? ??? ??????? ?? Cloudflare Worker:",
            pushError
        );
    }
}
        return ref.id;

    } catch (error) {
        console.error(
            "??? ????? ???????:",
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
        <div class="toast-icon">??</div>
        <div class="toast-content">
            <h4 class="toast-title">${escapeHTML(title)}</h4>
            <p class="toast-body">${escapeHTML(body)}</p>
        </div>
        <button type="button" class="toast-close" aria-label="?????">�</button>
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
                        showToast(d.title || "????? ????", d.body || "");
                    }
                });
            });
        })
        .catch(error => {
            console.error("??? ??? ????? ?????????:", error);
        });
}

async function setupMessagingForeground() {
    if (!window.firebaseApp) return;

    try {
        const { getMessaging, onMessage } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js");

        const messaging = getMessaging(window.firebaseApp);
        window.firebaseMessaging = messaging;

        onMessage(messaging, payload => {
            const title = payload.notification?.title || payload.data?.title || "????? ????";
            const body = payload.notification?.body || payload.data?.body || "????? ???? ?? ???? ????? ??????";
            showToast(title, body);
        });

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("firebase-messaging-sw.js").catch(() => {});
        }
    } catch (error) {
        console.error("??? ????? ??????? ?????????:", error);
    }
}

async function enablePushNotifications() {
    if (!requireLoginForWrite(enablePushNotifications)) return;

    if (!("Notification" in window)) {
        showMessage("??????? ?? ???? ?????????", "error");
        return;
    }

    if (Notification.permission === "denied") {
        showMessage("?? ??? ??? ?????????? ?? ??????? ?? ??????? ??????", "error");
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            showMessage("???? ?????? ?????????? ?? ??????? ??????", "error");
            return;
        }
    } catch (error) {
        console.error("??? ??? ?????????:", error);
        showMessage("???? ?????? ?????????? ?? ??????? ??????", "error");
        return;
    }

    if (VAPID_KEY === "YOUR_VAPID_PUBLIC_KEY") {
        showMessage("???? ????? ????? VAPID ?? ??? script.js ?????", "error");
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
            showMessage("???? ?????? ??? ??? ???????", "error");
            return;
        }

        const db = getFirestoreDB();
        if (!db) return;

        await setDoc(doc(db, TOKENS_COLLECTION, token), {
            token: token,
            createdAt: serverTimestamp(),
            userAgent: navigator.userAgent
        });

        showMessage("?? ????? ????????? ????? ??");

    } catch (error) {
        console.error("??? ????? ?????????:", error);
        showMessage("??? ??? ????? ????? ?????????: " + (error.message || "??? ??? ?????"), "error");
    }
}

// ============================================================
// =========================== ?????? ==========================
// ============================================================

// ???:
// ????? ?????? ?????? ?????? ?? index.html.
// ?? ???? ???? ????? ?? ?????? ???.

function createTasksInterface() {

    // ?? ???
    // ????? ?????? ?????? ????? ?? index.html.

}

// ============================================================
// ??? ???? ??????
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
// ??? ?????????
// ============================================================

function renderEngineers() {

    const container =
        document.querySelector(
            "#tasksPage .engineers-grid"
        );

    if (!container) {

        console.error(
            "??? ????????? ??? ????? ?? index.html"
        );

        return;

    }

    // ????????? ??????? ????? ?? index.html
    // ???? ?? ???? ?????? ?????.

}

// ============================================================
// ???????? ?????? ??? ?????
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
// ??? ???? ???????
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
            "?????? ???????: " +
            engineerName;

    }

    closeTaskForm();

    await getTasks();

}

// ============================================================
// ??? ????? ??????
// ============================================================

function openTaskForm() {

    if (!currentEngineer) {

        showMessage(
            "???? ?????? ??????? ?????",
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
// ????? ????? ??????
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
// ??? ?????? ?? Firebase
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
            "??? ????? ??????:",
            error
        );

        showMessage(
            "???? ????? ??????: " +
            (
                error.code ||
                error.message ||
                "??? ??? ?????"
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
// ????? ????
// ============================================================

async function addTask() {

    if (!requireLoginForWrite(addTask)) return;

    const input =
        document.getElementById(
            "taskText"
        );

    if (!input) {

        showMessage(
            "??? ?????? ??? ?????",
            "error"
        );

        return;

    }

    const text =
        input.value.trim();

    if (!text) {

        showMessage(
            "???? ?????? ?????",
            "error"
        );

        return;

    }

    if (!currentEngineer) {

        showMessage(
            "?? ??? ????? ???????",
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
            "??? ????? ?????? ?????"
        );

        notify(
            "???? ?????",
            "??? ????? ???? ??????? " + currentEngineer + ": " + text,
            "task"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "??? ????? ??????:",
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
            "??? ??? ????? ????? ??????";

        if (
            error.code ===
            "permission-denied"
        ) {

            errorMessage =
                "Firebase ??? ??? ?????? ???? ?????????";

        } else if (
            error.code ===
            "unauthenticated"
        ) {

            errorMessage =
                "??? ????? ?????? ??? Firebase";

        } else if (
            error.code ===
            "failed-precondition"
        ) {

            errorMessage =
                "Firebase ????? ??? ????? ?????";

        } else if (
            error.message
        ) {

            errorMessage =
                "??? ??? ??????: " +
                error.message;

        }

        showMessage(
            errorMessage,
            "error"
        );

    }

}

// ============================================================
// ??? ???? ???????
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
            "????? ?????? ??? ?????? ?? index.html"
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
    // ?????? ???????
    // ========================================================

    if (
        pending.length === 0
    ) {

        pendingContainer.innerHTML = `

            <div class="empty-tasks">

                <div class="empty-tasks-icon">
                    ??
                </div>

                <strong>
                    ?? ???? ???? ??????
                </strong>

                <p>
                    ???? ??? ????? ????
                    ?????? ???? ?????
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
    // ?????? ???????
    // ========================================================

    if (
        completed.length === 0
    ) {

        completedContainer.innerHTML = `

            <div class="empty-tasks">

                <div class="empty-tasks-icon">
                    ?
                </div>

                <strong>
                    ?? ???? ???? ?????
                </strong>

                <p>
                    ?????? ???????? ????? ???
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
// ??? ?????? ???????
// ============================================================

function createTaskHTML(
    task
) {

    return `

        <div class="task-card">

            <div class="task-card-main">

                <div class="task-card-icon">
                    ??
                </div>

                <div class="task-card-info">

                    <h4>
                        ${escapeHTML(
                            task.text
                        )}
                    </h4>

                    <div class="task-date">

                        ????? ???????:
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
                ? ?? ???????
            </button>

        </div>

    `;

}

// ============================================================
// ??? ?????? ???????
// ============================================================

function createCompletedTaskHTML(
    task
) {

    return `

        <div class="task-card completed-task">

            <div class="task-card-main">

                <div class="task-card-icon">
                    ?
                </div>

                <div class="task-card-info">

                    <h4>
                        ${escapeHTML(
                            task.text
                        )}
                    </h4>

                    <div class="task-date">

                        ?? ???????:
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
                ????? ???????
            </button>

        </div>

    `;

}

// ============================================================
// ????? ??????
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
            "?? ????? ????",
            "???? " + (task ? task.engineer : "") + ": " + (task ? task.text : ""),
            "task"
        );

        showMessage(
            "?? ??? ?????? ??? ???????"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "??? ????? ??????:",
            error
        );

        showMessage(
            "??? ??? ????? ????? ??????: " +
            (
                error.code ||
                error.message ||
                "??? ??? ?????"
            ),
            "error"
        );

    }

}

// ============================================================
// ????? ?????? ?? ???????
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
            "?? ????? ??????"
        );

        await getTasks();

    } catch (error) {

        console.error(
            "??? ????? ??????:",
            error
        );

        showMessage(
            "??? ??? ????? ????? ??????: " +
            (
                error.code ||
                error.message ||
                "??? ??? ?????"
            ),
            "error"
        );

    }

}

// ============================================================
// =================== ??????? ?????? (Medical) ================
// ============================================================

// ??????: MEDICAL_FAULTS_COLLECTION ? MEDICAL_COUNTERS_COLLECTION
// ???????? ??? ????? ??? ?? ???? ????? (??? ???????).

let medicalFaultsCache = [];
let medicalFaultsUnsubscribe = null;

// ???? ????? ????? ????? (???? ??????? ??????? ?? ???? ?????)
let faultFormSubmitting = false;

// ??????: ?? ??? ???? ????? ????? ?????? ???? ?????.
// ????? ????? ????? ??????? ????? ???? ?? ??? Excel ???????
// (??? ????? Device Inventory � ???? ???? ???????? ??? ????? ?????).

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

// ??? ??? ??????? ??????
function openMedicalDevices() {
    showPage("medicalDevicesPage");
    populateFaultDeviceSelect();
    // ??? ???? ???????? ???????? ?? ??? ???????? ????? ?????? ????????? ????????
    getMedicalFaults();
    subscribeMedicalFaults();
}

// ============================================================
// ??? ????? ??????? ?????? ??????? ?? ??? Excel ???????
// (??? ????? Device Inventory � ???? ???? ???????)
// ============================================================

// ????? ??? Excel ?????? ??????? ?????? ??????? ??????
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

// ????? ??????? ?? ????? ?????? ?????? ?? ????? ????? ???
// ("????? ?????" ???? ?????? ?????? � ???? ?? ???? ????? ??? ?? ???? ????????)
const FAULT_DEVICE_SELECTOR_EXCLUDED_NAMES = [
    normalizeMedicalText("????? ?????")
];

// ?? ?????? ???? ??? ?????? ??? � ??? ????? ?? ???? ?? ???? ?? ??? ??
// (??????? ????? ??? ????? ????????: ????? + ??????? + ???????
//  ?? ?????? ????? ?????? ??????? ?????? ??? Excel ?????? row-<excelRow>)
function buildFaultDeviceOptionLabel(record) {

    return record.name;

}

// ??? ????? ??????? ?? ??? Excel (?????: ???? / ????? / ???)
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

        // ?????? ?????????: ??? ?????? ???? ?? ??????? "????? ?????"
        // ?????? ??????? ??? ??? ????? ???????? (????? + ??????? + ??????) �
        // ?????? ???? ??? Excel ??????? ????? ????????? ???????? ?????? ??????
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

        // ?? ?????? ????? (????? + ??????? + ??????) ??????? ???? ??? Excel ?????
        selectorRecords.forEach(record => {

            const option =
                document.createElement("option");

            option.value =
                record.id;

            option.textContent =
                buildFaultDeviceOptionLabel(record);

            select.appendChild(option);

        });

        // ?????? ??? ???????? ?????? ?? ??? ?? ???? ??????
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

    // idle � ??? ????? ??? Excel ???? ??????? ???????? ?? Device Inventory
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

// ????? ?????? ????? ??? Excel ??? ??? ????
function retryFaultDeviceLoad(event) {

    if (event && typeof event.preventDefault === "function") {

        event.preventDefault();

    }

    loadMedicalInventory(true);

    populateFaultDeviceSelect();

}

// ??? ?????? ????? ????? ??????? ??????? ?? ??? Excel ??????? ??????
function onDeviceSelectChange() {

    const brandInput =
        document.getElementById("faultBrand");

    const originInput =
        document.getElementById("faultOrigin");

    const record =
        getSelectedFaultInventoryRecord();

    // ????? ???? ?? ??? ?? Excel ??????? � ?? ?????? ??? ??? ??????? ???????
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
// ????? ????? ??? ???? ??? (Medical Device Fault Form)
// ============================================================

// ?????? ???????? ?????? ?????? ?????????? ?????? ??? ???
const FAULT_REQUIRED_FIELDS = [
    { id: "faultDevice", message: "Device Name is required." },
    { id: "faultSerial", message: "Serial Number is required." },
    { id: "faultDescription", message: "Fault Description is required." },
    { id: "faultReportedBy", message: "Reported By is required." },
    { id: "faultPriority", message: "Priority is required." },
    { id: "faultStatus", message: "Status is required." }
];

// ??? ??????? ????? ?????
function openFaultForm() {
    const form = document.getElementById("faultForm");
    if (!form) return;

    clearFaultFormErrors();
    setFaultFormBusy(false);

    // ?????? ?? ?? ????? ??????? ????? ?? ??? Excel (???? ?????/??? ?????)
    populateFaultDeviceSelect();

    // ??????? ?????? ????????? ???????? ?????? ?? ??????? (?? ?????) ??? ????? ???????? ??????
    const reportedByInput = document.getElementById("faultReportedBy");
    if (reportedByInput && !String(reportedByInput.value).trim() && currentEngineer) {
        reportedByInput.value = currentEngineer;
    }

    form.style.display = "block";
}

// ??? ?? ????? ?????? ?????? ????? ???? ???????
function clearFaultFormErrors() {
    document.querySelectorAll("#faultForm .field-error").forEach(el => {
        el.textContent = "";
    });

    document.querySelectorAll("#faultForm .medical-input").forEach(el => {
        el.classList.remove("is-invalid");
    });
}

// ??? ??? ??? ???? (??????? ??? ????? ???????? ??????)
function clearFaultFieldError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");

    const errorEl = document.getElementById("error-" + input.id);
    if (errorEl) errorEl.textContent = "";
}

// ????? ????? ??? ???? ?????
function showFaultFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (input) input.classList.add("is-invalid");

    const errorEl = document.getElementById("error-" + fieldId);
    if (errorEl) errorEl.textContent = message;
}

// ?????/????? ?? ??????? ???? ??????? ??????? ?? ???? ?????
function setFaultFormBusy(isBusy) {
    faultFormSubmitting = isBusy;

    const button = document.getElementById("saveFaultBtn");
    if (button) {
        button.disabled = isBusy;
        button.textContent = isBusy ? "Saving..." : "Save Request";
    }
}

// ?????? ?? ?????? ???????? � ???? true ??? ??? ?????? ???????
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

    // ???? ?????? ?????? ????????
    ["faultDevice", "faultBrand", "faultOrigin", "faultSerial", "faultReportedBy", "faultDescription", "faultPriority", "faultStatus"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // ????? ????? ?????????? ?????? ??????? (??? ??? Firestore ???????)
    const prioritySelect = document.getElementById("faultPriority");
    if (prioritySelect) prioritySelect.value = "MEDIUM";

    const statusSelect = document.getElementById("faultStatus");
    if (statusSelect) statusSelect.value = "NEW";

    clearFaultFormErrors();
    setFaultFormBusy(false);

    // ??? ???? ???????/????? ?????? ?????? ????? Excel
    const faultDeviceHint = document.getElementById("faultDeviceHint");
    if (faultDeviceHint) faultDeviceHint.innerHTML = "";
}

// ??? ??????? (????? ?????)
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

// ???????? ????? ?? ?????? ???????: ????? ????????? ???????? ????????
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

// ????? ???????? (??????? ??? ?????? ????? ?? ????? ????????)
function stopMedicalFaultsSubscription() {
    if (typeof medicalFaultsUnsubscribe === "function") {
        medicalFaultsUnsubscribe();
    }
    medicalFaultsUnsubscribe = null;
}

// ????? Ticket ID ?????? ???????? Transaction
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

// ????? ??? ???? (??? ?????? Firestore ??????? ???????)
async function addFault() {
    // ??? ??????? ??????? ?? ???? ?????
    if (faultFormSubmitting) return;

    if (!requireLoginForWrite(addFault)) return;

    // ?????? ?? ?????? ???????? ??? ???????
    if (!validateFaultForm()) {
        showMessage("Please complete the required fields before submitting.", "error");
        return;
    }

    // ?????? ?? ?????? ???? ????? ?? ??? Excel ??? ?????
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

    // ????? ????? ??? Excel ?????? (??? ???? ??????? ???????) ????? ????????
    // ????? ???? ??????? ??????? ?? ??? ????? ??????? ??????
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

    const db = getFirestoreDB();
    if (!db) {
        showMessage("Unable to connect to the database. Please try again.", "error");
        return;
    }

    setFaultFormBusy(true);

    try {
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");

        const ticketID = await getNextTicketID(db);

        await addDoc(collection(db, MEDICAL_FAULTS_COLLECTION), {
            ticketID,
            device,
            brand,
            origin,
            serial,
            reportedBy,
            priority,
            status,
            description,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            completedAt: status === "COMPLETE" ? serverTimestamp() : null
        });

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

// ????? ???? ?????????? ????????
function renderMedicalDevicesPage() {
    renderDashboard();
    renderFaultsLists();
}

// ????? ???? ?????? ??????? ?? Firestore
// (???? ???????? ??????? ???? ????? ????? ????? ?? ????? COMPLETED)
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

// ????? ???? ???????? ??????? ?? Firestore
function normalizeFaultPriority(value) {
    return String(value || "").trim().toUpperCase().replace(/_/g, " ");
}

function renderDashboard() {
    // ???? ??????? (Ticket Summary) � ?????? ??????? ?????? ?????? ???????
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

    // ????? ????? ???????
    FAULT_STATUS_ORDER.forEach(status => {
        const count = medicalFaultsCache.filter(f => normalizeFaultStatus(f.status) === status).length;
        const el = document.getElementById(`stat-${status.toLowerCase().replace(" ", "_")}`);
        if (el) el.textContent = count;
    });

    // ????? ?????????
    FAULT_PRIORITY_ORDER.forEach(priority => {
        const count = medicalFaultsCache.filter(f => normalizeFaultPriority(f.priority) === priority).length;
        const el = document.getElementById(`stat-${priority.toLowerCase()}`);
        if (el) el.textContent = count;
    });
}

function renderFaultsLists() {
    const pendingContainer = document.getElementById("pendingFaults");
    const completedContainer = document.getElementById("completedFaults");

    const pending = medicalFaultsCache.filter(f => normalizeFaultStatus(f.status) !== "COMPLETE");
    const completed = medicalFaultsCache.filter(f => normalizeFaultStatus(f.status) === "COMPLETE");

    document.getElementById("pendingFaultCount").textContent = pending.length;
    document.getElementById("completedFaultCount").textContent = completed.length;

    if (pending.length === 0) {
        pendingContainer.innerHTML = `
            <div class="requests-empty">
                <div class="requests-empty-icon">???</div>
                <strong>No maintenance requests found.</strong>
                <p>Use �+ Add Fault� to register a new maintenance request.</p>
            </div>`;
    } else {
        pendingContainer.innerHTML = pending.map(f => createFaultCardHTML(f)).join("");
    }

    if (completed.length === 0) {
        completedContainer.innerHTML = `
            <div class="requests-empty">
                <div class="requests-empty-icon">?</div>
                <strong>No completed requests yet.</strong>
                <p>Serviced requests will appear here.</p>
            </div>`;
    } else {
        completedContainer.innerHTML = completed.map(f => createFaultCardHTML(f, true)).join("");
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

    let actionsHTML = `
        <div class="request-actions">
            ${!isCompleted ? `
            <button type="button" class="request-complete-btn" onclick="markAsComplete('${fault.id}')">
                Mark as Completed
            </button>` : ""}
            <button type="button" class="request-delete-btn" onclick="deleteFault('${fault.id}')">
                🗑️ حذف العطل
            </button>
        </div>`;

    let completedMetaHTML = "";
    if (isCompleted) {
        completedMetaHTML = `
                <div class="request-meta-item">
                    <span class="request-meta-label">Completed At</span>
                    <span class="request-meta-value">${completedDate || "---"}</span>
                </div>`;
    }

    return `
        <article class="request-card">
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

    try {
        const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");
        
        await updateDoc(doc(db, MEDICAL_FAULTS_COLLECTION, id), {
            status: "COMPLETE",
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

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
// ????? HTML
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
// ????? ???????
// ============================================================

function initializeCompanyApp() {

    console.log(
        "script.js loaded successfully"
    );

    console.log(
        "???? ????? ?????? - ??????? ???"
    );

    startNotificationsListener();

    setupMessagingForeground();

    getNotifications();

}

// ============================================================
// ??? ??? ????? ?????
// ============================================================

document.addEventListener(
    "touchstart",
    function () {},
    {
        passive: true
    }
);

// ============================================================
// ??? ???????
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
// MEDICAL DEVICE INVENTORY (Excel-driven) � ??? ??? ??????? ??????
// ??????: ??? Excel ??????? ?? ??? ???????
// "Al-Fedhalyia medical  222 Final - 180.000.000.xlsx" (Sheet2)
// - ?? ???? ????? ????? (Brand X / Brand Y) ?? ??? ?????.
// - ?? ?? ?? Excel ???? ????? ??????? ??? ?? ???? ??? ???????
//   ??? ???? ????? ??: ??? ?????? + ??????? + ??? ?????? + ??? ????.
// - ??? ????? ????? ??? ????? ?? ??? ??? ?? ???????.
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

// ????? ?????????? ???????? ???? ??? Excel ????: TUR / Turkey ? PRC / China
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

// ?????? ?????? ????? � ???????? ??? ????? ??? ???? ???????
// (???????? ????? ??????? ????? ????? ??????? ?? ??? ????????)
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
// ????? ?????? ?????
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

    // ????? ??????????? ???? ????? ????? HTML
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
// ????? ??? Excel ????? ????? ?????
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

    // ????? ?? ???????? ?????? ???????? ?? ??? Excel ??????
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

        // ??????? ?????? ????? ??? ??? Excel (A=??????? B=?????? C=??????? D=???????? E=??????)
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

        // ?????? ???? ?? ????? ??? ???? ??? ????????? (13 ?? ?? ??? Excel ??????)
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
// ????? ????? ????? Excel (SheetJS) ??? ?????? ???
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
// ????? ????? ?????? (????? / ??? / ???? / ????)
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
// ????? (??? ???? ????? ?????? ??????? ?? TUR/Turkey ? PRC/China)
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
// ??? ??????
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
            (state.sheetName ? " � " + state.sheetName : "") +
            " � " + MEDICAL_INVENTORY_EXCEL_FILE;

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
            "<td>" + (record.brand ? highlightMedicalMatch(record.brand, query) : "<span class=\"inventory-cell-muted\">�</span>") + "</td>" +
            "<td>" + (record.origin ? highlightMedicalMatch(record.origin, query) : "<span class=\"inventory-cell-muted\">�</span>") + "</td>" +
            "<td class=\"inventory-qty-cell\">" + (record.qty ? "<span class=\"inventory-qty\">" + escapeMedicalHtml(record.qty) + "</span>" : "<span class=\"inventory-cell-muted\">�</span>") + "</td>" +
            "</tr>";

    }).join("");

    tableBody.innerHTML =
        rowsHtml;

    showMedicalInventoryPane("table");

}

// ============================================================
// ????? ??? Excel ????? ?????
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

            // ????? ????????? (????? ???????) ??? ?????? ????? ?????
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
// ????? ???????
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

// ??? ???? ??? ??????? (???? ??????? ?????? ???? ?????? ??????????)
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
// ?????? ????? (Fuel Tanks)
// ------------------------------------------------------------
// ??? ????? ?????? ?? ???? ???????. ????? ?????? ????? ???.
// ????? ?? Firestore (????? Firebase ??????? ?? ????? ????).
// ============================================================

const FUEL_TANKS_DEFINITIONS = [
    { id: "hospitalGenerator", name: "???? ?????? ????????", capacity: 36000, icon: "???" },
    { id: "complexGenerator", name: "???? ????? ??????", capacity: 13000, icon: "???" },
    { id: "boiler1", name: "???? ????? ??? 1", capacity: 13500, icon: "???" },
    { id: "boiler2", name: "???? ????? ??? 2", capacity: 13500, icon: "???" }
];

const FUEL_TANKS_TOTAL_CAPACITY = FUEL_TANKS_DEFINITIONS.reduce(
    function (sum, tank) { return sum + tank.capacity; },
    0
);

// ?????? ??????? ??? ???? ??? ??????? ?? Firestore
// { [tankId]: { quantity: number|null, updatedAt: Timestamp|null } }
let fuelTanksState = {};
let fuelTanksLoaded = false;

// ============================================================
// ??? ??? ?????? ?????
// ============================================================

async function openFuelTanks() {
    showPage("fuelTanksPage");
    renderFuelTanksCards();
    await getFuelTanks();
}

// ============================================================
// ????? ?????? ???????? ?? Firestore
// ============================================================

async function getFuelTanks() {
    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { collection, getDocs } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        const snapshot = await getDocs(collection(db, FUEL_TANKS_COLLECTION));

        const loadedState = {};

        snapshot.forEach(function (docSnap) {
            const data = docSnap.data();
            loadedState[docSnap.id] = {
                quantity: typeof data.quantity === "number" ? data.quantity : null,
                updatedAt: data.updatedAt || null
            };
        });

        fuelTanksState = loadedState;
        fuelTanksLoaded = true;

        renderFuelTanksCards();

    } catch (error) {
        console.error("??? ????? ?????? ?????:", error);
        showMessage("??? ??? ????? ????? ?????? ?????? ?????", "error");
    }
}

// ============================================================
// ????? Timestamp ?? Firestore ??? ????? ???? ?????
// ????: 19 ?????? 2026 (???? ??? ?????)
// ============================================================

function formatFuelTankDate(timestamp) {
    if (!timestamp) return "?? ???? ????? ???";

    const monthNames = [
        "?????", "??????", "????", "?????", "????", "?????",
        "?????", "?????", "??????", "??????", "??????", "??????"
    ];

    try {
        let date;

        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        return date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear();

    } catch (error) {
        return "?? ???? ????? ???";
    }
}

// ============================================================
// ????? ??? ?????? ?????? (????? ??????)
// ============================================================

function formatFuelLiters(value) {
    const number = Number(value) || 0;
    return number.toLocaleString("en-US") + " ???";
}

// ============================================================
// ???? ?????? ???????? (??? ????? ??? ??? ??????)
// ============================================================

function renderFuelTanksCards() {
    const grid = document.getElementById("fuelTanksGrid");
    if (!grid) return;

    grid.innerHTML = "";

    FUEL_TANKS_DEFINITIONS.forEach(function (tank) {
        const saved = fuelTanksState[tank.id] || { quantity: null, updatedAt: null };

        const card = document.createElement("div");
        card.className = "fuel-tank-card";
        card.id = "fuelTankCard-" + tank.id;

        card.innerHTML =
            '<div class="fuel-tank-card-top">' +
                '<div class="fuel-tank-icon">' + tank.icon + '</div>' +
                '<div>' +
                    '<div class="fuel-tank-name">' + escapeHTML(tank.name) + '</div>' +
                    '<div class="fuel-tank-capacity">????? ??????: ' + formatFuelLiters(tank.capacity) + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="fuel-tank-field">' +
                '<label for="fuelQty-' + tank.id + '">?????? ???????? ?????? (???)</label>' +
                '<input ' +
                    'type="number" ' +
                    'id="fuelQty-' + tank.id + '" ' +
                    'class="medical-input" ' +
                    'min="0" ' +
                    'max="' + tank.capacity + '" ' +
                    'step="1" ' +
                    'placeholder="???? ?????? ???????" ' +
                    'value="' + (saved.quantity !== null ? saved.quantity : "") + '" ' +
                    'oninput="onFuelTankQuantityInput(\'' + tank.id + '\')"' +
                '>' +
                '<span class="fuel-tank-error" id="fuelQtyError-' + tank.id + '"></span>' +
            '</div>' +

            '<div class="fuel-tank-required-box">' +
                '<span class="fuel-tank-required-label">???????</span>' +
                '<span class="fuel-tank-required-value" id="fuelRequired-' + tank.id + '">-</span>' +
            '</div>' +

            '<div class="fuel-tank-date" id="fuelDate-' + tank.id + '">' +
                '????? ????? ??????: ' + formatFuelTankDate(saved.updatedAt) +
            '</div>' +

            '<button type="button" class="auth-submit-btn" onclick="saveFuelTankQuantity(\'' + tank.id + '\')">' +
                '?? ??? ??????' +
            '</button>';

        grid.appendChild(card);
    });

    updateFuelTankRequiredValue(); // ???? "???????" ??? ???? + ??????????
}

// ============================================================
// ????? ?????? ??????? ???????? ?? ????? (???? ???????? ????????)
// ???? null ??? ??? ????? ??????
// ============================================================

function getFuelTankInputQuantity(tankId) {
    const input = document.getElementById("fuelQty-" + tankId);
    if (!input || input.value === "") return null;

    const value = parseFloat(input.value);
    return isNaN(value) ? null : value;
}

// ============================================================
// ?????? ?? ??? ???? ???? ?????
// ============================================================

function validateFuelTankQuantity(tankId, quantity) {
    const tank = FUEL_TANKS_DEFINITIONS.find(function (t) { return t.id === tankId; });
    if (!tank) return "???? ??? ?????";

    if (quantity === null) return null; // ??? ???? ??? ??? ??? ????

    if (quantity < 0) {
        return "?? ???? ????? ???? ?????";
    }

    if (quantity > tank.capacity) {
        return "?????? ???? ?? ??? ?????? (" + formatFuelLiters(tank.capacity) + ")";
    }

    return null;
}

// ============================================================
// ??? ????? ???? ?? ??? ????: ????? "???????" ???? ??????
// ??????????? ?????? ?? ????? ??? ?????? ?? ???
// ============================================================

function onFuelTankQuantityInput(tankId) {
    updateFuelTankRequiredValue();
}

function updateFuelTankRequiredValue() {
    let totalCurrent = 0;
    let hasError = false;

    FUEL_TANKS_DEFINITIONS.forEach(function (tank) {
        const quantity = getFuelTankInputQuantity(tank.id);
        const errorMessage = validateFuelTankQuantity(tank.id, quantity);

        const errorEl = document.getElementById("fuelQtyError-" + tank.id);
        if (errorEl) {
            errorEl.textContent = errorMessage || "";
        }

        const requiredEl = document.getElementById("fuelRequired-" + tank.id);

        if (quantity === null || errorMessage) {
            if (requiredEl) requiredEl.textContent = "-";
            if (errorMessage) hasError = true;
            return;
        }

        const required = tank.capacity - quantity;
        if (requiredEl) requiredEl.textContent = formatFuelLiters(required);

        totalCurrent += quantity;
    });

    const totalCapacityEl = document.getElementById("fuelTotalCapacity");
    if (totalCapacityEl) totalCapacityEl.textContent = formatFuelLiters(FUEL_TANKS_TOTAL_CAPACITY);

    const totalCurrentEl = document.getElementById("fuelTotalCurrent");
    if (totalCurrentEl) totalCurrentEl.textContent = formatFuelLiters(totalCurrent);

    const totalNeededEl = document.getElementById("fuelTotalNeeded");
    if (totalNeededEl) {
        totalNeededEl.textContent = formatFuelLiters(FUEL_TANKS_TOTAL_CAPACITY - totalCurrent);
    }

    return !hasError;
}

// ============================================================
// ??? ???? ???? ???? ?? Firestore (????? ????? ??????)
// ============================================================

async function saveFuelTankQuantity(tankId) {
    if (!requireLoginForWrite(function () { saveFuelTankQuantity(tankId); })) return;

    const tank = FUEL_TANKS_DEFINITIONS.find(function (t) { return t.id === tankId; });
    if (!tank) return;

    const quantity = getFuelTankInputQuantity(tankId);

    if (quantity === null) {
        showMessage("???? ????? ?????? ?????", "error");
        return;
    }

    const errorMessage = validateFuelTankQuantity(tankId, quantity);
    if (errorMessage) {
        showMessage(errorMessage, "error");
        return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    try {
        const { doc, setDoc, serverTimestamp } = await import(
            "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
        );

        await setDoc(doc(db, FUEL_TANKS_COLLECTION, tankId), {
            name: tank.name,
            capacity: tank.capacity,
            quantity: quantity,
            updatedAt: serverTimestamp()
        });

        showMessage("?? ??? ???? " + tank.name + " ?????");

        await getFuelTanks();

    } catch (error) {
        console.error("??? ??? ???? ?????:", error);
        showMessage("??? ??? ????? ??? ??????: " + (error.code || error.message || "??? ??? ?????"), "error");
    }
}

// ============================================================
// AUTH (Firebase Authentication � Email/Password)
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
// Navigation guard � kept for backward compatibility.
// ?????? ???? ??????? ??????? ??? ?????? ?? ??? ??????? ???? ???
// ???????? ??? ?????? ????? ?? ??????? ?? ??? ???.
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
// ????? ?????? ??????? (????? / ????? / ???) ?????? ??????
// ------------------------------------------------------------
// ??????? ??????? ??????? ?????? ??? ??????. ?? ????? ???? ???
// Firestore ??? ?? ???? ???????? requireLoginForWrite(...):
// - ??? ??? ???????? ????? ??????: ??????? ??????? ??????.
// - ??? ?? ??? ???????: ???? ????? ?????? ?????? ????? ?????
//   ?????? ???????? ??????? ?????? ??????? ?????? ??????? ????????
//   ??? ???? ????? ?????? (???? ????? ????? ??????).
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
    "???? ????? ?????? ????? ?????? ?? ????? ????????.",
    "error"
  );

  openAuth();

  return false;
}

// ============================================================
// Auth state observer � called by the inline module's onAuthStateChanged
// ============================================================

function handleAuthStateChanged(user, authInstance) {
  currentUser = user || null;
  authUserUid = user ? user.uid : null;

  if (user) {
    // ????? ?????? ???.
    // ?? ????? ???? ???????? ?????? ?????? ????? ?????.
    // ?? ???? ???? ????? ????? ?????? (??? ???????? ??? ????? ??????)
    // ???? ???????? ??? ????? ??????? ?????? ??????? ????????.
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
      // ?? ??? ???? ????? ?????? ?????? (????? ?? ?? ??????)
      // ???? ???? ????? ?????? � ???? ???????? ?????? ???????.
      showPage(pageBeforeAuthPrompt || "homePage");
      pageBeforeAuthPrompt = null;
    }
  }
  // ??? ????? ?????? (?? ????? ??????) ?? ????? ?????? ??????? ????? �
  // ?????? ???? ??????? ?????? ??? ??????.
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

// ????? ????? ????? ?????? ??????? ?????? ???? ????? ????
// (????? ?? ????? ????? ???? ??????? ????? ??????)
function closeAuthOverlay() {
  const target = pageBeforeAuthPrompt || "homePage";
  pendingWriteAction = null;
  pageBeforeAuthPrompt = null;
  showPage(target);
}

function renderAuth() {
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  if (title) title.textContent = "????? ??????";
  if (subtitle) subtitle.textContent = "???? ????? ????? ?????? ????????";
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
    submitBtn.textContent = isRegister ? "????? ????" : "????? ??????";
  }
  if (toggleBtn) {
    toggleBtn.textContent = isRegister ? "??? ????? ??? ??????" : "????? ???? ????";
  }
  if (title) title.textContent = isRegister ? "????? ????" : "????? ??????";
  if (subtitle) subtitle.textContent = isRegister
    ? "???? ????? ????? ?????? ?????? ????"
    : "???? ????? ????? ?????? ????????";

  clearAuthErrors();
}

// ============================================================
// ????? ????? ??? ????? ??? ?? "????? ????" / "??? ????? ??? ??????"
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
    validateAuthField("authEmail", "????? ?????? ??????????");
    valid = false;
  }
  if (!password) {
    validateAuthField("authPassword", "?????? ???? ??????");
    valid = false;
  }
  if (isRegister && !confirm) {
    validateAuthField("authConfirmPassword", "????? ????? ???? ??????");
    valid = false;
  }
  if (isRegister && password && confirm && password !== confirm) {
    validateAuthField("authConfirmPassword", "????? ?????? ??? ???????");
    valid = false;
  }

  if (!valid) return;

  let mode = isRegister ? "???????" : "????? ??????";

  if (!getAuth()) {
    setAuthError("?? ????? Firebase ??? ?????. ???? ??? ????.");
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

    // onCreate / onLogin � onAuthStateChanged fires automatically.
    clearAuthErrors();
  } catch (error) {
    console.error("Auth error:", error);
    let msg = "??? ??? ??? ?????";

    if (error && error.code) {
      const code = error.code;

      if (code === "auth/invalid-email") {
        msg = "???? ?????? ?????????? ??? ?????";
      } else if (code === "auth/email-already-in-use") {
        msg = "??? ?????? ????? ??????. ???? ????? ??????";
      } else if (code === "auth/weak-password") {
        msg = "???? ?????? ????? (???? ?????? 6 ????)";
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        msg = "?????? ?????????? ?? ???? ?????? ??? ?????";
      } else if (code === "auth/missing-android-cred") {
        msg = "??? ?? ????? Firebase Authentication";
      } else if (code === "auth/requires-recent-login") {
        msg = "???? ????? ?????? ??? ????";
      } else if (code === "auth/too-many-requests") {
        msg = "?? ????? ??????? ?????? ???? ??????? ?????. ???? ??? ????";
      } else if (code === "auth/network-request-failed") {
        msg = "??? ??????? ???????. ???? ?? ???????? ?? ???? ??? ????";
      } else if (code === "auth/unauthorized-domain") {
        msg = "?????? ??? ????? ?? Firebase. ???? ????????";
      } else if (code === "auth/invalid-api-key") {
        msg = "????? ??? ???? ?? Firebase. ???? ????????";
      } else if (code === "auth/operation-not-allowed") {
        msg = "????? ??? ????? ??? ?????. ???? ????????";
      } else if (code === "auth/user-disabled") {
        msg = "?????? ?????. ???? ????????";
      } else if (code === "auth/credential-already-in-use") {
        msg = "??? ?????? ????? ????? ???. ?????? ????? ??????";
      } else if (code === "auth/invalid-credential") {
        msg = "?????? ???????? ??? ?????";
      } else if (code === "auth/internal-error") {
        msg = "??? ????? ?? Firebase. ???? ??? ???? ??? ????";
      } else {
        msg = "??? ?? ????????: " + (error.message || "??? ??? ??? ?????");
      }
    } else if (error && error.message) {
      msg = "??? ?? ????????: " + error.message;
    }

    setAuthError(msg);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = isRegister ? "????? ????" : "????? ??????";
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
    showMessage("??? ??? ????? ????? ??????");
  }
}



// ============================================================
// ربط حدث تسجيل الدخول (مسؤولية JS فقط، بدون inline onsubmit)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("authForm");
  if (!authForm) {
    console.error("AUTH FORM NOT FOUND");
    return;
  }
  authForm.addEventListener("submit", authSubmit);
  console.log("AUTH EVENT WIRED");
});

// ============================================================
// سحب بيانات الأجهزة الطبية من ملف Excel
// ============================================================

async function pullMedicalDevicesFromExcel() {
  const statusEl = document.getElementById("excelPullStatus");
  if (!statusEl) return;

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

    statusEl.textContent = "تم سحب " + parsed.records.length + " جهازًا بنجاح";
    console.log("تم حفظ سجل الصيانة:", title);

  } catch (error) {
    statusEl.textContent = "فشل: " + (error.message || error);
    console.error("خطأ في سحب بيانات الأجهزة من Excel:", error);
  }
}

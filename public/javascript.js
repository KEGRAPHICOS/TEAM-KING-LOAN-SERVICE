
"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE - FINAL: LONG POPUP + AUTO DOWNLOAD
========================================================= */

const INTEREST_RATE = 0.20;
const WHATSAPP_NUMBER = "233542519746";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/* =========================================================
   BASIC HELPERS
========================================================= */

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}


function setUploadStatus(element, uploaded) {
    if (!element) return;

    element.textContent = uploaded
        ? "✓ Uploaded"
        : "Not uploaded";

    element.classList.toggle(
        "uploaded",
        Boolean(uploaded)
    );
}


/* =========================================================
   INTEREST CALCULATION
========================================================= */

function calculateInterest() {
    const a = document.getElementById("amount");
    const b = document.getElementById("interest");
    const c = document.getElementById("income");

    if (!a || !b || !c) return;

    const amount = parseFloat(a.value);

    if (Number.isFinite(amount) && amount > 0) {

        const interest =
            Number(
                (amount * INTEREST_RATE).toFixed(2)
            );

        const total =
            Number(
                (amount + interest).toFixed(2)
            );

        b.value =
            `GHS ${interest.toFixed(2)} (20% Interest)`;

        c.value =
            `GHS ${total.toFixed(2)} (Total Payable)`;

    } else {

        b.value = "";
        c.value = "";
    }
}


/* =========================================================
   IMAGE VALIDATION
========================================================= */

function validateImageFile(file) {

    if (!file) {
        return {
            valid: false,
            message: "Please select a file."
        };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            message:
                "Only JPG, PNG and WEBP images are allowed."
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            message:
                "Each image must not exceed 5MB."
        };
    }

    return {
        valid: true
    };
}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function previewImage(
    inputId,
    previewId,
    imageLabel
) {
    const input =
        document.getElementById(inputId);

    const preview =
        document.getElementById(previewId);

    if (!input || !preview) return;

    input.addEventListener(
        "change",
        function () {

            preview.innerHTML = "";

            const file =
                this.files &&
                this.files[0];

            if (!file) return;

            const v =
                validateImageFile(file);

            if (!v.valid) {
                alert(
                    `${imageLabel}: ${v.message}`
                );

                this.value = "";
                return;
            }

            const img =
                document.createElement("img");

            const url =
                URL.createObjectURL(file);

            img.src = url;
            img.alt =
                `${imageLabel} preview`;

            img.loading = "lazy";

            img.onload = () =>
                URL.revokeObjectURL(url);

            preview.appendChild(img);
        }
    );
}


/* =========================================================
   VALIDATE UPLOADED FILES
========================================================= */

function validateUploadedFiles() {

    const list = [
        {
            id: "ghanaCardFront",
            label: "Ghana Card front"
        },
        {
            id: "ghanaCardBack",
            label: "Ghana Card back"
        },
        {
            id: "selfie",
            label: "Applicant selfie"
        }
    ];


    for (const item of list) {

        const input =
            document.getElementById(item.id);

        if (!input) {
            alert(
                `${item.label} upload field could not be found.`
            );

            return false;
        }

        if (
            !input.files ||
            input.files.length === 0
        ) {
            alert(
                `Please upload your ${item.label} before submitting the application.`
            );

            input.focus();
            return false;
        }
    }


    for (const item of list) {

        const input =
            document.getElementById(item.id);

        const v =
            validateImageFile(
                input.files[0]
            );

        if (!v.valid) {

            alert(
                `${item.label}: ${v.message}`
            );

            input.value = "";

            return false;
        }
    }

    return true;
}


/* =========================================================
   WHATSAPP MESSAGE
========================================================= */

function buildWhatsAppMessage(
    applicationNumber,
    amount,
    interest,
    total
) {

    return [
        "*TEAM KING LOAN SERVICE*",
        "",
        "*NEW LOAN APPLICATION*",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `Application No: ${applicationNumber}`,
        "",
        "*APPLICANT INFORMATION*",
        `First Name: ${getValue("fname")}`,
        `Last Name: ${getValue("lname")}`,
        `Email: ${getValue("email")}`,
        `Momo Number: ${getValue("mphone")}`,
        `Momo Network: ${getValue("type1")}`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "*LOAN DETAILS*",
        `Loan Amount: GHS ${amount.toFixed(2)}`,
        `Interest: GHS ${interest.toFixed(2)} (20%)`,
        `Total Payable: GHS ${total.toFixed(2)}`,
        `Loan Type: ${getValue("type")}`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "*GUARANTOR INFORMATION*",
        `Full Name: ${getValue("gname")}`,
        `Phone: ${getValue("gphone")}`,
        `Address: ${getValue("gaddress")}`,
        `Relationship: ${getValue("grelationship")}`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "*IDENTITY VERIFICATION*",
        `Ghana Card Number: ${getValue("ghanaCardNumber") || "Not provided"}`,
        "Ghana Card Front: Submitted",
        "Ghana Card Back: Submitted",
        "Selfie: Submitted",
        "",
        "*APPLICANT SIGNATURE*",
        `Signature: ${signaturePadHasInk() ? "Signed" : "Not signed"}`,
        `Signature Date: ${getValue("signatureDate") || "Not provided"}`,
        "",
        "The complete application and documents have been saved in the TEAM KING LOAN SERVICE system.",
        "",
        "Service To Human Is Service To Jesus"
    ].join("\n");
}


/* =========================================================
   LONG POPUP WITH AUTO DOWNLOAD + NO DOUBLE
========================================================= */

function showSuccessMessage(
    applicationNumber,
    amount,
    interest,
    total,
    pdfUrl
) {

    const old =
        document.getElementById(
            "applicationSuccessOverlay"
        );

    if (old) old.remove();


    const messageText =
        buildWhatsAppMessage(
            applicationNumber,
            amount,
            interest,
            total
        );


    const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            messageText
        )}`;


    const overlay =
        document.createElement("div");

    overlay.id =
        "applicationSuccessOverlay";

    overlay.style.cssText =
        `position: fixed;
         inset: 0;
         z-index: 999999;
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 20px;
         background: rgba(0,0,0,0.72);
         font-family: Arial, sans-serif;
         overflow-y: auto;`;


    overlay.innerHTML = `
        <div style="
            width: min(480px, 100%);
            background: #ffffff;
            border-radius: 18px;
            padding: 28px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            box-sizing: border-box;
        ">

            <div style="
                width: 64px;
                height: 64px;
                margin: 0 auto 16px;
                border-radius: 50%;
                background: #16a34a;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: bold;
            ">✓</div>


            <h2 style="
                margin: 0 0 10px;
                color: #111827;
                font-size: 22px;
            ">
                Application Submitted Successfully!
            </h2>


            <p style="
                margin: 0 0 8px;
                color: #4b5563;
                font-size: 14px;
            ">
                Your application number is:
            </p>


            <div style="
                margin: 0 auto 16px;
                padding: 12px;
                border-radius: 10px;
                background: #f3f4f6;
                color: #111827;
                font-size: 16px;
                font-weight: bold;
                word-break: break-word;
            ">
                ${applicationNumber}
            </div>


            <div style="
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-left: 4px solid #f59e0b;
                padding: 14px;
                border-radius: 8px;
                text-align: left;
                margin-bottom: 18px;
            ">

                <strong style="
                    color: #b45309;
                    font-size: 13px;
                    display: block;
                    margin-bottom: 4px;
                ">
                    ⚠️ IMPORTANT - READ CAREFULLY:
                </strong>

                <span style="
                    color: #7c2d12;
                    font-weight: 700;
                    font-size: 13.5px;
                    line-height: 1.5;
                ">
                    Please download your Loan Application Letter below and submit it after sending your details to our WhatsApp.
                </span>

            </div>


            <div style="
                background: #ecfdf5;
                border: 1px solid #6ee7b7;
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 12px;
                font-size: 13px;
                color: #065f46;
                font-weight: 600;
            ">
                ✅ Your Application Letter is downloading automatically...
            </div>


            <a
                id="manualDownloadLink"
                href="${pdfUrl}"
                target="_blank"
                rel="noopener noreferrer"
                download
                style="
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 14px 18px;
                    margin-bottom: 12px;
                    border-radius: 10px;
                    background: #1a2a4e;
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 15px;
                "
            >
                📄 Download Application Letter
            </a>


            <button
                type="button"
                id="openWhatsAppButton"
                style="
                    width: 100%;
                    border: 0;
                    padding: 14px 18px;
                    border-radius: 10px;
                    background: #25d366;
                    color: #ffffff;
                    font-weight: bold;
                    font-size: 15px;
                    cursor: pointer;
                "
            >
                💬 Send Details to WhatsApp
            </button>


            <button
                type="button"
                id="closeSuccessButton"
                style="
                    width: 100%;
                    border: 0;
                    padding: 12px 18px;
                    margin-top: 8px;
                    border-radius: 10px;
                    background: transparent;
                    color: #6b7280;
                    font-size: 14px;
                    cursor: pointer;
                "
            >
                Close
            </button>


            <p style="
                margin: 16px 0 0;
                color: #6b7280;
                font-size: 11.5px;
                line-height: 1.5;
            ">
                After clicking WhatsApp, you must also attach and send your downloaded Application Letter to
                <strong>${WHATSAPP_NUMBER}</strong>.
            </p>

        </div>
    `;


    document.body.appendChild(overlay);


    /* =====================================================
       AUTO DOWNLOAD PDF
    ===================================================== */

    setTimeout(() => {

        try {

            const link =
                document.createElement("a");

            link.href = pdfUrl;

            link.download =
                `TEAM-KING-${applicationNumber}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

        } catch (e) {

            console.log(
                "Auto-download blocked, opening in new tab"
            );

            window.open(
                pdfUrl,
                "_blank"
            );
        }

    }, 800);


    /* =====================================================
       BUTTON EVENTS
    ===================================================== */

    document
        .getElementById("openWhatsAppButton")
        .addEventListener(
            "click",
            function () {
                window.open(
                    whatsappUrl,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        );


    document
        .getElementById("closeSuccessButton")
        .addEventListener(
            "click",
            function () {
                overlay.remove();
            }
        );
}


/* =========================================================
   SUBMIT LOAN APPLICATION
========================================================= */

async function submitLoanApplication() {

    const form =
        document.getElementById("loanForm");

    const button =
        document.getElementById(
            "submitLoanButton"
        );


    if (!form) {
        alert(
            "Loan application form could not be found."
        );

        return;
    }


    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }


    if (!validateUploadedFiles()) {
        return;
    }


    const amount =
        parseFloat(
            getValue("amount")
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert(
            "Please enter a valid loan amount."
        );

        return;
    }


    if (amount > 100000000) {
        alert(
            "The loan amount is too large."
        );

        return;
    }


    const interest =
        Number(
            (amount * INTEREST_RATE).toFixed(2)
        );

    const total =
        Number(
            (amount + interest).toFixed(2)
        );


    calculateInterest();


    const originalButtonHTML =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled = true;

        button.classList.add("loading");

        button.innerHTML = `
            <span class="button-loader"></span>
            <span class="button-text">
                Submitting...
            </span>
        `;
    }


    try {

        const formData =
            new FormData();


        /* -------------------------------------------------
           APPLICANT DATA
        ------------------------------------------------- */

        formData.append(
            "fname",
            getValue("fname")
        );

        formData.append(
            "lname",
            getValue("lname")
        );

        formData.append(
            "email",
            getValue("email")
        );

        formData.append(
            "mphone",
            getValue("mphone")
        );

        formData.append(
            "type1",
            getValue("type1")
        );

        formData.append(
            "amount",
            String(amount)
        );

        formData.append(
            "type",
            getValue("type")
        );


        /* -------------------------------------------------
           GUARANTOR DATA
        ------------------------------------------------- */

        formData.append(
            "gname",
            getValue("gname")
        );

        formData.append(
            "gphone",
            getValue("gphone")
        );

        formData.append(
            "gaddress",
            getValue("gaddress")
        );

        formData.append(
            "grelationship",
            getValue("grelationship")
        );


        /* -------------------------------------------------
           GHANA CARD FRONT
        ------------------------------------------------- */

        const frontInput =
            document.getElementById(
                "ghanaCardFront"
            );

        if (
            !frontInput ||
            !frontInput.files ||
            !frontInput.files[0]
        ) {
            throw new Error(
                "Ghana Card front is required."
            );
        }

        formData.append(
            "ghanaCardFront",
            frontInput.files[0]
        );


        /* -------------------------------------------------
           GHANA CARD BACK
        ------------------------------------------------- */

        const backInput =
            document.getElementById(
                "ghanaCardBack"
            );

        if (
            !backInput ||
            !backInput.files ||
            !backInput.files[0]
        ) {
            throw new Error(
                "Ghana Card back is required."
            );
        }

        formData.append(
            "ghanaCardBack",
            backInput.files[0]
        );


        /* -------------------------------------------------
           SELFIE
        ------------------------------------------------- */

        const selfieInput =
            document.getElementById("selfie");

        if (
            !selfieInput ||
            !selfieInput.files ||
            !selfieInput.files[0]
        ) {
            throw new Error(
                "Applicant selfie is required."
            );
        }

        formData.append(
            "selfie",
            selfieInput.files[0]
        );


        /* -------------------------------------------------
           GHANA CARD NUMBER
        ------------------------------------------------- */

        const ghanaCardNumber =
            getValue("ghanaCardNumber")
                .toUpperCase()
                .replace(/\s+/g, "");


        if (
            !/^GHA-\d{9}-\d$/.test(
                ghanaCardNumber
            )
        ) {
            throw new Error(
                "Please enter a valid Ghana Card number in the format GHA-XXXXXXXXX-X."
            );
        }


        formData.append(
            "ghanaCardNumber",
            ghanaCardNumber
        );


        /* -------------------------------------------------
           SIGNATURE
        ------------------------------------------------- */

        if (!signaturePadHasInk()) {
            throw new Error(
                "Please sign the application before submitting."
            );
        }


        const signatureDate =
            getValue("signatureDate");


        if (!signatureDate) {
            throw new Error(
                "Please select the signature date."
            );
        }


        formData.append(
            "signatureData",
            getSignatureDataURL()
        );

        formData.append(
            "signatureDate",
            signatureDate
        );


        /* -------------------------------------------------
           SUBMIT TO BACKEND
        ------------------------------------------------- */

        const response =
            await fetch(
                "/api/applications",
                {
                    method: "POST",
                    body: formData
                }
            );


        const responseText =
            await response.text();


        let result;

        try {
            result =
                responseText
                    ? JSON.parse(responseText)
                    : {};
        } catch {
            throw new Error(
                "The server returned an invalid response."
            );
        }


        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Unable to submit your application."
            );
        }


        /* -------------------------------------------------
           APPLICATION NUMBER
        ------------------------------------------------- */

        const applicationNumber =
            result.applicationNumber;


        if (!applicationNumber) {
            throw new Error(
                "Application was submitted, but no application number was returned."
            );
        }


        /* -------------------------------------------------
           PDF URL
        ------------------------------------------------- */

        const pdfUrl =
            result.pdfUrl;


        if (!pdfUrl) {
            throw new Error(
                "Application was submitted, but the PDF download link was not created."
            );
        }


        /* -------------------------------------------------
           RESET SUBMIT BUTTON
        ------------------------------------------------- */

        if (button) {

            button.disabled = false;

            button.classList.remove(
                "loading"
            );

            button.innerHTML =
                originalButtonHTML;
        }


        /* -------------------------------------------------
           SUCCESS MESSAGE
        ------------------------------------------------- */

        showSuccessMessage(
            applicationNumber,
            amount,
            interest,
            total,
            pdfUrl
        );


        /* -------------------------------------------------
           RESET FORM
        ------------------------------------------------- */

        form.reset();

        calculateInterest();

        clearImagePreviews();

        clearSignature();


        setUploadStatus(
            document.getElementById(
                "frontUploadStatus"
            ),
            false
        );

        setUploadStatus(
            document.getElementById(
                "backUploadStatus"
            ),
            false
        );

        setUploadStatus(
            document.getElementById(
                "selfieUploadStatus"
            ),
            false
        );


        const cardNumberInput =
            document.getElementById(
                "ghanaCardNumber"
            );


        if (cardNumberInput) {

            cardNumberInput.value = "";

            cardNumberInput.readOnly = false;

            cardNumberInput.placeholder =
                "GHA-XXXXXXXXX-X";
        }


        const statusEl =
            document.getElementById(
                "ghanaCardNumberStatus"
            );


        if (statusEl) {

            statusEl.textContent =
                "Upload the Ghana Card front. Number will be detected or type manually.";

            statusEl.style.color =
                "#64748b";
        }

    } catch (error) {

        console.error(
            "Loan application error:",
            error
        );


        alert(
            "Application submission failed.\n\n" +
            (
                error.message ||
                "Please try again."
            )
        );


        if (button) {

            button.disabled = false;

            button.classList.remove(
                "loading"
            );

            button.innerHTML =
                originalButtonHTML;
        }
    }
}


/* =========================================================
   CLEAR IMAGE PREVIEWS
========================================================= */

function clearImagePreviews() {

    [
        "frontPreview",
        "backPreview",
        "selfiePreview"
    ].forEach(id => {

        const p =
            document.getElementById(id);

        if (p) {
            p.innerHTML = "";
        }
    });
}


/* =========================================================
   APPLICATION BUTTONS
========================================================= */

function setupApplicationButtons() {

    const elements =
        document.querySelectorAll(
            "a, button"
        );


    elements.forEach(element => {

        const text =
            element.textContent
                .trim()
                .replace(/\s+/g, " ")
                .toUpperCase();


        const isApplicationButton =
            text === "APPLY NOW" ||
            text === "START YOUR APPLICATION" ||
            text === "APPLY FOR A LOAN";


        if (!isApplicationButton) {
            return;
        }


        if (
            element.id ===
            "submitLoanButton"
        ) {
            return;
        }


        if (
            element.dataset.applicationReady ===
            "true"
        ) {
            return;
        }


        element.dataset.applicationReady =
            "true";


        const dest =
            element.href ||
            element.getAttribute("href");


        element.addEventListener(
            "click",
            function (e) {

                e.preventDefault();


                if (
                    element.classList.contains(
                        "application-loading"
                    )
                ) {
                    return;
                }


                element.classList.add(
                    "application-loading"
                );

                element.setAttribute(
                    "aria-disabled",
                    "true"
                );


                setTimeout(() => {

                    if (dest) {
                        window.location.href =
                            dest;
                    }

                }, 700);
            }
        );
    });
}


/* =========================================================
   PAGE LOADER
========================================================= */

function setupPageLoader() {

    const loader =
        document.getElementById(
            "pageLoader"
        );

    if (!loader) return;


    window.addEventListener(
        "load",
        () => {

            setTimeout(
                () => {
                    loader.classList.add(
                        "hide"
                    );
                },
                800
            );
        }
    );
}


/* =========================================================
   SIGNATURE PAD
========================================================= */

let signatureCanvas = null;
let signatureContext = null;
let signatureDrawing = false;
let signatureHasInk = false;


function setupSignaturePad() {

    signatureCanvas =
        document.getElementById(
            "signatureCanvas"
        );


    if (!signatureCanvas) return;


    signatureContext =
        signatureCanvas.getContext("2d");


    if (!signatureContext) return;


    signatureContext.lineWidth = 3;
    signatureContext.lineCap = "round";
    signatureContext.lineJoin = "round";
    signatureContext.strokeStyle =
        "#111827";


    function getPoint(e) {

        const r =
            signatureCanvas.getBoundingClientRect();

        const s =
            e.touches &&
            e.touches.length
                ? e.touches[0]
                : e;


        return {
            x:
                (s.clientX - r.left) *
                (
                    signatureCanvas.width /
                    r.width
                ),

            y:
                (s.clientY - r.top) *
                (
                    signatureCanvas.height /
                    r.height
                )
        };
    }


    function start(e) {

        e.preventDefault();

        const p =
            getPoint(e);

        signatureDrawing = true;
        signatureHasInk = true;

        signatureContext.beginPath();

        signatureContext.moveTo(
            p.x,
            p.y
        );

        updateSignatureStatus();
    }


    function draw(e) {

        if (!signatureDrawing) {
            return;
        }

        e.preventDefault();

        const p =
            getPoint(e);

        signatureContext.lineTo(
            p.x,
            p.y
        );

        signatureContext.stroke();
    }


    function stop(e) {

        if (e) {
            e.preventDefault();
        }

        signatureDrawing = false;
    }


    signatureCanvas.addEventListener(
        "mousedown",
        start
    );

    signatureCanvas.addEventListener(
        "mousemove",
        draw
    );

    window.addEventListener(
        "mouseup",
        stop
    );


    signatureCanvas.addEventListener(
        "touchstart",
        start,
        {
            passive: false
        }
    );

    signatureCanvas.addEventListener(
        "touchmove",
        draw,
        {
            passive: false
        }
    );

    signatureCanvas.addEventListener(
        "touchend",
        stop,
        {
            passive: false
        }
    );


    const clearButton =
        document.getElementById(
            "clearSignature"
        );


    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearSignature
        );
    }


    const dateInput =
        document.getElementById(
            "signatureDate"
        );


    if (
        dateInput &&
        !dateInput.value
    ) {

        const now =
            new Date();

        const localDate =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() *
                60000
            )
                .toISOString()
                .slice(0, 10);

        dateInput.value =
            localDate;
    }


    updateSignatureStatus();
}


/* =========================================================
   CLEAR SIGNATURE
========================================================= */

function clearSignature() {

    if (
        !signatureCanvas ||
        !signatureContext
    ) {
        return;
    }


    signatureContext.clearRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );


    signatureHasInk = false;

    updateSignatureStatus();
}


/* =========================================================
   SIGNATURE HELPERS
========================================================= */

function signaturePadHasInk() {

    return Boolean(
        signatureHasInk &&
        signatureCanvas
    );
}


function updateSignatureStatus() {

    const s =
        document.getElementById(
            "signatureStatus"
        );


    if (!s) return;


    if (signaturePadHasInk()) {

        s.textContent =
            "✓ Signature captured.";

        s.classList.add("signed");

    } else {

        s.textContent =
            "Please sign above before submitting.";

        s.classList.remove("signed");
    }
}


function getSignatureDataURL() {

    if (
        !signaturePadHasInk() ||
        !signatureCanvas
    ) {
        return "";
    }

    return signatureCanvas.toDataURL(
        "image/png"
    );
}


/* =========================================================
   GHANA CARD OCR
========================================================= */

let ghanaCardOCRPromise = null;


function loadTesseract() {

    if (window.Tesseract) {
        return Promise.resolve(
            window.Tesseract
        );
    }


    if (ghanaCardOCRPromise) {
        return ghanaCardOCRPromise;
    }


    ghanaCardOCRPromise =
        new Promise(
            (resolve, reject) => {

                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";


                script.onload = () => {

                    if (window.Tesseract) {
                        resolve(
                            window.Tesseract
                        );
                    } else {
                        reject(
                            new Error(
                                "OCR library could not be loaded."
                            )
                        );
                    }
                };


                script.onerror = () => {

                    reject(
                        new Error(
                            "Unable to load the OCR library."
                        )
                    );
                };


                document.head.appendChild(
                    script
                );
            }
        );


    return ghanaCardOCRPromise;
}


function extractGhanaCardNumber(text) {

    if (!text) return "";


    const normalized =
        String(text).toUpperCase();


    const regex =
        /GHA[\s\-]*([0-9OQDI]{8,12})[\s\-]*([0-9OQDI])/gi;


    let match;


    while (
        (match = regex.exec(normalized)) !== null
    ) {

        let combined =
            (
                match[1] +
                match[2]
            )
                .toUpperCase()
                .replace(/O/g, "0")
                .replace(/Q/g, "0")
                .replace(/D/g, "0")
                .replace(/I/g, "1")
                .replace(/L/g, "1")
                .replace(/[^0-9]/g, "");


        if (combined.length >= 10) {

            combined =
                combined.slice(0, 10);

            return (
                `GHA-${combined.slice(0, 9)}-${combined.slice(9)}`
            );
        }
    }


    const fallback =
        normalized.match(
            /GHA[^A-Z0-9]*([0-9OQDI\s\-]{9,20})/
        );


    if (fallback) {

        let digits =
            fallback[1]
                .toUpperCase()
                .replace(/O|Q|D/g, "0")
                .replace(/I|L/g, "1")
                .replace(/[^0-9]/g, "");


        if (digits.length >= 10) {

            digits =
                digits.slice(0, 10);

            return (
                `GHA-${digits.slice(0, 9)}-${digits.slice(9)}`
            );
        }
    }


    return "";
}


async function detectGhanaCardNumber(file) {

    const input =
        document.getElementById(
            "ghanaCardNumber"
        );

    const status =
        document.getElementById(
            "ghanaCardNumberStatus"
        );


    if (!file || !input) {
        return "";
    }


    if (status) {

        status.textContent =
            "🔍 Reading Ghana Card... please wait...";

        status.style.color =
            "#b45309";
    }


    try {

        const Tesseract =
            await loadTesseract();


        const result =
            await Tesseract.recognize(
                file,
                "eng"
            );


        const number =
            extractGhanaCardNumber(
                result &&
                result.data
                    ? result.data.text
                    : ""
            );


        if (
            number &&
            /^GHA-\d{9}-\d$/.test(number)
        ) {

            input.value =
                number;

            input.readOnly = false;


            if (status) {

                status.textContent =
                    `✓ Detected: ${number} - You can edit if wrong`;

                status.style.color =
                    "#15803d";
            }


            return number;
        }


        input.readOnly = false;

        input.placeholder =
            "Type manually: GHA-XXXXXXXXX-X";


        if (status) {

            status.textContent =
                "⚠️ Could not read automatically. Please type manually. Format: GHA-XXXXXXXXX-X";

            status.style.color =
                "#dc2626";
        }


        input.focus();

        return "";

    } catch (e) {

        console.warn(e);


        const input2 =
            document.getElementById(
                "ghanaCardNumber"
            );


        if (input2) {
            input2.readOnly = false;
        }


        const status2 =
            document.getElementById(
                "ghanaCardNumberStatus"
            );


        if (status2) {

            status2.textContent =
                "OCR failed. Please enter manually: GHA-XXXXXXXXX-X";

            status2.style.color =
                "#dc2626";
        }


        return "";
    }
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* -------------------------------------------------
           LOAN AMOUNT
        ------------------------------------------------- */

        const amount =
            document.getElementById(
                "amount"
            );


        if (amount) {

            amount.addEventListener(
                "input",
                calculateInterest
            );

            calculateInterest();
        }


        /* -------------------------------------------------
           IMAGE PREVIEWS
        ------------------------------------------------- */

        previewImage(
            "ghanaCardFront",
            "frontPreview",
            "Ghana Card front"
        );


        /* -------------------------------------------------
           SIGNATURE PAD
        ------------------------------------------------- */

        setupSignaturePad();


        /* -------------------------------------------------
           UPLOAD STATUS
        ------------------------------------------------- */

        const frontInputForOCR =
            document.getElementById(
                "ghanaCardFront"
            );

        const frontStatus =
            document.getElementById(
                "frontUploadStatus"
            );


        const backInputForStatus =
            document.getElementById(
                "ghanaCardBack"
            );

        const backStatus =
            document.getElementById(
                "backUploadStatus"
            );


        const selfieInputForStatus =
            document.getElementById(
                "selfie"
            );

        const selfieStatus =
            document.getElementById(
                "selfieUploadStatus"
            );


        /* -------------------------------------------------
           GHANA CARD FRONT + OCR
        ------------------------------------------------- */

        if (frontInputForOCR) {

            frontInputForOCR.addEventListener(
                "change",
                async function () {

                    const file =
                        this.files &&
                        this.files[0];

                    setUploadStatus(
                        frontStatus,
                        Boolean(file)
                    );


                    if (file) {
                        await detectGhanaCardNumber(
                            file
                        );
                    }
                }
            );
        }


        /* -------------------------------------------------
           GHANA CARD BACK STATUS
        ------------------------------------------------- */

        if (backInputForStatus) {

            backInputForStatus.addEventListener(
                "change",
                function () {

                    setUploadStatus(
                        backStatus,
                        Boolean(
                            this.files &&
                            this.files[0]
                        )
                    );
                }
            );
        }


        /* -------------------------------------------------
           SELFIE STATUS
        ------------------------------------------------- */

        if (selfieInputForStatus) {

            selfieInputForStatus.addEventListener(
                "change",
                function () {

                    setUploadStatus(
                        selfieStatus,
                        Boolean(
                            this.files &&
                            this.files[0]
                        )
                    );
                }
            );
        }


        /* -------------------------------------------------
           REMAINING IMAGE PREVIEWS
        ------------------------------------------------- */

        previewImage(
            "ghanaCardBack",
            "backPreview",
            "Ghana Card back"
        );


        previewImage(
            "selfie",
            "selfiePreview",
            "Selfie"
        );


        /* -------------------------------------------------
           FORM SUBMISSION
        ------------------------------------------------- */

        const form =
            document.getElementById(
                "loanForm"
            );


        if (
            form &&
            !form.dataset.listenerAdded
        ) {

            form.dataset.listenerAdded =
                "true";


            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    if (
                        form.dataset.submitting ===
                        "true"
                    ) {
                        return;
                    }


                    form.dataset.submitting =
                        "true";


                    submitLoanApplication()
                        .finally(
                            () => {

                                setTimeout(
                                    () => {

                                        form.dataset.submitting =
                                            "false";

                                    },
                                    2500
                                );
                            }
                        );
                }
            );
        }


        /* -------------------------------------------------
           OTHER PAGE SETUP
        ------------------------------------------------- */

        setupApplicationButtons();
        setupPageLoader();
    }
);

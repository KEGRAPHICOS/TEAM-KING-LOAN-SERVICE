/* =========================================================
   TEAM KING LOAN SERVICE
   FRONTEND-ONLY LOAN APPLICATION
   ========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

const WHATSAPP_NUMBER = "233501147019";

const INTEREST_RATE = 0.20;


/* =========================================================
   HELPERS
========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}


/* =========================================================
   LOAN CALCULATION
========================================================= */

function calculateInterest() {

    const amountInput =
        document.getElementById("amount");

    const interestInput =
        document.getElementById("interest");

    const totalInput =
        document.getElementById("income");


    if (
        !amountInput ||
        !interestInput ||
        !totalInput
    ) {
        return;
    }


    const amount =
        parseFloat(amountInput.value);


    if (
        Number.isFinite(amount) &&
        amount > 0
    ) {

        const interest =
            amount * INTEREST_RATE;


        const total =
            amount + interest;


        interestInput.value =
            `GHS ${interest.toFixed(2)} (20% Interest)`;


        totalInput.value =
            `GHS ${total.toFixed(2)} (Total Payable)`;

    }

    else {

        interestInput.value = "";

        totalInput.value = "";
    }
}


/* =========================================================
   GHANA CARD IMAGE PREVIEW
   OPTIONAL
========================================================= */

function previewImage(
    inputId,
    previewId
) {

    const input =
        document.getElementById(inputId);


    const preview =
        document.getElementById(previewId);


    if (
        !input ||
        !preview
    ) {
        return;
    }


    input.addEventListener(
        "change",
        function () {

            preview.innerHTML = "";


            const file =
                this.files &&
                this.files[0];


            if (!file) {
                return;
            }


            const allowedTypes = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                alert(
                    "Please select a JPG, PNG or WEBP image."
                );


                this.value = "";


                return;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "The Ghana Card image must not exceed 5MB."
                );


                this.value = "";


                return;
            }


            const image =
                document.createElement("img");


            const objectUrl =
                URL.createObjectURL(file);


            image.src =
                objectUrl;


            image.alt =
                "Ghana Card preview";


            image.onload = function () {

                URL.revokeObjectURL(
                    objectUrl
                );

            };


            preview.appendChild(
                image
            );

        }
    );
}


/* =========================================================
   BUILD WHATSAPP MESSAGE
========================================================= */

function buildWhatsAppMessage() {

    calculateInterest();


    const amount =
        parseFloat(
            getValue("amount")
        ) || 0;


    const interest =
        amount * INTEREST_RATE;


    const total =
        amount + interest;


    const front =
        document.getElementById(
            "ghanaCardFront"
        );


    const back =
        document.getElementById(
            "ghanaCardBack"
        );


    const frontSelected =
        !!(
            front &&
            front.files &&
            front.files.length
        );


    const backSelected =
        !!(
            back &&
            back.files &&
            back.files.length
        );


    return [

        "*TEAM KING LOAN SERVICE*",

        "",

        "*NEW LOAN APPLICATION*",

        "━━━━━━━━━━━━━━━━━━",

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

        "*GHANA CARD*",

        `Front selected: ${
            frontSelected
                ? "YES"
                : "NO"
        }`,

        `Back selected: ${
            backSelected
                ? "YES"
                : "NO"
        }`,

        "",

        "_Ghana Card upload is optional._",

        "",

        "━━━━━━━━━━━━━━━━━━",

        "",

        "*TEAM KING LOAN SERVICE*",

        "Service To Human Is Service To Jesus"

    ].join("\n");
}


/* =========================================================
   SEND APPLICATION TO WHATSAPP
========================================================= */

function sendViaWhatsApp() {

    const form =
        document.getElementById(
            "loanForm"
        );


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


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!form.checkValidity()) {

        form.reportValidity();

        return;
    }


    /* =====================================================
       CALCULATE LOAN
    ===================================================== */

    calculateInterest();


    /* =====================================================
       BUILD MESSAGE
    ===================================================== */

    const message =
        buildWhatsAppMessage();


    const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


    /* =====================================================
       CHECK GHANA CARD
    ===================================================== */

    const front =
        document.getElementById(
            "ghanaCardFront"
        );


    const back =
        document.getElementById(
            "ghanaCardBack"
        );


    const hasCardImages =
        !!(
            (
                front &&
                front.files &&
                front.files.length
            )
            ||
            (
                back &&
                back.files &&
                back.files.length
            )
        );


    /* =====================================================
       REQUEST LOAN BUTTON
    ===================================================== */

    if (button) {

        button.disabled = true;


        button.classList.add(
            "loading"
        );


        button.dataset.originalText =
            button.innerHTML;
    }


    /* =====================================================
       OPEN WHATSAPP
    ===================================================== */

    setTimeout(
        function () {

            const opened =
                window.open(
                    whatsappUrl,
                    "_blank",
                    "noopener,noreferrer"
                );


            if (!opened) {

                window.location.href =
                    whatsappUrl;
            }

        },
        700
    );


    /* =====================================================
       RESTORE REQUEST BUTTON
    ===================================================== */

    setTimeout(
        function () {

            if (button) {

                button.classList.remove(
                    "loading"
                );


                button.disabled =
                    false;


                button.innerHTML =
                    button.dataset.originalText ||
                    '<i class="fab fa-whatsapp"></i>' +
                    '<span class="button-text">' +
                    'Request Loan' +
                    '</span>';
            }


            if (hasCardImages) {

                alert(
                    "WhatsApp has been opened with your " +
                    "application details. Because this " +
                    "website has no backend, Ghana Card " +
                    "images cannot be attached automatically. " +
                    "Please attach the selected images manually " +
                    "in WhatsApp before sending."
                );

            }

            else {

                alert(
                    "WhatsApp has been opened with your " +
                    "application details. Please review " +
                    "the message and tap Send."
                );
            }

        },
        1800
    );
}


/* =========================================================
   APPLICATION BUTTON LOADING
   =========================================================
   
   This handles:

   1. APPLY NOW
   2. START YOUR APPLICATION
   3. APPLY FOR A LOAN

   The important part is that the normal link action
   is temporarily stopped so the spinner can actually
   appear before homepage.html opens.
========================================================= */

function setupApplicationButtons() {

    const elements =
        document.querySelectorAll(
            "a, button"
        );


    elements.forEach(
        function (element) {

            /* =============================================
               GET BUTTON TEXT
            ============================================= */

            const text =
                element.textContent
                    .trim()
                    .replace(/\s+/g, " ")
                    .toUpperCase();


            /* =============================================
               CHECK APPLICATION BUTTON
            ============================================= */

            const isApplicationButton =
                text === "APPLY NOW" ||
                text === "START YOUR APPLICATION" ||
                text === "APPLY FOR A LOAN";


            if (!isApplicationButton) {
                return;
            }


            /* =============================================
               NEVER ANIMATE REQUEST LOAN BUTTON
            ============================================= */

            if (
                element.id ===
                "submitLoanButton"
            ) {
                return;
            }


            /* =============================================
               PREVENT DUPLICATE LISTENER
            ============================================= */

            if (
                element.dataset.applicationReady ===
                "true"
            ) {
                return;
            }


            element.dataset.applicationReady =
                "true";


            /* =============================================
               SAVE DESTINATION
            ============================================= */

            const destination =
                element.href ||
                element.getAttribute("href");


            /* =============================================
               CLICK EVENT
            ============================================= */

            element.addEventListener(
                "click",
                function (event) {

                    /*
                     * Stop the link from navigating
                     * immediately.
                     */

                    event.preventDefault();


                    /*
                     * Stop double clicking.
                     */

                    if (
                        element.classList.contains(
                            "application-loading"
                        )
                    ) {
                        return;
                    }


                    /* =================================
                       SHOW SPINNER
                    ================================= */

                    element.classList.add(
                        "application-loading"
                    );


                    element.setAttribute(
                        "aria-disabled",
                        "true"
                    );


                    /* =================================
                       WAIT THEN NAVIGATE
                    ================================= */

                    setTimeout(
                        function () {

                            if (destination) {

                                window.location.href =
                                    destination;
                            }

                        },
                        700
                    );

                }
            );

        }
    );
}


/* =========================================================
   PAGE LOADER
========================================================= */

function setupPageLoader() {

    const loader =
        document.getElementById(
            "pageLoader"
        );


    if (!loader) {
        return;
    }


    window.addEventListener(
        "load",
        function () {

            setTimeout(
                function () {

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
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* ================================================
           LOAN CALCULATION
        ================================================ */

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


        /* ================================================
           GHANA CARD PREVIEWS
        ================================================ */

        previewImage(
            "ghanaCardFront",
            "frontPreview"
        );


        previewImage(
            "ghanaCardBack",
            "backPreview"
        );


        /* ================================================
           LOAN FORM
        ================================================ */

        const form =
            document.getElementById(
                "loanForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    sendViaWhatsApp();

                }
            );
        }


        /* ================================================
           APPLICATION BUTTONS
        ================================================ */

        setupApplicationButtons();


        /* ================================================
           PAGE LOADER
        ================================================ */

        setupPageLoader();

    }
);

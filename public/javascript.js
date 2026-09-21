"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE
   COMPLETE LOAN APPLICATION FRONTEND
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
   HELPER
========================================================= */

function getValue(id) {
    const element = document.getElementById(id);

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
            Number(
                (amount * INTEREST_RATE).toFixed(2)
            );

        const total =
            Number(
                (amount + interest).toFixed(2)
            );

        interestInput.value =
            `GHS ${interest.toFixed(2)} (20% Interest)`;

        totalInput.value =
            `GHS ${total.toFixed(2)} (Total Payable)`;
    } else {
        interestInput.value = "";
        totalInput.value = "";
    }
}


/* =========================================================
   IMAGE VALIDATION
========================================================= */

function validateImageFile(file) {
    if (!file) {
        return {
            valid: true
        };
    }

    if (
        !ALLOWED_IMAGE_TYPES.includes(
            file.type
        )
    ) {
        return {
            valid: false,
            message:
                "Only JPG, PNG and WEBP images are allowed."
        };
    }

    if (
        file.size > MAX_FILE_SIZE
    ) {
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

            const validation =
                validateImageFile(file);

            if (!validation.valid) {
                alert(
                    validation.message
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
                `${imageLabel} preview`;

            image.loading =
                "lazy";

            image.onload =
                function () {
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
   VALIDATE ALL SELECTED FILES
========================================================= */

function validateUploadedFiles() {
    const fileInputs = [
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
            label: "Selfie"
        }
    ];

    for (
        const item of fileInputs
    ) {
        const input =
            document.getElementById(
                item.id
            );

        if (
            !input ||
            !input.files ||
            !input.files[0]
        ) {
            continue;
        }

        const file =
            input.files[0];

        const validation =
            validateImageFile(file);

        if (!validation.valid) {
            alert(
                `${item.label}: ${validation.message}`
            );

            input.value = "";

            return false;
        }
    }

    return true;
}


/* =========================================================
   BUILD WHATSAPP MESSAGE
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
        "The complete application has been saved to the TEAM KING LOAN SERVICE system.",
        "",
        "Service To Human Is Service To Jesus"
    ].join("\n");
}


/* =========================================================
   SHOW SUCCESS MESSAGE
========================================================= */

function showSuccessMessage(
    applicationNumber,
    emailSent,
    pdfUrl
) {
    const emailMessage =
        emailSent
            ? "Your PDF has been generated, stored securely and emailed to you."
            : "Your PDF has been generated and stored securely.";

    const message =
        [
            "APPLICATION SUBMITTED SUCCESSFULLY!",
            "",
            `Application Number: ${applicationNumber}`,
            "",
            emailMessage
        ].join("\n");

    if (pdfUrl) {
        const download =
            confirm(
                `${message}\n\nClick OK to open your PDF.`
            );

        if (download) {
            window.open(
                pdfUrl,
                "_blank",
                "noopener,noreferrer"
            );
        }
    } else {
        alert(message);
    }

    const sendWhatsApp =
        confirm(
            "Would you also like to send the application details through WhatsApp?"
        );

    if (sendWhatsApp) {

        const amount =
            parseFloat(
                getValue("amount")
            ) || 0;

        const interest =
            Number(
                (
                    amount *
                    INTEREST_RATE
                ).toFixed(2)
            );

        const total =
            Number(
                (
                    amount +
                    interest
                ).toFixed(2)
            );

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

        window.open(
            whatsappUrl,
            "_blank",
            "noopener,noreferrer"
        );
    }
}


/* =========================================================
   RESET IMAGE PREVIEWS
========================================================= */

function clearImagePreviews() {
    const previewIds = [
        "frontPreview",
        "backPreview",
        "selfiePreview"
    ];

    previewIds.forEach(
        function (id) {
            const preview =
                document.getElementById(id);

            if (preview) {
                preview.innerHTML = "";
            }
        }
    );
}


/* =========================================================
   RESET SUBMIT BUTTON
========================================================= */

function resetSubmitButton(
    button,
    originalButtonHTML
) {
    if (!button) {
        return;
    }

    button.disabled = false;

    button.classList.remove(
        "loading"
    );

    button.innerHTML =
        originalButtonHTML ||
        `
        <i class="fab fa-whatsapp"></i>
        <span class="button-text">
            Request Loan
        </span>
        <span class="button-loader"></span>
        `;
}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

async function submitLoanApplication() {

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
       FORM VALIDATION
    ===================================================== */

    if (!form.checkValidity()) {
        form.reportValidity();

        return;
    }


    /* =====================================================
       IMAGE VALIDATION
    ===================================================== */

    if (
        !validateUploadedFiles()
    ) {
        return;
    }


    /* =====================================================
       LOAN AMOUNT
    ===================================================== */

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


    if (
        amount > 100000000
    ) {
        alert(
            "The loan amount is too large."
        );

        return;
    }


    /* =====================================================
       CALCULATE LOAN
    ===================================================== */

    const interest =
        Number(
            (
                amount *
                INTEREST_RATE
            ).toFixed(2)
        );

    const total =
        Number(
            (
                amount +
                interest
            ).toFixed(2)
        );

    calculateInterest();


    /* =====================================================
       SAVE ORIGINAL BUTTON
    ===================================================== */

    const originalButtonHTML =
        button
            ? button.innerHTML
            : "";


    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    if (button) {

        button.disabled = true;

        button.classList.add(
            "loading"
        );

        button.innerHTML = `
            <span class="button-loader"></span>
            <span class="button-text">
                Submitting...
            </span>
        `;
    }


    try {

        /* =================================================
           CREATE FORMDATA
        ================================================= */

        const formData =
            new FormData();


        /* =================================================
           APPLICANT INFORMATION
        ================================================= */

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


        /* =================================================
           LOAN DETAILS
        ================================================= */

        formData.append(
            "amount",
            String(amount)
        );

        formData.append(
            "type",
            getValue("type")
        );


        /* =================================================
           GUARANTOR INFORMATION
        ================================================= */

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


        /* =================================================
           GHANA CARD FRONT
        ================================================= */

        const frontInput =
            document.getElementById(
                "ghanaCardFront"
            );

        if (
            frontInput &&
            frontInput.files &&
            frontInput.files.length > 0
        ) {
            formData.append(
                "ghanaCardFront",
                frontInput.files[0]
            );
        }


        /* =================================================
           GHANA CARD BACK
        ================================================= */

        const backInput =
            document.getElementById(
                "ghanaCardBack"
            );

        if (
            backInput &&
            backInput.files &&
            backInput.files.length > 0
        ) {
            formData.append(
                "ghanaCardBack",
                backInput.files[0]
            );
        }


        /* =================================================
           SELFIE
        ================================================= */

        const selfieInput =
            document.getElementById(
                "selfie"
            );

        if (
            selfieInput &&
            selfieInput.files &&
            selfieInput.files.length > 0
        ) {
            formData.append(
                "selfie",
                selfieInput.files[0]
            );
        }


        /* =================================================
           SEND TO EXPRESS BACKEND
        ================================================= */

        const response =
            await fetch(
                "/api/applications",
                {
                    method: "POST",
                    body: formData
                }
            );


        /* =================================================
           READ SERVER RESPONSE
        ================================================= */

        let result;

        const responseText =
            await response.text();

        try {
            result =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};
        } catch {
            throw new Error(
                "The server returned an invalid response."
            );
        }


        /* =================================================
           CHECK RESPONSE
        ================================================= */

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Unable to submit your application."
            );
        }


        /* =================================================
           APPLICATION NUMBER
        ================================================= */

        const applicationNumber =
            result.applicationNumber;

        if (!applicationNumber) {
            throw new Error(
                "Application was submitted, but no application number was returned."
            );
        }


        /* =================================================
           PDF URL
        ================================================= */

        const pdfUrl =
            result.pdfUrl ||
            "";


        /* =================================================
           RESET BUTTON
        ================================================= */

        resetSubmitButton(
            button,
            originalButtonHTML
        );


        /* =================================================
           SHOW SUCCESS
        ================================================= */

        showSuccessMessage(
            applicationNumber,
            Boolean(
                result.emailSent
            ),
            pdfUrl
        );


        /* =================================================
           RESET FORM
        ================================================= */

        form.reset();

        calculateInterest();

        clearImagePreviews();


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

        resetSubmitButton(
            button,
            originalButtonHTML
        );
    }
}


/* =========================================================
   APPLICATION BUTTONS
========================================================= */

function setupApplicationButtons() {

    const elements =
        document.querySelectorAll(
            "a, button"
        );

    elements.forEach(
        function (element) {

            const text =
                element.textContent
                    .trim()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .toUpperCase();

            const isApplicationButton =
                text === "APPLY NOW" ||
                text ===
                    "START YOUR APPLICATION" ||
                text ===
                    "APPLY FOR A LOAN";

            if (
                !isApplicationButton
            ) {
                return;
            }

            if (
                element.id ===
                "submitLoanButton"
            ) {
                return;
            }

            if (
                element.dataset
                    .applicationReady ===
                "true"
            ) {
                return;
            }

            element.dataset
                .applicationReady =
                "true";

            const destination =
                element.href ||
                element.getAttribute(
                    "href"
                );

            element.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

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

                    setTimeout(
                        function () {

                            if (
                                destination
                            ) {
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

        /* =================================================
           LOAN CALCULATION
        ================================================= */

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


        /* =================================================
           GHANA CARD FRONT PREVIEW
        ================================================= */

        previewImage(
            "ghanaCardFront",
            "frontPreview",
            "Ghana Card front"
        );


        /* =================================================
           GHANA CARD BACK PREVIEW
        ================================================= */

        previewImage(
            "ghanaCardBack",
            "backPreview",
            "Ghana Card back"
        );


        /* =================================================
           SELFIE PREVIEW
        ================================================= */

        previewImage(
            "selfie",
            "selfiePreview",
            "Selfie"
        );


        /* =================================================
           LOAN FORM SUBMISSION
        ================================================= */

        const form =
            document.getElementById(
                "loanForm"
            );

        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    submitLoanApplication();
                }
            );
        }


        /* =================================================
           APPLICATION BUTTONS
        ================================================= */

        setupApplicationButtons();


        /* =================================================
           PAGE LOADER
        ================================================= */

        setupPageLoader();

    }
);
"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE
   Loan Application JavaScript
   ========================================================= */


/* =========================================================
   BACKEND CONFIGURATION
   =========================================================

   If homepage.html and server.js are hosted together:
       const API_BASE_URL = "";

   If homepage.html is hosted on GitHub Pages and your
   backend is hosted on Render, change this to your Render URL.

   Example:
   const API_BASE_URL = "https://your-team-king-backend.onrender.com";

   DO NOT put your WhatsApp access token here.
   ========================================================= */

const API_BASE_URL = "";


/* =========================================================
   CALCULATE LOAN INTEREST
   ========================================================= */

function calculateInterest() {
    const amountInput = document.getElementById("amount");
    const interestInput = document.getElementById("interest");
    const incomeInput = document.getElementById("income");

    if (!amountInput || !interestInput || !incomeInput) {
        return;
    }

    const amount = parseFloat(
        amountInput.value.replace(/[^0-9.]/g, "")
    );

    if (!isNaN(amount) && amount > 0) {
        const interest = amount * 0.20;
        const total = amount + interest;

        interestInput.value =
            `GHS ${interest.toFixed(2)} (20% Interest)`;

        incomeInput.value =
            `GHS ${total.toFixed(2)} (Total Payable)`;
    } else {
        interestInput.value = "";
        incomeInput.value = "";
    }
}


/* =========================================================
   GHANA CARD IMAGE PREVIEW
   ========================================================= */

function previewImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input || !preview) {
        return;
    }

    input.addEventListener("change", function () {
        preview.innerHTML = "";

        if (!this.files || !this.files.length) {
            return;
        }

        const file = this.files[0];

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            this.value = "";
            return;
        }

        const image = document.createElement("img");

        image.src = URL.createObjectURL(file);
        image.alt = "Ghana Card preview";

        image.onload = function () {
            URL.revokeObjectURL(image.src);
        };

        preview.appendChild(image);
    });
}


/* =========================================================
   VALIDATE GHANA CARD UPLOADS
   ========================================================= */

function validateGhanaCardUploads() {
    const frontInput = document.getElementById("ghanaCardFront");
    const backInput = document.getElementById("ghanaCardBack");

    if (!frontInput || !backInput) {
        alert("Ghana Card upload fields could not be found.");
        return false;
    }

    /* Front side */
    if (!frontInput.files || !frontInput.files.length) {
        alert("Please upload the FRONT of your Ghana Card.");
        frontInput.focus();
        return false;
    }

    /* Back side */
    if (!backInput.files || !backInput.files.length) {
        alert("Please upload the BACK of your Ghana Card.");
        backInput.focus();
        return false;
    }

    const frontFile = frontInput.files[0];
    const backFile = backInput.files[0];

    /* Allowed file types */
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(frontFile.type)) {
        alert(
            "The Ghana Card FRONT must be a JPG, PNG, or WEBP image."
        );
        frontInput.value = "";
        return false;
    }

    if (!allowedTypes.includes(backFile.type)) {
        alert(
            "The Ghana Card BACK must be a JPG, PNG, or WEBP image."
        );
        backInput.value = "";
        return false;
    }

    /* Maximum size: 5 MB per image */
    const maxFileSize = 5 * 1024 * 1024;

    if (frontFile.size > maxFileSize) {
        alert(
            "The Ghana Card FRONT image is too large. Maximum size is 5 MB."
        );
        frontInput.value = "";
        return false;
    }

    if (backFile.size > maxFileSize) {
        alert(
            "The Ghana Card BACK image is too large. Maximum size is 5 MB."
        );
        backInput.value = "";
        return false;
    }

    return true;
}


/* =========================================================
   GET FORM VALUE SAFELY
   ========================================================= */

function getValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value.trim();
}


/* =========================================================
   SUBMIT LOAN APPLICATION
   ========================================================= */

async function sendViaWhatsApp() {

    const form = document.getElementById("loanForm");

    if (!form) {
        alert("Loan application form could not be found.");
        return;
    }


    /* ---------------------------------------------
       Validate normal form fields
       --------------------------------------------- */

    if (!form.checkValidity()) {

        form.reportValidity();

        alert(
            "Please complete all required fields before submitting your application."
        );

        return;
    }


    /* ---------------------------------------------
       Validate Ghana Card uploads
       --------------------------------------------- */

    if (!validateGhanaCardUploads()) {
        return;
    }


    /* ---------------------------------------------
       Get submit button
       --------------------------------------------- */

    const submitButton =
        document.getElementById("submitLoanButton") ||
        document.querySelector(".submit-button");


    /* ---------------------------------------------
       Prevent multiple submissions
       --------------------------------------------- */

    if (submitButton && submitButton.disabled) {
        return;
    }


    /* ---------------------------------------------
       Get Ghana Card files
       --------------------------------------------- */

    const frontInput =
        document.getElementById("ghanaCardFront");

    const backInput =
        document.getElementById("ghanaCardBack");

    const frontFile =
        frontInput.files[0];

    const backFile =
        backInput.files[0];


    /* ---------------------------------------------
       Get applicant information
       --------------------------------------------- */

    const fname = getValue("fname");
    const lname = getValue("lname");
    const email = getValue("email");

    const mphone = getValue("mphone");
    const type1 = getValue("type1");


    /* ---------------------------------------------
       Get loan information
       --------------------------------------------- */

    const amount = getValue("amount");
    const interest = getValue("interest");
    const income = getValue("income");
    const type = getValue("type");


    /* ---------------------------------------------
       Get guarantor information
       --------------------------------------------- */

    const gname = getValue("gname");
    const gphone = getValue("gphone");
    const gaddress = getValue("gaddress");
    const grelationship = getValue("grelationship");


    /* ---------------------------------------------
       Recalculate interest before sending
       --------------------------------------------- */

    calculateInterest();


    /* Get updated values */
    const updatedInterest = getValue("interest");
    const updatedIncome = getValue("income");


    /* ---------------------------------------------
       Create FormData
       --------------------------------------------- */

    const formData = new FormData();


    /* Applicant information */

    formData.append("fname", fname);
    formData.append("lname", lname);
    formData.append("email", email);

    formData.append("mphone", mphone);
    formData.append("type1", type1);


    /* Loan information */

    formData.append("amount", amount);
    formData.append("interest", updatedInterest || interest);
    formData.append("income", updatedIncome || income);
    formData.append("type", type);


    /* Guarantor information */

    formData.append("gname", gname);
    formData.append("gphone", gphone);
    formData.append("gaddress", gaddress);
    formData.append("grelationship", grelationship);


    /* Ghana Card images */

    formData.append(
        "ghanaCardFront",
        frontFile
    );

    formData.append(
        "ghanaCardBack",
        backFile
    );


    /* ---------------------------------------------
       Disable button while submitting
       --------------------------------------------- */

    if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.originalText =
            submitButton.innerHTML;

        submitButton.innerHTML =
            "Submitting Application...";
    }


    /* ---------------------------------------------
       Send application to backend
       --------------------------------------------- */

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/applications`,
            {
                method: "POST",
                body: formData
            }
        );


        /* -----------------------------------------
           Read server response
           ----------------------------------------- */

        let result;

        try {
            result = await response.json();
        } catch (jsonError) {

            throw new Error(
                "The server returned an invalid response."
            );
        }


        /* -----------------------------------------
           Handle server error
           ----------------------------------------- */

        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Your application could not be submitted."
            );
        }


        /* -----------------------------------------
           Successful application
           ----------------------------------------- */

        alert(
            result.message ||
            "Your loan application has been submitted successfully."
        );


        /* -----------------------------------------
           Reset form
           ----------------------------------------- */

        form.reset();


        /* Clear calculated fields */

        const interestInput =
            document.getElementById("interest");

        const incomeInput =
            document.getElementById("income");

        if (interestInput) {
            interestInput.value = "";
        }

        if (incomeInput) {
            incomeInput.value = "";
        }


        /* Clear Ghana Card previews */

        const frontPreview =
            document.getElementById("frontPreview");

        const backPreview =
            document.getElementById("backPreview");

        if (frontPreview) {
            frontPreview.innerHTML = "";
        }

        if (backPreview) {
            backPreview.innerHTML = "";
        }


    } catch (error) {

        console.error(
            "Loan application submission error:",
            error
        );


        alert(
            error.message ||
            "An error occurred while submitting your application. Please try again."
        );


    } finally {

        /* -----------------------------------------
           Re-enable submit button
           ----------------------------------------- */

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.innerHTML =
                submitButton.dataset.originalText ||
                "Request Now";
        }
    }
}


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* -----------------------------------------
           Loan amount calculation
           ----------------------------------------- */

        const amountInput =
            document.getElementById("amount");

        if (amountInput) {

            amountInput.addEventListener(
                "input",
                calculateInterest
            );

            amountInput.addEventListener(
                "change",
                calculateInterest
            );
        }


        /* -----------------------------------------
           Ghana Card previews
           ----------------------------------------- */

        previewImage(
            "ghanaCardFront",
            "frontPreview"
        );

        previewImage(
            "ghanaCardBack",
            "backPreview"
        );


        /* -----------------------------------------
           Ghana Card validation on file selection
           ----------------------------------------- */

        const frontInput =
            document.getElementById("ghanaCardFront");

        const backInput =
            document.getElementById("ghanaCardBack");


        if (frontInput) {

            frontInput.addEventListener(
                "change",
                function () {

                    if (
                        this.files &&
                        this.files.length
                    ) {

                        const file =
                            this.files[0];

                        const allowedTypes = [
                            "image/jpeg",
                            "image/png",
                            "image/webp"
                        ];

                        const maxSize =
                            5 * 1024 * 1024;


                        if (
                            !allowedTypes.includes(
                                file.type
                            )
                        ) {

                            alert(
                                "Please upload a JPG, PNG, or WEBP image for the Ghana Card FRONT."
                            );

                            this.value = "";

                            const preview =
                                document.getElementById(
                                    "frontPreview"
                                );

                            if (preview) {
                                preview.innerHTML = "";
                            }

                            return;
                        }


                        if (file.size > maxSize) {

                            alert(
                                "The Ghana Card FRONT image must not exceed 5 MB."
                            );

                            this.value = "";

                            const preview =
                                document.getElementById(
                                    "frontPreview"
                                );

                            if (preview) {
                                preview.innerHTML = "";
                            }
                        }
                    }
                }
            );
        }


        if (backInput) {

            backInput.addEventListener(
                "change",
                function () {

                    if (
                        this.files &&
                        this.files.length
                    ) {

                        const file =
                            this.files[0];

                        const allowedTypes = [
                            "image/jpeg",
                            "image/png",
                            "image/webp"
                        ];

                        const maxSize =
                            5 * 1024 * 1024;


                        if (
                            !allowedTypes.includes(
                                file.type
                            )
                        ) {

                            alert(
                                "Please upload a JPG, PNG, or WEBP image for the Ghana Card BACK."
                            );

                            this.value = "";

                            const preview =
                                document.getElementById(
                                    "backPreview"
                                );

                            if (preview) {
                                preview.innerHTML = "";
                            }

                            return;
                        }


                        if (file.size > maxSize) {

                            alert(
                                "The Ghana Card BACK image must not exceed 5 MB."
                            );

                            this.value = "";

                            const preview =
                                document.getElementById(
                                    "backPreview"
                                );

                            if (preview) {
                                preview.innerHTML = "";
                            }
                        }
                    }
                }
            );
        }


        /* -----------------------------------------
           Form submit protection
           ----------------------------------------- */

        const form =
            document.getElementById("loanForm");

        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    sendViaWhatsApp();
                }
            );
        }

    }
);
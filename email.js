"use strict";

const fs = require("fs");
const { Resend } = require("resend");


/* =========================================================
   RESEND EMAIL CLIENT
========================================================= */

const resend =
    process.env.RESEND_API_KEY
        ? new Resend(
            process.env.RESEND_API_KEY
        )
        : null;


/* =========================================================
   SEND APPLICATION EMAIL
========================================================= */

async function sendApplicationEmail(
    application,
    pdfPath
) {

    /* =====================================================
       CHECK RESEND SETTINGS
    ===================================================== */

    if (!process.env.RESEND_API_KEY) {

        console.warn(
            "RESEND_API_KEY is not configured; PDF generated but email was not sent."
        );

        return false;
    }


    if (!resend) {

        console.warn(
            "Resend client is not available."
        );

        return false;
    }


    /* =====================================================
       CHECK PDF
    ===================================================== */

    if (!pdfPath) {

        console.warn(
            "PDF path is missing; email was not sent."
        );

        return false;
    }


    if (!fs.existsSync(pdfPath)) {

        console.warn(
            `PDF file does not exist: ${pdfPath}`
        );

        return false;
    }


    /* =====================================================
       EMAIL RECIPIENTS
    ===================================================== */

    const applicantEmail =
        application.email;

    const adminEmail =
        process.env.ADMIN_EMAIL;


    const recipients = [];


    if (applicantEmail) {

        recipients.push(
            applicantEmail
        );
    }


    if (
        adminEmail &&
        adminEmail !== applicantEmail
    ) {

        recipients.push(
            adminEmail
        );
    }


    if (recipients.length === 0) {

        console.warn(
            "No email recipient is available."
        );

        return false;
    }


    /* =====================================================
       APPLICATION INFORMATION
    ===================================================== */

    const applicationNumber =
        application.application_number ||
        application.applicationNumber ||
        "N/A";


    const firstName =
        application.first_name ||
        application.firstName ||
        "";


    const lastName =
        application.last_name ||
        application.lastName ||
        "";


    const loanType =
        application.loan_type ||
        application.loanType ||
        application.type ||
        "N/A";


    const loanAmount =
        Number(
            application.loan_amount ??
            application.loanAmount ??
            application.amount ??
            0
        );


    const interestAmount =
        Number(
            application.interest_amount ??
            application.interestAmount ??
            0
        );


    const totalPayable =
        Number(
            application.total_payable ??
            application.totalPayable ??
            0
        );


    /* =====================================================
       PDF
    ===================================================== */

    const pdfContent =
        fs.readFileSync(
            pdfPath
        );


    const filename =
        `${applicationNumber}.pdf`;


    /* =====================================================
       SENDER
    ===================================================== */

    const fromEmail =
        process.env.RESEND_FROM_EMAIL ||
        "onboarding@resend.dev";


    /* =====================================================
       SEND EMAIL
    ===================================================== */

    try {

        const result =
            await resend.emails.send({

                from:
                    fromEmail,

                to:
                    recipients,

                replyTo:
                    applicantEmail ||
                    undefined,

                subject:
                    `TEAM KING LOAN SERVICE - Application ${applicationNumber}`,

                html:
`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
TEAM KING LOAN SERVICE
</title>

</head>


<body style="
margin:0;
padding:0;
background:#f4f6f8;
font-family:Arial,Helvetica,sans-serif;
">


<div style="
max-width:650px;
margin:30px auto;
background:#ffffff;
border-radius:10px;
overflow:hidden;
box-shadow:0 2px 10px rgba(0,0,0,0.08);
">


    <!-- HEADER -->

    <div style="
    background:#1a2a4e;
    color:#ffffff;
    padding:25px;
    text-align:center;
    ">

        <h1 style="
        margin:0;
        font-size:24px;
        ">

            TEAM KING LOAN SERVICE

        </h1>


        <p style="
        margin:8px 0 0;
        font-size:14px;
        ">

            Service To Human Is Service To Jesus

        </p>

    </div>


    <!-- CONTENT -->

    <div style="
    padding:30px;
    color:#222222;
    ">


        <h2 style="
        margin-top:0;
        ">

            Loan Application Received

        </h2>


        <p>

            Dear ${firstName} ${lastName},

        </p>


        <p>

            Thank you for submitting your loan
            application to TEAM KING LOAN SERVICE.

        </p>


        <div style="
        background:#f7f8fa;
        border-radius:8px;
        padding:20px;
        margin:20px 0;
        ">


            <p>

                <strong>
                Application Number:
                </strong>

                ${applicationNumber}

            </p>


            <p>

                <strong>
                Loan Type:
                </strong>

                ${loanType}

            </p>


            <p>

                <strong>
                Requested Amount:
                </strong>

                GHS ${loanAmount.toFixed(2)}

            </p>


            <p>

                <strong>
                Interest:
                </strong>

                GHS ${interestAmount.toFixed(2)}

            </p>


            <p>

                <strong>
                Total Payable:
                </strong>

                GHS ${totalPayable.toFixed(2)}

            </p>


        </div>


        <p>

            Your loan application PDF is attached
            to this email.

        </p>


        <p>

            Please keep your application number
            for future reference.

        </p>


        <p style="
        margin-top:30px;
        ">

            Regards,<br>

            <strong>
            TEAM KING LOAN SERVICE
            </strong>

        </p>


    </div>


    <!-- FOOTER -->

    <div style="
    background:#f4f6f8;
    padding:15px;
    text-align:center;
    font-size:12px;
    color:#777777;
    ">

        Service To Human Is Service To Jesus

    </div>


</div>


</body>

</html>
`,

                text:
`
Dear ${firstName} ${lastName},

Thank you for submitting your loan application to TEAM KING LOAN SERVICE.

Application Number:
${applicationNumber}

Loan Type:
${loanType}

Requested Amount:
GHS ${loanAmount.toFixed(2)}

Interest:
GHS ${interestAmount.toFixed(2)}

Total Payable:
GHS ${totalPayable.toFixed(2)}

Your loan application PDF is attached to this email.

Please keep your application number for future reference.

TEAM KING LOAN SERVICE
Service To Human Is Service To Jesus
`,

                attachments: [

                    {
                        filename:
                            filename,

                        content:
                            pdfContent,

                        contentType:
                            "application/pdf"
                    }

                ]

            });


        /* =================================================
           RESEND ERROR
        ================================================= */

        if (result.error) {

            console.error(
                "Resend email failed:",
                result.error
            );

            return false;
        }


        /* =================================================
           SUCCESS
        ================================================= */

        console.log(
            `Application email sent successfully. Resend ID: ${
                result.data?.id || "unknown"
            }`
        );


        return true;


    } catch (error) {

        console.error(
            "Application email failed:",
            error
        );

        return false;
    }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    sendApplicationEmail
};
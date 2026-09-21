const nodemailer = require("nodemailer");


/* =========================================================
   SEND APPLICATION EMAIL
========================================================= */

async function sendApplicationEmail(application, pdfPath) {

    /* =====================================================
       CHECK SMTP SETTINGS
    ===================================================== */

    if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
    ) {
        console.warn(
            "SMTP not configured; PDF generated but not emailed."
        );

        return false;
    }


    /* =====================================================
       CREATE SMTP TRANSPORT
    ===================================================== */

    const transporter =
        nodemailer.createTransport({
            host: process.env.SMTP_HOST,

            port: Number(
                process.env.SMTP_PORT || 587
            ),

            secure:
                String(
                    process.env.SMTP_SECURE
                ).toLowerCase() === "true",

            auth: {
                user:
                    process.env.SMTP_USER,

                pass:
                    process.env.SMTP_PASS
            }
        });


    /* =====================================================
       VERIFY SMTP CONNECTION
    ===================================================== */

    await transporter.verify();


    /* =====================================================
       EMAIL RECIPIENTS
    ===================================================== */

    const applicantEmail =
        application.email;

    const adminEmail =
        process.env.ADMIN_EMAIL;


    /*
     * Send to the applicant.
     *
     * If ADMIN_EMAIL is configured,
     * also send a copy to the administrator.
     */

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
        throw new Error(
            "No email recipient is available."
        );
    }


    /* =====================================================
       SEND EMAIL
    ===================================================== */

    await transporter.sendMail({

        from:
            process.env.FROM_EMAIL ||
            process.env.SMTP_USER,

        to:
            recipients.join(","),

        replyTo:
            applicantEmail,

        subject:
            `TEAM KING LOAN SERVICE - Application ${application.application_number}`,

        text:
`Dear ${application.first_name} ${application.last_name},

Thank you for submitting your loan application to TEAM KING LOAN SERVICE.

Application Number:
${application.application_number}

Loan Type:
${application.loan_type}

Requested Amount:
GHS ${Number(application.loan_amount).toFixed(2)}

Interest:
GHS ${Number(application.interest_amount).toFixed(2)}

Total Payable:
GHS ${Number(application.total_payable).toFixed(2)}

Your loan application PDF is attached to this email.

Please keep your application number for future reference.

TEAM KING LOAN SERVICE
Service To Human Is Service To Jesus`,

        attachments: [
            {
                filename:
                    `${application.application_number}.pdf`,

                path:
                    pdfPath,

                contentType:
                    "application/pdf"
            }
        ]
    });


    console.log(
        `Application email sent successfully to: ${recipients.join(", ")}`
    );


    return true;
}


module.exports = {
    sendApplicationEmail
};

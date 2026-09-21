"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE
   PROFESSIONAL PDF GENERATOR

   EXACTLY 5 PAGES

   PAGE 1 = APPLICATION SUMMARY
   PAGE 2 = GHANA CARD FRONT
   PAGE 3 = GHANA CARD BACK
   PAGE 4 = APPLICANT SELFIE
   PAGE 5 = APPLICATION RECORD

   IMPORTANT:
   - No automatic text pagination
   - No automatic field overflow
   - All coordinates are fixed
   - Identity images are contained inside their pages
========================================================= */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const {
    supabase,
    BUCKET
} = require("./supabase");


/* =========================================================
   COLORS
========================================================= */

const COLORS = {
    navy: "#17395F",
    navyDark: "#102B49",
    gold: "#F4B400",
    goldDark: "#D99B00",
    white: "#FFFFFF",
    text: "#25313D",
    muted: "#6B7785",
    lightText: "#8A96A3",
    light: "#F4F7FA",
    border: "#D9E1E8",
    red: "#C0392B"
};


/* =========================================================
   A4 PAGE
========================================================= */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 38;

const HEADER_HEIGHT = 82;
const FOOTER_Y = 800;

const CONTENT_TOP = 107;


/* =========================================================
   SAFE VALUE
========================================================= */

function safeValue(value) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return "—";
    }

    return String(value).trim();
}


/* =========================================================
   MONEY
========================================================= */

function money(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "GHS 0.00";
    }

    return `GHS ${number.toFixed(2)}`;
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* =========================================================
   SHORTEN TEXT
   ---------------------------------------------------------
   Prevents long values from causing PDF overflow.
========================================================= */

function shorten(text, maxLength = 45) {

    text = safeValue(text);

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength - 3) + "...";
}


/* =========================================================
   DRAW HEADER
========================================================= */

function drawHeader(
    doc,
    title,
    applicationNumber
) {

    doc
        .rect(
            0,
            0,
            PAGE_WIDTH,
            HEADER_HEIGHT
        )
        .fill(COLORS.navy);


    doc
        .rect(
            0,
            HEADER_HEIGHT - 4,
            PAGE_WIDTH,
            4
        )
        .fill(COLORS.gold);


    /* Brand */

    doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(
            "TEAM KING",
            MARGIN,
            18,
            {
                width: 180,
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.gold)
        .font("Helvetica-Bold")
        .fontSize(7)
        .text(
            "LOAN SERVICE",
            MARGIN,
            43,
            {
                width: 150,
                lineBreak: false
            }
        );


    /* Page title */

    doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
            title,
            PAGE_WIDTH - MARGIN - 210,
            20,
            {
                width: 210,
                align: "right",
                lineBreak: false
            }
        );


    /* Application number */

    doc
        .fillColor("#DCE7F2")
        .font("Helvetica")
        .fontSize(7)
        .text(
            safeValue(applicationNumber),
            PAGE_WIDTH - MARGIN - 210,
            43,
            {
                width: 210,
                align: "right",
                lineBreak: false
            }
        );
}


/* =========================================================
   DRAW FOOTER
========================================================= */

function drawFooter(
    doc,
    pageNumber
) {

    doc
        .moveTo(
            MARGIN,
            FOOTER_Y
        )
        .lineTo(
            PAGE_WIDTH - MARGIN,
            FOOTER_Y
        )
        .strokeColor(COLORS.border)
        .lineWidth(0.7)
        .stroke();


    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(7)
        .text(
            "TEAM KING LOAN SERVICE",
            MARGIN,
            FOOTER_Y + 11,
            {
                width: 200,
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(7)
        .text(
            `Page ${pageNumber} of 5`,
            PAGE_WIDTH - MARGIN - 100,
            FOOTER_Y + 11,
            {
                width: 100,
                align: "right",
                lineBreak: false
            }
        );
}


/* =========================================================
   SECTION TITLE
========================================================= */

function sectionTitle(
    doc,
    title,
    y
) {

    const width =
        PAGE_WIDTH - (MARGIN * 2);


    doc
        .roundedRect(
            MARGIN,
            y,
            width,
            25,
            5
        )
        .fill(COLORS.light);


    doc
        .rect(
            MARGIN,
            y,
            4,
            25
        )
        .fill(COLORS.gold);


    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
            title,
            MARGIN + 12,
            y + 8,
            {
                width: width - 24,
                lineBreak: false
            }
        );


    return y + 34;
}


/* =========================================================
   DRAW CARD
   ---------------------------------------------------------
   IMPORTANT:
   NO HEIGHT OPTION
   NO AUTOMATIC TEXT FLOW
   NO PAGE BREAK
========================================================= */

function card(
    doc,
    label,
    value,
    x,
    y,
    width,
    height = 47
) {

    doc
        .roundedRect(
            x,
            y,
            width,
            height,
            5
        )
        .fillAndStroke(
            COLORS.white,
            COLORS.border
        );


    /* Label */

    doc
        .fillColor(COLORS.lightText)
        .font("Helvetica-Bold")
        .fontSize(6.2)
        .text(
            label.toUpperCase(),
            x + 10,
            y + 8,
            {
                width: width - 20,
                lineBreak: false
            }
        );


    /* Value */

    doc
        .fillColor(COLORS.text)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(
            shorten(value, 48),
            x + 10,
            y + 23,
            {
                width: width - 20,
                lineBreak: false
            }
        );
}


/* =========================================================
   APPLICATION NUMBER BOX
========================================================= */

function applicationBox(
    doc,
    applicationNumber,
    submittedDate
) {

    const y = CONTENT_TOP;

    const width =
        PAGE_WIDTH - (MARGIN * 2);

    const height = 58;


    doc
        .roundedRect(
            MARGIN,
            y,
            width,
            height,
            7
        )
        .fill("#F5F8FB");


    doc
        .fillColor(COLORS.lightText)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(
            "APPLICATION NUMBER",
            MARGIN + 14,
            y + 10,
            {
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
            shorten(applicationNumber, 30),
            MARGIN + 14,
            y + 25,
            {
                width: 250,
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(7)
        .text(
            `Submitted ${formatDate(submittedDate)}`,
            MARGIN + width - 185,
            y + 27,
            {
                width: 170,
                align: "right",
                lineBreak: false
            }
        );


    return y + height + 15;
}


/* =========================================================
   TOTAL PAYABLE
========================================================= */

function totalBox(
    doc,
    amount,
    y
) {

    const width =
        PAGE_WIDTH - (MARGIN * 2);

    const height = 58;


    doc
        .roundedRect(
            MARGIN,
            y,
            width,
            height,
            7
        )
        .fill(COLORS.navy);


    doc
        .fillColor("#DCE7F2")
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(
            "TOTAL AMOUNT PAYABLE",
            MARGIN + 14,
            y + 10,
            {
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.gold)
        .font("Helvetica-Bold")
        .fontSize(17)
        .text(
            money(amount),
            MARGIN + 14,
            y + 25,
            {
                width: width - 28,
                lineBreak: false
            }
        );
}


/* =========================================================
   SUPABASE IMAGE DOWNLOAD
========================================================= */

async function downloadFromSupabase(
    storagePath
) {

    if (!storagePath) {
        return null;
    }


    const result =
        await supabase
            .storage
            .from(BUCKET)
            .download(storagePath);


    if (result.error) {

        throw new Error(
            `Supabase Storage error: ${result.error.message}`
        );
    }


    if (!result.data) {
        return null;
    }


    const arrayBuffer =
        await result.data.arrayBuffer();


    return Buffer.from(arrayBuffer);
}


/* =========================================================
   GET IMAGE BUFFER
========================================================= */

async function getImageBuffer(
    storagePath
) {

    if (!storagePath) {
        return null;
    }


    /* Try Supabase first */

    try {

        const buffer =
            await downloadFromSupabase(
                storagePath
            );

        if (buffer) {
            return buffer;
        }

    } catch (error) {

        console.warn(
            "Supabase image download failed:",
            error.message
        );

    }


    /* Local fallback */

    const possiblePaths = [

        storagePath,

        path.resolve(
            process.cwd(),
            storagePath
        ),

        path.resolve(
            __dirname,
            "..",
            storagePath
        )

    ];


    for (
        const filePath
        of possiblePaths
    ) {

        try {

            if (
                fs.existsSync(
                    filePath
                )
            ) {

                return fs.readFileSync(
                    filePath
                );

            }

        } catch (_) {}

    }


    return null;
}


/* =========================================================
   IMAGE PAGE
========================================================= */

async function imagePage(
    doc,
    title,
    imagePath,
    applicationNumber,
    pageNumber
) {

    /*
       IMPORTANT:
       addPage() is the ONLY place where a new page
       is intentionally created.
    */

    doc.addPage({
        size: "A4",
        margin: 0
    });


    drawHeader(
        doc,
        "IDENTITY DOCUMENT",
        applicationNumber
    );


    /* Title */

    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(
            title,
            MARGIN,
            108,
            {
                width:
                    PAGE_WIDTH -
                    (MARGIN * 2),
                lineBreak: false
            }
        );


    /* Gold line */

    doc
        .moveTo(
            MARGIN,
            134
        )
        .lineTo(
            PAGE_WIDTH - MARGIN,
            134
        )
        .strokeColor(COLORS.gold)
        .lineWidth(1)
        .stroke();


    /* Image frame */

    const frameX = MARGIN;
    const frameY = 155;

    const frameWidth =
        PAGE_WIDTH - (MARGIN * 2);

    const frameHeight = 620;


    doc
        .roundedRect(
            frameX,
            frameY,
            frameWidth,
            frameHeight,
            8
        )
        .fillAndStroke(
            "#F5F7FA",
            COLORS.border
        );


    const image =
        await getImageBuffer(
            imagePath
        );


    if (image) {

        try {

            doc.image(
                image,
                frameX + 12,
                frameY + 12,
                {
                    fit: [
                        frameWidth - 24,
                        frameHeight - 24
                    ],
                    align: "center",
                    valign: "center"
                }
            );

        } catch (error) {

            doc
                .fillColor(COLORS.red)
                .font("Helvetica-Bold")
                .fontSize(9)
                .text(
                    "The submitted image could not be displayed.",
                    frameX + 20,
                    frameY + 300,
                    {
                        width:
                            frameWidth - 40,
                        align: "center",
                        lineBreak: false
                    }
                );

        }

    } else {

        doc
            .fillColor(COLORS.muted)
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(
                "No document was submitted.",
                frameX + 20,
                frameY + 300,
                {
                    width:
                        frameWidth - 40,
                    align: "center",
                    lineBreak: false
                }
            );

    }


    drawFooter(
        doc,
        pageNumber
    );
}


/* =========================================================
   FINAL RECORD PAGE
========================================================= */

function recordPage(
    doc,
    applicationNumber
) {

    doc.addPage({
        size: "A4",
        margin: 0
    });


    drawHeader(
        doc,
        "APPLICATION RECORD",
        applicationNumber
    );


    /* Main icon */

    doc
        .roundedRect(
            PAGE_WIDTH / 2 - 38,
            245,
            76,
            76,
            12
        )
        .fill(COLORS.navy);


    doc
        .fillColor(COLORS.gold)
        .font("Helvetica-Bold")
        .fontSize(28)
        .text(
            "✓",
            PAGE_WIDTH / 2 - 38,
            263,
            {
                width: 76,
                align: "center",
                lineBreak: false
            }
        );


    /* Heading */

    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(21)
        .text(
            "Application Record",
            MARGIN,
            350,
            {
                width:
                    PAGE_WIDTH -
                    (MARGIN * 2),
                align: "center",
                lineBreak: false
            }
        );


    /* Description */

    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(9.5)
        .text(
            "This document contains information submitted by the applicant as part of a loan application to TEAM KING LOAN SERVICE.",
            MARGIN + 55,
            390,
            {
                width:
                    PAGE_WIDTH -
                    ((MARGIN + 55) * 2),
                align: "center",
                lineBreak: true
            }
        );


    /* Notice */

    doc
        .fillColor(COLORS.text)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
            "IMPORTANT NOTICE",
            MARGIN,
            455,
            {
                width:
                    PAGE_WIDTH -
                    (MARGIN * 2),
                align: "center",
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(
            "This document records application information only. It does not constitute a loan approval, loan agreement, or disbursement notice.",
            MARGIN + 60,
            480,
            {
                width:
                    PAGE_WIDTH -
                    ((MARGIN + 60) * 2),
                align: "center",
                lineBreak: true
            }
        );


    /* Brand */

    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
            "TEAM KING LOAN SERVICE",
            MARGIN,
            570,
            {
                width:
                    PAGE_WIDTH -
                    (MARGIN * 2),
                align: "center",
                lineBreak: false
            }
        );


    doc
        .fillColor(COLORS.goldDark)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
            "Service To Human Is Service To Jesus",
            MARGIN,
            590,
            {
                width:
                    PAGE_WIDTH -
                    (MARGIN * 2),
                align: "center",
                lineBreak: false
            }
        );


    drawFooter(
        doc,
        5
    );
}


/* =========================================================
   MAIN PDF FUNCTION
========================================================= */

async function createApplicationPDF(
    application,
    outputPath
) {

    return new Promise(
        async (resolve, reject) => {

            try {

                /* =================================================
                   APPLICATION DATA
                ================================================= */

                const applicationNumber =
                    safeValue(
                        application.application_number ||
                        application.applicationNumber
                    );


                const submittedDate =
                    application.created_at ||
                    application.createdAt ||
                    application.submitted_at ||
                    new Date();


                const firstName =
                    safeValue(
                        application.first_name ||
                        application.firstName ||
                        application.fname
                    );


                const lastName =
                    safeValue(
                        application.last_name ||
                        application.lastName ||
                        application.lname
                    );


                const email =
                    safeValue(
                        application.email
                    );


                const momoPhone =
                    safeValue(
                        application.momo_phone ||
                        application.mphone
                    );


                const momoNetwork =
                    safeValue(
                        application.momo_network ||
                        application.type1
                    );


                const loanType =
                    safeValue(
                        application.loan_type ||
                        application.type
                    );


                const loanAmount =
                    Number(
                        application.loan_amount ??
                        application.amount ??
                        0
                    );


                const interestRate =
                    Number(
                        application.interest_rate ??
                        20
                    );


                const interestAmount =
                    Number(
                        application.interest_amount ??
                        (
                            loanAmount *
                            interestRate /
                            100
                        )
                    );


                const totalPayable =
                    Number(
                        application.total_payable ??
                        (
                            loanAmount +
                            interestAmount
                        )
                    );


                const guarantorName =
                    safeValue(
                        application.guarantor_name ||
                        application.gname
                    );


                const guarantorPhone =
                    safeValue(
                        application.guarantor_phone ||
                        application.gphone
                    );


                const guarantorAddress =
                    safeValue(
                        application.guarantor_address ||
                        application.gaddress
                    );


                const guarantorRelationship =
                    safeValue(
                        application.guarantor_relationship ||
                        application.grelationship
                    );


                const ghanaCardFrontPath =
                    application.ghana_card_front_path ||
                    application.ghanaCardFrontPath ||
                    null;


                const ghanaCardBackPath =
                    application.ghana_card_back_path ||
                    application.ghanaCardBackPath ||
                    null;


                const selfiePath =
                    application.selfie_path ||
                    application.selfiePath ||
                    null;


                /* =================================================
                   OUTPUT DIRECTORY
                ================================================= */

                const outputDirectory =
                    path.dirname(outputPath);


                if (
                    !fs.existsSync(
                        outputDirectory
                    )
                ) {

                    fs.mkdirSync(
                        outputDirectory,
                        {
                            recursive: true
                        }
                    );

                }


                /* =================================================
                   CREATE PDF
                ================================================= */

                const doc =
                    new PDFDocument({
                        size: "A4",
                        margin: 0,
                        autoFirstPage: true,
                        bufferPages: false
                    });


                const stream =
                    fs.createWriteStream(
                        outputPath
                    );


                doc.pipe(stream);


                /* =================================================
                   PAGE 1
                   APPLICATION SUMMARY
                ================================================= */

                drawHeader(
                    doc,
                    "APPLICATION SUMMARY",
                    applicationNumber
                );


                let y =
                    applicationBox(
                        doc,
                        applicationNumber,
                        submittedDate
                    );


                /* =================================================
                   APPLICANT INFORMATION
                ================================================= */

                y =
                    sectionTitle(
                        doc,
                        "APPLICANT INFORMATION",
                        y
                    );


                const gap = 10;

                const columnWidth =
                    (
                        PAGE_WIDTH -
                        (MARGIN * 2) -
                        gap
                    ) / 2;


                card(
                    doc,
                    "First Name",
                    firstName,
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Last Name",
                    lastName,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                y += 57;


                card(
                    doc,
                    "Email Address",
                    email,
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Mobile Money Phone",
                    momoPhone,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                y += 57;


                card(
                    doc,
                    "Mobile Money Network",
                    momoNetwork,
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Loan Type",
                    loanType,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                /* =================================================
                   LOAN DETAILS
                ================================================= */

                y += 68;


                y =
                    sectionTitle(
                        doc,
                        "LOAN DETAILS",
                        y
                    );


                card(
                    doc,
                    "Requested Loan Amount",
                    money(loanAmount),
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Interest Rate",
                    `${interestRate.toFixed(2)}%`,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                y += 57;


                card(
                    doc,
                    "Interest Amount",
                    money(interestAmount),
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Loan Type",
                    loanType,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                y += 72;


                totalBox(
                    doc,
                    totalPayable,
                    y
                );


                /* =================================================
                   GUARANTOR INFORMATION
                ================================================= */

                y += 78;


                y =
                    sectionTitle(
                        doc,
                        "GUARANTOR INFORMATION",
                        y
                    );


                card(
                    doc,
                    "Guarantor Name",
                    guarantorName,
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Guarantor Phone",
                    guarantorPhone,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                y += 57;


                card(
                    doc,
                    "Relationship",
                    guarantorRelationship,
                    MARGIN,
                    y,
                    columnWidth
                );


                card(
                    doc,
                    "Guarantor Address",
                    guarantorAddress,
                    MARGIN +
                    columnWidth +
                    gap,
                    y,
                    columnWidth
                );


                drawFooter(
                    doc,
                    1
                );


                /* =================================================
                   PAGE 2
                   GHANA CARD FRONT
                ================================================= */

                await imagePage(
                    doc,
                    "GHANA CARD — FRONT",
                    ghanaCardFrontPath,
                    applicationNumber,
                    2
                );


                /* =================================================
                   PAGE 3
                   GHANA CARD BACK
                ================================================= */

                await imagePage(
                    doc,
                    "GHANA CARD — BACK",
                    ghanaCardBackPath,
                    applicationNumber,
                    3
                );


                /* =================================================
                   PAGE 4
                   APPLICANT SELFIE
                ================================================= */

                await imagePage(
                    doc,
                    "APPLICANT SELFIE",
                    selfiePath,
                    applicationNumber,
                    4
                );


                /* =================================================
                   PAGE 5
                   APPLICATION RECORD
                ================================================= */

                recordPage(
                    doc,
                    applicationNumber
                );


                /* =================================================
                   FINISH
                ================================================= */

                doc.end();


                stream.on(
                    "finish",
                    () => {

                        resolve(
                            outputPath
                        );

                    }
                );


                stream.on(
                    "error",
                    reject
                );

            } catch (error) {

                reject(error);

            }

        }
    );
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    createApplicationPDF
};
"use strict";

require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const { query } = require("./db");
const { createApplicationPDF } = require("./pdf");
const { sendApplicationEmail } = require("./email");
const { supabase, BUCKET } = require("./supabase");

const app = express();

app.disable("x-powered-by");

const PORT = Number(process.env.PORT || 5000);

const INTEREST_RATE = 0.20;


/* =========================================================
   PROJECT DIRECTORIES
========================================================= */

const ROOT = path.join(__dirname, "..");

const PUBLIC = path.join(ROOT, "public");

const PRIVATE = path.join(ROOT, "private_data");

const UPLOAD = path.join(PRIVATE, "uploads");

const PDF = path.join(PRIVATE, "pdf");

[UPLOAD, PDF].forEach((folder) => {
    fs.mkdirSync(folder, { recursive: true });
});


/* =========================================================
   DOWNLOAD TOKEN

   The browser receives a token for the specific PDF instead
   of exposing PDFs through an easily guessable URL.
========================================================= */

const DOWNLOAD_SECRET =
    process.env.DOWNLOAD_SECRET ||
    crypto.randomBytes(32).toString("hex");

if (!process.env.DOWNLOAD_SECRET) {
    console.warn(
        "DOWNLOAD_SECRET is not configured. PDF links will become invalid after a server restart."
    );
}


function createDownloadToken(applicationNumber) {
    return crypto
        .createHmac("sha256", DOWNLOAD_SECRET)
        .update(applicationNumber)
        .digest("hex");
}


function isValidDownloadToken(applicationNumber, token) {

    if (!token || typeof token !== "string") {
        return false;
    }

    const expected = createDownloadToken(applicationNumber);

    try {

        return crypto.timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(token, "hex")
        );

    } catch {

        return false;

    }
}


/* =========================================================
   MIDDLEWARE
========================================================= */

const allowAllOrigins =
    String(
        process.env.ALLOW_ALL_ORIGINS || "true"
    ).toLowerCase() === "true";


app.use(
    cors(
        allowAllOrigins
            ? {}
            : {
                  origin:
                      process.env.FRONTEND_URL || false
              }
    )
);


app.use(
    express.json({
        limit: "1mb"
    })
);


app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


/* =========================================================
   FILE UPLOAD
========================================================= */

const storage = multer.diskStorage({

    destination: (_req, _file, cb) => {
        cb(null, UPLOAD);
    },

    filename: (_req, file, cb) => {

        const safeName = path
            .basename(file.originalname)
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

        const filename =
            `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safeName}`;

        cb(null, filename);
    }

});


const upload = multer({

    storage,

    limits: {

        fileSize:
            5 * 1024 * 1024,

        files: 3

    },

    fileFilter: (_req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only JPG, PNG and WEBP images are allowed."
                )
            );

        }

    }

});


/*
 * Multer runs before the route handler,
 * so errors from it must be handled here.
 */

function handleApplicationUpload(
    req,
    res,
    next
) {

    upload.fields([

        {
            name: "ghanaCardFront",
            maxCount: 1
        },

        {
            name: "ghanaCardBack",
            maxCount: 1
        },

        {
            name: "selfie",
            maxCount: 1
        }

    ])(
        req,
        res,
        (error) => {

            if (!error) {
                return next();
            }

            console.error(
                "Upload error:",
                error
            );

            return res.status(400).json({

                success: false,

                message:
                    error.code ===
                    "LIMIT_FILE_SIZE"
                        ? "Each image must not exceed 5MB."
                        : error.message ||
                          "Invalid uploaded file."

            });

        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function reqStr(value, name) {

    const result =
        String(value ?? "").trim();

    if (!result) {

        throw new Error(
            `${name} is required.`
        );

    }

    return result;
}


function emailOk(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value
    );

}


function appNo() {

    const date = new Date();

    return `TKL-${date.getUTCFullYear()}${String(
        date.getUTCMonth() + 1
    ).padStart(2, "0")}${String(
        date.getUTCDate()
    ).padStart(2, "0")}-${crypto.randomInt(
        1000,
        10000
    )}`;

}


function removeFile(filePath) {

    if (!filePath) {
        return;
    }

    try {

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

    } catch (error) {

        console.error(
            "Unable to remove file:",
            error
        );

    }

}


/* =========================================================
   SUPABASE STORAGE UPLOAD
========================================================= */

async function uploadToSupabase(
    filePath,
    storagePath,
    contentType
) {

    if (!filePath) {
        return null;
    }

    if (!fs.existsSync(filePath)) {

        throw new Error(
            `Local file does not exist: ${filePath}`
        );

    }

    const fileBuffer =
        fs.readFileSync(filePath);

    const {
        error
    } = await supabase
        .storage
        .from(BUCKET)
        .upload(
            storagePath,
            fileBuffer,
            {
                contentType,
                upsert: false
            }
        );

    if (error) {

        throw new Error(
            `Supabase Storage upload failed: ${error.message}`
        );

    }

    console.log(
        `Supabase Storage upload successful: ${storagePath}`
    );

    return storagePath;
}


/* =========================================================
   SUPABASE STORAGE CLEANUP
========================================================= */

async function deleteFromSupabase(
    storagePath
) {

    if (!storagePath) {
        return;
    }

    try {

        const {
            error
        } = await supabase
            .storage
            .from(BUCKET)
            .remove([
                storagePath
            ]);

        if (error) {

            console.error(
                "Supabase Storage cleanup failed:",
                error.message
            );

        } else {

            console.log(
                `Supabase Storage file removed: ${storagePath}`
            );

        }

    } catch (error) {

        console.error(
            "Supabase Storage cleanup failed:",
            error
        );

    }

}


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    async (_req, res) => {

        try {

            await query(
                "SELECT 1"
            );

            res.json({

                ok: true,

                database:
                    "connected"

            });

        } catch (error) {

            console.error(
                "Database health check failed:",
                error
            );

            res.status(503).json({

                ok: false,

                database:
                    "not connected"

            });

        }

    }
);


/* =========================================================
   LOAN APPLICATION
========================================================= */

app.post(

    "/api/applications",

    handleApplicationUpload,

    async (req, res) => {

        let row = null;

        let pdfFile = null;

        let storageFrontPath = null;

        let storageBackPath = null;

        let storageSelfiePath = null;

        let storagePdfPath = null;


        const uploadedFiles = [

            ...(req.files?.ghanaCardFront || []),

            ...(req.files?.ghanaCardBack || []),

            ...(req.files?.selfie || [])

        ].map(
            (file) => file.path
        );


        try {

            const body = req.body;


            /* =================================================
               APPLICATION DATA
            ================================================= */

            const application = {

                first_name:
                    reqStr(
                        body.fname,
                        "First name"
                    ),

                last_name:
                    reqStr(
                        body.lname,
                        "Last name"
                    ),

                email:
                    reqStr(
                        body.email,
                        "Email"
                    ),

                momo_phone:
                    reqStr(
                        body.mphone,
                        "Momo number"
                    ),

                momo_network:
                    reqStr(
                        body.type1,
                        "Momo network"
                    ),

                loan_type:
                    reqStr(
                        body.type,
                        "Loan type"
                    ),

                guarantor_name:
                    reqStr(
                        body.gname,
                        "Guarantor name"
                    ),

                guarantor_phone:
                    reqStr(
                        body.gphone,
                        "Guarantor phone"
                    ),

                guarantor_address:
                    reqStr(
                        body.gaddress,
                        "Guarantor address"
                    ),

                guarantor_relationship:
                    reqStr(
                        body.grelationship,
                        "Guarantor relationship"
                    )

            };


            /* =================================================
               EMAIL VALIDATION
            ================================================= */

            if (
                !emailOk(
                    application.email
                )
            ) {

                throw new Error(
                    "Please enter a valid email address."
                );

            }


            /* =================================================
               LOAN AMOUNT
            ================================================= */

            const amount =
                Number(body.amount);


            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0 ||
                amount > 100000000
            ) {

                throw new Error(
                    "Please enter a valid loan amount."
                );

            }


            /* =================================================
               INTEREST CALCULATION
            ================================================= */

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


            /* =================================================
               APPLICATION NUMBER
            ================================================= */

            application.application_number =
                appNo();


            application.loan_amount =
                amount;


            application.interest_rate =
                INTEREST_RATE * 100;


            application.interest_amount =
                interest;


            application.total_payable =
                total;


            /* =================================================
               LOCAL FILE PATHS
            ================================================= */

            application.ghana_card_front_path =
                req.files
                    ?.ghanaCardFront
                    ?.[0]
                    ?.path || null;


            application.ghana_card_back_path =
                req.files
                    ?.ghanaCardBack
                    ?.[0]
                    ?.path || null;


            application.selfie_path =
                req.files
                    ?.selfie
                    ?.[0]
                    ?.path || null;


            /* =================================================
               SAVE APPLICATION TO DATABASE
            ================================================= */

            const result =
                await query(

                    `
                    INSERT INTO loan_applications (

                        application_number,

                        first_name,

                        last_name,

                        email,

                        momo_phone,

                        momo_network,

                        loan_amount,

                        loan_type,

                        interest_rate,

                        interest_amount,

                        total_payable,

                        guarantor_name,

                        guarantor_phone,

                        guarantor_address,

                        guarantor_relationship,

                        ghana_card_front_path,

                        ghana_card_back_path,

                        selfie_path

                    )

                    VALUES (

                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        $11,
                        $12,
                        $13,
                        $14,
                        $15,
                        $16,
                        $17,
                        $18

                    )

                    RETURNING *
                    `,

                    [

                        application.application_number,

                        application.first_name,

                        application.last_name,

                        application.email,

                        application.momo_phone,

                        application.momo_network,

                        application.loan_amount,

                        application.loan_type,

                        application.interest_rate,

                        application.interest_amount,

                        application.total_payable,

                        application.guarantor_name,

                        application.guarantor_phone,

                        application.guarantor_address,

                        application.guarantor_relationship,

                        application.ghana_card_front_path,

                        application.ghana_card_back_path,

                        application.selfie_path

                    ]

                );


            row =
                result.rows[0];


            /* =================================================
               SUPABASE STORAGE FOLDER
            ================================================= */

            const storageFolder =
                `applications/${row.application_number}`;


            /* =================================================
               UPLOAD GHANA CARD FRONT
            ================================================= */

            if (
                req.files
                    ?.ghanaCardFront
                    ?.[0]
            ) {

                const file =
                    req.files
                        .ghanaCardFront[0];


                storageFrontPath =
                    await uploadToSupabase(

                        file.path,

                        `${storageFolder}/ghana-card-front${path.extname(file.originalname).toLowerCase()}`,

                        file.mimetype

                    );

            }


            /* =================================================
               UPLOAD GHANA CARD BACK
            ================================================= */

            if (
                req.files
                    ?.ghanaCardBack
                    ?.[0]
            ) {

                const file =
                    req.files
                        .ghanaCardBack[0];


                storageBackPath =
                    await uploadToSupabase(

                        file.path,

                        `${storageFolder}/ghana-card-back${path.extname(file.originalname).toLowerCase()}`,

                        file.mimetype

                    );

            }


            /* =================================================
               UPLOAD SELFIE
            ================================================= */

            if (
                req.files
                    ?.selfie
                    ?.[0]
            ) {

                const file =
                    req.files
                        .selfie[0];


                storageSelfiePath =
                    await uploadToSupabase(

                        file.path,

                        `${storageFolder}/selfie${path.extname(file.originalname).toLowerCase()}`,

                        file.mimetype

                    );

            }


            /* =================================================
               GENERATE PDF
            ================================================= */

            pdfFile =
                path.join(

                    PDF,

                    `${row.application_number}.pdf`

                );


            await createApplicationPDF(
                row,
                pdfFile
            );


            /* =================================================
               UPLOAD PDF TO SUPABASE
            ================================================= */

            storagePdfPath =
                await uploadToSupabase(

                    pdfFile,

                    `${storageFolder}/${row.application_number}.pdf`,

                    "application/pdf"

                );


            /* =================================================
               EMAIL APPLICANT + ADMIN
            =================================================

               Email failure does not destroy a successfully
               saved application.
            ================================================= */

            let emailSent = false;


            try {

                emailSent =
                    await sendApplicationEmail(

                        row,

                        pdfFile

                    );

            } catch (
                emailError
            ) {

                console.error(
                    "Application email failed:",
                    emailError
                );

            }


            /* =================================================
               UPDATE DATABASE
            ================================================= */

            await query(

                `
                UPDATE loan_applications

                SET

                    pdf_path = $1,

                    storage_pdf_path = $2,

                    ghana_card_front_path = $3,

                    ghana_card_back_path = $4,

                    selfie_path = $5,

                    email_sent = $6

                WHERE id = $7
                `,

                [

                    pdfFile,

                    storagePdfPath,

                    storageFrontPath,

                    storageBackPath,

                    storageSelfiePath,

                    emailSent,

                    row.id

                ]

            );


            /* =================================================
               DOWNLOAD TOKEN
            ================================================= */

            const downloadToken =
                createDownloadToken(
                    row.application_number
                );


            const pdfUrl =
                `/api/applications/${encodeURIComponent(
                    row.application_number
                )}/pdf?token=${encodeURIComponent(
                    downloadToken
                )}`;


            /* =================================================
               SUCCESS RESPONSE
            ================================================= */

            return res.status(201).json({

                success: true,

                message:
                    emailSent

                        ? "Application submitted successfully. PDF generated, stored and emailed."

                        : "Application submitted successfully. PDF generated and stored.",

                applicationNumber:
                    row.application_number,

                interestAmount:
                    interest,

                totalPayable:
                    total,

                emailSent,

                pdfUrl

            });

        } catch (error) {

            console.error(
                "Application error:",
                error
            );


            /* =================================================
               ROLLBACK DATABASE
            ================================================= */

            if (row?.id) {

                await query(

                    `
                    DELETE FROM loan_applications
                    WHERE id = $1
                    `,

                    [row.id]

                ).catch(
                    (deleteError) => {

                        console.error(
                            "Unable to roll back database row:",
                            deleteError
                        );

                    }
                );

            }


            /* =================================================
               CLEAN UP SUPABASE STORAGE
            ================================================= */

            await deleteFromSupabase(
                storageFrontPath
            );

            await deleteFromSupabase(
                storageBackPath
            );

            await deleteFromSupabase(
                storageSelfiePath
            );

            await deleteFromSupabase(
                storagePdfPath
            );


            /* =================================================
               CLEAN UP LOCAL UPLOADS
            ================================================= */

            uploadedFiles.forEach(
                removeFile
            );


            /* =================================================
               CLEAN UP LOCAL PDF
            ================================================= */

            removeFile(
                pdfFile
            );


            /* =================================================
               ERROR RESPONSE
            ================================================= */

            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Unable to submit application."

            });

        }

    }

);


/* =========================================================
   DOWNLOAD APPLICATION PDF
========================================================= */

app.get(

    "/api/applications/:applicationNumber/pdf",

    async (req, res) => {

        try {

            const applicationNumber =
                String(
                    req.params.applicationNumber ||
                    ""
                ).trim();


            const token =
                String(
                    req.query.token ||
                    ""
                );


            if (
                !isValidDownloadToken(
                    applicationNumber,
                    token
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Invalid or missing PDF access token."

                });

            }


            const result =
                await query(

                    `
                    SELECT pdf_path
                    FROM loan_applications
                    WHERE application_number = $1
                    `,

                    [applicationNumber]

                );


            if (
                !result.rowCount ||
                !result.rows[0].pdf_path
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "PDF not found."

                });

            }


            const pdfPath =
                result.rows[0].pdf_path;


            if (
                !fs.existsSync(
                    pdfPath
                )
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "PDF file does not exist."

                });

            }


            return res.download(

                pdfPath,

                `${applicationNumber}.pdf`

            );

        } catch (error) {

            console.error(
                "PDF download error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve PDF."

            });

        }

    }

);


/* =========================================================
   SERVE FRONTEND
========================================================= */

app.use(
    express.static(PUBLIC)
);


app.use(
    (req, res, next) => {

        if (
            req.path.startsWith(
                "/api/"
            )
        ) {

            return next();

        }

        return res.sendFile(
            path.join(
                PUBLIC,
                "index.html"
            )
        );

    }
);


/* =========================================================
   404 API HANDLER
========================================================= */

app.use(
    "/api",
    (_req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found."

        });

    }
);


/* =========================================================
   GENERAL ERROR HANDLER
========================================================= */

app.use(
    (
        error,
        _req,
        res,
        _next
    ) => {

        console.error(
            "Server error:",
            error
        );

        if (
            res.headersSent
        ) {
            return;
        }

        res.status(500).json({

            success: false,

            message:
                "Internal server error."

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

const server =
    app.listen(
        PORT,
        () => {

            console.log("");

            console.log(
                "=============================================="
            );

            console.log(
                "   TEAM KING LOAN SERVICE"
            );

            console.log(
                "=============================================="
            );

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                `Frontend: http://localhost:${PORT}`
            );

            console.log(
                `Health:   http://localhost:${PORT}/api/health`
            );

            console.log(
                "=============================================="
            );

            console.log("");

        }
    );


server.on(
    "error",
    (error) => {

        if (
            error.code ===
            "EADDRINUSE"
        ) {

            console.error(
                `ERROR: Port ${PORT} is already in use.`
            );

            process.exit(1);

        }

        console.error(
            "Server error:",
            error
        );

    }
);


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

function shutdown(signal) {

    console.log(
        `${signal} received. Shutting down...`
    );

    server.close(
        () => {

            console.log(
                "HTTP server closed."
            );

            process.exit(0);

        }
    );

}


process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);


process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);
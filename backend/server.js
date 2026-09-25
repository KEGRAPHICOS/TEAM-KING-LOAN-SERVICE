"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE - FIXED FOR RENDER + FAILED TO FETCH
========================================================= */

require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const { query } = require("./db");
const { createApplicationPDF } = require("./pdf");
const { supabase, BUCKET } = require("./supabase");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const INTEREST_RATE = 0.20;

// FIXED: Put your real number
const WHATSAPP_NUMBER = "233540206528";

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PRIVATE = path.join(ROOT, "private_data");
const UPLOAD = path.join(PRIVATE, "uploads");
const PDF = path.join(PRIVATE, "pdf");

[UPLOAD, PDF].forEach(folder => {
    fs.mkdirSync(folder, { recursive: true });
});

const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || crypto.randomBytes(32).toString("hex");

function createDownloadToken(applicationNumber) {
    return crypto.createHmac("sha256", DOWNLOAD_SECRET).update(String(applicationNumber)).digest("hex");
}
function isValidDownloadToken(applicationNumber, token) {
    if (!token) return false;
    const expected = createDownloadToken(applicationNumber);
    return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/* =========================================================
   MIDDLEWARE - FIXED FOR FAILED TO FETCH
========================================================= */

// FIX 1: CORS allow all + preflight
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.options("*", cors());

// FIX 2: INCREASE LIMIT FROM 2mb TO 25mb
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, UPLOAD); },
    filename: function (req, file, cb) {
        const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, safeName);
    }
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 3 },
    fileFilter: function (req, file, cb) {
        if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }
});

const uploadFields = upload.fields([
    { name: "ghanaCardFront", maxCount: 1 },
    { name: "ghanaCardBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
]);

/* HEALTH CHECK - FOR RENDER */
app.get("/api/health", async function (req, res) {
    try {
        await query("SELECT 1");
        res.json({ ok: true, database: "connected" });
    } catch (error) {
        res.status(500).json({ ok: false, database: "disconnected" });
    }
});

app.get("/", function(req,res){ res.json({ ok:true, message:"TEAM KING API RUNNING" }); });

function removeTemporaryFiles(files) {
    if (!files) return;
    for (const fieldName of Object.keys(files)) {
        for (const file of files[fieldName]) {
            try { if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
        }
    }
}
function requireUploadedDocument(files, fieldName, displayName) {
    const file = files && files[fieldName] && files[fieldName][0];
    if (!file) { const error = new Error(`${displayName} is required.`); error.statusCode = 400; throw error; }
    return file;
}
async function uploadToSupabase(file, storagePath) {
    const fileBuffer = fs.readFileSync(file.path);
    const result = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, { contentType: file.mimetype, upsert: true });
    if (result.error) throw new Error(`Supabase upload failed: ${result.error.message}`);
    return storagePath;
}

app.get("/api/applications", async function (req, res) {
    try {
        const result = await query(`SELECT * FROM loan_applications WHERE LOWER(status) = 'approved' OR status IS NULL OR status = 'APPROVED' ORDER BY created_at DESC`);
        res.json({ success: true, count: result.rows.length, applications: result.rows });
    } catch (e) {
        try {
            const result = await query(`SELECT * FROM loan_applications ORDER BY created_at DESC`);
            res.json({ success: true, count: result.rows.length, applications: result.rows });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
});

app.get("/api/applications/export/approved-pdf", async function (req, res) {
    try {
        const result = await query(`SELECT * FROM loan_applications ORDER BY created_at DESC`);
        const approved = result.rows.filter(r => { const s = (r.status || r.approval_status || "approved").toString().toLowerCase(); return s === "approved"; });
        res.json({ success: true, message: "Approved only export", total: approved.length, applications: approved });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post("/api/applications", function(req,res,next){
    uploadFields(req,res,function(err){
        if(err){
            if(err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success:false, message:"Each image must not exceed 5MB" });
            return res.status(400).json({ success:false, message: err.message });
        }
        next();
    });
}, async function (req, res) {
    const files = req.files || {};
    try {
        const frontFile = requireUploadedDocument(files, "ghanaCardFront", "Ghana Card Front");
        const backFile = requireUploadedDocument(files, "ghanaCardBack", "Ghana Card Back");
        const selfieFile = requireUploadedDocument(files, "selfie", "Applicant Selfie");

        const fname = String(req.body.fname || "").trim();
        const lname = String(req.body.lname || "").trim();
        const email = String(req.body.email || "").trim();
        const mphone = String(req.body.mphone || "").trim();
        const type1 = String(req.body.type1 || "").trim();
        const loanType = String(req.body.type || "").trim();
        const amount = Number(req.body.amount);
        const gname = String(req.body.gname || "").trim();
        const gphone = String(req.body.gphone || "").trim();
        const gaddress = String(req.body.gaddress || "").trim();
        const grelationship = String(req.body.grelationship || "").trim();
        const ghanaCardNumber = String(req.body.ghanaCardNumber || "").trim().toUpperCase().replace(/\s+/g, "");
        const signatureData = String(req.body.signatureData || "").trim();
        const signatureDate = String(req.body.signatureDate || "").trim();

        if (!fname ||!lname ||!email ||!mphone ||!type1) throw Object.assign(new Error("Please complete all applicant information."), { statusCode: 400 });
        if (!loanType ||!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error("Please provide a valid loan amount and loan type."), { statusCode: 400 });
        if (!gname ||!gphone ||!gaddress ||!grelationship) throw Object.assign(new Error("Please complete all guarantor information."), { statusCode: 400 });
        if (!/^GHA-\d{9}-\d$/.test(ghanaCardNumber)) throw Object.assign(new Error("Please enter a valid Ghana Card number in the format GHA-XXXXXXXXX-X."), { statusCode: 400 });
        if (!signatureData.startsWith("data:image/png;base64,")) throw Object.assign(new Error("Applicant signature is required."), { statusCode: 400 });
        if (signatureData.length > 1000000) throw Object.assign(new Error("The signature image is too large."), { statusCode: 400 });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(signatureDate)) throw Object.assign(new Error("A valid signature date is required."), { statusCode: 400 });

        const interest = Number((amount * INTEREST_RATE).toFixed(2));
        const total = Number((amount + interest).toFixed(2));
        const applicationNumber = `TKL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

        const insertResult = await query(`INSERT INTO loan_applications (application_number, first_name, last_name, email, momo_phone, momo_network, loan_type, loan_amount, interest_rate, interest_amount, total_payable, guarantor_name, guarantor_phone, guarantor_address, guarantor_relationship, ghana_card_number, signature_data, signature_date, status, approval_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'APPROVED','APPROVED') RETURNING *`,
            [applicationNumber, fname, lname, email, mphone, type1, loanType, amount, INTEREST_RATE * 100, interest, total, gname, gphone, gaddress, grelationship, ghanaCardNumber, signatureData, signatureDate]);
        let application = insertResult.rows[0];

        const basePath = `applications/${applicationNumber}`;
        const frontPath = `${basePath}/ghana-card-front${path.extname(frontFile.originalname).toLowerCase()}`;
        const backPath = `${basePath}/ghana-card-back${path.extname(backFile.originalname).toLowerCase()}`;
        const selfiePath = `${basePath}/selfie${path.extname(selfieFile.originalname).toLowerCase()}`;

        await uploadToSupabase(frontFile, frontPath);
        await uploadToSupabase(backFile, backPath);
        await uploadToSupabase(selfieFile, selfiePath);

        const updateResult = await query(`UPDATE loan_applications SET ghana_card_front_path = $1, ghana_card_back_path = $2, selfie_path = $3 WHERE application_number = $4 RETURNING *`, [frontPath, backPath, selfiePath, applicationNumber]);
        application = updateResult.rows[0];

        const pdfPath = path.join(PDF, `${applicationNumber}.pdf`);
        await createApplicationPDF(application, pdfPath);

        const pdfStoragePath = `${basePath}/application-${applicationNumber}.pdf`;
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfUpload = await supabase.storage.from(BUCKET).upload(pdfStoragePath, pdfBuffer, { contentType: "application/pdf", upsert: true });
        if (pdfUpload.error) throw new Error(`PDF upload failed: ${pdfUpload.error.message}`);

        const finalResult = await query(`UPDATE loan_applications SET pdf_path = $1, storage_pdf_path = $2 WHERE application_number = $3 RETURNING *`, [pdfPath, pdfStoragePath, applicationNumber]);
        application = finalResult.rows[0];

        const token = createDownloadToken(applicationNumber);
        const pdfUrl = `/api/applications/${encodeURIComponent(applicationNumber)}/pdf?token=${encodeURIComponent(token)}`;

        removeTemporaryFiles(files);

        return res.status(201).json({
            success: true, message: "Application submitted successfully!",
            instruction: "IMPORTANT: Please download your Loan Application Letter below and submit it after sending your details to our WhatsApp.",
            whatsappNumber: WHATSAPP_NUMBER,
            applicationNumber, interestAmount: interest, totalPayable: total, pdfUrl
        });

    } catch (error) {
        console.error("APPLICATION SUBMISSION ERROR:", error);
        removeTemporaryFiles(files);
        const status = Number(error.statusCode) || 500;
        return res.status(status).json({ success: false, message: error.message || "Application submission failed." });
    }
});

app.get("/api/applications/:applicationNumber/pdf", async function (req, res) {
    try {
        const applicationNumber = req.params.applicationNumber;
        const token = req.query.token;
        if (!isValidDownloadToken(applicationNumber, token)) return res.status(403).json({ success: false, message: "Invalid or expired PDF download token." });
        const result = await query(`SELECT * FROM loan_applications WHERE application_number = $1 LIMIT 1`, [applicationNumber]);
        if (!result.rows.length) return res.status(404).json({ success: false, message: "Application not found." });
        const application = result.rows[0];
        if (application.pdf_path && fs.existsSync(application.pdf_path)) {
            return res.sendFile(path.resolve(application.pdf_path), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${applicationNumber}.pdf"` } });
        }
        if (application.storage_pdf_path) {
            const download = await supabase.storage.from(BUCKET).download(application.storage_pdf_path);
            if (download.error) throw new Error(download.error.message);
            const arrayBuffer = await download.data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${applicationNumber}.pdf"`);
            return res.send(buffer);
        }
        return res.status(404).json({ success: false, message: "PDF file was not found." });
    } catch (error) {
        console.error("PDF download error:", error);
        return res.status(500).json({ success: false, message: "Unable to download PDF." });
    }
});

app.use(express.static(PUBLIC));
app.use("/api", function (req, res) { res.status(404).json({ success: false, message: "API endpoint not found." }); });
app.get("*", function (req, res) {
    const indexFile = path.join(PUBLIC, "index.html");
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    return res.status(404).send("TEAM KING LOAN SERVICE frontend not found.");
});
app.use(function (error, req, res, next) {
    console.error("Unhandled server error:", error);
    if (res.headersSent) return next(error);
    res.status(Number(error.statusCode) || 500).json({ success: false, message: error.message || "Internal server error." });
});
async function ensureApplicationColumns() {
    await query(`ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS ghana_card_number TEXT, ADD COLUMN IF NOT EXISTS signature_data TEXT, ADD COLUMN IF NOT EXISTS signature_date DATE, ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'APPROVED', ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED'`);
    await query(`UPDATE loan_applications SET status = 'APPROVED', approval_status = 'APPROVED'`);
    console.log("Database schema check: all set to APPROVED only.");
}
let server;
async function startServer() {
    try { await ensureApplicationColumns(); server = app.listen(PORT, () => { console.log(`Server running on port ${PORT} - FIXED CORS + LIMIT`); }); } catch (error) { console.error("Database schema initialization failed:", error); process.exit(1); }
}
startServer();
function shutdown(signal) { console.log(`${signal} received. Shutting down...`); server.close(() => { console.log("HTTP server closed."); process.exit(0); }); }
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

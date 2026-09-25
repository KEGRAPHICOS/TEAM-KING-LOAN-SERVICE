"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE
   FIXED: SIGNATURE OVERLAP + LONG DATE
========================================================= */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 30;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

const COLORS = {
    navy: "#17395F", gold: "#F4B400", white: "#FFFFFF",
    text: "#25313D", muted: "#6B7785", lightText: "#8A96A3",
    light: "#F4F7FA", border: "#D9E1E8", green: "#198754", red: "#C0392B"
};

function value(...values) {
    for (const item of values) {
        if (item !== undefined && item !== null && String(item).trim() !== "") return String(item).trim();
    }
    return "Not provided";
}
function money(amount) {
    const number = Number(amount);
    if (!Number.isFinite(number)) return "GHS 0.00";
    return `GHS ${number.toFixed(2)}`;
}
function shortDate(dateValue) {
    if (!dateValue) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue).slice(0, 12);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateWithLiveTime(dateValue) {
    return shortDate(dateValue);
}
function signatureBuffer(signatureData) {
    if (!signatureData || typeof signatureData !== "string") return null;
    const prefix = "data:image/png;base64,";
    try {
        const b64 = signatureData.startsWith(prefix) ? signatureData.slice(prefix.length) : signatureData.split(",").pop();
        return Buffer.from(b64, "base64");
    } catch { return null; }
}
function normalizeApplication(application) {
    const rawStatus = value(application.status, application.approval_status).toLowerCase();
    if (rawStatus && rawStatus !== "approved" && rawStatus !== "not provided") return null;
    const firstName = value(application.first_name, application.firstName, application.fname);
    const lastName = value(application.last_name, application.lastName, application.lname);
    const fullName = `${firstName} ${lastName}`.replace(/\bNot provided\b/g, "").trim();
    return {
        applicationNumber: value(application.application_number, application.applicationNumber),
        createdAt: application.created_at || application.createdAt,
        fullName: fullName || "Not provided",
        email: value(application.email),
        momoPhone: value(application.momo_phone, application.mphone),
        momoNetwork: value(application.momo_network, application.type1),
        loanType: value(application.loan_type, application.type),
        loanAmount: Number(application.loan_amount ?? application.amount ?? 0),
        interestRate: Number(application.interest_rate ?? 20),
        interestAmount: Number(application.interest_amount ?? 0),
        totalPayable: Number(application.total_payable ?? 0),
        ghanaCardNumber: value(application.ghana_card_number, application.ghanaCardNumber),
        signatureData: application.signature_data || application.signatureData || "",
        signatureDate: application.signature_date || application.signatureDate || application.created_at,
        approvalStatus: "Approved", approvedAmount: Number(application.loan_amount ?? 0),
        officerName: "Mr. Kingsley Anyasu", approvalDate: application.created_at || new Date(),
        guarantorName: value(application.guarantor_name, application.gname),
        guarantorPhone: value(application.guarantor_phone, application.gphone),
        guarantorAddress: value(application.guarantor_address, application.gaddress),
        guarantorRelationship: value(application.guarantor_relationship, application.grelationship),
        hasFront: Boolean(application.ghana_card_front_path), hasBack: Boolean(application.ghana_card_back_path), hasSelfie: Boolean(application.selfie_path)
    };
}
function drawHeader(doc, application) {
    doc.rect(0, 0, PAGE_WIDTH, 68).fill(COLORS.navy);
    doc.rect(0, 64, PAGE_WIDTH, 4).fill(COLORS.gold);
    doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.white).text("TEAM KING", MARGIN, 17, { width: 220, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.gold).text("LOAN SERVICE", MARGIN, 43, { width: 180, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.white).text("LOAN APPLICATION", PAGE_WIDTH - MARGIN - 210, 20, { width: 210, align: "right", lineBreak: false });
    doc.font("Helvetica").fontSize(7.5).fillColor("#DCE7F2").text(application.applicationNumber, PAGE_WIDTH - MARGIN - 210, 43, { width: 210, align: "right", lineBreak: false });
}
function sectionTitle(doc, title, y) {
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 22, 4).fill(COLORS.light);
    doc.rect(MARGIN, y, 4, 22).fill(COLORS.gold);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.navy).text(title, MARGIN + 11, y + 7, { width: CONTENT_WIDTH - 20, lineBreak: false });
    return y + 28;
}
function field(doc, label, text, x, y, width) {
    doc.roundedRect(x, y, width, 38, 4).fillAndStroke(COLORS.white, COLORS.border);
    doc.font("Helvetica-Bold").fontSize(5.8).fillColor(COLORS.lightText).text(label.toUpperCase(), x + 8, y + 7, { width: width - 16, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(7.8).fillColor(COLORS.text).text(value(text), x + 8, y + 19, { width: width - 16, height: 12, ellipsis: true, lineBreak: false });
}

function createApplicationPDF(application, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const data = normalizeApplication(application);
            if (!data) return resolve(null);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true, info: { Title: `TEAM KING - ${data.applicationNumber}` } });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            drawHeader(doc, data);
            let y = 88;
            doc.font("Helvetica-Bold").fontSize(6).fillColor(COLORS.lightText).text("SUBMITTED", MARGIN, y, { width: 70, lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.text).text(shortDate(data.createdAt), MARGIN + 55, y - 1, { width: 350, lineBreak: false });
            y += 22;
            const gap = 8; const columnWidth = (CONTENT_WIDTH - gap) / 2;

            y = sectionTitle(doc, "APPLICANT INFORMATION", y);
            field(doc, "Full Name", data.fullName, MARGIN, y, columnWidth);
            field(doc, "Email Address", data.email, MARGIN + columnWidth + gap, y, columnWidth); y += 44;
            field(doc, "MoMo Number", data.momoPhone, MARGIN, y, columnWidth);
            field(doc, "MoMo Network", data.momoNetwork, MARGIN + columnWidth + gap, y, columnWidth); y += 44;

            y = sectionTitle(doc, "LOAN INFORMATION", y);
            field(doc, "Loan Type", data.loanType, MARGIN, y, columnWidth);
            field(doc, "Requested Amount", money(data.loanAmount), MARGIN + columnWidth + gap, y, columnWidth); y += 44;
            field(doc, "Interest Rate", `${data.interestRate}%`, MARGIN, y, columnWidth);
            field(doc, "Interest Amount", money(data.interestAmount), MARGIN + columnWidth + gap, y, columnWidth); y += 44;
            doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 36, 5).fill(COLORS.navy);
            doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#DCE7F2").text("TOTAL AMOUNT PAYABLE", MARGIN + 12, y + 9, { lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.gold).text(money(data.totalPayable), MARGIN + 190, y + 8, { width: CONTENT_WIDTH - 202, align: "right", lineBreak: false });
            y += 44;

            y = sectionTitle(doc, "GUARANTOR INFORMATION", y);
            field(doc, "Full Name", data.guarantorName, MARGIN, y, columnWidth);
            field(doc, "Phone", data.guarantorPhone, MARGIN + columnWidth + gap, y, columnWidth); y += 44;
            field(doc, "Address", data.guarantorAddress, MARGIN, y, columnWidth);
            field(doc, "Relationship", data.guarantorRelationship, MARGIN + columnWidth + gap, y, columnWidth); y += 44;

            y = sectionTitle(doc, "IDENTITY VERIFICATION - GHANA CARD", y);
            field(doc, "Ghana Card Number", data.ghanaCardNumber, MARGIN, y, CONTENT_WIDTH); y += 44;
            const dw = (CONTENT_WIDTH - 12) / 3;
            doc.roundedRect(MARGIN, y, dw, 28, 4).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(6.2).fillColor(COLORS.text).text("Ghana Card Front", MARGIN + 8, y + 9, { width: dw - 70, lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(6.2).fillColor(data.hasFront? COLORS.green : COLORS.red).text(data.hasFront? "UPLOADED" : "MISSING", MARGIN + dw - 57, y + 9, { width: 50, align: "right", lineBreak: false });
            doc.roundedRect(MARGIN + dw + 6, y, dw, 28, 4).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(6.2).fillColor(COLORS.text).text("Ghana Card Back", MARGIN + dw + 14, y + 9, { width: dw - 70, lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(6.2).fillColor(data.hasBack? COLORS.green : COLORS.red).text(data.hasBack? "UPLOADED" : "MISSING", MARGIN + dw*2 + 6 - 57, y + 9, { width: 50, align: "right", lineBreak: false });
            doc.roundedRect(MARGIN + (dw + 6)*2, y, dw, 28, 4).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(6.2).fillColor(COLORS.text).text("Selfie", MARGIN + (dw + 6)*2 + 8, y + 9, { width: dw - 70, lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(6.2).fillColor(data.hasSelfie? COLORS.green : COLORS.red).text(data.hasSelfie? "UPLOADED" : "MISSING", MARGIN + (dw + 6)*3 - 65, y + 9, { width: 50, align: "right", lineBreak: false });
            y += 36;

            // === FIXED: CLEAN SIGNATURE SECTION ===
            y = sectionTitle(doc, "APPLICANT CONFIRMATION", y);
            doc.font("Helvetica").fontSize(6.8).fillColor(COLORS.muted).text("I confirm that the information provided in this application is accurate and complete.", MARGIN, y + 1, { width: CONTENT_WIDTH, lineBreak: false });
            y += 16;

            // Draw clean white boxes for signature and date
            doc.roundedRect(MARGIN, y, columnWidth, 45, 4).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5.8).fillColor(COLORS.lightText).text("APPLICANT SIGNATURE", MARGIN + 8, y + 7, { width: columnWidth - 16, lineBreak: false });
            
            // Draw signature ONLY, no background text
            const sigBuf = signatureBuffer(data.signatureData);
            if (sigBuf) {
                try { doc.image(sigBuf, MARGIN + 10, y + 16, { fit: [columnWidth - 20, 25] }); }
                catch (e) {}
            }

            doc.roundedRect(MARGIN + columnWidth + gap, y, columnWidth, 45, 4).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5.8).fillColor(COLORS.lightText).text("DATE", MARGIN + columnWidth + gap + 8, y + 7, { width: columnWidth - 16, lineBreak: false });
            // FIXED: SHORT DATE ONLY
            doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.text).text(shortDate(data.signatureDate), MARGIN + columnWidth + gap + 8, y + 20, { width: columnWidth - 16, lineBreak: false });

            // Footer - clean, far from signature
            const footerY = PAGE_HEIGHT - 30;
            doc.moveTo(MARGIN, footerY - 10).lineTo(PAGE_WIDTH - MARGIN, footerY - 10).strokeColor(COLORS.border).lineWidth(0.5).stroke();
            doc.font("Helvetica-Bold").fontSize(6).fillColor(COLORS.navy).text("TEAM KING LOAN SERVICE", MARGIN, footerY, { width: 200, lineBreak: false });
            doc.font("Helvetica").fontSize(5.5).fillColor(COLORS.muted).text("Service To Human Is Service To Jesus", MARGIN, footerY + 8, { width: 250, lineBreak: false });
            doc.font("Helvetica").fontSize(5.5).fillColor(COLORS.muted).text("LOAN APPLICATION DOCUMENT", PAGE_WIDTH - MARGIN - 180, footerY + 3, { width: 180, align: "right", lineBreak: false });

            doc.end();
            stream.on("finish", () => resolve(outputPath));
            stream.on("error", reject);
        } catch (error) { reject(error); }
    });
}
module.exports = { createApplicationPDF };

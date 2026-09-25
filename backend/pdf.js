"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE - FINAL FIXED PDF
   - GHANA CARD NUMBER SHOWS
   - OFFICE USE SECTION RESTORED
   - SIGNATURE CLEAN
   - DATE SHORT
========================================================= */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 28;
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
    const n = Number(amount);
    if (!Number.isFinite(n)) return "GHS 0.00";
    return `GHS ${n.toFixed(2)}`;
}
function shortDate(d) {
    if (!d) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d).slice(0, 12);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function signatureBuffer(signatureData) {
    if (!signatureData || typeof signatureData !== "string") return null;
    try {
        const b64 = signatureData.includes(",") ? signatureData.split(",").pop() : signatureData;
        return Buffer.from(b64, "base64");
    } catch { return null; }
}
function normalizeApplication(application) {
    const rawStatus = value(application.status, application.approval_status).toLowerCase();
    if (rawStatus && rawStatus !== "approved" && rawStatus !== "not provided") return null;
    const firstName = value(application.first_name, application.fname);
    const lastName = value(application.last_name, application.lname);
    const fullName = `${firstName} ${lastName}`.replace(/\bNot provided\b/g, "").trim();
    return {
        applicationNumber: value(application.application_number),
        createdAt: application.created_at,
        fullName: fullName || "Not provided",
        email: value(application.email),
        momoPhone: value(application.momo_phone, application.mphone),
        momoNetwork: value(application.momo_network, application.type1),
        loanType: value(application.loan_type, application.type),
        loanAmount: Number(application.loan_amount ?? 0),
        interestRate: Number(application.interest_rate ?? 20),
        interestAmount: Number(application.interest_amount ?? 0),
        totalPayable: Number(application.total_payable ?? 0),
        ghanaCardNumber: value(application.ghana_card_number, application.ghanaCardNumber),
        signatureData: application.signature_data || "",
        signatureDate: application.signature_date || application.created_at,
        approvedAmount: Number(application.loan_amount ?? 0),
        officerName: "Mr. Kingsley Anyasu",
        approvalDate: application.created_at || new Date(),
        guarantorName: value(application.guarantor_name, application.gname),
        guarantorPhone: value(application.guarantor_phone, application.gphone),
        guarantorAddress: value(application.guarantor_address, application.gaddress),
        guarantorRelationship: value(application.guarantor_relationship, application.grelationship),
        hasFront: Boolean(application.ghana_card_front_path),
        hasBack: Boolean(application.ghana_card_back_path),
        hasSelfie: Boolean(application.selfie_path)
    };
}
function drawHeader(doc, application) {
    doc.rect(0, 0, PAGE_WIDTH, 62).fill(COLORS.navy);
    doc.rect(0, 58, PAGE_WIDTH, 4).fill(COLORS.gold);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.white).text("TEAM KING", MARGIN, 14, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.gold).text("LOAN SERVICE", MARGIN, 36, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.white).text("LOAN APPLICATION", PAGE_WIDTH - MARGIN - 200, 18, { width: 200, align: "right", lineBreak: false });
    doc.font("Helvetica").fontSize(7).fillColor("#DCE7F2").text(application.applicationNumber, PAGE_WIDTH - MARGIN - 200, 38, { width: 200, align: "right", lineBreak: false });
}
function sectionTitle(doc, title, y) {
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 18, 3).fill(COLORS.light);
    doc.rect(MARGIN, y, 3, 18).fill(COLORS.gold);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.navy).text(title, MARGIN + 10, y + 5, { lineBreak: false });
    return y + 22;
}
function field(doc, label, text, x, y, width) {
    const h = 32;
    doc.roundedRect(x, y, width, h, 3).fillAndStroke(COLORS.white, COLORS.border);
    doc.font("Helvetica-Bold").fontSize(5).fillColor(COLORS.lightText).text(label.toUpperCase(), x + 6, y + 5, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.text).text(value(text), x + 6, y + 15, { width: width - 12, height: 10, ellipsis: true, lineBreak: false });
    return h;
}

function createApplicationPDF(application, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const data = normalizeApplication(application);
            if (!data) return resolve(null);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `TEAM KING - ${data.applicationNumber}` } });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            drawHeader(doc, data);
            let y = 78;
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(COLORS.lightText).text("SUBMITTED", MARGIN, y);
            doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.text).text(shortDate(data.createdAt), MARGIN + 45, y - 1);
            y += 16;

            const gap = 6; const col = (CONTENT_WIDTH - gap) / 2;

            y = sectionTitle(doc, "APPLICANT INFORMATION", y);
            field(doc, "Full Name", data.fullName, MARGIN, y, col);
            field(doc, "Email Address", data.email, MARGIN + col + gap, y, col); y += 36;
            field(doc, "MoMo Number", data.momoPhone, MARGIN, y, col);
            field(doc, "MoMo Network", data.momoNetwork, MARGIN + col + gap, y, col); y += 36;

            y = sectionTitle(doc, "LOAN INFORMATION", y);
            field(doc, "Loan Type", data.loanType, MARGIN, y, col);
            field(doc, "Requested Amount", money(data.loanAmount), MARGIN + col + gap, y, col); y += 36;
            field(doc, "Interest Rate", `${data.interestRate}%`, MARGIN, y, col);
            field(doc, "Interest Amount", money(data.interestAmount), MARGIN + col + gap, y, col); y += 36;
            doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 4).fill(COLORS.navy);
            doc.font("Helvetica-Bold").fontSize(6).fillColor("#DCE7F2").text("TOTAL AMOUNT PAYABLE", MARGIN + 10, y + 8);
            doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.gold).text(money(data.totalPayable), MARGIN + 150, y + 6, { width: CONTENT_WIDTH - 160, align: "right" });
            y += 36;

            y = sectionTitle(doc, "GUARANTOR INFORMATION", y);
            field(doc, "Full Name", data.guarantorName, MARGIN, y, col);
            field(doc, "Phone", data.guarantorPhone, MARGIN + col + gap, y, col); y += 36;
            field(doc, "Address", data.guarantorAddress, MARGIN, y, col);
            field(doc, "Relationship", data.guarantorRelationship, MARGIN + col + gap, y, col); y += 36;

            y = sectionTitle(doc, "IDENTITY VERIFICATION - GHANA CARD", y);
            field(doc, "Ghana Card Number", data.ghanaCardNumber, MARGIN, y, CONTENT_WIDTH); y += 36;
            const dw = (CONTENT_WIDTH - 12) / 3;
            doc.roundedRect(MARGIN, y, dw, 22, 3).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(COLORS.text).text("Ghana Card Front", MARGIN + 6, y + 7);
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(data.hasFront? COLORS.green : COLORS.red).text(data.hasFront? "UPLOADED" : "MISSING", MARGIN + dw - 45, y + 7, { width: 40, align: "right" });
            doc.roundedRect(MARGIN + dw + 6, y, dw, 22, 3).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(COLORS.text).text("Ghana Card Back", MARGIN + dw + 12, y + 7);
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(data.hasBack? COLORS.green : COLORS.red).text(data.hasBack? "UPLOADED" : "MISSING", MARGIN + dw*2 + 6 - 45, y + 7, { width: 40, align: "right" });
            doc.roundedRect(MARGIN + (dw + 6)*2, y, dw, 22, 3).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(COLORS.text).text("Selfie", MARGIN + (dw + 6)*2 + 6, y + 7);
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(data.hasSelfie? COLORS.green : COLORS.red).text(data.hasSelfie? "UPLOADED" : "MISSING", MARGIN + (dw + 6)*3 - 51, y + 7, { width: 40, align: "right" });
            y += 28;

            // RESTORED OFFICE USE SECTION
            y = sectionTitle(doc, "OFFICE USE ONLY / APPROVAL", y);
            field(doc, "Status", "Approved", MARGIN, y, col);
            field(doc, "Approved Amount", money(data.approvedAmount), MARGIN + col + gap, y, col); y += 36;
            field(doc, "Officer Name", data.officerName, MARGIN, y, col);
            field(doc, "Approval Date", shortDate(data.approvalDate), MARGIN + col + gap, y, col); y += 36;

            y = sectionTitle(doc, "APPLICANT CONFIRMATION", y);
            doc.font("Helvetica").fontSize(6).fillColor(COLORS.muted).text("I confirm that the information provided in this application is accurate and complete.", MARGIN, y);
            y += 12;
            doc.roundedRect(MARGIN, y, col, 40, 3).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5).fillColor(COLORS.lightText).text("APPLICANT SIGNATURE", MARGIN + 6, y + 5);
            const sigBuf = signatureBuffer(data.signatureData);
            if (sigBuf) { try { doc.image(sigBuf, MARGIN + 8, y + 13, { fit: [col - 16, 22] }); } catch(e){} }

            doc.roundedRect(MARGIN + col + gap, y, col, 40, 3).fillAndStroke(COLORS.white, COLORS.border);
            doc.font("Helvetica-Bold").fontSize(5).fillColor(COLORS.lightText).text("DATE", MARGIN + col + gap + 6, y + 5);
            doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.text).text(shortDate(data.signatureDate), MARGIN + col + gap + 6, y + 16);

            const footerY = PAGE_HEIGHT - 26;
            doc.moveTo(MARGIN, footerY - 8).lineTo(PAGE_WIDTH - MARGIN, footerY - 8).strokeColor(COLORS.border).lineWidth(0.5).stroke();
            doc.font("Helvetica-Bold").fontSize(5.5).fillColor(COLORS.navy).text("TEAM KING LOAN SERVICE", MARGIN, footerY);
            doc.font("Helvetica").fontSize(5).fillColor(COLORS.muted).text("Service To Human Is Service To Jesus", MARGIN, footerY + 7);
            doc.font("Helvetica").fontSize(5).fillColor(COLORS.muted).text("LOAN APPLICATION DOCUMENT", PAGE_WIDTH - MARGIN - 150, footerY + 2, { width: 150, align: "right" });

            doc.end();
            stream.on("finish", () => resolve(outputPath));
            stream.on("error", reject);
        } catch (error) { reject(error); }
    });
}
module.exports = { createApplicationPDF };

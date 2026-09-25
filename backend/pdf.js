"use strict";

/* =========================================================
   TEAM KING LOAN SERVICE
   ONE-PAGE PROFESSIONAL PDF GENERATOR - FIXED
   FIXED: GHANA CARD NUMBER NOW SHOWS ON PDF
========================================================= */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 30;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

const COLORS = {
    navy: "#17395F",
    navyDark: "#102B49",
    gold: "#F4B400",
    white: "#FFFFFF",
    text: "#25313D",
    muted: "#6B7785",
    lightText: "#8A96A3",
    light: "#F4F7FA",
    border: "#D9E1E8",
    green: "#198754",
    red: "#C0392B"
};

function value(...values) {
    for (const item of values) {
        if (item !== undefined && item !== null && String(item).trim() !== "") {
            return String(item).trim();
        }
    }
    return "Not provided";
}
function money(amount) {
    const number = Number(amount);
    if (!Number.isFinite(number)) return "GHS 0.00";
    return `GHS ${number.toFixed(2)}`;
}
function formatDateWithLiveTime(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toString();
}
function signatureBuffer(signatureData) {
    if (!signatureData || typeof signatureData !== "string") return null;
    const prefix = "data:image/png;base64,";
    if (!signatureData.startsWith(prefix)) {
        try {
            if (signatureData.length > 100) {
                return Buffer.from(signatureData.split(",").pop(), "base64");
            }
            return null;
        } catch { return null; }
    }
    try { return Buffer.from(signatureData.slice(prefix.length), "base64"); }
    catch (error) { return null; }
}

function normalizeApplication(application) {
    const rawStatus = value(application.status, application.approval_status, application.approvalStatus, application.application_status).toLowerCase();
    if (rawStatus && rawStatus !== "approved" && rawStatus !== "not provided") return null;

    const firstName = value(application.first_name, application.firstName, application.fname);
    const lastName = value(application.last_name, application.lastName, application.lname);
    const fullName = `${firstName} ${lastName}`.replace(/\bNot provided\b/g, "").trim();
    const momoPhone = value(application.momo_phone, application.momoPhone, application.momo_number, application.mphone);
    const momoNetwork = value(application.momo_network, application.momoNetwork, application.type1);
    const loanType = value(application.loan_type, application.loanType, application.type);
    const loanAmount = Number(application.loan_amount ?? application.loanAmount ?? application.amount ?? 0);
    const interestRate = Number(application.interest_rate ?? application.interestRate ?? 20);
    const interestAmount = Number(application.interest_amount ?? application.interestAmount ?? (loanAmount * interestRate / 100));
    const totalPayable = Number(application.total_payable ?? application.totalPayable ?? (loanAmount + interestAmount));
    const ghanaCardNumber = value(application.ghana_card_number, application.ghanaCardNumber, application.ghana_card_no, application.ghanaCardNo);
    const signatureData = application.signature_data || application.signatureData || "";
    const signatureDate = application.signature_date || application.signatureDate || application.created_at || application.createdAt;

    return {
        applicationNumber: value(application.application_number, application.applicationNumber),
        createdAt: application.created_at || application.createdAt || application.submitted_at,
        firstName, lastName, fullName: fullName || "Not provided",
        email: value(application.email), momoPhone, momoNetwork, loanType, loanAmount, interestRate, interestAmount, totalPayable,
        ghanaCardNumber, signatureData, signatureDate,
        approvalStatus: "Approved", approvedAmount: loanAmount, officerName: "Mr. Kingsley Anyasu",
        approvalDate: application.created_at || application.createdAt || new Date(),
        guarantorName: value(application.guarantor_name, application.guarantorName, application.gname),
        guarantorPhone: value(application.guarantor_phone, application.guarantorPhone, application.gphone),
        guarantorAddress: value(application.guarantor_address, application.guarantorAddress, application.gaddress),
        guarantorRelationship: value(application.guarantor_relationship, application.guarantorRelationship, application.grelationship),
        hasFront: Boolean(application.ghana_card_front_path),
        hasBack: Boolean(application.ghana_card_back_path),
        hasSelfie: Boolean(application.selfie_path)
    };
}

function drawHeader(doc, application) {
    const headerHeight = 60;
    doc.rect(0, 0, PAGE_WIDTH, headerHeight).fill(COLORS.navy);
    doc.rect(0, headerHeight - 4, PAGE_WIDTH, 4).fill(COLORS.gold);
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
    const height = 35;
    doc.roundedRect(x, y, width, height, 4).fillAndStroke(COLORS.white, COLORS.border);
    doc.font("Helvetica-Bold").fontSize(5.8).fillColor(COLORS.lightText).text(label.toUpperCase(), x + 8, y + 7, { width: width - 16, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(7.8).fillColor(COLORS.text).text(value(text), x + 8, y + 19, { width: width - 16, height: 12, ellipsis: true, lineBreak: false });
}
function fieldNoPlaceholder(doc, label, x, y, width) {
    const height = 35;
    doc.roundedRect(x, y, width, height, 4).fillAndStroke(COLORS.white, COLORS.border);
    doc.font("Helvetica-Bold").fontSize(5.8).fillColor(COLORS.lightText).text(label.toUpperCase(), x + 8, y + 7, { width: width - 16, lineBreak: false });
}
function documentStatus(doc, label, uploaded, x, y, width) {
    const height = 25;
    doc.roundedRect(x, y, width, height, 4).fillAndStroke(COLORS.white, COLORS.border);
    doc.font("Helvetica-Bold").fontSize(6.2).fillColor(COLORS.text).text(label, x + 8, y + 9, { width: width - 70, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(6.2).fillColor(uploaded? COLORS.green : COLORS.red).text(uploaded? "UPLOADED" : "NOT UPLOADED", x + width - 65, y + 9, { width: 57, align: "right", lineBreak: false });
}

function createApplicationPDF(application, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const data = normalizeApplication(application);
            if (!data) { console.log("Skipped non-approved application"); return resolve(null); }
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            const doc = new PDFDocument({
                size: "A4", margin: 0, autoFirstPage: true, bufferPages: true,
                info: { Title: `TEAM KING LOAN SERVICE - ${data.applicationNumber}`, Author: "TEAM KING LOAN SERVICE", Subject: "Loan Application" }
            });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            stream.on("error", reject);
            doc.on("error", reject);

            drawHeader(doc, data);
            let y = 95;
            doc.font("Helvetica-Bold").fontSize(6).fillColor(COLORS.lightText).text("SUBMITTED", MARGIN, y, { width: 70, lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.text).text(formatDateWithLiveTime(data.createdAt), MARGIN + 55, y - 1, { width: 350, lineBreak: false });
            y += 24;
            y = sectionTitle(doc, "APPLICANT INFORMATION", y);
            const gap = 6;
            const columnWidth = (CONTENT_WIDTH - gap) / 2;
            field(doc, "Full Name", data.fullName, MARGIN, y, columnWidth);
            field(doc, "Email Address", data.email, MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            field(doc, "MoMo Number", data.momoPhone, MARGIN, y, columnWidth);
            field(doc, "MoMo Network", data.momoNetwork, MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            y = sectionTitle(doc, "LOAN INFORMATION", y);
            field(doc, "Loan Type", data.loanType, MARGIN, y, columnWidth);
            field(doc, "Requested Amount", money(data.loanAmount), MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            field(doc, "Interest Rate", `${data.interestRate}%`, MARGIN, y, columnWidth);
            field(doc, "Interest Amount", money(data.interestAmount), MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 39, 5).fill(COLORS.navy);
            doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#DCE7F2").text("TOTAL AMOUNT PAYABLE", MARGIN + 12, y + 9, { lineBreak: false });
            doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.gold).text(money(data.totalPayable), MARGIN + 190, y + 8, { width: CONTENT_WIDTH - 202, align: "right", lineBreak: false });
            y += 49;
            y = sectionTitle(doc, "GUARANTOR INFORMATION", y);
            field(doc, "Full Name", data.guarantorName, MARGIN, y, columnWidth);
            field(doc, "Phone", data.guarantorPhone, MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            field(doc, "Address", data.guarantorAddress, MARGIN, y, columnWidth);
            field(doc, "Relationship", data.guarantorRelationship, MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;

            // FIXED SECTION - GHANA CARD NUMBER ADDED
            y = sectionTitle(doc, "IDENTITY VERIFICATION - GHANA CARD", y);
            
            // THIS IS THE FIX - NOW SHOWS GHANA CARD NUMBER BIG
            field(doc, "Ghana Card Number", data.ghanaCardNumber, MARGIN, y, CONTENT_WIDTH);
            y += 44;

            const documentGap = 6;
            const documentWidth = (CONTENT_WIDTH - (documentGap * 2)) / 3;
            documentStatus(doc, "Ghana Card Front", data.hasFront, MARGIN, y, documentWidth);
            documentStatus(doc, "Ghana Card Back", data.hasBack, MARGIN + documentWidth + documentGap, y, documentWidth);
            documentStatus(doc, "Applicant Selfie", data.hasSelfie, MARGIN + ((documentWidth + documentGap) * 2), y, documentWidth);
            y += 38;

            y = sectionTitle(doc, "OFFICE USE ONLY / APPROVAL", y);
            field(doc, "Status", "Approved", MARGIN, y, columnWidth);
            field(doc, "Approved Amount", money(data.approvedAmount), MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            field(doc, "Officer Name", data.officerName, MARGIN, y, columnWidth);
            field(doc, "Approval Date", formatDateWithLiveTime(data.approvalDate), MARGIN + columnWidth + gap, y, columnWidth);
            y += 44;
            y = sectionTitle(doc, "APPLICANT CONFIRMATION", y);
            doc.font("Helvetica").fontSize(6.8).fillColor(COLORS.muted).text("I confirm that the information provided in this application is accurate and complete.", MARGIN, y + 1, { width: CONTENT_WIDTH, lineBreak: false });
            y += 19;
            fieldNoPlaceholder(doc, "Applicant Signature", MARGIN, y, columnWidth);
            const signatureImage = signatureBuffer(data.signatureData);
            if (signatureImage) {
                try { doc.image(signatureImage, MARGIN + 8, y + 16, { fit: [columnWidth - 16, 26] }); }
                catch (e) { console.warn("Unable to render signature:", e.message); }
            } else {
                doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted).text("Not Provided", MARGIN + 8, y + 19, { width: columnWidth - 16, lineBreak: false });
            }
            field(doc, "Date", formatDateWithLiveTime(data.signatureDate || data.createdAt), MARGIN + columnWidth + gap, y, columnWidth);

            const footerY = PAGE_HEIGHT - 45;
            doc.moveTo(MARGIN, footerY).lineTo(PAGE_WIDTH - MARGIN, footerY).strokeColor(COLORS.border).lineWidth(0.7).stroke();
            doc.font("Helvetica").fontSize(5)fillColor(COLORS.muted).text("Service To Human Is Service To Jesus", MARGIN, footerY + 20, { width: 250, lineBreak: false });
            doc.font("Helvetica").fontSize(5).fillColor(COLORS.muted).text("LOAN APPLICATION DOCUMENT • PAGE 1 OF 1", PAGE_WIDTH - MARGIN - 190, footerY + 14, { width: 190, align: "right", lineBreak: false });
            doc.end();
            stream.on("finish", () => resolve(outputPath));
        } catch (error) {
            console.error("PDF generation failed:", error);
            reject(error);
        }
    });
}
module.exports = { createApplicationPDF };

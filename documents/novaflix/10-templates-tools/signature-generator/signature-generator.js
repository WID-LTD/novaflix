const SIGNING_AUTHORITY = {
  founder: {
    fullName: "Chukwu Akachukwu Success",
    shortName: "Success",
    title: "Founder & Chief Executive Officer, NovaFlix",
    email: "chukwusuccess247@gmail.com",
    signatureFont: "Great Vibes",
    fallbackFont: "Brush Script MT",
    color: "#E50914",
    initials: "CAS",
    signingCapacity: "Individual Capacity & Authorized Signatory for WID Ltd"
  },

  parentCompany: {
    legalName: "WID Ltd",
    rcNumber: "RC 8824091",
    incorporated: "2024",
    jurisdiction: "Federal Republic of Nigeria",
    registeredAddress: "Lagos, Nigeria",
    ceo: "Ike Wisdom",
    motto: "Motivation Drives Innovation",
    website: "https://xperiencestore.store",
    linkedin: "https://linkedin.com/company/wid-ltd",
    instagram: "https://instagram.com/widltd",
    businessLines: [
      "Xperiencestore (E-commerce & Retail)",
      "First Lady Fashion Hub (Fashion Retail)",
      "WID Force (Tech Hub & R&D)",
      "Xperience TV (Media & Streaming)",
      "NovaFlix (Streaming Platform - Subsidiary)",
      "GiGoAI (AI/ML Solutions - VTON, 3D, Chatbots)"
    ],
    corporateSeal: true,
    sealDescription: "WID Ltd Corporate Seal - RC 8824091"
  },

  subsidiary: {
    legalName: "NovaFlix",
    tradingName: "NovaFlix",
    parentCompany: "WID Ltd (RC 8824091)",
    relationship: "Wholly-owned subsidiary",
    authorizedBy: "Board Resolution WID/2024/001",
    business: "Video streaming platform, creator economy, content marketplace"
  },

  watermark: {
    imagePath: "../../../../client/public/combination-mark-logo.png",
    fallbackImage: "../../../../client/public/nova-logo.png",
    opacity: 0.06,
    angle: -35,
    scale: 0.25,
    repeat: true,
    spacing: { x: 300, y: 300 },
    textFallback: {
      text: "NovaFlix \u00b7 WID Ltd",
      fontSize: 48,
      color: "#E50914",
      opacity: 0.04,
      fontFamily: "Inter, sans-serif",
      letterSpacing: "0.1em"
    }
  },

  documentClasses: {
    classA: {
      name: "Foundational Corporate Documents",
      requires: ["founder_signature", "parent_company_attestation", "corporate_seal"],
      documents: [
        "certificate-of-incorporation",
        "memorandum-of-association",
        "articles-of-association",
        "shareholder-agreement",
        "board-charter",
        "cap-table",
        "cac-registration-rc",
        "wid-ltd-parent-company-affidavit",
        "novaflix-subsidiary-resolution"
      ]
    },
    classB: {
      name: "Operational Agreements & Policies",
      requires: ["founder_signature", "parent_company_attestation"],
      documents: [
        "creator-platform-agreement",
        "terms-of-service",
        "privacy-policy",
        "payment-gateway-agreements",
        "employment-contracts",
        "vendor-agreements",
        "content-license-agreement",
        "dmca-compliance-policy",
        "creator-code-of-conduct",
        "acceptable-use-policy",
        "community-guidelines"
      ]
    },
    classC: {
      name: "Internal Procedures & Technical Docs",
      requires: ["founder_signature"],
      documents: [
        "technical-architecture",
        "product-specs",
        "operational-checklists",
        "runbooks",
        "system-architecture",
        "database-schema",
        "api-design"
      ]
    },
    classD: {
      name: "Generated Reports & Analytics",
      requires: ["watermark_only"],
      documents: [
        "financial-projections",
        "marketing-reports",
        "analytics-dashboards",
        "cohort-analysis"
      ]
    }
  }
};

class DocumentSigner {
  constructor(config = SIGNING_AUTHORITY) {
    this.config = config;
  }

  generateFounderBlock(documentType, documentClass = 'classB', date = new Date()) {
    const founder = this.config.founder;
    const parent = this.config.parentCompany;
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toLocaleTimeString('en-NG', { hour12: false, timeZone: 'Africa/Lagos' });

    return {
      visual: {
        name: founder.fullName,
        shortName: founder.shortName,
        title: founder.title,
        initials: founder.initials,
        color: founder.color,
        font: founder.signatureFont,
        date: dateStr,
        time: timeStr,
        location: "Lagos, Nigeria"
      },
      metadata: {
        signedBy: founder.fullName,
        title: founder.title,
        email: founder.email,
        signingCapacity: founder.signingCapacity,
        documentType,
        documentClass,
        parentCompany: parent.legalName,
        parentCompanyRC: parent.rcNumber,
        timestamp: date.toISOString(),
        timezone: "Africa/Lagos",
        jurisdiction: parent.jurisdiction
      },
      attestation: `I, ${founder.fullName}, in my capacity as ${founder.title} \nand as Authorized Signatory for ${parent.legalName} (${parent.rcNumber}), \nhereby execute this ${documentType} on behalf of NovaFlix, a wholly-owned \nsubsidiary of ${parent.legalName}.`
    };
  }

  generateParentAttestation(documentType, date = new Date()) {
    const parent = this.config.parentCompany;
    const founder = this.config.founder;
    const dateStr = date.toISOString().split('T')[0];

    return {
      visual: {
        company: parent.legalName,
        rcNumber: parent.rcNumber,
        ceo: parent.ceo,
        motto: parent.motto,
        website: parent.website,
        authorizedBy: founder.fullName,
        authorizedTitle: founder.title,
        date: dateStr,
        corporateSeal: parent.corporateSeal
      },
      metadata: {
        company: parent.legalName,
        rcNumber: parent.rcNumber,
        jurisdiction: parent.jurisdiction,
        registeredAddress: parent.registeredAddress,
        ceo: parent.ceo,
        authorizedSignatory: founder.fullName,
        signatoryTitle: founder.title,
        documentType,
        timestamp: date.toISOString(),
        attestationClause: `This document is authorized by ${parent.legalName} (${parent.rcNumber}), \nincorporated under the laws of the ${parent.jurisdiction}, as the parent company \nand sole shareholder of NovaFlix. The undersigned, ${founder.fullName} \n(${founder.title}), is duly authorized to execute this document on behalf of \nboth NovaFlix and ${parent.legalName}.`
      }
    };
  }

  getDocumentClass(filePath) {
    const fileName = filePath.toLowerCase();
    for (const [classKey, classConfig] of Object.entries(this.config.documentClasses)) {
      if (classConfig.documents.some(doc => fileName.includes(doc.toLowerCase()))) {
        return classKey;
      }
    }
    return 'classC';
  }

  async applyToPDF(pdfBytes, filePath) {
    const PDFDocument = require('pdf-lib').PDFDocument;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const { founder, parentCompany, watermark, documentClasses } = this.config;

    const docClass = this.getDocumentClass(filePath);
    const classConfig = documentClasses[docClass];
    const isLastPage = (page) => page === pages[pages.length - 1];

    let signatureFont;
    try {
      const fontResp = await fetch('https://fonts.gstatic.com/s/greatvibes/v12/9oRONYsxYB9wG2lH.woff2');
      const fontBytes = await fontResp.arrayBuffer();
      signatureFont = await pdfDoc.embedFont(fontBytes);
    } catch {
      signatureFont = await pdfDoc.embedFont(PDFDocument.fonts.Helvetica);
    }

    let watermarkImage;
    const fs = require('fs');
    const path = require('path');
    const watermarkPath = path.resolve(__dirname, watermark.imagePath);
    if (fs.existsSync(watermarkPath)) {
      const imgBytes = fs.readFileSync(watermarkPath);
      watermarkImage = await pdfDoc.embedPng(imgBytes);
    }

    const helveticaBold = await pdfDoc.embedFont(PDFDocument.fonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(PDFDocument.fonts.Helvetica);

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (watermarkImage) {
        if (watermark.repeat) {
          const cols = Math.ceil(width / watermark.spacing.x) + 1;
          const rows = Math.ceil(height / watermark.spacing.y) + 1;
          for (let c = -1; c < cols; c++) {
            for (let r = -1; r < rows; r++) {
              page.drawImage(watermarkImage, {
                x: c * watermark.spacing.x,
                y: r * watermark.spacing.y,
                width: watermarkImage.width * watermark.scale,
                height: watermarkImage.height * watermark.scale,
                opacity: watermark.opacity,
                rotate: { angle: watermark.angle, type: 'degrees' }
              });
            }
          }
        } else {
          page.drawImage(watermarkImage, {
            x: (width - watermarkImage.width * watermark.scale) / 2,
            y: (height - watermarkImage.height * watermark.scale) / 2,
            width: watermarkImage.width * watermark.scale,
            height: watermarkImage.height * watermark.scale,
            opacity: watermark.opacity,
            rotate: { angle: watermark.angle, type: 'degrees' }
          });
        }
      } else if (watermark.textFallback) {
        const tf = watermark.textFallback;
        const cols = Math.ceil(width / 400);
        const rows = Math.ceil(height / 200);
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            page.drawText(tf.text, {
              x: c * 400 - 100,
              y: r * 200 - 50,
              size: tf.fontSize,
              color: this.hexToRgb(tf.color),
              opacity: tf.opacity,
              rotate: { angle: -35, type: 'degrees' },
              font: helveticaBold
            });
          }
        }
      }

      if (isLastPage(page)) {
        const yStart = 120;
        let y = yStart;

        if (classConfig.requires.includes('founder_signature')) {
          const sig = this.generateFounderBlock(
            filePath.split('/').pop().replace('.md', ''),
            docClass
          );

          page.drawLine({
            start: { x: 72, y: y + 55 },
            end: { x: 300, y: y + 55 },
            thickness: 1,
            color: this.hexToRgb(founder.color)
          });

          page.drawText(sig.visual.shortName, {
            x: 72,
            y: y + 35,
            size: 36,
            font: signatureFont,
            color: this.hexToRgb(founder.color)
          });

          page.drawText(sig.visual.name, {
            x: 72,
            y: y + 10,
            size: 11,
            color: this.hexToRgb('#333333')
          });

          page.drawText(sig.visual.title, {
            x: 72,
            y: y - 5,
            size: 9,
            color: this.hexToRgb('#666666')
          });

          page.drawText(`Date: ${sig.visual.date}  Time: ${sig.visual.time} WAT`, {
            x: 72,
            y: y - 20,
            size: 8,
            color: this.hexToRgb('#888888')
          });

          page.drawText(`Location: ${sig.visual.location}`, {
            x: 72,
            y: y - 32,
            size: 8,
            color: this.hexToRgb('#888888')
          });

          y -= 60;
        }

        if (classConfig.requires.includes('parent_company_attestation')) {
          const attest = this.generateParentAttestation(
            filePath.split('/').pop().replace('.md', '')
          );

          page.drawLine({
            start: { x: 72, y: y + 10 },
            end: { x: 520, y: y + 10 },
            thickness: 0.5,
            color: this.hexToRgb('#CCCCCC')
          });

          page.drawText("ATTESTED BY PARENT COMPANY", {
            x: 72,
            y: y - 5,
            size: 10,
            color: this.hexToRgb(founder.color),
            font: helveticaBold
          });

          page.drawText(`${attest.visual.company}  \u2022  ${attest.visual.rcNumber}`, {
            x: 72,
            y: y - 20,
            size: 9,
            color: this.hexToRgb('#333333')
          });

          page.drawText(`${attest.visual.motto}`, {
            x: 72,
            y: y - 32,
            size: 8,
            color: this.hexToRgb('#E50914')
          });

          page.drawText(`Authorized by: ${attest.visual.authorizedBy} (${attest.visual.authorizedTitle})`, {
            x: 72,
            y: y - 44,
            size: 8,
            color: this.hexToRgb('#555555')
          });

          page.drawText(`Date: ${attest.visual.date}`, {
            x: 72,
            y: y - 56,
            size: 8,
            color: this.hexToRgb('#888888')
          });

          if (attest.visual.corporateSeal && classConfig.requires.includes('corporate_seal')) {
            page.drawText("\uD83D\uDD34  CORPORATE SEAL AFFIXED", {
              x: 380,
              y: y - 10,
              size: 8,
              color: this.hexToRgb('#E50914')
            });
          }

          y -= 80;
        }

        page.drawLine({
          start: { x: 72, y: 40 },
          end: { x: width - 72, y: 40 },
          thickness: 0.5,
          color: this.hexToRgb('#DDDDDD')
        });

        page.drawText(`NovaFlix \u2022 WID Ltd (RC 8824091) \u2022 ${new Date().getFullYear()} \u2022 Confidential`, {
          x: 72,
          y: 28,
          size: 7,
          color: this.hexToRgb('#999999')
        });

        page.drawText(`Doc ID: ${this.generateDocId(filePath)}`, {
          x: width - 200,
          y: 28,
          size: 7,
          color: this.hexToRgb('#999999')
        });
      }
    }

    return await pdfDoc.save();
  }

  generateDocId(filePath) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(filePath).digest('hex').slice(0, 12).toUpperCase();
    return `NFX-${hash}`;
  }

  hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
}

module.exports = { DocumentSigner, SIGNING_AUTHORITY };
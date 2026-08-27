/**
 * Local PDF generator for resumes — used as a fallback when the backend
 * is unreachable. Mirrors the visual structure of the server-side
 * resumePdfService.js (ATS templates, contact rows, bullets, sections).
 *
 * Uses pdf-lib (pure JS, no native deps, works in Expo / React Native)
 * and the StandardFonts (Helvetica family) so there are no extra font
 * assets to bundle.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib';

// ---------- helpers ----------

function hexToColor(hex) {
  if (typeof hex !== 'string' || !hex) return rgb(0, 0, 0);
  const cleaned = hex.replace('#', '').trim();
  if (!/^([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(cleaned)) {
    return rgb(0, 0, 0);
  }
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function safeText(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// pdf-lib does not provide auto-wrap. Naive greedy word-wrap by character
// count, using the Helvetica metrics approximation provided by widthOfText.
function wrapText(text, font, fontSize, maxWidth) {
  const raw = safeText(text);
  if (!raw) return [];
  const paragraphs = raw.split(/\r?\n/);
  const lines = [];

  paragraphs.forEach((paragraph) => {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push('');
      return;
    }
    const words = trimmed.split(/\s+/);
    let current = '';

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        current = candidate;
      } else if (current) {
        lines.push(current);
        current = word;
      } else {
        // single word longer than line — hard break by characters
        let chunk = '';
        for (const ch of word) {
          if (
            font.widthOfTextAtSize(chunk + ch, fontSize) <= maxWidth ||
            !chunk
          ) {
            chunk += ch;
          } else {
            lines.push(chunk);
            chunk = ch;
          }
        }
        if (chunk) current = chunk;
      }
    });

    if (current) lines.push(current);
  });

  return lines;
}

// ---------- templates ----------

const COLOR_PALETTE = {
  ink: '#292929',
  body: '#414141',
  muted: '#727272',
  blue: '#3567F0',
  chip: '#EEF3FF',
  rule: '#292929',
  lightRule: '#C8C8C8',
};

const TEMPLATES = {
  'ats-classic': {
    ...COLOR_PALETTE,
    id: 'ats-classic',
    headingStyle: 'classic',
    headerStyle: 'left',
  },
  'corporate-professional': {
    ...COLOR_PALETTE,
    id: 'corporate-professional',
    ink: '#182433',
    body: '#263442',
    muted: '#617080',
    blue: '#17365D',
    chip: '#EAF0F7',
    rule: '#17365D',
    lightRule: '#B7C4D0',
    headingStyle: 'band',
    headerStyle: 'center',
  },
  'european-standard': {
    ...COLOR_PALETTE,
    id: 'european-standard',
    ink: '#18354A',
    body: '#304A5D',
    muted: '#687F8E',
    blue: '#005B96',
    chip: '#E8F3F9',
    rule: '#005B96',
    lightRule: '#B5D1E1',
    headingStyle: 'european',
    headerStyle: 'european',
  },
  'technical-compact': {
    ...COLOR_PALETTE,
    id: 'technical-compact',
    ink: '#193B38',
    body: '#2E4946',
    muted: '#687C79',
    blue: '#0F766E',
    chip: '#E5F4F1',
    rule: '#0F766E',
    lightRule: '#B5D8D3',
    headingStyle: 'technical',
    headerStyle: 'technical',
  },
  'eu-academic': {
    ...COLOR_PALETTE,
    id: 'eu-academic',
    ink: '#1A2A4F',
    body: '#2C3E50',
    muted: '#7B8794',
    blue: '#1A2A4F',
    chip: '#E8EEF7',
    rule: '#1A2A4F',
    lightRule: '#C5CFDD',
    headingStyle: 'academic',
    headerStyle: 'academic',
  },
  'academic-photo': {
    ...COLOR_PALETTE,
    id: 'academic-photo',
    ink: '#1A2A4F',
    body: '#2C3E50',
    muted: '#7B8794',
    blue: '#1A2A4F',
    chip: '#E8EEF7',
    rule: '#1A2A4F',
    lightRule: '#C5CFDD',
    headingStyle: 'academic',
    headerStyle: 'academic-photo',
  },
};

function getTheme(templateId) {
  return TEMPLATES[templateId] && TEMPLATES[templateId].id
    ? TEMPLATES[templateId]
    : TEMPLATES['ats-classic'];
}

// ---------- layout primitives ----------

class ResumeCanvas {
  constructor(doc, theme, fonts) {
    this.doc = doc;
    this.theme = theme;
    this.fonts = fonts; // { regular, bold }
    this.page = doc.getPage(0);
    this.margins = { top: 32, bottom: 42, left: 32, right: 32 };
    this.pageWidth = this.page.getWidth();
    this.pageHeight = this.page.getHeight();
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
    this.y = this.margins.top;
  }

  pageBottom() {
    return this.pageHeight - this.margins.bottom - 18;
  }

  ensureSpace(height) {
    if (this.y + height > this.pageBottom()) this.addPage();
  }

  addPage() {
    this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.y = this.margins.top;
  }

  currentFont(bold = false) {
    return bold ? this.fonts.bold : this.fonts.regular;
  }

  textWidth(value, fontSize, bold = false) {
    return this.currentFont(bold).widthOfTextAtSize(value, fontSize);
  }

  // Draw a left-aligned line at the current cursor (does NOT move down).
  drawText(value, options = {}) {
    const {
      size = 10,
      bold = false,
      color = this.theme.body,
      x = this.margins.left,
      y = this.y,
      maxWidth,
      align = 'left',
    } = options;

    const font = this.currentFont(bold);
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;

    if (!value) return;

    if (maxWidth && align === 'left') {
      const lines = wrapText(value, font, size, maxWidth);
      lines.forEach((line) => {
        this.ensureSpace(size + 3);
        this.page.drawText(line || '', {
          x,
          y: this.y,
          size,
          font,
          color: colorRgb,
        });
        this.y -= size + 3;
      });
    } else {
      this.ensureSpace(size + 3);
      let drawX = x;
      if (align === 'center') {
        drawX = x + (maxWidth || this.contentWidth) / 2 - this.textWidth(value, size, bold) / 2;
      } else if (align === 'right') {
        drawX = x + (maxWidth || this.contentWidth) - this.textWidth(value, size, bold);
      }
      this.page.drawText(value, {
        x: drawX,
        y,
        size,
        font,
        color: colorRgb,
      });
    }
  }

  drawLine(x1, y1, x2, y2, color, thickness = 1) {
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;
    this.page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color: colorRgb,
    });
  }

  drawRect(x, y, width, height, color, options = {}) {
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      color: colorRgb,
      borderColor: options.borderColor
        ? typeof options.borderColor === 'string'
          ? hexToColor(options.borderColor)
          : options.borderColor
        : undefined,
      borderWidth: options.borderWidth || 0,
    });
  }

  moveDown(amount = 12) {
    this.y -= amount;
  }
}

// ---------- section builders ----------

function addSectionHeading(canvas, title) {
  canvas.ensureSpace(36);
  canvas.moveDown(0.55);
  const y = canvas.y;
  const theme = canvas.theme;

  if (theme.headingStyle === 'band') {
    canvas.drawRect(
      canvas.margins.left,
      y - 6,
      canvas.contentWidth,
      20,
      theme.blue
    );
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: '#FFFFFF',
      x: canvas.margins.left + 8,
      y: y - 2,
    });
    canvas.moveDown(20 + 6);
  } else if (theme.headingStyle === 'technical') {
    canvas.drawRect(canvas.margins.left, y - 6, 4, 20, theme.blue);
    canvas.drawRect(
      canvas.margins.left + 4,
      y - 6,
      canvas.contentWidth - 4,
      20,
      theme.chip
    );
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left + 10,
      y: y - 2,
    });
    canvas.moveDown(20 + 6);
  } else if (theme.headingStyle === 'academic') {
    // Europass-style: uppercase heading with a thin colored rule beneath
    canvas.drawText(title.toUpperCase(), {
      size: 11.5,
      bold: true,
      color: theme.blue,
      x: canvas.margins.left,
      y,
    });
    const lineY = y - 14;
    canvas.drawLine(
      canvas.margins.left,
      lineY,
      canvas.pageWidth - canvas.margins.right,
      lineY,
      theme.rule,
      0.75
    );
    canvas.moveDown(22);
  } else {
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left,
      y,
    });
    const lineY = y - 14;
    canvas.drawLine(
      canvas.margins.left,
      lineY,
      canvas.pageWidth - canvas.margins.right,
      lineY,
      theme.rule,
      theme.headingStyle === 'european' ? 1 : 1.5
    );
    canvas.moveDown(20);
  }
}

function addParagraph(canvas, value, options = {}) {
  const text = safeText(value);
  if (!text) return;
  canvas.drawText(text, {
    size: options.size || 9.5,
    color: options.color || canvas.theme.body,
    maxWidth: options.width || canvas.contentWidth,
  });
  canvas.moveDown(4);
}

function addBulletPoint(canvas, value) {
  const text = safeText(value);
  if (!text) return;
  const font = canvas.currentFont(false);
  const wrapped = wrapText(text, font, 9.5, canvas.contentWidth - 14);
  if (!wrapped.length) return;

  // bullet dot — aligned to the first line's baseline
  canvas.ensureSpace(12);
  const dotX = canvas.margins.left + 2;
  const dotY = canvas.y - 8;
  canvas.page.drawCircle({
    x: dotX,
    y: dotY,
    size: 1.6,
    color: hexToColor(canvas.theme.body),
  });

  wrapped.forEach((line, index) => {
    canvas.ensureSpace(12);
    canvas.page.drawText(line || '', {
      x: canvas.margins.left + 12,
      y: canvas.y - 8,
      size: 9.5,
      font,
      color: hexToColor(canvas.theme.body),
    });
    if (index < wrapped.length - 1) {
      canvas.y -= 12;
    }
  });
  canvas.moveDown(12);
}

function addHeadingRow(canvas, leftText, rightText) {
  canvas.ensureSpace(20);
  const leftWidth = canvas.contentWidth * 0.72;
  const rightWidth = canvas.contentWidth * 0.28;
  if (leftText) {
    canvas.drawText(leftText, {
      size: 11,
      bold: true,
      color: canvas.theme.body,
      x: canvas.margins.left,
      y: canvas.y,
      maxWidth: leftWidth,
    });
  }
  if (rightText) {
    canvas.drawText(rightText, {
      size: 11,
      bold: true,
      color: canvas.theme.body,
      x: canvas.margins.left + leftWidth,
      y: canvas.y,
      maxWidth: rightWidth,
      align: 'right',
    });
  }
  // estimate consumed height
  const leftLines = leftText
    ? wrapText(leftText, canvas.currentFont(true), 11, leftWidth).length
    : 0;
  canvas.moveDown(14 + (leftLines > 1 ? (leftLines - 1) * 12 : 0));
}

function addSubheadingRow(canvas, leftText, rightText) {
  canvas.ensureSpace(18);
  const leftWidth = canvas.contentWidth * 0.72;
  const rightWidth = canvas.contentWidth * 0.28;
  if (leftText) {
    canvas.drawText(leftText, {
      size: 9.2,
      bold: true,
      color: canvas.theme.blue,
      x: canvas.margins.left,
      y: canvas.y,
      maxWidth: leftWidth,
    });
  }
  if (rightText) {
    canvas.drawText(rightText, {
      size: 8.8,
      color: canvas.theme.body,
      x: canvas.margins.left + leftWidth,
      y: canvas.y,
      maxWidth: rightWidth,
      align: 'right',
    });
  }
  canvas.moveDown(12);
}

function addMetaRow(canvas, leftText, rightText) {
  canvas.ensureSpace(14);
  const leftWidth = canvas.contentWidth * 0.65;
  const rightWidth = canvas.contentWidth * 0.35;
  if (leftText) {
    canvas.drawText(leftText, {
      size: 8.8,
      color: canvas.theme.body,
      x: canvas.margins.left,
      y: canvas.y,
      maxWidth: leftWidth,
    });
  }
  if (rightText) {
    canvas.drawText(rightText, {
      size: 8.8,
      color: canvas.theme.body,
      x: canvas.margins.left + leftWidth,
      y: canvas.y,
      maxWidth: rightWidth,
      align: 'right',
    });
  }
  canvas.moveDown(11);
}

function addSkills(canvas, skills) {
  const values = safeArray(skills)
    .map((skill) => (typeof skill === 'string' ? skill.trim() : safeText(skill?.name)))
    .filter(Boolean);
  if (!values.length) return;

  addSectionHeading(canvas, 'Skills');

  const left = canvas.margins.left;
  const right = canvas.pageWidth - canvas.margins.right;
  let x = left;
  let lineHeight = 19;
  const padding = 22;
  const chipHeight = 17;

  values.forEach((skill) => {
    const textWidth = canvas.textWidth(skill, 9, false);
    const chipWidth = Math.min(textWidth + padding, 150);
    if (x + chipWidth > right) {
      x = left;
      canvas.moveDown(lineHeight + 5);
    }
    const chipY = canvas.y - chipHeight;
    canvas.drawRect(x, chipY, chipWidth, chipHeight, canvas.theme.chip);
    canvas.drawText(skill, {
      size: 9,
      color: canvas.theme.blue,
      x: x + 11,
      y: chipY + 5,
    });
    x += chipWidth + 9;
  });
  canvas.moveDown(lineHeight + 8);
}

function addCustomSection(canvas, section) {
  const title = safeText(section?.title);
  const content = safeText(section?.content);
  if (!title || !content) return;
  addSectionHeading(canvas, title);
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length > 1) lines.forEach((line) => addBulletPoint(canvas, line));
  else addParagraph(canvas, content);
}

// ---------- academic template helpers ----------

/**
 * Render a Europass-style "Personal details" block below the header.
 * Shows nationality, date of birth, and place of birth (one line, separated
 * by " | "). Falls back gracefully when fields are missing.
 */
function addAcademicPersonalDetails(canvas, resumeData) {
  const parts = [
    safeText(resumeData.nationality)
      ? `Nationality: ${safeText(resumeData.nationality)}`
      : '',
    safeText(resumeData.dateOfBirth)
      ? `Date of birth: ${safeText(resumeData.dateOfBirth)}`
      : '',
    safeText(resumeData.placeOfBirth)
      ? `Place of birth: ${safeText(resumeData.placeOfBirth)}`
      : '',
  ].filter(Boolean);

  if (!parts.length) return;
  canvas.drawText(parts.join('   |   '), {
    size: 9,
    color: canvas.theme.muted,
    maxWidth: canvas.contentWidth,
    align: 'center',
  });
  canvas.moveDown(14);
}

/**
 * Render a Languages section from a textarea where each non-empty line is one
 * language entry. Example input:
 *   English — C1 (Fluent)
 *   German — B1 (Intermediate)
 *   Urdu — Native
 */
function addLanguagesBlock(canvas, languagesText) {
  const text = safeText(languagesText);
  if (!text) return;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return;

  addSectionHeading(canvas, 'Languages');
  lines.forEach((line) => {
    canvas.drawText(`•  ${line}`, {
      size: 9.5,
      color: canvas.theme.body,
      maxWidth: canvas.contentWidth,
    });
    canvas.moveDown(11);
  });
  canvas.moveDown(4);
}

/**
 * Render a References section. If the text is just "Available on request"
 * (case-insensitive), render it as a single line; otherwise treat each line
 * as a separate reference and render as paragraphs.
 */
function addReferencesBlock(canvas, referencesText) {
  const text = safeText(referencesText);
  if (!text) return;

  addSectionHeading(canvas, 'References');

  const trimmed = text.trim();
  if (/^available on request\.?$/i.test(trimmed)) {
    canvas.drawText('Available on request.', {
      size: 9.5,
      color: canvas.theme.body,
      maxWidth: canvas.contentWidth,
    });
    canvas.moveDown(10);
    return;
  }

  // Multi-line: render each non-empty line as its own paragraph
  const blocks = trimmed
    .split(/\r?\n\s*\r?\n/) // blank-line separated blocks
    .map((b) => b.trim())
    .filter(Boolean);

  blocks.forEach((block, idx) => {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, lineIdx) => {
      canvas.drawText(line, {
        size: lineIdx === 0 ? 9.8 : 9.2,
        bold: lineIdx === 0,
        color: lineIdx === 0 ? canvas.theme.ink : canvas.theme.body,
        maxWidth: canvas.contentWidth,
      });
      canvas.moveDown(11);
    });
    if (idx < blocks.length - 1) canvas.moveDown(6);
  });
  canvas.moveDown(4);
}

/**
 * Europass / DAAD-style signature footer ("Place, Date" + signature line) was
 * previously rendered here but has been removed at the user's request. The
 * EU Academic template now ends with the References block, with no extra
 * signature/date footer on any page.
 */

/**
 * Format education date range from start + end (year) fields.
 *   start=2020, end=2024 -> "2020 - 2024"
 *   start=2020, end=''   -> "2020 - Present"
 *   start='',   end=2024 -> "2024"
 *   start='',   end=''   -> ""
 */
function formatEducationDateRange(startDate, endDate) {
  const start = safeText(startDate);
  const end = safeText(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Present`;
  if (end) return end;
  return '';
}

// ---------- contact icons (no visible text, with hyperlinks) ----------

/**
 * Draw a small vector icon for a contact type. Mirrors the backend PDF.
 * Coordinate (x, y) is the top-left of the 9x9 icon box.
 */
function drawContactIcon(canvas, type, x, y) {
  const page = canvas.page;
  const theme = canvas.theme;
  const color = hexToColor(theme.blue);

  if (type === 'email') {
    page.drawRectangle({ x, y: y + 1, width: 9, height: 7, borderColor: color, borderWidth: 0.8 });
    page.drawLine({ start: { x, y: y + 1 }, end: { x: x + 4.5, y: y + 5 }, thickness: 0.8, color });
    page.drawLine({ start: { x: x + 9, y: y + 1 }, end: { x: x + 4.5, y: y + 5 }, thickness: 0.8, color });
  } else if (type === 'phone') {
    // simplified phone: filled circle with two dots
    page.drawCircle({ x: x + 4.5, y: y + 4.5, size: 3.7, borderColor: color, borderWidth: 0.8 });
    page.drawCircle({ x: x + 1.2, y: y + 7.2, size: 1, color });
    page.drawCircle({ x: x + 7.8, y: y + 1.8, size: 1, color });
  } else if (type === 'location') {
    page.drawCircle({ x: x + 4.5, y: y + 3.5, size: 3.3, borderColor: color, borderWidth: 0.8 });
    page.drawCircle({ x: x + 4.5, y: y + 3.5, size: 1.1, borderColor: color, borderWidth: 0.8 });
    page.drawLine({ start: { x: x + 2.2, y: y + 6 }, end: { x: x + 4.5, y: y + 9 }, thickness: 0.8, color });
    page.drawLine({ start: { x: x + 6.8, y: y + 6 }, end: { x: x + 4.5, y: y + 9 }, thickness: 0.8, color });
  } else if (type === 'linkedin') {
    page.drawRectangle({ x, y, width: 9, height: 9, color });
    page.drawText('in', {
      x: x + 1.6, y: y + 1.8, size: 5.5, font: canvas.fonts.bold, color: hexToColor('#FFFFFF'),
    });
  } else if (type === 'github') {
    page.drawCircle({ x: x + 4.5, y: y + 4.5, size: 4.2, borderColor: color, borderWidth: 0.8 });
    page.drawText('GH', {
      x: x + 1.1, y: y + 2.1, size: 4.5, font: canvas.fonts.bold, color,
    });
  } else {
    // portfolio: two linked circles
    page.drawCircle({ x: x + 3, y: y + 4.5, size: 2.5, borderColor: color, borderWidth: 0.8 });
    page.drawCircle({ x: x + 7, y: y + 4.5, size: 2.5, borderColor: color, borderWidth: 0.8 });
    page.drawLine({ start: { x: x + 3.5, y: y + 4.5 }, end: { x: x + 6.5, y: y + 4.5 }, thickness: 0.8, color });
  }
}

function addContactIconsRow(canvas, resumeData) {
  const email = safeText(resumeData.email);
  const phone = safeText(resumeData.phone);
  const location = safeText(resumeData.location);
  const linkedin = safeText(resumeData.linkedin);
  const github = safeText(resumeData.github);
  const portfolio = safeText(resumeData.portfolio);

  const items = [
    { type: 'email',    link: email ? `mailto:${email}` : '' },
    { type: 'phone',    link: phone ? `tel:${phone.replace(/\s+/g, '')}` : '' },
    { type: 'location', link: '' },
    { type: 'linkedin', link: linkedin ? (linkedin.startsWith('http') ? linkedin : `https://${linkedin}`) : '' },
    { type: 'github',   link: github ? (github.startsWith('http') ? github : `https://${github}`) : '' },
    { type: 'portfolio',link: portfolio ? (portfolio.startsWith('http') ? portfolio : `https://${portfolio}`) : '' },
  ].filter((it) => it.link || (it.type === 'location' && location));

  if (!items.length) {
    canvas.moveDown(8);
    return;
  }

  // Each icon takes ~20pt of horizontal space (9pt icon + 11pt gap)
  const slotWidth = 20;
  const right = canvas.pageWidth - canvas.margins.right;
  let x = canvas.margins.left;
  const pageRef = canvas.page.node;

  items.forEach((item) => {
    if (x + slotWidth > right) {
      x = canvas.margins.left;
      canvas.moveDown(16);
    }
    const iconY = canvas.y;
    drawContactIcon(canvas, item.type, x, iconY);

    // Add a clickable link annotation over the icon area.
    // pdf-lib doesn't have a high-level API for this, so we use the low-level
    // context.register + node.addAnnot pattern. The annotation is invisible
    // (no border) but clicking it opens the URL.
    if (item.link) {
      try {
        const linkDict = canvas.doc.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          // pdf-lib uses bottom-left origin; our iconY is in top-down coords.
          // Convert: pdfY = pageHeight - topY.
          Rect: [
            x,
            canvas.pageHeight - iconY - 11,
            x + slotWidth,
            canvas.pageHeight - iconY,
          ],
          Border: [0, 0, 0],
          A: { Type: 'Action', S: 'URI', URI: item.link },
        });
        const ref = canvas.doc.context.register(linkDict);
        pageRef.addAnnot(ref);
      } catch (err) {
        // Link annotation is best-effort; if it fails, the icon is still visible.
        console.warn('[localResumePdf] Failed to add link annotation:', err?.message);
      }
    }
    x += slotWidth;
  });

  canvas.moveDown(16);
}

function addContactLine(canvas, resumeData) {
  // DEPRECATED: replaced by addContactIconsRow. Kept for backward compat.
  addContactIconsRow(canvas, resumeData);
}

// ---------- main entry ----------

export async function buildResumePdfBytes(resumeData = {}) {
  if (!resumeData || typeof resumeData !== 'object' || Array.isArray(resumeData)) {
    throw new TypeError('Resume data must be an object.');
  }

  const firstName = safeText(resumeData.firstName, 'Candidate');
  const lastName = safeText(resumeData.lastName, 'User');
  const fullName = `${firstName} ${lastName}`.trim();
  const targetRole = safeText(resumeData.targetRole);
  const templateId = getTheme(resumeData.templateId).id;
  const theme = getTheme(templateId);

  const doc = await PDFDocument.create();
  doc.setTitle(`${fullName} - Resume`);
  doc.setAuthor(fullName);
  doc.setSubject('Resume generated by Hirely (offline)');
  doc.setCreator('Hirely');
  doc.setProducer('Hirely client (pdf-lib)');

  // StandardFonts are bundled with pdf-lib and embed synchronously
  // (no fontkit required, no asset files to ship with the APK).
  const regular = doc.embedStandardFont(StandardFonts.Helvetica);
  const bold = doc.embedStandardFont(StandardFonts.HelveticaBold);

  // Create first page explicitly so canvas has something to bind to.
  doc.addPage([595.28, 841.89]); // A4 in points

  const canvas = new ResumeCanvas(doc, theme, { regular, bold });

  // --- header ---
  if (theme.headerStyle === 'academic-photo') {
    // DAAD-style header: portrait photo top-right, name+target on left
    const photoW = 90;
    const photoH = 113; // 4:5 portrait
    const photoX = canvas.pageWidth - canvas.margins.right - photoW;
    const photoY = canvas.y;
    const leftTextWidth = photoX - canvas.margins.left - 14;

    const photoBase64 = safeText(resumeData.photoBase64);
    let photoEmbedded = false;
    if (photoBase64) {
      try {
        // Decode base64 to Uint8Array and embed with pdf-lib
        const binary = atob(photoBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const isPng = (resumeData.photoMimeType || '').includes('png');
        const img = isPng ? await canvas.doc.embedPng(bytes) : await canvas.doc.embedJpg(bytes);
        canvas.page.drawImage(img, { x: photoX, y: canvas.pageHeight - photoY - photoH, width: photoW, height: photoH });
        photoEmbedded = true;
      } catch (err) {
        console.warn('[localResumePdf] Failed to embed photo:', err?.message);
      }
    }
    if (!photoEmbedded) {
      // Initials avatar fallback
      const initials = `${safeText(resumeData.firstName, 'A').charAt(0)}${safeText(resumeData.lastName, 'U').charAt(0)}`.toUpperCase();
      canvas.drawRect(photoX, photoY, photoW, photoH, canvas.theme.chip);
      canvas.drawRect(photoX, photoY, photoW, photoH, canvas.theme.rule, { borderWidth: 0.75 });
      canvas.drawText(initials, {
        size: 34, bold: true, color: canvas.theme.blue,
        x: photoX, y: photoY + photoH / 2 - 17,
        maxWidth: photoW, align: 'center',
      });
    }

    // Name + target role on the left of the photo
    const nameY = photoY + 8;
    canvas.drawText(fullName, {
      size: 22, bold: true, color: theme.ink,
      x: canvas.margins.left, y: nameY,
      maxWidth: leftTextWidth, align: 'left',
    });
    if (targetRole) {
      canvas.drawText(targetRole, {
        size: 11, bold: false, color: theme.blue,
        x: canvas.margins.left, y: nameY + 30,
        maxWidth: leftTextWidth, align: 'left',
      });
    }

    // Move cursor below the photo
    canvas.y = photoY + photoH + 8;

    // Thin centered rule under the header
    const ruleY = canvas.y;
    canvas.drawLine(
      canvas.margins.left + 80, ruleY,
      canvas.pageWidth - canvas.margins.right - 80, ruleY,
      theme.rule, 0.75
    );
    canvas.moveDown(14);
    addAcademicPersonalDetails(canvas, resumeData);
  } else if (theme.headerStyle === 'academic') {
    // Europass-inspired centered header
    canvas.drawText(fullName, {
      size: 22,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left,
      y: canvas.y,
      maxWidth: canvas.contentWidth,
      align: 'center',
    });
    canvas.moveDown(24);
    if (targetRole) {
      canvas.drawText(targetRole, {
        size: 11,
        bold: false,
        color: theme.blue,
        x: canvas.margins.left,
        y: canvas.y,
        maxWidth: canvas.contentWidth,
        align: 'center',
      });
      canvas.moveDown(14);
    }
    // Thin centered rule under the header
    const lineY = canvas.y;
    canvas.drawLine(
      canvas.margins.left + 80,
      lineY,
      canvas.pageWidth - canvas.margins.right - 80,
      lineY,
      theme.rule,
      0.75
    );
    canvas.moveDown(14);
    // Nationality | DOB | POB
    addAcademicPersonalDetails(canvas, resumeData);
  } else if (theme.headerStyle === 'european') {
    const headerY = canvas.y - 6;
    canvas.drawRect(
      canvas.margins.left,
      headerY - 48,
      canvas.contentWidth,
      54,
      theme.blue
    );
    canvas.drawText(fullName, {
      size: 20,
      bold: true,
      color: '#FFFFFF',
      x: canvas.margins.left + 14,
      y: headerY - 24,
      maxWidth: canvas.contentWidth - 28,
    });
    if (targetRole) {
      canvas.drawText(targetRole, {
        size: 10.5,
        bold: true,
        color: '#DDEEF8',
        x: canvas.margins.left + 14,
        y: headerY - 40,
        maxWidth: canvas.contentWidth - 28,
      });
    }
    canvas.moveDown(70);
  } else {
    const centered = theme.headerStyle === 'center';
    canvas.drawText(fullName, {
      size: 23,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left,
      y: canvas.y,
      maxWidth: canvas.contentWidth,
      align: centered ? 'center' : 'left',
    });
    canvas.moveDown(24);
    if (targetRole) {
      canvas.drawText(targetRole, {
        size: 11,
        bold: true,
        color: theme.blue,
        x: canvas.margins.left,
        y: canvas.y,
        maxWidth: canvas.contentWidth,
        align: centered ? 'center' : 'left',
      });
      canvas.moveDown(14);
    }
    if (theme.headerStyle === 'technical') {
      const lineY = canvas.y;
      canvas.drawLine(
        canvas.margins.left,
        lineY,
        canvas.pageWidth - canvas.margins.right,
        lineY,
        theme.blue,
        3
      );
      canvas.moveDown(12);
    }
  }

  // --- contact ---
  addContactLine(canvas, resumeData);

  // --- summary ---
  const summary = safeText(resumeData.summary);
  if (summary) {
    addSectionHeading(
      canvas,
      (templateId === 'eu-academic' || templateId === 'academic-photo') ? 'Personal Statement' : 'Summary'
    );
    addParagraph(canvas, summary);
  }

  // ============================================================
  // EU ACADEMIC template — Europass-style section order
  // (Education first, then research/projects, experience, skills,
  //  languages, references, signature footer)
  // ============================================================
  if (templateId === 'eu-academic' || templateId === 'academic-photo') {
    // Education (most important for students)
    const education = safeArray(resumeData.education);
    if (education.length) {
      addSectionHeading(canvas, 'Education');
      education.forEach((item, index) => {
        // Line 1: degree (left) + gpa (right)
        addHeadingRow(canvas, safeText(item?.degree, 'Qualification'), safeText(item?.gpa));
        // Line 2: institution (left) + date range (right)
        const dateRange = formatEducationDateRange(item?.startDate, item?.year);
        if (safeText(item?.institution) || dateRange) {
          addSubheadingRow(canvas, safeText(item?.institution), dateRange);
        }
        // Line 3: location
        if (item?.location) {
          addMetaRow(canvas, safeText(item?.location), '');
        }
        if (index < education.length - 1) canvas.moveDown(6);
      });
    }

    // Research experience / Projects (academic projects)
    const projects = safeArray(resumeData.projects);
    if (projects.length) {
      addSectionHeading(canvas, 'Research & Academic Projects');
      projects.forEach((project, index) => {
        addHeadingRow(canvas, safeText(project?.name, 'Project'), '');
        const technologies = Array.isArray(project?.technologies)
          ? project.technologies.filter(Boolean).join(', ')
          : safeText(project?.technologies);
        if (technologies) {
          canvas.drawText(technologies, {
            size: 8.5,
            color: canvas.theme.muted,
            maxWidth: canvas.contentWidth,
          });
          canvas.moveDown(11);
        }
        const points = safeArray(project?.points).filter(Boolean);
        if (points.length) {
          points.forEach((point) => addBulletPoint(canvas, point));
        } else {
          addParagraph(canvas, project?.description, { size: 9.3 });
        }
        if (index < projects.length - 1) {
          const lineY = canvas.y - 2;
          canvas.drawLine(
            canvas.margins.left,
            lineY,
            canvas.pageWidth - canvas.margins.right,
            lineY,
            canvas.theme.lightRule,
            1
          );
          canvas.moveDown(10);
        }
      });
    }

    // Work / internship experience
    const experience = safeArray(resumeData.experience);
    if (experience.length) {
      addSectionHeading(canvas, 'Work & Internship Experience');
      experience.forEach((item, index) => {
        addHeadingRow(canvas, safeText(item?.role, 'Position'), safeText(item?.duration));
        addSubheadingRow(canvas, safeText(item?.company), safeText(item?.location));
        safeArray(item?.points).forEach((point) => addBulletPoint(canvas, point));
        if (index < experience.length - 1) canvas.moveDown(6);
      });
    }

    // Technical skills
    addSkills(canvas, safeArray(resumeData.skills));

    // Languages (CEFR-style — important for EU universities)
    addLanguagesBlock(canvas, resumeData.languagesText);

    // Certifications & Awards
    const certifications = safeArray(resumeData.certifications);
    if (certifications.length) {
      addSectionHeading(canvas, 'Certifications & Awards');
      certifications.forEach((item, index) => {
        const cert = typeof item === 'string' ? { name: item } : item;
        addHeadingRow(canvas, safeText(cert?.name), safeText(cert?.year));
        if (cert?.issuer) {
          canvas.drawText(safeText(cert.issuer), {
            size: 9,
            bold: true,
            color: canvas.theme.blue,
            maxWidth: canvas.contentWidth,
          });
          canvas.moveDown(11);
        }
        if (index < certifications.length - 1) canvas.moveDown(4);
      });
    }

    // Custom sections (publications, conferences, volunteering, etc.)
    safeArray(resumeData.customSections).forEach((section) =>
      addCustomSection(canvas, section)
    );

    // References (always last for academic)
    addReferencesBlock(canvas, resumeData.referencesText);
  } else {
  // ============================================================
  // Standard templates — original section order
  // ============================================================
  if (templateId === 'technical-compact') {
    addSkills(canvas, safeArray(resumeData.skills));
  }

  // --- education ---
  const education = safeArray(resumeData.education);
  if (education.length) {
    addSectionHeading(canvas, 'Education');
    education.forEach((item, index) => {
      // Line 1: degree (left) + gpa (right)
      addHeadingRow(canvas, safeText(item?.degree, 'Qualification'), safeText(item?.gpa));
      // Line 2: institution (left) + date range (right)
      const dateRange = formatEducationDateRange(item?.startDate, item?.year);
      if (safeText(item?.institution) || dateRange) {
        addSubheadingRow(canvas, safeText(item?.institution), dateRange);
      }
      // Line 3: location
      if (item?.location) {
        addMetaRow(canvas, safeText(item?.location), '');
      }
      if (index < education.length - 1) canvas.moveDown(6);
    });
  }

  // --- experience ---
  const experience = safeArray(resumeData.experience);
  if (experience.length) {
    addSectionHeading(canvas, 'Experience');
    experience.forEach((item, index) => {
      addHeadingRow(canvas, safeText(item?.role, 'Position'), safeText(item?.duration));
      addSubheadingRow(canvas, safeText(item?.company), safeText(item?.location));
      safeArray(item?.points).forEach((point) => addBulletPoint(canvas, point));
      if (index < experience.length - 1) canvas.moveDown(6);
    });
  }

  // --- projects ---
  const projects = safeArray(resumeData.projects);
  if (projects.length) {
    addSectionHeading(canvas, 'Projects');
    projects.forEach((project, index) => {
      addHeadingRow(canvas, safeText(project?.name, 'Project'), '');
      const technologies = Array.isArray(project?.technologies)
        ? project.technologies.filter(Boolean).join(', ')
        : safeText(project?.technologies);
      if (technologies) {
        canvas.drawText(technologies, {
          size: 8.5,
          color: canvas.theme.muted,
          maxWidth: canvas.contentWidth,
        });
        canvas.moveDown(11);
      }
      const points = safeArray(project?.points).filter(Boolean);
      if (points.length) {
        points.forEach((point) => addBulletPoint(canvas, point));
      } else {
        addParagraph(canvas, project?.description, { size: 9.3 });
      }
      if (index < projects.length - 1) {
        const lineY = canvas.y - 2;
        canvas.drawLine(
          canvas.margins.left,
          lineY,
          canvas.pageWidth - canvas.margins.right,
          lineY,
          canvas.theme.lightRule,
          1
        );
        canvas.moveDown(10);
      }
    });
  }

  if (templateId !== 'technical-compact') {
    addSkills(canvas, safeArray(resumeData.skills));
  }

  // --- certifications ---
  const certifications = safeArray(resumeData.certifications);
  if (certifications.length) {
    addSectionHeading(canvas, 'Certifications');
    certifications.forEach((item, index) => {
      const cert = typeof item === 'string' ? { name: item } : item;
      addHeadingRow(canvas, safeText(cert?.name), safeText(cert?.year));
      if (cert?.issuer) {
        canvas.drawText(safeText(cert.issuer), {
          size: 9,
          bold: true,
          color: canvas.theme.blue,
          maxWidth: canvas.contentWidth,
        });
        canvas.moveDown(11);
      }
      if (index < certifications.length - 1) canvas.moveDown(4);
    });
  }

  // --- custom sections ---
  safeArray(resumeData.customSections).forEach((section) =>
    addCustomSection(canvas, section)
  );
  } // end of non-academic branch

  // --- footer page numbers ---
  const pages = doc.getPages();
  pages.forEach((page, idx) => {
    const footerY = 20;
    page.drawText(`${fullName} | Page ${idx + 1} of ${pages.length}`, {
      x: canvas.margins.left,
      y: footerY,
      size: 7.5,
      font: regular,
      color: hexToColor('#999999'),
    });
  });

  return doc.save();
}

export function buildResumeFilename(resumeData = {}) {
  const firstName = safeText(resumeData.firstName, 'Candidate');
  const lastName = safeText(resumeData.lastName, 'Resume');
  const fullName = `${firstName}_${lastName}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  return `${fullName || 'Hirely_Candidate'}_Resume.pdf`;
}

// Re-export for callers that only need one function
export default {
  buildResumePdfBytes,
  buildResumeFilename,
};

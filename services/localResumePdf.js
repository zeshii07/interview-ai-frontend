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

import { bytesToBase64 } from '../utils/bytes';

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

// ---------- WinAnsi sanitizer ----------
//
// pdf-lib's StandardFonts (Helvetica) only support the WinAnsi (CP-1252)
// character set. Any character outside it throws
//   "WinAnsi cannot encode ..." (0xXXXX)
// which crashes the PDF download. The fix has two layers:
//   1. safeText() sanitizes every string at the source (all resume text flows
//      through it via wrapText/fitText/direct calls).
//   2. ResumeCanvas.drawText() sanitizes again right before page.drawText()
//      as a last line of defense for callers that bypass safeText().

const WINANSI_REPLACEMENTS = [
  // Dashes / quotes
  [/[\u2018\u2019\u201A\u201B\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u201F\u2033]/g, '"'],
  [/[\u2013]/g, '-'],           // en dash
  [/[\u2012\u2014\u2015]/g, '--'], // figure/em dashes
  [/\u2026/g, '...'],           // ellipsis
  // Bullets
  [/\u2022/g, '*'],
  [/\u25CF|\u25AA|\u25A0|\u2023|\u25E6/g, '*'],
  // Arrows / math
  [/[\u2190\u2191\u2193]/g, ''],
  [/\u2192|\u21D2/g, '->'],
  [/\u2190|\u21D0/g, '<-'],
  [/\u2194/g, '<->'],
  [/\u00D7|\u2715|\u2716/g, 'x'],
  [/\u00F7/g, '/'],
  [/\u2264/g, '<='],
  [/\u2265/g, '>='],
  [/\u2260/g, '!='],
  [/\u2248/g, '~'],
  [/\u00B1/g, '+/-'],
  [/\u221E/g, 'inf'],
  [/\u00B0/g, 'deg'],
  // Currency
  [/\u20AC/g, 'EUR'],
  [/\u20B9/g, 'Rs'],
  [/\u00A3/g, 'GBP'],
  [/\u00A5/g, 'JPY'],
  // Symbols
  [/\u2122/g, '(TM)'],
  [/\u00A9/g, '(c)'],
  [/\u00AE/g, '(r)'],
  [/\u00A7/g, 'S'],
  [/\u00B6/g, 'P'],
  [/\u2020/g, '+'],
  [/\u2021/g, '++'],
  [/\u2030/g, '%%'],
  // Fractions
  [/\u00BD/g, '1/2'],
  [/\u00BC/g, '1/4'],
  [/\u00BE/g, '3/4'],
  [/\u2153/g, '1/3'],
  [/\u2154/g, '2/3'],
  // Spaces
  [/[\u00A0\u2007\u202F\u2009\u200A\u200B\u200C\u200D\uFEFF]/g, ' '],
];

// Emoji, dingbats, symbols, variation selectors and zero-width joiners —
// none of these exist in WinAnsi.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu;

// Everything WinAnsi can encode: ASCII, Latin-1 supplement, and the CP-1252
// specials (smart punctuation, œ/Š/ž/Ÿ/ƒ/€/™...).
const WINANSI_OK = /[\u0020-\u007E\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/;

function sanitizeForWinAnsi(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);

  for (const [pattern, replacement] of WINANSI_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(EMOJI_RE, '');

  // Strip any remaining characters WinAnsi cannot encode (CJK, Arabic,
  // Cyrillic, Devanagari, box drawing, ...).
  let out = '';
  for (const char of text) {
    if (char === '\n' || char === '\t' || WINANSI_OK.test(char)) {
      out += char;
    }
  }
  return out;
}

function safeText(value, fallback = '') {
  if (typeof value === 'string') return sanitizeForWinAnsi(value.trim()) || fallback;
  if (typeof value === 'number') return String(value);
  return sanitizeForWinAnsi(fallback);
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

function fitText(text, font, fontSize, maxWidth) {
  const value = safeText(text);
  if (!value || font.widthOfTextAtSize(value, fontSize) <= maxWidth) {
    return value;
  }

  const ellipsis = '...';
  let end = value.length;
  while (end > 0) {
    const candidate = `${value.slice(0, end).trimEnd()}${ellipsis}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      return candidate;
    }
    end -= 1;
  }
  return ellipsis;
}

// ---------- templates ----------
// Theme tokens now live in constants/resumeTemplates.js (single source of
// truth shared with the DOCX generator, the in-app preview, and the template
// picker) so the downloaded document always matches what the user saw.
import { RESUME_TEMPLATE_THEMES as TEMPLATES } from '../constants/resumeTemplates';

function getTheme(templateId) {
  return TEMPLATES[templateId] && TEMPLATES[templateId].id
    ? TEMPLATES[templateId]
    : TEMPLATES['ats-classic'];
}

// ---------- layout primitives ----------
//
// IMPORTANT: This canvas tracks the cursor Y in TOP-DOWN coordinates
// (y=0 is the top of the page, y increases downward). But pdf-lib uses
// BOTTOM-UP coordinates (y=0 is the bottom, y increases upward).
// Every draw method converts top-down Y to pdf-lib Y via:
//   pdfY = pageHeight - topDownY - elementHeight
// This makes the layout code intuitive (like CSS/HTML) while still
// producing correct PDFs.

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

  // Convert top-down Y to pdf-lib bottom-up Y for a text baseline.
  // `textSize` is the font size — the baseline sits `size` below the top
  // of the text box, so pdfY = pageHeight - y - size.
  toPdfY_text(topDownY, textSize) {
    return this.pageHeight - topDownY - textSize;
  }

  // Convert top-down Y to pdf-lib Y for a rectangle.
  // The rectangle's top is at `topDownY`, so its bottom-left corner is at
  // `topDownY + height`, giving pdfY = pageHeight - (topDownY + height).
  toPdfY_rect(topDownY, height) {
    return this.pageHeight - topDownY - height;
  }

  pageBottom() {
    // In top-down coords, the bottom of the content area
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

  // Draw text. `y` is in top-down coords (the TOP of the text box).
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

    // Safety net: sanitize right before drawing so a caller that bypassed
    // safeText() can still never trigger "WinAnsi cannot encode".
    const cleanValue = sanitizeForWinAnsi(value);
    if (!cleanValue) return;

    const font = this.currentFont(bold);
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;

    if (maxWidth && align === 'left') {
      const lines = wrapText(cleanValue, font, size, maxWidth);
      let cursorY = y;
      lines.forEach((line) => {
        if (cursorY + size + 3 > this.pageBottom()) {
          this.addPage();
          cursorY = this.y;
        }
        this.page.drawText(line || '', {
          x,
          y: this.toPdfY_text(cursorY, size),
          size,
          font,
          color: colorRgb,
        });
        cursorY += size + 3;
      });
      this.y = cursorY;
    } else {
      this.ensureSpace(size + 3);
      let drawX = x;
      if (align === 'center') {
        drawX = x + (maxWidth || this.contentWidth) / 2 - this.textWidth(cleanValue, size, bold) / 2;
      } else if (align === 'right') {
        drawX = x + (maxWidth || this.contentWidth) - this.textWidth(cleanValue, size, bold);
      }
      this.page.drawText(cleanValue, {
        x: drawX,
        y: this.toPdfY_text(y, size),
        size,
        font,
        color: colorRgb,
      });
    }
  }

  // Draw a horizontal line at top-down Y.
  drawLine(x1, y1, x2, y2, color, thickness = 1) {
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;
    // For horizontal lines, y1 === y2. Convert to pdf-lib Y (no height offset
    // for a zero-thickness line — just flip the Y).
    const pdfY1 = this.pageHeight - y1;
    const pdfY2 = this.pageHeight - y2;
    this.page.drawLine({
      start: { x: x1, y: pdfY1 },
      end: { x: x2, y: pdfY2 },
      thickness,
      color: colorRgb,
    });
  }

  // Draw a rectangle. `x, y` is the TOP-LEFT corner in top-down coords.
  drawRect(x, y, width, height, color, options = {}) {
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;
    this.page.drawRectangle({
      x,
      y: this.toPdfY_rect(y, height),
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

  // Draw a circle. `x, y` is the center in top-down coords.
  drawCircle(cx, cy, radius, color, options = {}) {
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;
    this.page.drawCircle({
      x: cx,
      y: this.pageHeight - cy,
      size: radius,
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
    this.y += amount;  // top-down: y increases as we move down
  }

  moveUp(amount = 12) {
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
      y,
      canvas.contentWidth,
      20,
      theme.blue
    );
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: '#FFFFFF',
      x: canvas.margins.left + 8,
      y: y + 4,
    });
    canvas.moveDown(26);
  } else if (theme.headingStyle === 'technical') {
    canvas.drawRect(canvas.margins.left, y, 4, 20, theme.blue);
    canvas.drawRect(
      canvas.margins.left + 4,
      y,
      canvas.contentWidth - 4,
      20,
      theme.chip
    );
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left + 10,
      y: y + 4,
    });
    canvas.moveDown(26);
  } else if (theme.headingStyle === 'academic') {
    // Europass-style: uppercase heading with a thin colored rule beneath
    canvas.drawText(title.toUpperCase(), {
      size: 11.5,
      bold: true,
      color: theme.blue,
      x: canvas.margins.left,
      y,
    });
    const lineY = y + 14;
    canvas.drawLine(
      canvas.margins.left,
      lineY,
      canvas.pageWidth - canvas.margins.right,
      lineY,
      theme.rule,
      0.75
    );
    canvas.moveDown(18);
  } else {
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left,
      y,
    });
    const lineY = y + 14;
    canvas.drawLine(
      canvas.margins.left,
      lineY,
      canvas.pageWidth - canvas.margins.right,
      lineY,
      theme.rule,
      theme.headingStyle === 'european' ? 1 : 1.5
    );
    canvas.moveDown(18);
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
  canvas.moveDown(3);
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
  const dotY = canvas.y + 4;  // center of bullet dot, top-down
  canvas.page.drawCircle({
    x: dotX,
    y: canvas.pageHeight - dotY,  // convert to pdf-lib Y
    size: 1.6,
    color: hexToColor(canvas.theme.body),
  });

  wrapped.forEach((line) => {
    canvas.ensureSpace(12);
    canvas.page.drawText(line || '', {
      x: canvas.margins.left + 12,
      y: canvas.toPdfY_text(canvas.y, 9.5),  // convert top-down Y to pdf-lib Y
      size: 9.5,
      font,
      color: hexToColor(canvas.theme.body),
    });
    canvas.y += 11;
  });
  canvas.moveDown(3);
}

function addHeadingRow(canvas, leftText, rightText) {
  canvas.ensureSpace(16);
  const leftWidth = canvas.contentWidth * 0.72;
  const rightWidth = canvas.contentWidth * 0.28;
  const startY = canvas.y;  // capture y BEFORE drawing either text
  const leftValue = fitText(
    leftText,
    canvas.currentFont(true),
    11,
    leftWidth - 6
  );
  const rightValue = fitText(
    rightText,
    canvas.currentFont(true),
    11,
    rightWidth
  );

  if (leftValue) {
    canvas.page.drawText(leftValue, {
      x: canvas.margins.left,
      y: canvas.toPdfY_text(startY, 11),
      size: 11,
      font: canvas.currentFont(true),
      color: hexToColor(canvas.theme.body),
    });
  }
  if (rightValue) {
    // Draw right text right-aligned at the same y
    const rightTextWidth = canvas.textWidth(rightValue, 11, true);
    canvas.page.drawText(rightValue, {
      x: canvas.margins.left + leftWidth + rightWidth - rightTextWidth,
      y: canvas.toPdfY_text(startY, 11),
      size: 11,
      font: canvas.currentFont(true),
      color: hexToColor(canvas.theme.body),
    });
  }
  canvas.y = startY + 14;  // move down once
}

function addSubheadingRow(canvas, leftText, rightText) {
  canvas.ensureSpace(14);
  const leftWidth = canvas.contentWidth * 0.72;
  const rightWidth = canvas.contentWidth * 0.28;
  const startY = canvas.y;
  const leftValue = fitText(
    leftText,
    canvas.currentFont(true),
    9.2,
    leftWidth - 6
  );
  const rightValue = fitText(
    rightText,
    canvas.currentFont(false),
    8.8,
    rightWidth
  );

  if (leftValue) {
    canvas.page.drawText(leftValue, {
      x: canvas.margins.left,
      y: canvas.toPdfY_text(startY, 9.2),
      size: 9.2,
      font: canvas.currentFont(true),
      color: hexToColor(canvas.theme.blue),
    });
  }
  if (rightValue) {
    const rightTextWidth = canvas.textWidth(rightValue, 8.8, false);
    canvas.page.drawText(rightValue, {
      x: canvas.margins.left + leftWidth + rightWidth - rightTextWidth,
      y: canvas.toPdfY_text(startY, 8.8),
      size: 8.8,
      font: canvas.currentFont(false),
      color: hexToColor(canvas.theme.body),
    });
  }
  canvas.y = startY + 12;
}

function addMetaRow(canvas, leftText, rightText) {
  canvas.ensureSpace(12);
  const leftWidth = canvas.contentWidth * 0.65;
  const rightWidth = canvas.contentWidth * 0.35;
  const startY = canvas.y;
  const leftValue = fitText(
    leftText,
    canvas.currentFont(false),
    8.8,
    leftWidth - 6
  );
  const rightValue = fitText(
    rightText,
    canvas.currentFont(false),
    8.8,
    rightWidth
  );

  if (leftValue) {
    canvas.page.drawText(leftValue, {
      x: canvas.margins.left,
      y: canvas.toPdfY_text(startY, 8.8),
      size: 8.8,
      font: canvas.currentFont(false),
      color: hexToColor(canvas.theme.body),
    });
  }
  if (rightValue) {
    const rightTextWidth = canvas.textWidth(rightValue, 8.8, false);
    canvas.page.drawText(rightValue, {
      x: canvas.margins.left + leftWidth + rightWidth - rightTextWidth,
      y: canvas.toPdfY_text(startY, 8.8),
      size: 8.8,
      font: canvas.currentFont(false),
      color: hexToColor(canvas.theme.body),
    });
  }
  canvas.y = startY + 11;
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
    const displaySkill = fitText(skill, canvas.currentFont(false), 9, 128);
    const textWidth = canvas.textWidth(displaySkill, 9, false);
    const chipWidth = Math.min(textWidth + padding, 150);
    if (x + chipWidth > right) {
      x = left;
      canvas.moveDown(lineHeight);
    }
    if (canvas.y + chipHeight > canvas.pageBottom()) {
      canvas.addPage();
      x = left;
    }
    const chipY = canvas.y;  // top of chip (top-down coords)
    canvas.drawRect(x, chipY, chipWidth, chipHeight, canvas.theme.chip);
    canvas.page.drawText(displaySkill, {
      x: x + 11,
      y: canvas.toPdfY_text(chipY + 4, 9),
      size: 9,
      font: canvas.currentFont(false),
      color: hexToColor(canvas.theme.blue),
    });
    x += chipWidth + 9;
  });
  canvas.moveDown(lineHeight + 4);
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

// ---------- contact details (visible text, icons, and hyperlinks) ----------

/**
 * Draw a small vector icon for a contact type. Mirrors the backend PDF.
 * Coordinate (x, y) is the top-left of the 9x9 icon box.
 */
function drawContactIcon(canvas, type, x, y) {
  const page = canvas.page;
  const ph = canvas.pageHeight;
  const theme = canvas.theme;
  const color = hexToColor(theme.blue);
  // `y` is top-down from caller. Convert each Y to pdf-lib bottom-up Y.
  // For rectangles: pdfY = ph - (topDownY + height)
  // For lines/circles/text: pdfY = ph - topDownY

  if (type === 'email') {
    page.drawRectangle({ x, y: ph - (y + 1) - 7, width: 9, height: 7, borderColor: color, borderWidth: 0.8 });
    page.drawLine({ start: { x, y: ph - (y + 1) }, end: { x: x + 4.5, y: ph - (y + 5) }, thickness: 0.8, color });
    page.drawLine({ start: { x: x + 9, y: ph - (y + 1) }, end: { x: x + 4.5, y: ph - (y + 5) }, thickness: 0.8, color });
  } else if (type === 'phone') {
    // Smartphone outline — universally recognizable
    page.drawRectangle({ x: x + 2, y: ph - (y + 0.5) - 8, width: 5, height: 8, borderColor: color, borderWidth: 0.8 });
    // Earpiece line at top
    page.drawLine({ start: { x: x + 3.3, y: ph - (y + 2) }, end: { x: x + 5.7, y: ph - (y + 2) }, thickness: 0.8, color });
    // Home button dot at bottom
    page.drawCircle({ x: x + 4.5, y: ph - (y + 7.2), size: 0.5, color });
  } else if (type === 'location') {
    page.drawCircle({ x: x + 4.5, y: ph - (y + 3.5), size: 3.3, borderColor: color, borderWidth: 0.8 });
    page.drawCircle({ x: x + 4.5, y: ph - (y + 3.5), size: 1.1, borderColor: color, borderWidth: 0.8 });
    page.drawLine({ start: { x: x + 2.2, y: ph - (y + 6) }, end: { x: x + 4.5, y: ph - (y + 9) }, thickness: 0.8, color });
    page.drawLine({ start: { x: x + 6.8, y: ph - (y + 6) }, end: { x: x + 4.5, y: ph - (y + 9) }, thickness: 0.8, color });
  } else if (type === 'linkedin') {
    page.drawRectangle({ x, y: ph - y - 9, width: 9, height: 9, color });
    page.drawText('in', {
      x: x + 1.6, y: ph - (y + 1.8) - 5.5, size: 5.5, font: canvas.fonts.bold, color: hexToColor('#FFFFFF'),
    });
  } else if (type === 'github') {
    page.drawCircle({ x: x + 4.5, y: ph - (y + 4.5), size: 4.2, borderColor: color, borderWidth: 0.8 });
    page.drawText('GH', {
      x: x + 1.1, y: ph - (y + 2.1) - 4.5, size: 4.5, font: canvas.fonts.bold, color,
    });
  } else {
    // portfolio: two linked circles
    page.drawCircle({ x: x + 3, y: ph - (y + 4.5), size: 2.5, borderColor: color, borderWidth: 0.8 });
    page.drawCircle({ x: x + 7, y: ph - (y + 4.5), size: 2.5, borderColor: color, borderWidth: 0.8 });
    page.drawLine({ start: { x: x + 3.5, y: ph - (y + 4.5) }, end: { x: x + 6.5, y: ph - (y + 4.5) }, thickness: 0.8, color });
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
    { type: 'email', label: email, link: email ? `mailto:${email}` : '' },
    { type: 'phone', label: phone, link: phone ? `tel:${phone.replace(/\s+/g, '')}` : '' },
    { type: 'location', label: location, link: '' },
    { type: 'linkedin', label: linkedin, link: linkedin ? (linkedin.startsWith('http') ? linkedin : `https://${linkedin}`) : '' },
    { type: 'github', label: github, link: github ? (github.startsWith('http') ? github : `https://${github}`) : '' },
    { type: 'portfolio', label: portfolio, link: portfolio ? (portfolio.startsWith('http') ? portfolio : `https://${portfolio}`) : '' },
  ].filter((item) => item.label);

  if (!items.length) {
    canvas.moveDown(8);
    return;
  }

  const right = canvas.pageWidth - canvas.margins.right;
  let x = canvas.margins.left;

  items.forEach((item) => {
    const label = fitText(item.label, canvas.currentFont(false), 8.8, 145);
    const slotWidth = Math.min(
      canvas.textWidth(label, 8.8, false) + 20,
      canvas.contentWidth
    );
    if (x !== canvas.margins.left && x + slotWidth > right) {
      x = canvas.margins.left;
      canvas.moveDown(16);
    }
    if (canvas.y + 14 > canvas.pageBottom()) {
      canvas.addPage();
      x = canvas.margins.left;
    }
    const iconY = canvas.y;
    drawContactIcon(canvas, item.type, x, iconY);
    canvas.page.drawText(label, {
      x: x + 12,
      y: canvas.toPdfY_text(iconY, 8.8),
      size: 8.8,
      font: canvas.currentFont(false),
      color: hexToColor(canvas.theme.body),
    });

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
        canvas.page.node.addAnnot(ref);
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

// A4 in points — one constant so the downloaded PDF and the in-app
// document preview always agree on page geometry.
const PAGE_SIZE = [595.28, 841.89];

/**
 * Run the full resume layout against `doc`.
 *
 * `doc` is either a real pdf-lib PDFDocument (for the downloadable PDF) or
 * a recording document (for the in-app template preview — see
 * buildResumePdfLayout). Both expose the same small interface the render
 * code needs: metadata setters, embedStandardFont / embedJpg / embedPng,
 * addPage / getPage / getPages and a PDF context for link annotations.
 *
 * Everything below (header, sections, footer) is written once and drives
 * BOTH outputs, so the preview matches the PDF line-for-line — same text
 * wrapping (real Helvetica metrics), same page breaks, same positions.
 */
async function renderResumeDocument(doc, resumeData) {
  const firstName = safeText(resumeData.firstName, 'Candidate');
  const lastName = safeText(resumeData.lastName, 'User');
  const fullName = `${firstName} ${lastName}`.trim();
  const targetRole = safeText(resumeData.targetRole);
  const templateId = getTheme(resumeData.templateId).id;
  const theme = getTheme(templateId);

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
  doc.addPage(PAGE_SIZE); // A4 in points

  const canvas = new ResumeCanvas(doc, theme, { regular, bold });

  // --- header ---
  if (theme.headerStyle === 'academic-photo') {
    // DAAD-style header with two horizontal rules:
    //   [Name]                        [Photo]
    //   ════════════════════════════════════════  (rule 1)
    //   [Target Role]                  [Photo]
    //   [Contact Icons]                [Photo]
    //   Nationality: X                 [Photo]
    //   Date of birth: Y               [Photo]
    //   Place of birth: Z              [Photo]
    //   ════════════════════════════════════════  (rule 2)
    //   [Personal Statement heading + content]

    const photoW = 110;
    const photoH = 138; // 4:5 portrait, larger
    const photoX = canvas.pageWidth - canvas.margins.right - photoW;
    const photoY = canvas.y;
    const leftX = canvas.margins.left;
    const leftTextWidth = photoX - leftX - 14;

    // --- Photo (top-right) ---
    const photoBase64 = safeText(resumeData.photoBase64);
    let photoEmbedded = false;
    if (photoBase64) {
      try {
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
      const initials = `${safeText(resumeData.firstName, 'A').charAt(0)}${safeText(resumeData.lastName, 'U').charAt(0)}`.toUpperCase();
      canvas.drawRect(photoX, photoY, photoW, photoH, canvas.theme.chip);
      canvas.drawRect(photoX, photoY, photoW, photoH, canvas.theme.rule, { borderWidth: 0.75 });
      canvas.drawText(initials, {
        size: 38, bold: true, color: canvas.theme.blue,
        x: photoX, y: photoY + photoH / 2 - 19,
        maxWidth: photoW, align: 'center',
      });
    }

    // --- Name (top-left, beside photo) ---
    const nameY = photoY + 4;
    canvas.drawText(fullName, {
      size: 22, bold: true, color: theme.ink,
      x: leftX, y: nameY,
      maxWidth: leftTextWidth, align: 'left',
    });

    // --- Target role (ABOVE rule 1, below name) ---
    canvas.y = nameY + 28;
    if (targetRole) {
      canvas.drawText(targetRole, {
        size: 11, bold: false, color: theme.blue,
        x: leftX, y: canvas.y,
        maxWidth: leftTextWidth, align: 'left',
      });
      canvas.moveDown(16);
    }

    // --- Rule 1: LEFT COLUMN ONLY (stops before photo, no overlap) ---
    let ruleY = canvas.y;
    canvas.drawLine(leftX, ruleY, photoX - 8, ruleY, theme.rule, 0.75);

    // --- Contact icons ---
    canvas.y = ruleY + 6;
    addContactIconsRow(canvas, resumeData);

    // --- Personal details (Nationality, DOB, POB) as separate lines ---
    const personalLines = [
      safeText(resumeData.nationality) ? `Nationality: ${safeText(resumeData.nationality)}` : '',
      safeText(resumeData.dateOfBirth) ? `Date of birth: ${safeText(resumeData.dateOfBirth)}` : '',
      safeText(resumeData.placeOfBirth) ? `Place of birth: ${safeText(resumeData.placeOfBirth)}` : '',
    ].filter(Boolean);

    personalLines.forEach((line) => {
      canvas.drawText(line, {
        size: 9, color: canvas.theme.muted,
        x: leftX, y: canvas.y,
        maxWidth: leftTextWidth, align: 'left',
      });
      canvas.moveDown(13);
    });

    // --- Move cursor below the photo (whichever is lower) ---
    canvas.y = Math.max(canvas.y, photoY + photoH + 8);

    // --- Rule 2: full width, separates header from body ---
    ruleY = canvas.y;
    canvas.drawLine(leftX, ruleY, canvas.pageWidth - canvas.margins.right, ruleY, theme.rule, 0.75);
    canvas.moveDown(14);
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
    const headerY = canvas.y;
    canvas.drawRect(
      canvas.margins.left,
      headerY,
      canvas.contentWidth,
      64,
      theme.blue
    );
    canvas.drawText(fullName, {
      size: 20,
      bold: true,
      color: '#FFFFFF',
      x: canvas.margins.left + 14,
      y: headerY + 12,
      maxWidth: canvas.contentWidth - 28,
    });
    if (targetRole) {
      canvas.drawText(targetRole, {
        size: 10.5,
        bold: true,
        color: '#DDEEF8',
        x: canvas.margins.left + 14,
        y: headerY + 40,
        maxWidth: canvas.contentWidth - 28,
      });
    }
    canvas.y = headerY + 76;
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
          const lineY = canvas.y + 2;
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
        const lineY = canvas.y + 2;
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
}

function assertResumeData(resumeData) {
  if (!resumeData || typeof resumeData !== 'object' || Array.isArray(resumeData)) {
    throw new TypeError('Resume data must be an object.');
  }
}

export async function buildResumePdfBytes(resumeData = {}) {
  assertResumeData(resumeData);

  const doc = await PDFDocument.create();
  await renderResumeDocument(doc, resumeData);

  // useObjectStreams: false — object-stream serialization (the pako flate
  // path inside pdf-lib's save) is the most fragile part of pdf-lib on
  // Hermes / React Native and has been linked to hard native crashes when
  // the PDF button is tapped. A classic xref-table PDF is a few KB larger
  // but far more compatible with every viewer.
  return doc.save({ useObjectStreams: false });
}

// ---------- recording document (in-app template preview) ----------
//
// To show users EXACTLY how their downloaded PDF will look, the same
// render code above is re-run against this recording document: every
// page.drawText / drawLine / drawRectangle / drawCircle / drawImage call
// is captured (in PDF coordinates) instead of written into a real PDF.
// components/resume/PdfDocumentPreview.js then paints the recorded
// operations as React Native views at A4 proportions.

function pdfColorToHex(color) {
  if (!color || typeof color !== 'object') return '#000000';
  const part = (value) =>
    Math.max(0, Math.min(255, Math.round((value ?? 0) * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(color.red)}${part(color.green)}${part(color.blue)}`;
}

function isBoldFont(font) {
  return Boolean(font && font.name && String(font.name).includes('Bold'));
}

function createRecordingPage(width, height) {
  const page = {
    width,
    height,
    ops: [],
    node: { addAnnot: () => {} },
    getWidth: () => page.width,
    getHeight: () => page.height,
    drawText(text, options = {}) {
      const value = String(text ?? '');
      if (!value) return;
      page.ops.push({
        type: 'text',
        text: value,
        x: options.x ?? 0,
        y: options.y ?? 0,
        size: options.size ?? 10,
        bold: isBoldFont(options.font),
        color: pdfColorToHex(options.color),
      });
    },
    drawLine(options = {}) {
      page.ops.push({
        type: 'line',
        x1: options.start?.x ?? 0,
        y1: options.start?.y ?? 0,
        x2: options.end?.x ?? 0,
        y2: options.end?.y ?? 0,
        thickness: options.thickness ?? 1,
        color: pdfColorToHex(options.color),
      });
    },
    drawRectangle(options = {}) {
      page.ops.push({
        type: 'rect',
        x: options.x ?? 0,
        y: options.y ?? 0,
        width: options.width ?? 0,
        height: options.height ?? 0,
        color: options.color ? pdfColorToHex(options.color) : null,
        borderColor: options.borderColor ? pdfColorToHex(options.borderColor) : null,
        borderWidth: options.borderWidth ?? 0,
      });
    },
    drawCircle(options = {}) {
      page.ops.push({
        type: 'circle',
        cx: options.x ?? 0,
        cy: options.y ?? 0,
        r: options.size ?? 0,
        color: options.color ? pdfColorToHex(options.color) : null,
        borderColor: options.borderColor ? pdfColorToHex(options.borderColor) : null,
        borderWidth: options.borderWidth ?? 0,
      });
    },
    drawImage(image, options = {}) {
      if (!image || !image.base64) return;
      page.ops.push({
        type: 'image',
        x: options.x ?? 0,
        y: options.y ?? 0,
        width: options.width ?? 0,
        height: options.height ?? 0,
        base64: image.base64,
        mime: image.mime || 'image/jpeg',
      });
    },
  };
  return page;
}

function createRecordingDoc(fonts) {
  const pages = [];
  return {
    // The render code registers link annotations through the low-level
    // context — the preview doesn't need them, so accept and ignore.
    context: {
      obj: () => ({}),
      register: () => ({}),
    },
    setTitle: () => {},
    setAuthor: () => {},
    setSubject: () => {},
    setCreator: () => {},
    setProducer: () => {},
    // Return the REAL pdf-lib fonts (from a throwaway metrics document) so
    // widthOfTextAtSize uses true Helvetica metrics — the preview wraps and
    // paginates exactly like the PDF.
    embedStandardFont: (name) =>
      name === StandardFonts.HelveticaBold ? fonts.bold : fonts.regular,
    embedJpg: async (bytes) => ({
      base64: bytesToBase64(bytes),
      mime: 'image/jpeg',
    }),
    embedPng: async (bytes) => ({
      base64: bytesToBase64(bytes),
      mime: 'image/png',
    }),
    addPage: (size) => {
      const page = createRecordingPage(
        size?.[0] ?? PAGE_SIZE[0],
        size?.[1] ?? PAGE_SIZE[1]
      );
      pages.push(page);
      return page;
    },
    getPage: (index) => pages[index],
    getPages: () => pages,
    getResult: () => ({
      pages: pages.map((page) => ({
        width: page.width,
        height: page.height,
        ops: page.ops,
      })),
    }),
  };
}

/**
 * Build a full document LAYOUT description for the in-app preview — the
 * exact draw operations the PDF generator would emit, page by page.
 *
 * Returns: { pages: [{ width, height, ops: [...] }] }
 */
export async function buildResumePdfLayout(resumeData = {}) {
  assertResumeData(resumeData);

  // Real pdf-lib fonts for true Helvetica metrics (pure AFM math — nothing
  // is written to disk, no document is serialized).
  const metricsDoc = await PDFDocument.create();
  const fonts = {
    regular: metricsDoc.embedStandardFont(StandardFonts.Helvetica),
    bold: metricsDoc.embedStandardFont(StandardFonts.HelveticaBold),
  };

  const doc = createRecordingDoc(fonts);
  await renderResumeDocument(doc, resumeData);
  return doc.getResult();
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
  buildResumePdfLayout,
  buildResumeFilename,
};

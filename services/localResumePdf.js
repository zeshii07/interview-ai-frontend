/**
 * Local PDF generator for resumes — used as a fallback when the backend
 * is unreachable. Mirrors the visual structure of the server-side
 * resumePdfService.js (ATS templates, contact rows, bullets, sections).
 *
 * Uses pdf-lib (pure JS, no native deps, works in Expo / React Native)
 * and the StandardFonts (Helvetica family) so there are no extra font
 * assets to bundle.
 *
 * ⚠️ IMPORTANT — WinAnsi encoding constraint:
 * pdf-lib's StandardFonts (Helvetica, Times-Roman, Courier) only support
 * the WinAnsi (CP-1252) character set. Any character outside this range
 * (emojis, CJK, Arabic, Cyrillic, smart quotes, em-dashes, etc.) causes
 * pdf-lib to throw: "WinAnsi cannot encode X (0xXXXX)".
 *
 * The `sanitizeForWinAnsi()` function below replaces common Unicode chars
 * with their WinAnsi equivalents and strips anything that can't be encoded.
 * It is called inside `safeText()` so ALL text flowing through the PDF
 * is sanitized at the source, plus a second safety net in
 * `ResumeCanvas.drawText()`.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib';

// ---------- helpers ----------

/**
 * Replace common Unicode characters with WinAnsi (CP-1252) equivalents
 * and strip anything that pdf-lib's StandardFonts cannot encode.
 *
 * This fixes the "WinAnsi cannot encode" error that occurs when resume
 * content contains smart quotes, em-dashes, emojis, arrows, bullets,
 * or any non-Latin text (Urdu, Hindi, Arabic, CJK, Cyrillic, etc.).
 *
 * The WinAnsi character set covers:
 *   - 0x00-0x7F  (ASCII)
 *   - 0xA0-0xFF  (Latin-1 supplement: àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ, etc.)
 *   - 0x80-0x9F  (selected chars: €‚ƒ„…†‡ˆ‰Š‹ŒŽ''""•–—˜™š›œžŸ)
 *
 * Everything else is either replaced with a close ASCII equivalent or
 * stripped. Emojis are always stripped (they have no WinAnsi mapping).
 */
function sanitizeForWinAnsi(input) {
  if (input == null) return '';
  let s = typeof input === 'string' ? input : String(input);

  // 1. Replace common Unicode punctuation/symbols with ASCII equivalents.
  s = s
    // Dashes
    .replace(/[\u2010\u2011]/g, '-')   // hyphen, non-breaking hyphen
    .replace(/\u2012/g, '=')           // figure dash
    .replace(/\u2013/g, '-')           // en dash
    .replace(/\u2014/g, '--')          // em dash → double hyphen
    .replace(/\u2015/g, '--')          // horizontal bar
    // Quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // single curly quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // double curly quotes
    .replace(/\u00AB/g, '<<')          // «
    .replace(/\u00BB/g, '>>')          // »
    // Spaces
    .replace(/[\u00A0\u2007\u202F]/g, ' ')   // non-breaking spaces
    .replace(/[\u2000-\u200A\u205F]/g, ' ')  // various width spaces
    .replace(/\u200B/g, '')            // zero-width space
    .replace(/\u2028/g, '\n')          // line separator
    .replace(/\u2029/g, '\n')          // paragraph separator
    // Ellipsis & misc punctuation
    .replace(/\u2026/g, '...')         // …
    .replace(/\u2044/g, '/')           // ⁄ fraction slash
    // Bullets & dots (U+2022 • IS in WinAnsi at 0x95, but keep for safety)
    .replace(/[\u2023\u2043\u204C\u204D\u2219\u25AA\u25CF\u25E6]/g, '*')
    // Arrows
    .replace(/\u2192/g, '->')          // →
    .replace(/\u2190/g, '<-')          // ←
    .replace(/\u2191/g, '^')           // ↑
    .replace(/\u2193/g, 'v')           // ↓
    .replace(/\u21D2/g, '=>')          // ⇒
    // Math symbols
    .replace(/\u00D7/g, 'x')           // × multiplication
    .replace(/\u00F7/g, '/')           // ÷ division
    .replace(/\u2212/g, '-')           // − minus sign
    .replace(/\u2217/g, '*')           // ∗ asterisk operator
    .replace(/\u2260/g, '!=')          // ≠
    .replace(/\u2264/g, '<=')          // ≤
    .replace(/\u2265/g, '>=')          // ≥
    .replace(/\u2248/g, '~=')          // ≈
    .replace(/\u221E/g, 'inf')         // ∞
    .replace(/\u2211/g, 'sum')         // ∑
    .replace(/\u220F/g, 'prod')        // ∏
    .replace(/\u221A/g, 'sqrt')        // √
    .replace(/\u222B/g, 'int')         // ∫
    .replace(/\u03C0/g, 'pi')          // π
    .replace(/\u0394/g, 'Delta')       // Δ
    // Check marks & crosses
    .replace(/[\u2713\u2714]/g, 'OK')  // ✓
    .replace(/[\u2715\u2716\u2717\u2718]/g, 'x')  // ✗
    .replace(/[\u2605\u2606]/g, '*')   // ★ ☆
    // Trademark/copyright (™ is NOT in WinAnsi, ©® are)
    .replace(/\u2122/g, '(TM)')        // ™
    .replace(/\u00A9/g, '(c)')         // ©
    .replace(/\u00AE/g, '(R)')         // ®
    // Other WinAnsi-mappable chars in the 0x80-0x9F range (their Unicode
    // code points are > 0xFF, so step 3 below would strip them unless we
    // replace them here first).
    .replace(/\u2022/g, '*')           // • bullet (WinAnsi 0x95)
    .replace(/\u2020/g, '+')           // † dagger (WinAnsi 0x86)
    .replace(/\u2021/g, '++')          // ‡ double dagger (WinAnsi 0x87)
    .replace(/\u02C6/g, '^')           // ˆ modifier letter circumflex (WinAnsi 0x88)
    .replace(/\u2030/g, '0/00')        // ‰ per mille (WinAnsi 0x89)
    .replace(/\u0160/g, 'S')           // Š (WinAnsi 0x8A)
    .replace(/\u2039/g, '<')           // ‹ single left angle quote (WinAnsi 0x8B)
    .replace(/\u0152/g, 'OE')          // Œ (WinAnsi 0x8C)
    .replace(/\u017D/g, 'Z')           // Ž (WinAnsi 0x8E)
    .replace(/\u0161/g, 's')           // š (WinAnsi 0x9A)
    .replace(/\u203A/g, '>')           // › single right angle quote (WinAnsi 0x9B)
    .replace(/\u0153/g, 'oe')          // œ (WinAnsi 0x9C)
    .replace(/\u017E/g, 'z')           // ž (WinAnsi 0x9E)
    .replace(/\u0178/g, 'Y')           // Ÿ (WinAnsi 0x9F)
    .replace(/\u02DC/g, '~')           // ˜ small tilde (WinAnsi 0x98)
    .replace(/\u0192/g, 'f')           // ƒ (WinAnsi 0x83)
    // Currency (€ IS in WinAnsi at 0x80, but safer to replace)
    .replace(/\u20AC/g, 'EUR')         // €
    .replace(/\u20A3/g, 'FRF')         // ₣
    .replace(/\u20A4/g, 'GBP')         // £ (also in WinAnsi, but safe)
    .replace(/\u00A5/g, 'JPY')         // ¥
    .replace(/\u20A6/g, 'NGN')         // ₦
    .replace(/\u20A8/g, 'Rs')          // ₨
    .replace(/\u20B9/g, 'Rs')          // ₹
    .replace(/\u20AA/g, 'ILS')         // ₪
    .replace(/\u20AB/g, 'VND')         // ₫
    .replace(/\u20B1/g, 'PHP')         // ₱
    .replace(/\u20B2/g, 'PYG')         // ₲
    .replace(/\u20B4/g, 'UAH')         // ₴
    .replace(/\u20B5/g, 'GHS')         // ₵
    // Fractions
    .replace(/\u00BC/g, '1/4')
    .replace(/\u00BD/g, '1/2')
    .replace(/\u00BE/g, '3/4')
    // Degree & plus-minus (in WinAnsi, but safe to keep)
    // .replace(/\u00B0/g, ' deg ')     // ° — keep, it's in WinAnsi
    // .replace(/\u00B1/g, '+/-')       // ± — keep, it's in WinAnsi
    // Typography
    .replace(/\u00A6/g, '|')           // ¦ broken bar
    .replace(/\u00AD/g, '-')           // ­ soft hyphen
    .replace(/\u00B7/g, '.')           // · middle dot
    .replace(/\u2016/g, '||')          // ‖ double vertical line
    .replace(/\u2032/g, "'")           // ′ prime
    .replace(/\u2033/g, '"')           // ″ double prime
    .replace(/\u2039/g, '<')           // ‹
    .replace(/\u203A/g, '>')           // ›
    .replace(/\u00BF/g, '?')           // ¿ inverted question mark
    .replace(/\u00A1/g, '!')           // ¡ inverted exclamation mark
    // Roman numerals
    .replace(/[\u2160-\u216F]/g, (m) => {
      const map = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','L','C','D','M'];
      return map[m.charCodeAt(0) - 0x2160] || '';
    });

  // 2. Strip ALL emojis and symbols outside the Unicode basic planes.
  //    This catches: 😀🎉🔥⚡🌱🎯🧠💻 (and thousands more).
  //    Range: U+1F000 to U+1FAFF (Emoticons, Misc Symbols, Pictographs,
  //    Transport, Supplemental Symbols, Symbols and Pictographs Extended-A)
  s = s.replace(/[\u{1F000}-\u{1FAFF}]/gu, '');
  //    Dingbats, Misc Symbols, Transport (U+2700-U+27BF, U+2600-U+26FF)
  s = s.replace(/[\u{2600}-\u{27BF}]/gu, '');
  //    Variation selectors (invisible emoji modifiers)
  s = s.replace(/[\u{FE00}-\u{FE0F}]/gu, '');
  //    Zero-width joiner and non-joiner
  s = s.replace(/[\u{200D}\u{200C}]/gu, '');

  // 3. Strip any remaining characters that are NOT in the WinAnsi range.
  //    WinAnsi covers: 0x00-0x7F (ASCII) + 0xA0-0xFF (Latin-1) + selected
  //    chars in 0x80-0x9F. We allow 0x00-0xFF and strip everything else.
  //    This catches: CJK (Chinese/Japanese/Korean), Arabic, Hebrew,
  //    Cyrillic, Thai, Devanagari (Hindi/Urdu when in Devanagari script),
  //    and any other non-Latin script.
  s = s.replace(/[^\x00-\xFF]/g, '');

  return s;
}

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
  if (typeof value === 'string') return sanitizeForWinAnsi(value.trim() || fallback);
  if (typeof value === 'number') return sanitizeForWinAnsi(String(value));
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
  const ellipsisWidth = font.widthOfTextAtSize(ellipsis, fontSize);
  if (ellipsisWidth > maxWidth) return '';

  const targetWidth = maxWidth - ellipsisWidth;
  let low = 0;
  let high = value.length;
  let best = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const substr = value.slice(0, mid).trimEnd();
    if (font.widthOfTextAtSize(substr, fontSize) <= targetWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return `${value.slice(0, best).trimEnd()}${ellipsis}`;
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
      lineHeight,
    } = options;

    const safeValue = sanitizeForWinAnsi(value);
    if (!safeValue) return;

    const font = this.currentFont(bold);
    const colorRgb = typeof color === 'string' ? hexToColor(color) : color;
    const effectiveWidth = maxWidth || this.contentWidth;
    const actualLineHeight = lineHeight || Math.round((size + 3.5) * 10) / 10;

    if (maxWidth || align === 'center' || align === 'right') {
      const lines = wrapText(safeValue, font, size, effectiveWidth);
      let cursorY = (y === this.y) ? this.y : y;
      lines.forEach((line) => {
        if (cursorY + size + 2 > this.pageBottom()) {
          this.addPage();
          cursorY = this.margins.top;
        }
        const lineWidth = font.widthOfTextAtSize(line, size);
        let drawX = x;
        if (align === 'center') {
          drawX = x + Math.max(0, (effectiveWidth - lineWidth) / 2);
        } else if (align === 'right') {
          drawX = x + Math.max(0, effectiveWidth - lineWidth);
        }
        this.page.drawText(line, {
          x: drawX,
          y: this.toPdfY_text(cursorY, size),
          size,
          font,
          color: colorRgb,
        });
        cursorY += actualLineHeight;
      });
      this.y = cursorY;
    } else {
      this.ensureSpace(size + 3);
      this.page.drawText(safeValue, {
        x,
        y: this.toPdfY_text(this.y, size),
        size,
        font,
        color: colorRgb,
      });
      this.y += actualLineHeight;
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
  // Ensure enough space for the heading and at least the first item below it
  canvas.ensureSpace(50);
  if (canvas.y > canvas.margins.top + 6) {
    canvas.moveDown(12);
  }
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
      size: 11,
      bold: true,
      color: '#FFFFFF',
      x: canvas.margins.left + 8,
      y: y + 4,
    });
    canvas.y = y + 26;
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
      size: 11,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left + 10,
      y: y + 4,
    });
    canvas.y = y + 26;
  } else if (theme.headingStyle === 'academic') {
    // Europass-style: uppercase heading with a thin colored rule beneath
    canvas.drawText(title.toUpperCase(), {
      size: 11.5,
      bold: true,
      color: theme.blue,
      x: canvas.margins.left,
      y,
    });
    const lineY = y + 16;
    canvas.drawLine(
      canvas.margins.left,
      lineY,
      canvas.pageWidth - canvas.margins.right,
      lineY,
      theme.rule,
      0.75
    );
    canvas.y = lineY + 8;
  } else {
    canvas.drawText(title.toUpperCase(), {
      size: 12,
      bold: true,
      color: theme.ink,
      x: canvas.margins.left,
      y,
    });
    const lineY = y + 16;
    canvas.drawLine(
      canvas.margins.left,
      lineY,
      canvas.pageWidth - canvas.margins.right,
      lineY,
      theme.rule,
      theme.headingStyle === 'european' ? 1 : 1.5
    );
    canvas.y = lineY + 8;
  }
}

function addParagraph(canvas, value, options = {}) {
  const text = safeText(value);
  if (!text) return;
  const size = options.size || 9.5;
  const lineHeight = options.lineHeight || 13.5;
  canvas.drawText(text, {
    size,
    color: options.color || canvas.theme.body,
    maxWidth: options.width || canvas.contentWidth,
    align: options.align || 'left',
    lineHeight,
  });
  canvas.moveDown(4);
}

function addBulletPoint(canvas, value) {
  const text = safeText(value);
  if (!text) return;
  const font = canvas.currentFont(false);
  const fontSize = 9.5;
  const lineHeight = 13.5;
  const textLeft = canvas.margins.left + 12;
  const maxWidth = canvas.contentWidth - 12;
  const wrapped = wrapText(text, font, fontSize, maxWidth);
  if (!wrapped.length) return;

  // Keep bullet dot and first line together atomically
  canvas.ensureSpace(lineHeight * Math.min(2, wrapped.length));

  // Bullet dot aligned with lowercase character center of the first line
  const dotX = canvas.margins.left + 3.5;
  const firstLineBaseY = canvas.toPdfY_text(canvas.y, fontSize);
  const dotPdfY = firstLineBaseY + 3.2;

  canvas.page.drawCircle({
    x: dotX,
    y: dotPdfY,
    size: 1.5,
    color: hexToColor(canvas.theme.body),
  });

  wrapped.forEach((line) => {
    if (canvas.y + lineHeight > canvas.pageBottom()) {
      canvas.addPage();
    }
    canvas.page.drawText(line || '', {
      x: textLeft,
      y: canvas.toPdfY_text(canvas.y, fontSize),
      size: fontSize,
      font,
      color: hexToColor(canvas.theme.body),
    });
    canvas.y += lineHeight;
  });
  canvas.moveDown(3);
}

function addHeadingRow(canvas, leftText, rightText) {
  const left = safeText(leftText);
  const right = safeText(rightText);
  if (!left && !right) return;

  const font = canvas.currentFont(true);
  const fontSize = 11;
  const lineHeight = 15;

  const rightWidth = right ? font.widthOfTextAtSize(right, fontSize) + 12 : 0;
  const leftMaxWidth = canvas.contentWidth - rightWidth;
  const wrappedLeft = wrapText(left, font, fontSize, leftMaxWidth);

  canvas.ensureSpace(lineHeight * Math.max(1, wrappedLeft.length));
  const startY = canvas.y;

  wrappedLeft.forEach((line, idx) => {
    canvas.page.drawText(line, {
      x: canvas.margins.left,
      y: canvas.toPdfY_text(startY + idx * lineHeight, fontSize),
      size: fontSize,
      font,
      color: hexToColor(canvas.theme.body),
    });
  });

  if (right) {
    const rWidth = font.widthOfTextAtSize(right, fontSize);
    canvas.page.drawText(right, {
      x: canvas.pageWidth - canvas.margins.right - rWidth,
      y: canvas.toPdfY_text(startY, fontSize),
      size: fontSize,
      font,
      color: hexToColor(canvas.theme.body),
    });
  }

  canvas.y = startY + (Math.max(1, wrappedLeft.length) * lineHeight) + 2;
}

function addSubheadingRow(canvas, leftText, rightText) {
  const left = safeText(leftText);
  const right = safeText(rightText);
  if (!left && !right) return;

  const leftFont = canvas.currentFont(true);
  const rightFont = canvas.currentFont(false);
  const fontSize = 9.2;
  const lineHeight = 13;

  const rightWidth = right ? rightFont.widthOfTextAtSize(right, 8.8) + 12 : 0;
  const leftMaxWidth = canvas.contentWidth - rightWidth;
  const wrappedLeft = wrapText(left, leftFont, fontSize, leftMaxWidth);

  canvas.ensureSpace(lineHeight * Math.max(1, wrappedLeft.length));
  const startY = canvas.y;

  wrappedLeft.forEach((line, idx) => {
    canvas.page.drawText(line, {
      x: canvas.margins.left,
      y: canvas.toPdfY_text(startY + idx * lineHeight, fontSize),
      size: fontSize,
      font: leftFont,
      color: hexToColor(canvas.theme.blue),
    });
  });

  if (right) {
    const rWidth = rightFont.widthOfTextAtSize(right, 8.8);
    canvas.page.drawText(right, {
      x: canvas.pageWidth - canvas.margins.right - rWidth,
      y: canvas.toPdfY_text(startY, 8.8),
      size: 8.8,
      font: rightFont,
      color: hexToColor(canvas.theme.body),
    });
  }

  canvas.y = startY + (Math.max(1, wrappedLeft.length) * lineHeight) + 2;
}

function addMetaRow(canvas, leftText, rightText) {
  const left = safeText(leftText);
  const right = safeText(rightText);
  if (!left && !right) return;

  const font = canvas.currentFont(false);
  const fontSize = 8.8;
  const lineHeight = 12.5;

  const rightWidth = right ? font.widthOfTextAtSize(right, fontSize) + 12 : 0;
  const leftMaxWidth = canvas.contentWidth - rightWidth;
  const wrappedLeft = wrapText(left, font, fontSize, leftMaxWidth);

  canvas.ensureSpace(lineHeight * Math.max(1, wrappedLeft.length));
  const startY = canvas.y;

  wrappedLeft.forEach((line, idx) => {
    canvas.page.drawText(line, {
      x: canvas.margins.left,
      y: canvas.toPdfY_text(startY + idx * lineHeight, fontSize),
      size: fontSize,
      font,
      color: hexToColor(canvas.theme.body),
    });
  });

  if (right) {
    const rWidth = font.widthOfTextAtSize(right, fontSize);
    canvas.page.drawText(right, {
      x: canvas.pageWidth - canvas.margins.right - rWidth,
      y: canvas.toPdfY_text(startY, fontSize),
      size: fontSize,
      font,
      color: hexToColor(canvas.theme.body),
    });
  }

  canvas.y = startY + (Math.max(1, wrappedLeft.length) * lineHeight) + 2;
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
  const lineHeight = 21;
  const padding = 16;
  const chipHeight = 17;

  canvas.ensureSpace(chipHeight + 8);

  values.forEach((skill) => {
    const displaySkill = fitText(skill, canvas.currentFont(false), 9, 140);
    const textWidth = canvas.textWidth(displaySkill, 9, false);
    const chipWidth = Math.min(textWidth + padding, 160);
    if (x !== left && x + chipWidth > right) {
      x = left;
      canvas.moveDown(lineHeight);
    }
    if (canvas.y + chipHeight > canvas.pageBottom()) {
      canvas.addPage();
      x = left;
    }
    const chipY = canvas.y;
    canvas.drawRect(x, chipY, chipWidth, chipHeight, canvas.theme.chip);
    canvas.page.drawText(displaySkill, {
      x: x + Math.round((chipWidth - textWidth) / 2),
      y: canvas.toPdfY_text(chipY + 4, 9),
      size: 9,
      font: canvas.currentFont(false),
      color: hexToColor(canvas.theme.blue),
    });
    x += chipWidth + 8;
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
    addBulletPoint(canvas, line.replace(/^[•*-]\s*/, ''));
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
    addParagraph(canvas, 'Available on request.');
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
        lineHeight: 13.5,
      });
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

/**
 * Local DOCX fallback for resumes — used when the backend is unreachable.
 *
 * Produces a Word-compatible .doc file using the well-known HTML-with-.doc
 * technique. Word, LibreOffice, Google Docs, and Pages all open HTML files
 * saved with a .doc extension as proper Word documents.
 *
 * Why not the `docx` npm package?
 *   The `docx` library depends on `jszip` + browser Blob/Worker APIs that are
 *   painful to polyfill inside React Native / Expo. The HTML approach is
 *   ~100 lines, has zero dependencies, and renders cleanly in every word
 *   processor we care about.
 *
 * Visual styling mirrors the PDF output for each of the 5 templates:
 *   - ats-classic:              left-aligned name, thin rule under section heading
 *   - corporate-professional:   centered name, navy band on section headings
 *   - european-standard:        blue header box, blue rules
 *   - technical-compact:        green chip + accent bar on section headings
 *   - eu-academic:              centered name with thin centered rule, accent rules
 */

// ---------- helpers ----------

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// ---------- templates ----------

const TEMPLATE_THEMES = {
  'ats-classic': {
    ink: '#292929', body: '#414141', muted: '#727272', accent: '#3567F0', chipBg: '#EEF3FF', rule: '#292929',
    headerAlign: 'left',
    headingStyle: 'classic', // thin rule under heading
  },
  'corporate-professional': {
    ink: '#182433', body: '#263442', muted: '#617080', accent: '#17365D', chipBg: '#EAF0F7', rule: '#17365D',
    headerAlign: 'center',
    headingStyle: 'band', // filled navy band
  },
  'european-standard': {
    ink: '#18354A', body: '#304A5D', muted: '#687F8E', accent: '#005B96', chipBg: '#E8F3F9', rule: '#005B96',
    headerAlign: 'left',
    headingStyle: 'european', // thin blue rule
  },
  'technical-compact': {
    ink: '#193B38', body: '#2E4946', muted: '#687C79', accent: '#0F766E', chipBg: '#E5F4F1', rule: '#0F766E',
    headerAlign: 'left',
    headingStyle: 'technical', // accent bar + chip background
  },
  'eu-academic': {
    ink: '#1A2A4F', body: '#2C3E50', muted: '#7B8794', accent: '#1A2A4F', chipBg: '#E8EEF7', rule: '#1A2A4F',
    headerAlign: 'center',
    headingStyle: 'academic', // thin centered rule under heading text
  },
  'academic-photo': {
    ink: '#1A2A4F', body: '#2C3E50', muted: '#7B8794', accent: '#1A2A4F', chipBg: '#E8EEF7', rule: '#1A2A4F',
    headerAlign: 'left',
    headingStyle: 'academic',
  },
};

function getTheme(templateId) {
  return TEMPLATE_THEMES[templateId] && TEMPLATE_THEMES[templateId].accent
    ? TEMPLATE_THEMES[templateId]
    : TEMPLATE_THEMES['ats-classic'];
}

/**
 * Format education date range from start + end (year) fields.
 */
function formatEducationDateRange(startDate, endDate) {
  const start = safeText(startDate);
  const end = safeText(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Present`;
  if (end) return end;
  return '';
}

// ---------- contact icons (no visible text, only hyperlinked Unicode glyphs) ----------

function buildContactIconsRow(resumeData, theme) {
  const email = safeText(resumeData.email);
  const phone = safeText(resumeData.phone);
  const location = safeText(resumeData.location);
  const linkedin = safeText(resumeData.linkedin);
  const github = safeText(resumeData.github);
  const portfolio = safeText(resumeData.portfolio);

  const glyphMap = {
    email: '&#9993;',     // ✉
    phone: '&#9742;',     // ☎
    linkedin: 'in',
    github: 'GH',
    portfolio: '&#128279;', // 🔗 chain
    location: '&#9678;',  // ◉
  };

  const items = [
    { type: 'email',     val: email,    link: email ? `mailto:${email}` : '' },
    { type: 'phone',     val: phone,    link: phone ? `tel:${phone.replace(/\s+/g, '')}` : '' },
    { type: 'location',  val: location, link: '' },
    { type: 'linkedin',  val: linkedin, link: linkedin ? (linkedin.startsWith('http') ? linkedin : `https://${linkedin}`) : '' },
    { type: 'github',    val: github,   link: github ? (github.startsWith('http') ? github : `https://${github}`) : '' },
    { type: 'portfolio', val: portfolio,link: portfolio ? (portfolio.startsWith('http') ? portfolio : `https://${portfolio}`) : '' },
  ].filter((it) => it.val);

  if (!items.length) return '';

  const parts = items.map((item) => {
    const glyph = glyphMap[item.type] || '&#9679;';
    const fontSize = (item.type === 'linkedin' || item.type === 'github') ? '9pt' : '13pt';
    const styledGlyph = `<span style="color:${theme.accent};font-size:${fontSize};font-weight:bold;text-decoration:none;">${glyph}</span>`;
    if (item.link) {
      return `<a href="${escapeHtml(item.link)}" style="text-decoration:none;color:${theme.accent};">${styledGlyph}</a>`;
    }
    return styledGlyph;
  });

  return `<div style="text-align:${theme.headerAlign};color:${theme.body};font-size:13pt;font-family:Helvetica,Arial,sans-serif;margin-bottom:10pt;">${parts.join('&nbsp;&nbsp;&nbsp;&nbsp;')}</div>`;
}

// ---------- header ----------

function buildHeader(resumeData, theme) {
  const fullName = `${safeText(resumeData.firstName, 'Candidate')} ${safeText(resumeData.lastName, 'User')}`.trim();
  const targetRole = safeText(resumeData.targetRole);
  const align = theme.headerAlign;
  const isAcademic = resumeData.templateId === 'eu-academic';
  const isAcademicPhoto = resumeData.templateId === 'academic-photo';
  const isCorporate = resumeData.templateId === 'corporate-professional';

  let html = '';

  if (isAcademicPhoto) {
    // DAAD-style: 2-column table — name/target on left, photo on right
    const photoBase64 = safeText(resumeData.photoBase64);
    const photoMime = safeText(resumeData.photoMimeType) || 'image/jpeg';
    let photoHtml;
    if (photoBase64) {
      photoHtml = `<img src="data:${photoMime};base64,${photoBase64}" width="95" height="119" style="border:0.75pt solid ${theme.rule};"/>`;
    } else {
      const initials = `${safeText(resumeData.firstName, 'A').charAt(0)}${safeText(resumeData.lastName, 'U').charAt(0)}`.toUpperCase();
      photoHtml = `<div style="width:95px;height:119px;background-color:${theme.chipBg};border:0.75pt solid ${theme.rule};display:flex;align-items:center;justify-content:center;color:${theme.accent};font-size:34pt;font-weight:bold;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(initials)}</div>`;
    }

    // Use a 2-column HTML table for the header layout
    html += `<table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;margin-bottom:6pt;"><tr>`;
    html += `<td style="width:75%;vertical-align:top;padding:0 14pt 0 0;">`;
    html += `<div style="font-size:22pt;font-weight:bold;color:${theme.ink};">${escapeHtml(fullName)}</div>`;
    if (targetRole) {
      html += `<div style="font-size:11pt;font-weight:bold;color:${theme.accent};margin-top:4pt;">${escapeHtml(targetRole)}</div>`;
    }
    html += `</td>`;
    html += `<td style="width:25%;vertical-align:top;text-align:right;">${photoHtml}</td>`;
    html += `</tr></table>`;
  } else if (isAcademic) {
    // Academic: centered name + centered thin rule
    html += `<div style="text-align:center;font-family:Helvetica,Arial,sans-serif;margin-bottom:6pt;">`;
    html += `<div style="font-size:22pt;font-weight:bold;color:${theme.ink};">${escapeHtml(fullName)}</div>`;
    if (targetRole) {
      html += `<div style="font-size:11pt;color:${theme.accent};margin-top:2pt;">${escapeHtml(targetRole)}</div>`;
    }
    html += `<div style="border-top:1pt solid ${theme.rule};margin:8pt 80pt 0 80pt;font-size:1pt;">&nbsp;</div>`;
    html += `</div>`;
  } else if (isCorporate) {
    // Corporate: centered name + bold
    html += `<div style="text-align:center;font-family:Helvetica,Arial,sans-serif;margin-bottom:6pt;">`;
    html += `<div style="font-size:22pt;font-weight:bold;color:${theme.ink};">${escapeHtml(fullName)}</div>`;
    if (targetRole) {
      html += `<div style="font-size:11pt;font-weight:bold;color:${theme.accent};margin-top:2pt;">${escapeHtml(targetRole)}</div>`;
    }
    html += `</div>`;
  } else {
    // Standard left-aligned header
    html += `<div style="text-align:${align};font-family:Helvetica,Arial,sans-serif;margin-bottom:6pt;">`;
    html += `<div style="font-size:22pt;font-weight:bold;color:${theme.ink};">${escapeHtml(fullName)}</div>`;
    if (targetRole) {
      html += `<div style="font-size:11pt;font-weight:bold;color:${theme.accent};margin-top:2pt;">${escapeHtml(targetRole)}</div>`;
    }
    html += `</div>`;
  }

  // academic personal details line
  if (isAcademic || isAcademicPhoto) {
    const parts = [
      safeText(resumeData.nationality) ? `Nationality: ${escapeHtml(safeText(resumeData.nationality))}` : '',
      safeText(resumeData.dateOfBirth) ? `Date of birth: ${escapeHtml(safeText(resumeData.dateOfBirth))}` : '',
      safeText(resumeData.placeOfBirth) ? `Place of birth: ${escapeHtml(safeText(resumeData.placeOfBirth))}` : '',
    ].filter(Boolean);
    if (parts.length) {
      html += `<div style="text-align:center;color:${theme.muted};font-size:9pt;font-family:Helvetica,Arial,sans-serif;margin-bottom:6pt;">${parts.join(' &nbsp;|&nbsp; ')}</div>`;
    }
  }

  // contact icons (no visible text — only hyperlinked Unicode glyphs)
  html += buildContactIconsRow(resumeData, theme);

  return html;
}

// ---------- section heading (template-specific) ----------

function buildSectionHeading(title, theme) {
  const text = escapeHtml(safeText(title).toUpperCase());
  const fontFamily = 'font-family:Helvetica,Arial,sans-serif;';

  if (theme.headingStyle === 'band') {
    // Corporate: full-width navy band, white text
    return `<div style="background-color:${theme.accent};padding:4pt 8pt;margin-top:14pt;margin-bottom:6pt;${fontFamily}"><span style="color:#FFFFFF;font-size:12pt;font-weight:bold;">${text}</span></div>`;
  }

  if (theme.headingStyle === 'technical') {
    // Technical: accent bar (5px) on left + chip background
    return `<div style="margin-top:14pt;margin-bottom:6pt;${fontFamily}display:flex;align-items:center;">` +
           `<span style="background-color:${theme.accent};width:5pt;height:18pt;display:inline-block;margin-right:6pt;">&nbsp;</span>` +
           `<span style="background-color:${theme.chipBg};padding:3pt 8pt;color:${theme.ink};font-size:12pt;font-weight:bold;flex:1;">${text}</span>` +
           `</div>`;
  }

  if (theme.headingStyle === 'academic') {
    // Academic: centered text + thin rule beneath
    return `<div style="margin-top:14pt;margin-bottom:6pt;${fontFamily}">` +
           `<div style="color:${theme.accent};font-size:11.5pt;font-weight:bold;">${text}</div>` +
           `<div style="border-top:0.75pt solid ${theme.rule};margin-top:2pt;font-size:1pt;">&nbsp;</div>` +
           `</div>`;
  }

  if (theme.headingStyle === 'european') {
    // European: thin (1pt) blue rule
    return `<div style="margin-top:14pt;margin-bottom:6pt;${fontFamily}">` +
           `<div style="color:${theme.ink};font-size:12pt;font-weight:bold;">${text}</div>` +
           `<div style="border-top:1pt solid ${theme.rule};margin-top:2pt;font-size:1pt;">&nbsp;</div>` +
           `</div>`;
  }

  // classic (ats-classic): 1.5pt rule under heading
  return `<div style="margin-top:14pt;margin-bottom:6pt;${fontFamily}">` +
         `<div style="color:${theme.ink};font-size:12pt;font-weight:bold;">${text}</div>` +
         `<div style="border-top:1.5pt solid ${theme.rule};margin-top:2pt;font-size:1pt;">&nbsp;</div>` +
         `</div>`;
}

// ---------- body builders ----------

function buildParagraph(text, theme) {
  return `<p style="font-size:10pt;color:${theme.body};line-height:1.4;margin:0 0 4pt 0;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(text)}</p>`;
}

function buildBullet(text, theme) {
  return `<ul style="margin:0 0 4pt 0;padding-left:18pt;font-family:Helvetica,Arial,sans-serif;"><li style="font-size:10pt;color:${theme.body};line-height:1.4;">${escapeHtml(text)}</li></ul>`;
}

function buildHeadingRow(leftText, rightText, theme) {
  const left = escapeHtml(safeText(leftText));
  const right = rightText ? `<span style="float:right;color:${theme.body};">${escapeHtml(safeText(rightText))}</span>` : '';
  return `<div style="font-size:11pt;font-weight:bold;color:${theme.body};font-family:Helvetica,Arial,sans-serif;margin-bottom:1pt;overflow:hidden;">${left}${right}</div>`;
}

function buildSubheadingRow(leftText, rightText, theme) {
  const left = leftText ? `<span style="color:${theme.accent};font-weight:bold;">${escapeHtml(safeText(leftText))}</span>` : '';
  const right = rightText ? `<span style="float:right;color:${theme.body};">${escapeHtml(safeText(rightText))}</span>` : '';
  if (!left && !right) return '';
  return `<div style="font-size:9.5pt;font-family:Helvetica,Arial,sans-serif;margin-bottom:1pt;overflow:hidden;">${left}${right}</div>`;
}

function buildMetaRow(leftText, rightText, theme) {
  const left = leftText ? escapeHtml(safeText(leftText)) : '';
  const right = rightText ? `<span style="float:right;color:${theme.body};">${escapeHtml(safeText(rightText))}</span>` : '';
  return `<div style="font-size:9pt;color:${theme.body};font-family:Helvetica,Arial,sans-serif;margin-bottom:3pt;overflow:hidden;">${left}${right}</div>`;
}

function buildSkillsSection(skills, theme) {
  const values = safeArray(skills)
    .map((s) => (typeof s === 'string' ? s.trim() : safeText(s?.name)))
    .filter(Boolean);
  if (!values.length) return '';

  let html = buildSectionHeading('Skills', theme);

  if (theme.headingStyle === 'technical') {
    // Technical: chip-style inline-blocks (mirrors PDF skill chips)
    html += '<div style="margin-top:2pt;">';
    values.forEach((skill) => {
      html += `<span style="display:inline-block;background-color:${theme.chipBg};color:${theme.accent};font-size:9pt;padding:3pt 9pt;margin:2pt 4pt 2pt 0;border-radius:3pt;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(skill)}</span>`;
    });
    html += '</div>';
  } else {
    // Other templates: comma-separated list (still readable, ATS-friendly)
    html += buildParagraph(values.join('  ·  '), theme);
  }
  return html;
}

function buildLanguagesBlock(languagesText, theme) {
  const text = safeText(languagesText);
  if (!text) return '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  let html = buildSectionHeading('Languages', theme);
  lines.forEach((line) => {
    html += buildBullet(line, theme);
  });
  return html;
}

function buildReferencesBlock(referencesText, theme) {
  const text = safeText(referencesText);
  if (!text) return '';
  let html = buildSectionHeading('References', theme);
  const trimmed = text.trim();
  if (/^available on request\.?$/i.test(trimmed)) {
    html += buildParagraph('Available on request.', theme);
    return html;
  }
  trimmed.split(/\r?\n/).forEach((line) => {
    if (line.trim()) html += buildParagraph(line, theme);
  });
  return html;
}

function buildCustomSection(section, theme) {
  const title = safeText(section?.title);
  const content = safeText(section?.content);
  if (!title || !content) return '';
  let html = buildSectionHeading(title, theme);
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    lines.forEach((l) => { html += buildBullet(l, theme); });
  } else {
    html += buildParagraph(content, theme);
  }
  return html;
}

// ---------- main entry ----------

export function buildResumeDocBytes(resumeData = {}) {
  if (!resumeData || typeof resumeData !== 'object' || Array.isArray(resumeData)) {
    throw new TypeError('Resume data must be an object.');
  }

  const templateId = getTheme(resumeData.templateId).accent
    ? resumeData.templateId
    : 'ats-classic';
  const theme = getTheme(templateId);
  const fullName = `${safeText(resumeData.firstName, 'Candidate')} ${safeText(resumeData.lastName, 'User')}`.trim();

  let body = '';

  // header
  body += buildHeader(resumeData, theme);

  // summary
  const summary = safeText(resumeData.summary);
  if (summary) {
    body += buildSectionHeading(
      (templateId === 'eu-academic' || templateId === 'academic-photo') ? 'Personal Statement' : 'Summary',
      theme
    );
    body += buildParagraph(summary, theme);
  }

  // ============================================================
  // EU ACADEMIC — Europass section order
  // ============================================================
  if (templateId === 'eu-academic' || templateId === 'academic-photo') {
    const education = safeArray(resumeData.education);
    if (education.length) {
      body += buildSectionHeading('Education', theme);
      education.forEach((item) => {
        // Line 1: degree (left) + gpa (right)
        body += buildHeadingRow(safeText(item?.degree, 'Qualification'), safeText(item?.gpa), theme);
        // Line 2: institution (left) + date range (right)
        const dateRange = formatEducationDateRange(item?.startDate, item?.year);
        if (safeText(item?.institution) || dateRange) {
          body += buildSubheadingRow(safeText(item?.institution), dateRange, theme);
        }
        // Line 3: location
        if (item?.location) {
          body += buildMetaRow(safeText(item?.location), '', theme);
        }
        body += '<div style="margin-bottom:6pt;"></div>';
      });
    }

    const projects = safeArray(resumeData.projects);
    if (projects.length) {
      body += buildSectionHeading('Research & Academic Projects', theme);
      projects.forEach((project) => {
        body += buildHeadingRow(safeText(project?.name, 'Project'), '', theme);
        const technologies = Array.isArray(project?.technologies)
          ? project.technologies.filter(Boolean).join(', ')
          : safeText(project?.technologies);
        if (technologies) {
          body += `<div style="font-size:8.5pt;color:${theme.muted};font-family:Helvetica,Arial,sans-serif;margin-bottom:2pt;">${escapeHtml(technologies)}</div>`;
        }
        const points = safeArray(project?.points).filter(Boolean);
        if (points.length) {
          points.forEach((p) => { body += buildBullet(p, theme); });
        } else if (project?.description) {
          body += buildParagraph(project.description, theme);
        }
        body += '<div style="margin-bottom:6pt;"></div>';
      });
    }

    const experience = safeArray(resumeData.experience);
    if (experience.length) {
      body += buildSectionHeading('Work & Internship Experience', theme);
      experience.forEach((item) => {
        body += buildHeadingRow(safeText(item?.role, 'Position'), safeText(item?.duration), theme);
        body += buildSubheadingRow(safeText(item?.company), safeText(item?.location), theme);
        safeArray(item?.points).forEach((p) => { body += buildBullet(p, theme); });
        body += '<div style="margin-bottom:6pt;"></div>';
      });
    }

    body += buildSkillsSection(safeArray(resumeData.skills), theme);
    body += buildLanguagesBlock(resumeData.languagesText, theme);

    const certifications = safeArray(resumeData.certifications);
    if (certifications.length) {
      body += buildSectionHeading('Certifications & Awards', theme);
      certifications.forEach((item) => {
        const cert = typeof item === 'string' ? { name: item } : item;
        body += buildHeadingRow(safeText(cert?.name), safeText(cert?.year), theme);
        if (cert?.issuer) {
          body += `<div style="font-size:9pt;color:${theme.accent};font-weight:bold;font-family:Helvetica,Arial,sans-serif;margin-bottom:3pt;">${escapeHtml(safeText(cert.issuer))}</div>`;
        }
      });
    }

    safeArray(resumeData.customSections).forEach((section) => {
      body += buildCustomSection(section, theme);
    });

    body += buildReferencesBlock(resumeData.referencesText, theme);
  } else {
    // ============================================================
    // Standard templates — original section order
    // ============================================================
    const education = safeArray(resumeData.education);
    if (education.length) {
      body += buildSectionHeading('Education', theme);
      education.forEach((item) => {
        // Line 1: degree (left) + gpa (right)
        body += buildHeadingRow(safeText(item?.degree, 'Qualification'), safeText(item?.gpa), theme);
        // Line 2: institution (left) + date range (right)
        const dateRange = formatEducationDateRange(item?.startDate, item?.year);
        if (safeText(item?.institution) || dateRange) {
          body += buildSubheadingRow(safeText(item?.institution), dateRange, theme);
        }
        // Line 3: location
        if (item?.location) {
          body += buildMetaRow(safeText(item?.location), '', theme);
        }
        body += '<div style="margin-bottom:6pt;"></div>';
      });
    }

    const experience = safeArray(resumeData.experience);
    if (experience.length) {
      body += buildSectionHeading('Experience', theme);
      experience.forEach((item) => {
        body += buildHeadingRow(safeText(item?.role, 'Position'), safeText(item?.duration), theme);
        body += buildSubheadingRow(safeText(item?.company), safeText(item?.location), theme);
        safeArray(item?.points).forEach((p) => { body += buildBullet(p, theme); });
        body += '<div style="margin-bottom:6pt;"></div>';
      });
    }

    const projects = safeArray(resumeData.projects);
    if (projects.length) {
      body += buildSectionHeading('Projects', theme);
      projects.forEach((project) => {
        body += buildHeadingRow(safeText(project?.name, 'Project'), '', theme);
        const technologies = Array.isArray(project?.technologies)
          ? project.technologies.filter(Boolean).join(', ')
          : safeText(project?.technologies);
        if (technologies) {
          body += `<div style="font-size:8.5pt;color:${theme.muted};font-family:Helvetica,Arial,sans-serif;margin-bottom:2pt;">${escapeHtml(technologies)}</div>`;
        }
        const points = safeArray(project?.points).filter(Boolean);
        if (points.length) {
          points.forEach((p) => { body += buildBullet(p, theme); });
        } else if (project?.description) {
          body += buildParagraph(project.description, theme);
        }
        body += '<div style="margin-bottom:6pt;"></div>';
      });
    }

    body += buildSkillsSection(safeArray(resumeData.skills), theme);

    const certifications = safeArray(resumeData.certifications);
    if (certifications.length) {
      body += buildSectionHeading('Certifications', theme);
      certifications.forEach((item) => {
        const cert = typeof item === 'string' ? { name: item } : item;
        body += buildHeadingRow(safeText(cert?.name), safeText(cert?.year), theme);
        if (cert?.issuer) {
          body += `<div style="font-size:9pt;color:${theme.accent};font-weight:bold;font-family:Helvetica,Arial,sans-serif;margin-bottom:3pt;">${escapeHtml(safeText(cert.issuer))}</div>`;
        }
      });
    }

    safeArray(resumeData.customSections).forEach((section) => {
      body += buildCustomSection(section, theme);
    });
  }

  // Wrap in Word-compatible HTML envelope
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(fullName)} - Resume</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page WordSection1 {
  size: 595.3pt 841.9pt;
  margin: 36pt 36pt 42pt 36pt;
}
div.WordSection1 { page: WordSection1; }
body { font-family: Helvetica, Arial, sans-serif; color: ${theme.body}; }
p, div, ul, li { margin-top: 0; margin-bottom: 0; }
ul { padding-left: 18pt; }
</style>
</head>
<body>
<div class="WordSection1">
${body}
</div>
</body>
</html>`;

  // Encode as UTF-8 bytes
  const bytes = new TextEncoder().encode(html);
  return bytes;
}

export function buildResumeDocFilename(resumeData = {}) {
  const firstName = safeText(resumeData.firstName, 'Candidate');
  const lastName = safeText(resumeData.lastName, 'Resume');
  const fullName = `${firstName}_${lastName}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  return `${fullName || 'Hirely_Candidate'}_Resume.doc`;
}

export default {
  buildResumeDocBytes,
  buildResumeDocFilename,
};

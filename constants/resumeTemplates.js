/**
 * Resume/CV template registry — the single source of truth for the 6 resume
 * templates.
 *
 * This module is shared by:
 *   - app/resume/generator.js      (template selection list shown to the user)
 *   - app/resume/preview.js        (in-app preview styled like the document)
 *   - services/localResumePdf.js   (PDF renderer theme tokens)
 *   - services/localResumeDocx.js  (DOCX renderer theme tokens)
 *
 * Previously each of those files defined its own copy of the template data,
 * which caused the classic inconsistency: the template picker showed one set
 * of colors, the preview showed a generic layout, and the downloaded PDF/DOCX
 * used a third set. Everything now reads from here.
 *
 * Document color tokens (ink/body/muted/accent/chip/rule/lightRule) are the
 * values used by the PDF and DOCX generators — the UI mirrors them so the
 * preview matches the download.
 *
 * Aliases: `blue` and `chip` are kept alongside `accent` and `chipBg` because
 * localResumePdf.js uses the former names internally.
 */

export const RESUME_TEMPLATES = [
  {
    id: 'ats-classic',
    name: 'Professional',
    description: 'Clean, balanced — works for most applications.',
    icon: 'document-text-outline',
    accent: '#3567F0',
    badge: 'Recommended',
  },
  {
    id: 'corporate-professional',
    name: 'Modern',
    description: 'Navy styling for business and large companies.',
    icon: 'business-outline',
    accent: '#17365D',
    badge: 'Popular',
  },
  {
    id: 'technical-compact',
    name: 'Technical',
    description: 'Compact skills-first layout for software roles.',
    icon: 'code-slash-outline',
    accent: '#0F766E',
  },
  {
    id: 'european-standard',
    name: 'Minimal',
    description: 'Clean A4 chronological CV, no clutter.',
    icon: 'remove-circle-outline',
    accent: '#005B96',
  },
  {
    id: 'eu-academic',
    name: 'Executive',
    description: 'Senior-level CV with leadership emphasis.',
    icon: 'ribbon-outline',
    accent: '#1A2A4F',
  },
  {
    id: 'academic-photo',
    name: 'Creative',
    description: 'Photo CV with portrait, for academic applications.',
    icon: 'person-circle-outline',
    accent: '#1A2A4F',
    badge: 'With photo',
  },
];

/**
 * Document theme tokens per template.
 *
 *   headingStyle : how section headings are drawn
 *                   - classic    : uppercase text + thin rule underneath
 *                   - band       : white text on a filled accent band
 *                   - european   : text + thin accent rule underneath
 *                   - technical  : accent bar on the left of the heading
 *                   - academic   : centered text + thin centered rule
 *   headerStyle / headerAlign : PDF / DOCX name-header treatment
 */
export const RESUME_TEMPLATE_THEMES = {
  'ats-classic': {
    id: 'ats-classic',
    ink: '#292929',
    body: '#414141',
    muted: '#727272',
    accent: '#3567F0',
    blue: '#3567F0',
    chip: '#EEF3FF',
    chipBg: '#EEF3FF',
    rule: '#292929',
    lightRule: '#C8C8C8',
    headingStyle: 'classic',
    headerStyle: 'left',
    headerAlign: 'left',
  },
  'corporate-professional': {
    id: 'corporate-professional',
    ink: '#182433',
    body: '#263442',
    muted: '#617080',
    accent: '#17365D',
    blue: '#17365D',
    chip: '#EAF0F7',
    chipBg: '#EAF0F7',
    rule: '#17365D',
    lightRule: '#B7C4D0',
    headingStyle: 'band',
    headerStyle: 'center',
    headerAlign: 'center',
  },
  'european-standard': {
    id: 'european-standard',
    ink: '#18354A',
    body: '#304A5D',
    muted: '#687F8E',
    accent: '#005B96',
    blue: '#005B96',
    chip: '#E8F3F9',
    chipBg: '#E8F3F9',
    rule: '#005B96',
    lightRule: '#B5D1E1',
    headingStyle: 'european',
    headerStyle: 'european',
    headerAlign: 'left',
  },
  'technical-compact': {
    id: 'technical-compact',
    ink: '#193B38',
    body: '#2E4946',
    muted: '#687C79',
    accent: '#0F766E',
    blue: '#0F766E',
    chip: '#E5F4F1',
    chipBg: '#E5F4F1',
    rule: '#0F766E',
    lightRule: '#B5D8D3',
    headingStyle: 'technical',
    headerStyle: 'technical',
    headerAlign: 'left',
  },
  'eu-academic': {
    id: 'eu-academic',
    ink: '#1A2A4F',
    body: '#2C3E50',
    muted: '#7B8794',
    accent: '#1A2A4F',
    blue: '#1A2A4F',
    chip: '#E8EEF7',
    chipBg: '#E8EEF7',
    rule: '#1A2A4F',
    lightRule: '#C5CFDD',
    headingStyle: 'academic',
    headerStyle: 'academic',
    headerAlign: 'center',
  },
  'academic-photo': {
    id: 'academic-photo',
    ink: '#1A2A4F',
    body: '#2C3E50',
    muted: '#7B8794',
    accent: '#1A2A4F',
    blue: '#1A2A4F',
    chip: '#E8EEF7',
    chipBg: '#E8EEF7',
    rule: '#1A2A4F',
    lightRule: '#C5CFDD',
    headingStyle: 'academic',
    headerStyle: 'academic-photo',
    headerAlign: 'left',
  },
};

export const DEFAULT_TEMPLATE_ID = 'ats-classic';

export function getResumeTemplate(id) {
  return RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0];
}

export function getResumeTemplateTheme(id) {
  return RESUME_TEMPLATE_THEMES[id] || RESUME_TEMPLATE_THEMES[DEFAULT_TEMPLATE_ID];
}

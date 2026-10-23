const SKILLS = [
  'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js', 'express', 'html', 'css',
  'bootstrap', 'jquery', 'tailwind', 'python', 'java', 'c++', 'c#', 'sql', 'mysql', 'mongodb',
  'postgresql', 'git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'rest api', 'graphql',
  'linux', 'testing', 'figma', 'asana', 'trello', 'jira', 'slack', 'toggl', 'microsoft project',
  'google drive', 'salesforce', 'excel', 'tableau', 'power bi', 'agile', 'scrum', 'confluence',
  'machine learning', 'project management', 'leadership', 'communication'
];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = (text, skill) =>
  new RegExp('(^|[^a-z0-9+#])' + esc(skill) + '([^a-z0-9+#]|$)').test(text);

const HEADINGS = [
  'contact', 'profile', 'summary', 'professional summary', 'objective', 'career objective',
  'education', 'projects', 'academic projects', 'personal projects',
  'experience', 'work experience', 'professional experience', 'employment', 'internships',
  'skills', 'tech skills', 'technical skills', 'soft skills', 'languages',
  'achievements', 'achievements & hackathons', 'certifications', 'awards', 'interests', 'references'
];

const norm = l => l.toLowerCase().replace(/[:\s]+$/, '');
const isHeading = l => HEADINGS.includes(norm(l));

function toLines(text) {
  return text.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// lines that sit under one of the given headings, until the next heading
function sectionOf(lines, names) {
  const out = [];
  let inside = false;
  for (const l of lines) {
    if (isHeading(l)) {
      inside = names.includes(norm(l));
      continue;
    }
    if (inside) out.push(l);
  }
  return out;
}

function guessName(lines) {
  const nameRe = /^[A-Z][A-Za-z.'-]+(?: [A-Z][A-Za-z.'-]+){1,3}$/;
  const ok = l => nameRe.test(l) && !isHeading(l);
  const early = lines.slice(0, 5).find(ok);
  if (early) return early;
  return lines.find(l => ok(l) && l === l.toUpperCase()) || '';
}

function findPhone(text) {
  const matches = text.match(/\+?\d[\d ().-]{8,}\d/g) || [];
  return matches.find(m => {
    const digits = m.replace(/\D/g, '').length;
    return digits >= 10 && digits <= 13;
  }) || '';
}

function projectTitles(sectionLines) {
  const dateTail = /\s+(?:[A-Za-z]{3,9}\s+)?\d{4}\s*[-–]\s*(?:[A-Za-z]{3,9}\s+)?(?:\d{4}|present|current)$/i;
  const titles = [];
  for (const l of sectionLines) {
    const short = l.split(' ').length <= 9;
    if (short && !/[.:]$/.test(l) && !/technologies used/i.test(l) && /^[A-Z0-9]/.test(l)) {
      const t = l.replace(dateTail, '');
      if (!titles.includes(t)) titles.push(t);
    }
  }
  return titles.slice(0, 6);
}

const eduRe = /\b(bachelor|master|b\.?\s?tech|m\.?\s?tech|b\.?sc|m\.?sc|ph\.?d|diploma|mba|university|college|institute)\b/i;

module.exports = function parseResume(text) {
  const lines = toLines(text);
  const lower = text.toLowerCase();

  const education = [];
  for (const l of lines) {
    if (l.split(' ').length <= 12 && eduRe.test(l) && !education.includes(l)) education.push(l);
    if (education.length === 3) break;
  }

  return {
    name: guessName(lines),
    email: (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0],
    phone: findPhone(text),
    education,
    skills: SKILLS.filter(k => has(lower, k)),
    projects: projectTitles(sectionOf(lines, ['projects', 'academic projects', 'personal projects'])),
    experience: sectionOf(lines, ['experience', 'work experience', 'professional experience', 'employment', 'internships']).slice(0, 3)
  };
};
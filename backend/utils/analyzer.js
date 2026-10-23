
const Anthropic = require('@anthropic-ai/sdk');

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

// Fallback analysis using keyword matching
function keywordAnalysis(resumeText, jdText) {
  const resume = resumeText.toLowerCase();
  const jd = jdText.toLowerCase();

  const wanted = SKILLS.filter(skill => has(jd, skill));
  const found = wanted.filter(skill => has(resume, skill));
  const missing = wanted.filter(skill => !has(resume, skill));

  const score = wanted.length
    ? Math.round((found.length / wanted.length) * 100)
    : 0;

  const suggestions = missing.map(
    skill => `Add "${skill}" to your skills, or show it in a project, if you have used it.`
  );

  suggestions.push(
    'Start each project bullet with what you built and the result, with numbers where you can.'
  );

  return {
    score,
    found,
    missing,
    suggestions,
    summary: `${found.length} of ${wanted.length} skills from the job description appear in your resume.`
  };
}

// AI analysis using Anthropic
async function aiAnalysis(resumeText, jdText) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
    max_tokens: 1000,
    system:
      'You are an ATS resume analyzer. Respond with ONLY valid JSON, no markdown, no extra text.',
    messages: [
      {
        role: 'user',
        content:
          'Compare this resume with the job description.\n\n' +
          'Return JSON in exactly this shape:\n' +
          '{"score": <integer 0-100>, "summary": "<one sentence>", ' +
          '"found": ["skills from the job description that appear in the resume"], ' +
          '"missing": ["skills from the job description that the resume lacks"], ' +
          '"suggestions": ["3 to 5 short, specific improvements"]}\n\n' +
          'RESUME:\n' + resumeText.slice(0, 12000) +
          '\n\nJOB DESCRIPTION:\n' + jdText.slice(0, 6000)
      }
    ]
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  const data = JSON.parse(
    text.replace(/```json|```/g, '').trim()
  );

  return {
    score: Math.max(
      0,
      Math.min(100, Math.round(Number(data.score) || 0))
    ),
    summary: String(data.summary || ''),
    found: Array.isArray(data.found) ? data.found.map(String) : [],
    missing: Array.isArray(data.missing) ? data.missing.map(String) : [],
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions.map(String)
      : []
  };
}

// Main analyzer function


module.exports = async function analyze(resumeText, jdText) {
  if (
    typeof resumeText !== 'string' ||
    typeof jdText !== 'string' ||
    !resumeText.trim() ||
    !jdText.trim()
  ) {
    throw new Error('Resume text and job description are required.');
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await aiAnalysis(resumeText, jdText);
    } catch (err) {
      console.error(
        'AI analysis failed, using keyword fallback:',
        err.message
      );
    }
  }

  return keywordAnalysis(resumeText, jdText);

  module.exports.SKILLS = SKILLS;
};

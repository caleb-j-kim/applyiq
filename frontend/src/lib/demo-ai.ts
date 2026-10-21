// Demo-account stand-ins for the paid AI calls. The preview account never reaches Claude:
// Resume Match and Interview Prep build their results here instead, from the same job
// description and resume text the real pipeline would use.
import type { InterviewPrepResponseDto, MatchAnalysisResponseDto, PrepEffort } from '@/lib/mappers';
import { PREVIEW_ACCOUNT_EMAIL } from '@/lib/preview-account';
import type { JobApplication, ScoredKeyword } from '@/types';

export const isDemoAccount = (email?: string) => email === PREVIEW_ACCOUNT_EMAIL;

// Fake latency so the demo feels like the real thing.
export const demoDelay = () => new Promise((resolve) => setTimeout(resolve, 1200));

// Port of the backend's SkillTaxonomy + SkillExtractionService.extract (keep in sync), so
// demo scores match the ones the backend seeds for the same text.
const SKILLS: [string, number][] = [
  ['Java', 92], ['Spring Boot', 88], ['Spring Security', 70], ['Hibernate', 62], ['Python', 90],
  ['JavaScript', 88], ['TypeScript', 85], ['React', 90], ['Redux', 55], ['Node.js', 82], ['Express', 58],
  ['REST APIs', 80], ['GraphQL', 60], ['API Design', 65], ['SQL', 85], ['PostgreSQL', 78], ['MySQL', 72],
  ['MongoDB', 65], ['NoSQL', 55], ['Database Design', 60], ['Query Optimization', 50], ['Docker', 80],
  ['Kubernetes', 75], ['Containerization', 55], ['Microservices', 72], ['Distributed Systems', 68],
  ['API Gateway', 48], ['CI/CD', 75], ['Jenkins', 55], ['GitHub Actions', 52], ['Automated Testing', 60],
  ['AWS', 85], ['Azure', 78], ['GCP', 76], ['Cloud Infrastructure', 70], ['Terraform', 62],
  ['Infrastructure as Code', 55], ['Kafka', 60], ['Event-Driven Architecture', 50], ['Git', 70],
  ['Agile', 50], ['Scrum', 45], ['Sprint Planning', 35], ['Unit Testing', 58], ['System Design', 72],
  ['Scalability', 60], ['Communication', 40], ['Leadership', 42], ['Mentoring', 32], ['Problem Solving', 38],
  ['Cross-functional Collaboration', 36],
];

function extract(text: string): ScoredKeyword[] {
  const lower = text.toLowerCase();
  return SKILLS.filter(([name]) => lower.includes(name.toLowerCase()))
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight);
}

function splitByResume(jobDescription: string, resumeText: string) {
  const jdKeywords = extract(jobDescription);
  const resumeNames = new Set(extract(resumeText).map((k) => k.name));
  return {
    jdKeywords,
    found: jdKeywords.filter((k) => resumeNames.has(k.name)),
    missed: jdKeywords.filter((k) => !resumeNames.has(k.name)),
  };
}

// What Claude would add on top: skills a posting implies without naming them.
const IMPLIED: [string, number][] = [
  ['Data Structures', 72], ['Code Review', 58], ['Debugging', 62], ['Linux', 50], ['Security Best Practices', 46], ['Observability', 40],
];

export function mockMatchAnalysis(opts: {
  jobDescription: string;
  resumeText: string;
  resumeId: string;
  applicationId: string | null;
}): MatchAnalysisResponseDto {
  const { jdKeywords, found, missed } = splitByResume(opts.jobDescription, opts.resumeText);
  const resumeLower = opts.resumeText.toLowerCase();
  const start = opts.jobDescription.length % IMPLIED.length;
  const predicted = [...IMPLIED.slice(start), ...IMPLIED.slice(0, start)]
    .slice(0, 4)
    .map(([name, weight]) => ({ name, weight }));
  const predictedFound = predicted.filter((k) => resumeLower.includes(k.name.toLowerCase()));
  const predictedMissed = predicted.filter((k) => !predictedFound.includes(k));
  const gaps = [...missed, ...predictedMissed].map((k) => k.name);

  return {
    id: crypto.randomUUID(),
    resumeId: opts.resumeId,
    jobApplicationId: opts.applicationId,
    matchScore: jdKeywords.length ? Math.round((100 * found.length) / jdKeywords.length) : 0,
    jdKeywords,
    foundInResume: found,
    missed,
    predictedFound,
    predictedMissed,
    scoreRationale:
      `Your resume covers ${found.length} of the ${jdKeywords.length} skills this posting names` +
      (gaps.length ? `; the biggest gaps are ${gaps.slice(0, 3).join(', ')}.` : '.'),
    suggestedResumeBullets: [
      gaps[0] && `Built and shipped a side project that uses ${gaps[0]} end to end, and documented the design trade-offs in its README.`,
      gaps[1] && `Introduced ${gaps[1]} on an existing service, cutting manual release work for a team of five.`,
      gaps[2] && `Completed a hands-on ${gaps[2]} course and applied it to the ApplyIQ project within two weeks.`,
    ].filter((b): b is string => Boolean(b)),
    createdAt: new Date().toISOString(),
  };
}

const TECH_QUESTIONS: Record<string, string> = {
  Java: 'How does garbage collection work in Java, and when would you tune it?',
  'Spring Boot': 'How does Spring Boot dependency injection work, and how would you structure a service with controllers, services and repositories?',
  Python: 'What is the difference between a list and a generator in Python, and when would you choose each?',
  React: 'When does a React component re-render, and how would you stop unnecessary re-renders?',
  TypeScript: 'How do union types and type narrowing work in TypeScript? Give an example from your own code.',
  SQL: 'Write a query that returns the top three customers by total order value. How would you index the tables for it?',
  PostgreSQL: 'How would you find and fix a slow query in PostgreSQL?',
  AWS: 'Which AWS services would you use to host a web API with a database, and why?',
  Docker: 'What is the difference between a Docker image and a container, and how do you keep images small?',
  Kubernetes: 'What happens when a pod in a Kubernetes deployment crashes?',
  'REST APIs': 'How would you design a REST API for a to-do app? Cover status codes, pagination and versioning.',
  'Distributed Systems': 'How would you keep data consistent across two services that each own a database?',
  'System Design': 'Design a URL shortener. How does it scale to millions of requests per day?',
  Microservices: 'When would you split a monolith into microservices, and when would you not?',
  Kafka: 'How does Kafka guarantee message ordering, and what happens when a consumer falls behind?',
  'CI/CD': 'Walk me through a CI/CD pipeline you would set up for a new service.',
  Azure: 'How would you move an on-premises web app to Azure with minimal downtime?',
  Agile: 'How do you handle a sprint where the scope keeps changing?',
};

// Fictional stand-ins for applications with no recruiter on file (example.com is reserved for examples).
const SAMPLE_INTERVIEWERS = [
  { name: 'Jordan Ellis', previous: 'Recruiting Coordinator at a Series B fintech startup', school: 'B.A. in Communications' },
  { name: 'Priya Raman', previous: 'Senior Software Engineer at a healthcare SaaS company', school: 'M.S. in Computer Science' },
  { name: 'Marcus Webb', previous: 'Campus Recruiter at a Big Four consulting firm', school: 'B.S. in Business Administration' },
];

const STORY_THEMES = [
  'ownership, debugging and delivering under a deadline',
  'mentoring, feedback and explaining technical ideas',
  'ambiguity, learning a new technology and design trade-offs',
  'collaboration and working in an existing codebase',
];

// Section order per effort level; see .claude/skills/caleb-custom/reference/effort-levels.md.
const SECTIONS_BY_EFFORT: Record<PrepEffort, string[]> = {
  Low: ['Interviewer Information', 'Key Points', 'Biggest Gaps — and How to Answer Them', 'Likely Questions', 'Questions to Ask'],
  Medium: [
    'Interviewer Information', 'Qualifications', 'Company Research', 'Key Points', 'Knowledge', 'Behavioral Stories to Prepare',
    'Likely Questions', 'Interview Strategy', 'Questions to Ask', 'Interview Notes Placeholders',
  ],
  High: [
    'Interviewer Information', 'Qualifications', 'Company Research', 'Clarifying Questions / Interview Approach', 'Data Structures Recap',
    'Key Points', 'Biggest Gaps — and How to Answer Them', 'Knowledge', 'Behavioral Stories to Prepare', 'Likely Recruiter Questions',
    'Likely Technical / Hiring Manager Questions', 'Technical Scenario Questions', 'Coding Interview Strategy',
    'Questions for the Recruiter', 'Questions for the Hiring Manager', 'Interview Notes Placeholders',
  ],
};

export function mockInterviewPrep(
  app: JobApplication,
  resume: { fileName: string; parsedText: string | null },
  effort: PrepEffort
): InterviewPrepResponseDto {
  const resumeText = resume.parsedText ?? '';
  const jd = app.jobDescription ?? '';
  const { jdKeywords, found, missed } = splitByResume(jd, resumeText);
  const jdLines = jd.split('\n').map((l) => l.trim()).filter(Boolean);
  const responsibilities = jdLines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  const summary = jdLines.find((l) => !l.startsWith('- ') && l.length > 60) ?? `${app.companyName} is hiring a ${app.jobTitle}.`;
  const resumeLines = resumeText.split('\n').map((l) => l.trim().replace(/^- /, ''));
  // "Title | Org | Dates" lines are the resume's experiences and projects (the GPA line is education).
  const experiences = resumeLines.filter((l) => l.includes(' | ') && !l.includes('@') && !l.includes('GPA')).map((l) => l.split(' | ')[0]);
  const evidence = (skill: string) =>
    resumeLines.find((l) => l.toLowerCase().includes(skill.toLowerCase()) && !l.includes(':') && !l.includes(' | '));
  const strongest = experiences[0] ?? 'your most recent project';
  const top = jdKeywords.slice(0, 3).map((k) => k.name);
  const languages = ['Java', 'Python', 'JavaScript', 'TypeScript'].filter((l) => jdKeywords.some((k) => k.name === l));
  const knowledge = (n: number) =>
    jdKeywords
      .slice(0, n)
      .map((k) => `${k.name}: ${TECH_QUESTIONS[k.name] ?? `Walk me through a project where you used ${k.name}. What would you do differently now?`}`);
  const gapAnswer = (name: string) =>
    `"I haven't used ${name} in production yet. The closest I've done is ${strongest}, and I'm reviewing ${name} fundamentals before starting."`;

  const sample = SAMPLE_INTERVIEWERS[app.companyName.length % SAMPLE_INTERVIEWERS.length];
  const interviewerName = app.recruiterName ?? sample.name;
  const interviewerEmail = app.recruiterEmail ?? `${interviewerName.toLowerCase().replace(' ', '.')}@example.com`;

  const recruiterQuestions = [
    `Tell me about yourself. Lead with ${strongest}, then the skills this posting names that you already have (${found.slice(0, 3).map((k) => k.name).join(', ')}).`,
    `Why ${app.companyName}? Tie the role's focus on ${top.join(', ')} to the work you want to do next.`,
    'Are you comfortable with the location and work model? Answer directly, then ask about the team.',
  ];
  const technicalQuestions = responsibilities.slice(0, 4).map((r) => `How would you approach this part of the role: "${r}"?`);
  const scenarios = [
    'An endpoint that used to respond in 100 ms now takes 2 seconds. Check recent deploys, then logs and metrics, then the slowest query.',
    'A deploy breaks production for some users. Roll back first, then reproduce in staging and add a test that would have caught it.',
    `Design a small service for ${app.companyName}'s domain using ${top.slice(0, 2).join(' and ')}. Start with the API, then the data model, then scaling.`,
  ];
  const approach = [
    'Clarify requirements: restate the problem and confirm inputs and outputs.',
    'Clarify edge cases: empty input, duplicates, very large input, invalid data.',
    'Clarify use cases: who calls this, how often, and what matters most (speed, memory, correctness).',
    'Plan a brute-force solution first and say it out loud.',
    'State its time and space complexity.',
    'Move to an optimal solution and explain the trade-off.',
    'Talk through your reasoning while you code.',
    'Test with a normal case and an edge case, then re-check complexity.',
  ];
  const codingStrategy = [
    `Likely languages: ${languages.join(', ') || 'your strongest language'}.`,
    'Prioritize arrays and hash maps, then trees and graphs, then dynamic programming.',
    'Narrate the brute-force approach before optimizing, state complexity, and test edge cases out loud.',
  ];
  const forRecruiter = [
    'What are the remaining steps in the process, and what is the timeline?',
    'How are interns placed on teams?',
    'What distinguishes interns who receive return offers?',
    'Is the role in-office, hybrid or remote?',
  ];
  const forManager = [
    `Why did the team choose ${top[0] ?? 'its current stack'}, and what would you change about it?`,
    'What would I own in my first month?',
    'How does code get reviewed, tested and deployed?',
    'What could I learn before starting to hit the ground running?',
  ];

  const all: Record<string, string[]> = {
    'Interviewer Information': [
      `Name: ${interviewerName}`,
      `Email: ${interviewerEmail}`,
      `Current title: University Recruiter at ${app.companyName} (3 years)`,
      `Previous: ${sample.previous}`,
      `Education: ${sample.school}`,
      `Location: ${app.location || 'Not listed'}`,
      'Talking point: posts regularly about early-career hiring and intern mentorship.',
    ],
    Qualifications: jdKeywords.map((k) =>
      found.includes(k)
        ? `${k.name}: Strong match. ${evidence(k.name) ?? 'Listed in your skills; have one concrete example ready.'}`
        : effort === 'Medium'
          ? `${k.name}: Gap. Don't claim it. Say: ${gapAnswer(k.name)}`
          : `${k.name}: Gap. Not on your resume, so don't claim it. Point to the closest related work and say how you'd ramp up.`
    ),
    'Company Research': [
      summary,
      ...responsibilities.slice(0, 2).map((r) => `The role contributes by: ${r.charAt(0).toLowerCase()}${r.slice(1)}.`),
      `Why this role: "I want to work on ${top.join(', ')} at ${app.companyName}. ${strongest} gave me hands-on experience with ${found.slice(0, 2).map((k) => k.name).join(' and ') || 'similar work'}, and this role is where I can go deeper."`,
    ],
    'Clarifying Questions / Interview Approach': approach,
    'Data Structures Recap': [
      'Arrays and strings: two pointers, sliding window, prefix sums.',
      'Hash maps and sets: O(1) lookups for counting, de-duplication and caching.',
      'Stacks and queues: matching brackets, BFS, undo history.',
      'Trees and graphs: DFS/BFS, binary search trees, cycle detection.',
      'Heaps: top-k items and scheduling problems.',
    ],
    'Key Points': [
      `This role is fundamentally: ${responsibilities[0] ?? app.jobTitle}.`,
      `Top technical focus areas: ${top.join(', ')}.`,
      `Best positioning: ${found.length} of the ${jdKeywords.length} skills the posting names are already on your resume.`,
      `Strongest matching evidence: ${strongest}.`,
      ...(experiences[1] ? [`Second strongest: ${experiences[1]}.`] : []),
    ],
    'Biggest Gaps — and How to Answer Them': missed.length
      ? missed.slice(0, effort === 'Low' ? 2 : 4).map((k) => `${k.name}: ${gapAnswer(k.name)}`)
      : ['No major gaps against the skills this posting names. Focus on depth in your strongest examples.'],
    Knowledge: knowledge(effort === 'High' ? 6 : 4),
    'Behavioral Stories to Prepare': experiences.slice(0, STORY_THEMES.length).map((e, i) => `${e}: ${STORY_THEMES[i]}.`),
    'Likely Recruiter Questions': recruiterQuestions,
    'Likely Technical / Hiring Manager Questions': technicalQuestions,
    'Technical Scenario Questions': scenarios,
    'Coding Interview Strategy': codingStrategy,
    'Questions for the Recruiter': forRecruiter,
    'Questions for the Hiring Manager': forManager,
    'Interview Notes Placeholders': ['Interview with Recruiter:', 'Technical Interview with Manager:'],
    // Merged sections used by the lower effort levels.
    'Likely Questions':
      effort === 'Low'
        ? [recruiterQuestions[0], recruiterQuestions[1], technicalQuestions[0], knowledge(1)[0]].filter(Boolean)
        : [...recruiterQuestions, ...technicalQuestions, ...scenarios.slice(0, 2)],
    'Interview Strategy': [...approach.slice(0, 6), ...codingStrategy.slice(0, 2)],
    'Questions to Ask':
      effort === 'Low'
        ? [forRecruiter[0], forManager[0], forManager[1]]
        : [...forRecruiter.map((q) => `Recruiter: ${q}`), ...forManager.map((q) => `Hiring manager: ${q}`)],
  };

  return {
    id: crypto.randomUUID(),
    jobApplicationId: app.id,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    resumeName: resume.fileName,
    effort,
    sections: SECTIONS_BY_EFFORT[effort].map((title) => ({ title, bullets: all[title] })),
    createdAt: new Date().toISOString(),
  };
}

// Demo account's saved preps live in this browser only; real accounts get them from the backend.
const DEMO_PREPS_KEY = 'applyiq.demoInterviewPreps';

export function loadDemoPreps(): InterviewPrepResponseDto[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_PREPS_KEY) ?? '[]') as InterviewPrepResponseDto[];
  } catch {
    return [];
  }
}

// Saves a new prep, or replaces the saved one with the same id (edits).
export function saveDemoPrep(prep: InterviewPrepResponseDto) {
  const preps = loadDemoPreps();
  const next = preps.some((p) => p.id === prep.id) ? preps.map((p) => (p.id === prep.id ? prep : p)) : [prep, ...preps];
  localStorage.setItem(DEMO_PREPS_KEY, JSON.stringify(next));
}

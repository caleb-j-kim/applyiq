---
name: interview-prep
description: Convert a job description into a comprehensive, candidate-specific interview preparation document by reusing the structure, depth, and style of the provided interview-prep template. Match qualifications to verified candidate experience, identify truthful gaps, research the company/role when web access is available, tailor technical and behavioral preparation, and generate recruiter/hiring-manager questions without leaving stale content from the prior company or role.
---

# Interview Prep

## Purpose

Use this skill whenever the user provides a job description and wants a complete interview-preparation guide based on the reference document in `reference/interview-prep-template-example.txt`.

The reference is a **filled example**, not a source of facts about the new employer. Its job is to define:
- section structure,
- level of detail,
- style and tone,
- how qualifications are mapped to candidate experience,
- how gaps are handled,
- how technical knowledge is reviewed,
- how behavioral stories are selected,
- how recruiter and hiring-manager questions are generated.

The output must feel like the same document was freshly rebuilt for the new job description.

## Inputs

Primary required input:
1. A new job description.

Optional inputs:
- updated resume,
- candidate profile,
- interview format or recruiter notes,
- company-specific information,
- interview date,
- specific areas the user wants emphasized.

If the user provides only a job description, use candidate facts already present in the reference template and any other reliable user-provided candidate material available in context. Do not invent employment, projects, metrics, technologies, education, or accomplishments.

## Core Rules

### 1. Treat the reference as a structural template, not role content
Every company- or role-specific statement from the old example must be replaced, removed, or rewritten for the new role.

Run a stale-content check before finalizing. For example, if the reference mentions URBN, Urban Outfitters, e-commerce, Anthropologie, Go, MongoDB, carts, checkout, or another prior-role-specific concept, retain it only if it is independently relevant to the new job description.

### 2. Be truthful about candidate fit
For each requirement or desired qualification, label the fit using language consistent with the template, such as:
- Strong match.
- Good match.
- Partial match.
- Transferable experience.
- Transferable gap.
- Gap.

Do not inflate the candidate's experience.

When there is a gap:
- explain the closest transferable experience,
- state what should not be claimed,
- provide a concise, interview-ready way to answer honestly,
- identify what to review before the interview.

### 3. Prefer concrete project evidence
Whenever possible, map qualifications to specific candidate experiences from the reference/profile, such as:
- AMD internal inventory tracking work,
- Tomorrow's Leaders Today grant/funding application manager,
- Tomorrow's Weather senior capstone,
- ApplyIQ,
- Fintasy,
- UTD research,
- ACM leadership/mentoring,
- relevant coursework or game-development work.

Use the strongest evidence for the new job rather than mechanically repeating every project.

### 4. Tailor emphasis to the job description
Extract and prioritize:
- required qualifications,
- preferred qualifications,
- languages/frameworks,
- databases,
- cloud/MLOps/devops tools,
- AI/ML concepts,
- software engineering concepts,
- domain knowledge,
- collaboration expectations,
- ownership expectations,
- internship eligibility/logistics when relevant.

The preparation guide should spend the most space on the concepts most likely to matter for this role.

### 5. Research the company when possible
If current web access is available, research the company and team using authoritative sources first, especially:
- official company pages,
- official careers/team pages,
- engineering/AI blogs,
- annual reports or official product pages when relevant.

Use current information and do not copy unverified claims from the old template.

If web access is unavailable, build the company section only from the job description and explicitly avoid unsupported company claims.

### 6. Preserve the user's preferred style
Write in direct, practical interview-prep language. Use short sections, bullets, concise explanations, and ready-to-say interview answers where useful.

Avoid generic motivational filler. The document should be useful for studying immediately.

## Required Output Structure

Recreate the following sections in this order unless the job clearly makes a section irrelevant. Rename subsections when necessary so they match the new role.

### 1. Qualifications
For every meaningful qualification from the job description:
- list the qualification,
- assess candidate match,
- cite concrete supporting experiences,
- explain gaps honestly,
- provide a suggested interview response for important gaps.

Do not omit preferred qualifications if they are likely to appear in the interview.

### 2. Company Research
Include:
- what the company does,
- relevant business/product areas,
- the team or organization if identifiable,
- how the role contributes,
- why the role matters technically/business-wise,
- what specifically makes the opportunity relevant to the candidate.

End with a concise candidate-specific "why this company/role" framing that can be spoken in an interview.

### 3. Clarifying Questions / Interview Approach
Keep the reusable interview process guidance from the template where useful:
- clarify requirements,
- clarify edge cases,
- clarify use cases,
- plan brute-force solution,
- state complexity,
- transition to an optimal solution,
- communicate while coding,
- test and analyze.

Tailor examples to the new role. If the interview is unlikely to involve coding, shorten this section and emphasize case, ML, system-design, or behavioral clarification instead.

### 4. Data Structures Recap
Retain the reusable reference material when the role is software/technical and coding interviews are plausible.
Prioritize structures likely to matter for the role.
Do not bloat the document with irrelevant structures if the interview is primarily ML research, product, or another format.

### 5. Key Points
Summarize:
- what this role fundamentally is,
- top technical focus areas,
- top behavioral/collaboration focus areas,
- candidate's best positioning,
- strongest matching project,
- second/third strongest evidence as appropriate.

### 6. Biggest Gaps — and How to Answer Them
Identify the highest-risk gaps in the candidate's background relative to this job.
For each:
- state the gap,
- explain transferable strengths,
- write a truthful interview-ready answer.

Never fabricate experience to eliminate a gap.

### 7. Knowledge
Create a study guide for the concepts most likely to be tested.
For each major topic:
- explain the concept,
- list what the candidate should know,
- connect it to candidate experience where possible,
- include likely interview questions,
- include concise strong answers when appropriate.

The topics must be generated from the new job description. Examples may include:
- OOP/design patterns,
- APIs,
- Python/Java/JavaScript,
- SQL/databases,
- system design,
- distributed systems,
- cloud,
- Docker/Kubernetes/CI/CD,
- ML fundamentals,
- deep learning,
- LLMs,
- RAG,
- vector databases,
- AI agents/agentic workflows,
- MLOps,
- model evaluation,
- NLP,
- statistics,
- domain-specific concepts.

### 8. Behavioral Stories to Prepare
Select candidate experiences that best answer likely behavioral prompts such as:
- ownership,
- ambiguity,
- collaboration,
- conflict,
- leadership,
- feedback/failure,
- debugging/problem solving,
- learning a new technology,
- stakeholder communication,
- working on an existing codebase,
- delivering under constraints.

For each story, name the recommended project/experience and the questions it can answer. Add a short focus list for what to emphasize.

### 9. Likely Technical / Hiring Manager Questions
Generate role-specific questions and strong preparation notes.
Prefer realistic questions derived from the actual job description over generic LeetCode prompts.

For ML/AI roles, include model/LLM/system questions as appropriate.
For full-stack/backend roles, include architecture/API/database/debugging scenarios as appropriate.

### 10. Technical Scenario Questions
Create realistic troubleshooting/design scenarios based on the company's domain and the responsibilities in the posting.
For each scenario:
- provide the investigation/design path,
- connect to candidate experience where relevant,
- avoid pretending the candidate has operated systems at a scale they have not.

### 11. Coding Interview Strategy
If coding is plausible:
- list prioritized topics,
- identify likely languages,
- include practical application-development problems if the role suggests them,
- retain the template's communication/testing/complexity strategy.

If coding is not plausible, replace this with the relevant interview strategy (e.g. ML case study, research discussion, system design, product case).

### 12. Questions for the Recruiter
Generate thoughtful, non-redundant questions about:
- process,
- team placement,
- intern cohort/mentorship,
- role scope,
- conversion when appropriate,
- location/work model,
- timeline,
- what distinguishes successful interns/candidates.

Do not ask questions already answered clearly in the job description unless clarification is genuinely useful.

### 13. Questions for the Hiring Manager
Generate deeper questions about:
- team architecture/workflows,
- technologies and why they are used,
- ownership,
- technical challenges,
- testing/deployment/review practices,
- collaboration,
- success expectations,
- what the candidate could learn before starting.

### 14. Interview Notes Placeholders
End with placeholders equivalent to the reference example, adapted to the expected process, such as:
- Interview with Recruiter:
- Technical Interview with Manager:

Add additional rounds only when known.

## Quality Checks Before Finalizing

Verify all of the following:
1. No stale company names or role-specific details from the previous example remain accidentally.
2. Every major job qualification is addressed.
3. Candidate claims are supported by the reference/profile or explicitly framed as gaps.
4. The strongest projects are selected based on this job, not the previous one.
5. Company research is current when browsing is available.
6. Technical study topics map to the job description.
7. Recruiter and hiring-manager questions are specific to this opportunity.
8. Suggested answers sound natural and are not overly polished or exaggerated.
9. The document is comprehensive enough to study from but avoids repeating the same candidate evidence unnecessarily.

## Default Response Behavior

When the user pastes a job description and invokes this skill:
- do not ask for confirmation,
- immediately generate the full updated interview-prep document,
- use the reference template automatically,
- do not require the user to re-upload the template each time unless they explicitly replace it with a newer version.

If the user later provides a revised resume or newer interview-prep template, treat the newest explicit source as authoritative for future outputs.

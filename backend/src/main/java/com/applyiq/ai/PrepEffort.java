package com.applyiq.ai;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * How much interview prep to generate. Serialized as "Low"/"Medium"/"High" to match
 * PrepEffort in frontend/src/lib/mappers.ts; accepted in any case on the way in.
 * Section lists mirror .claude/skills/caleb-custom/reference/effort-levels.md.
 */
public enum PrepEffort {
    LOW("Low", "low", 8000, """
            Interviewer Information
            Key Points
            Biggest Gaps — and How to Answer Them
            Likely Questions
            Questions to Ask"""),
    MEDIUM("Medium", "medium", 16000, """
            Interviewer Information
            Qualifications
            Company Research
            Key Points
            Knowledge
            Behavioral Stories to Prepare
            Likely Questions
            Interview Strategy
            Questions to Ask
            Interview Notes Placeholders"""),
    HIGH("High", "high", 24000, """
            Interviewer Information
            Qualifications
            Company Research
            Clarifying Questions / Interview Approach
            Data Structures Recap
            Key Points
            Biggest Gaps — and How to Answer Them
            Knowledge
            Behavioral Stories to Prepare
            Likely Recruiter Questions
            Likely Technical / Hiring Manager Questions
            Technical Scenario Questions
            Coding Interview Strategy
            Questions for the Recruiter
            Questions for the Hiring Manager
            Interview Notes Placeholders""");

    private final String label;
    /** The API's output_config.effort for this level. */
    final String apiEffort;
    final int maxTokens;
    final String sections;

    PrepEffort(String label, String apiEffort, int maxTokens, String sections) {
        this.label = label;
        this.apiEffort = apiEffort;
        this.maxTokens = maxTokens;
        this.sections = sections;
    }

    @JsonValue
    public String label() {
        return label;
    }

    @JsonCreator
    public static PrepEffort from(String value) {
        return valueOf(value.trim().toUpperCase());
    }
}

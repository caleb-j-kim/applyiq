package com.applyiq.resumes;

import java.util.regex.Pattern;

/**
 * Cleans up raw PDFBox/POI output so resume text is roughly as analyzable as
 * a job description that was pasted in as plain prose — SkillExtractionService
 * does case-insensitive substring matching, which is exactly the kind of check
 * that silently breaks on PDF-extraction noise a human reader never notices:
 * a skill name split across a line-wrapped hyphen, a bullet glyph glued to the
 * first word, or doubled spaces from character-positioning quirks. None of
 * that is visible when a person looks at the resume, so a keyword that's
 * plainly "on the resume" can still fail a literal match without this pass.
 */
final class ResumeTextNormalizer {

    // "Post-\ngreSQL" -> "PostgreSQL" — the single most common cause of a visibly-present
    // skill silently failing a substring match: PDF text wraps at the hyphen, not the word.
    private static final Pattern LINE_WRAP_HYPHEN = Pattern.compile("([A-Za-z])-\\n([a-z])");

    // Bullet glyphs PDFBox carries over literally (●, •, ▪, ○, ‣, ·) plus plain "-"/"*" when
    // they're acting as a list marker at the start of a line, not part of a word.
    private static final Pattern LEADING_BULLET = Pattern.compile("(?m)^[\\s]*[•●▪○◦‣·*]\\s*");

    private static final Pattern CARRIAGE_RETURN = Pattern.compile("\\r\\n?");
    private static final Pattern REPEATED_SPACES = Pattern.compile("[ \\t]{2,}");
    private static final Pattern REPEATED_BLANK_LINES = Pattern.compile("\\n{3,}");

    static String normalize(String rawText) {
        if (rawText == null) {
            return null;
        }
        String text = CARRIAGE_RETURN.matcher(rawText).replaceAll("\n");
        text = LINE_WRAP_HYPHEN.matcher(text).replaceAll("$1$2");
        text = LEADING_BULLET.matcher(text).replaceAll("");
        text = REPEATED_SPACES.matcher(text).replaceAll(" ");
        text = REPEATED_BLANK_LINES.matcher(text).replaceAll("\n\n");

        String trimmed = text.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ResumeTextNormalizer() {
    }
}

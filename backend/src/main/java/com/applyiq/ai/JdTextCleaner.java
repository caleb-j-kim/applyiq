package com.applyiq.ai;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Strips paragraphs that are pure noise for skill inference before a job
 * description goes to Claude — EEO/accommodation boilerplate, benefits
 * laundry lists, salary-range/compliance disclaimers. These routinely make
 * up 20-30% of a real posting's token count and contribute nothing to
 * figuring out what skills the role needs, so cutting them is free token
 * savings with no quality cost (unlike trimming the actual role description,
 * which would hurt the "predicted keywords" reasoning this call exists for).
 */
final class JdTextCleaner {

    private static final List<Pattern> BOILERPLATE_PARAGRAPH_PATTERNS = List.of(
            Pattern.compile("(?i)\\bequal opportunity employer\\b"),
            Pattern.compile("(?i)\\bdoes not discriminate\\b"),
            Pattern.compile("(?i)\\breasonable accommodation\\b"),
            Pattern.compile("(?i)\\bpay transparency\\b"),
            Pattern.compile("(?i)\\bsalary range for this (role|position)\\b"),
            Pattern.compile("(?i)\\bbenefits (include|offered)\\b"),
            Pattern.compile("(?i)\\b401\\(?k\\)?\\b.{0,40}\\bmatch\\b"),
            Pattern.compile("(?i)\\bE-?Verify\\b"),
            Pattern.compile("(?i)\\bbackground check\\b.{0,30}\\b(condition|contingent)\\b")
    );

    static String clean(String jobDescription) {
        if (jobDescription == null || jobDescription.isBlank()) {
            return "";
        }
        String[] paragraphs = jobDescription.split("\\n{2,}");
        StringBuilder kept = new StringBuilder();
        for (String paragraph : paragraphs) {
            if (isBoilerplate(paragraph)) {
                continue;
            }
            if (!kept.isEmpty()) {
                kept.append("\n\n");
            }
            kept.append(paragraph.strip());
        }
        return kept.isEmpty() ? jobDescription.strip() : kept.toString();
    }

    private static boolean isBoilerplate(String paragraph) {
        for (Pattern pattern : BOILERPLATE_PARAGRAPH_PATTERNS) {
            if (pattern.matcher(paragraph).find()) {
                return true;
            }
        }
        return false;
    }

    private JdTextCleaner() {
    }
}

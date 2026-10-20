package com.applyiq.ai;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MatchLogicTest {

    @Test
    void splitsKeywordsByPresenceIgnoringCase() {
        List<ScoredKeyword> jd = List.of(new ScoredKeyword("Java", 90), new ScoredKeyword("Docker", 80));
        List<ScoredKeyword> resume = List.of(new ScoredKeyword("java", 90));

        Map<Boolean, List<ScoredKeyword>> split = new SkillExtractionService().splitByPresence(jd, resume);

        assertEquals(List.of(new ScoredKeyword("Java", 90)), split.get(true));
        assertEquals(List.of(new ScoredKeyword("Docker", 80)), split.get(false));
    }

    @Test
    void stripsBoilerplateParagraphsFromJobDescription() {
        String jd = "Build Java services.\n\nWe are an equal opportunity employer.\n\n  Use Docker.  ";
        assertEquals("Build Java services.\n\nUse Docker.", JdTextCleaner.clean(jd));
        assertEquals("We are an Equal Opportunity Employer.", JdTextCleaner.clean("We are an Equal Opportunity Employer."));
    }
}

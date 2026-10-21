package com.applyiq.demo;

import com.applyiq.ai.ResumeMatchService;
import com.applyiq.ai.ScoredKeyword;
import com.applyiq.ai.SkillExtractionService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoContentTest {

    private final SkillExtractionService extraction = new SkillExtractionService();

    @Test
    void everyDemoJobDescriptionYieldsKeywordsAndAPartialMatch() {
        List<ScoredKeyword> resumeSkills = extraction.extract(DemoContent.SWE_RESUME);
        assertEquals(12, DemoContent.JOB_DESCRIPTIONS.size());
        DemoContent.JOB_DESCRIPTIONS.forEach((company, jd) -> {
            List<ScoredKeyword> jdSkills = extraction.extract(jd);
            int found = extraction.splitByPresence(jdSkills, resumeSkills).get(true).size();
            int score = ResumeMatchService.matchScore(found, jdSkills.size());
            assertTrue(jdSkills.size() >= 5, company);
            assertTrue(score > 0 && score < 100, company);
        });
    }
}

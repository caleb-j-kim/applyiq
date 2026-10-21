package com.applyiq.ai;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class CompanyResearchServiceTest {

    @Test
    void prefersNameDescriptionOverOgAndDecodesEntities() {
        String html = """
                <meta property="og:description" content="Tagline"/>
                <meta content='We build data &amp; analytics software.' name="description">
                """;
        assertEquals("We build data & analytics software.", CompanyResearchService.metaDescription(html));
        assertEquals("Tagline", CompanyResearchService.metaDescription("<meta property=\"og:description\" content=\"Tagline\">"));
        assertNull(CompanyResearchService.metaDescription("<html><title>No meta</title></html>"));
    }

    @Test
    void derivesCompanySiteButSkipsJobBoards() {
        assertEquals("https://capitalone.com", CompanyResearchService.companySiteFromJobUrl("https://careers.capitalone.com/job/123"));
        assertNull(CompanyResearchService.companySiteFromJobUrl("https://boards.greenhouse.io/stripe/jobs/1"));
        assertNull(CompanyResearchService.companySiteFromJobUrl("https://acme.wd5.myworkdayjobs.com/x"));
        assertNull(CompanyResearchService.companySiteFromJobUrl(null));
    }

    @Test
    void picksPreferredThenEnglishWebsite() throws Exception {
        var json = new com.fasterxml.jackson.databind.ObjectMapper();
        String it = "{\"rank\":\"normal\",\"mainsnak\":{\"datavalue\":{\"value\":\"https://www.amazon.it/\"}},\"qualifiers\":{\"P407\":[{\"datavalue\":{\"value\":{\"id\":\"Q652\"}}}]}}";
        String uk = "{\"rank\":\"normal\",\"mainsnak\":{\"datavalue\":{\"value\":\"https://www.amazon.co.uk/\"}},\"qualifiers\":{\"P407\":[{\"datavalue\":{\"value\":{\"id\":\"Q7979\"}}}]}}";
        String com = "{\"rank\":\"preferred\",\"mainsnak\":{\"datavalue\":{\"value\":\"https://www.amazon.com/\"}}}";
        assertEquals("https://www.amazon.com/", CompanyResearchService.pickWebsite(json.readTree("[" + it + "," + uk + "," + com + "]")));
        assertEquals("https://www.amazon.co.uk/", CompanyResearchService.pickWebsite(json.readTree("[" + it + "," + uk + "]")));
        assertEquals("https://www.amazon.it/", CompanyResearchService.pickWebsite(json.readTree("[" + it + "]")));
    }

    @Test
    void splitsIntoSentencesAndCaps() {
        String text = "Palantir Technologies Inc. is an American software company. It was founded in 2003 by Peter Thiel. "
                + "Its customers include federal agencies and commercial enterprises.";
        List<String> sentences = CompanyResearchService.sentences(text, 2);
        assertEquals(2, sentences.size());
        assertEquals("It was founded in 2003 by Peter Thiel.", sentences.get(1));
    }
}

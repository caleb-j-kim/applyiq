package com.applyiq.ai;

import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Pure-Java, zero-LLM-token explicit keyword extraction. Dictionary/substring
 * matching against {@link SkillTaxonomy} — deterministic, free, instant. This
 * covers every skill a posting or resume names outright; it's deliberately
 * NOT where implied/"hidden" skills come from (that needs real semantic
 * reasoning about the specific text, which is what the Claude call in
 * {@link ResumeMatchService} is for). Explicit extraction should always run
 * first and its output handed to the model as context, rather than asking
 * the model to rediscover what a dictionary lookup already finds for free.
 */
@Service
public class SkillExtractionService {

    /** Every taxonomy skill literally present in {@code text} (case-insensitive substring), highest weight first. */
    public List<ScoredKeyword> extract(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String lower = text.toLowerCase();
        return SkillTaxonomy.ENTRIES.stream()
                .filter(entry -> lower.contains(entry.name().toLowerCase()))
                .map(entry -> new ScoredKeyword(entry.name(), entry.weight()))
                .sorted(Comparator.comparingInt(ScoredKeyword::weight).reversed())
                .toList();
    }

    /** Splits {@code candidates} by whether each name also appears in {@code haystack}: true = present, false = missing. */
    public Map<Boolean, List<ScoredKeyword>> splitByPresence(List<ScoredKeyword> candidates, List<ScoredKeyword> haystack) {
        Set<String> haystackNames = haystack.stream().map(k -> k.name().toLowerCase()).collect(Collectors.toSet());
        return candidates.stream().collect(Collectors.partitioningBy(k -> haystackNames.contains(k.name().toLowerCase())));
    }
}

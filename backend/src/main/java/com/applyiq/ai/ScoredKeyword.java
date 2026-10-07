package com.applyiq.ai;

/**
 * A skill/keyword with a 1-100 importance weight (how central it typically is
 * to the kind of role it was found in). Serializes directly as the frontend's
 * keyword-list item shape.
 */
public record ScoredKeyword(String name, int weight) {
}

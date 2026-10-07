package com.applyiq.ai;

import java.util.List;
import java.util.Map;

/**
 * Static reference list used for the zero-token, pure-Java half of match
 * analysis: literal dictionary matching of explicit skills in a job
 * description or resume. This is NOT where "hidden"/implied skills come from
 * — that's Claude's job, using real reasoning about the specific posting
 * (see ResumeMatchService). This list only needs to be broad enough to catch
 * common explicit mentions; it mirrors the frontend's dev-time mock list
 * (frontend/src/lib/mock-match-analysis.ts) so results stay recognizable
 * across the old preview and the real pipeline.
 */
public final class SkillTaxonomy {

    public record Entry(String name, int weight) {
    }

    public static final List<Entry> ENTRIES = List.of(
            new Entry("Java", 92),
            new Entry("Spring Boot", 88),
            new Entry("Spring Security", 70),
            new Entry("Hibernate", 62),
            new Entry("Python", 90),
            new Entry("JavaScript", 88),
            new Entry("TypeScript", 85),
            new Entry("React", 90),
            new Entry("Redux", 55),
            new Entry("Node.js", 82),
            new Entry("Express", 58),
            new Entry("REST APIs", 80),
            new Entry("GraphQL", 60),
            new Entry("API Design", 65),
            new Entry("SQL", 85),
            new Entry("PostgreSQL", 78),
            new Entry("MySQL", 72),
            new Entry("MongoDB", 65),
            new Entry("NoSQL", 55),
            new Entry("Database Design", 60),
            new Entry("Query Optimization", 50),
            new Entry("Docker", 80),
            new Entry("Kubernetes", 75),
            new Entry("Containerization", 55),
            new Entry("Microservices", 72),
            new Entry("Distributed Systems", 68),
            new Entry("API Gateway", 48),
            new Entry("CI/CD", 75),
            new Entry("Jenkins", 55),
            new Entry("GitHub Actions", 52),
            new Entry("Automated Testing", 60),
            new Entry("AWS", 85),
            new Entry("Azure", 78),
            new Entry("GCP", 76),
            new Entry("Cloud Infrastructure", 70),
            new Entry("Terraform", 62),
            new Entry("Infrastructure as Code", 55),
            new Entry("Kafka", 60),
            new Entry("Event-Driven Architecture", 50),
            new Entry("Git", 70),
            new Entry("Agile", 50),
            new Entry("Scrum", 45),
            new Entry("Sprint Planning", 35),
            new Entry("Unit Testing", 58),
            new Entry("System Design", 72),
            new Entry("Scalability", 60),
            new Entry("Communication", 40),
            new Entry("Leadership", 42),
            new Entry("Mentoring", 32),
            new Entry("Problem Solving", 38),
            new Entry("Cross-functional Collaboration", 36)
    );

    private static final Map<String, Entry> BY_LOWER_NAME = ENTRIES.stream()
            .collect(java.util.stream.Collectors.toMap(e -> e.name().toLowerCase(), e -> e));

    public static Entry byName(String name) {
        return BY_LOWER_NAME.get(name.toLowerCase());
    }

    private SkillTaxonomy() {
    }
}

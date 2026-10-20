package com.applyiq.resumes;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.regex.Pattern;

/**
 * Plain-text extraction for the three resume content types ResumeService
 * accepts, normalized to the same kind of clean prose a pasted job description
 * already is. This is what makes keyword matching (SkillExtractionService) and
 * the Claude match-score call possible at all. Failures (a scanned/image-only
 * PDF with no text layer, a corrupt file) are swallowed here and surfaced later
 * as a clear "couldn't extract text" error at analysis time (see
 * ResumeMatchService) rather than failing the upload — a resume with no
 * extractable text is still a resume worth keeping on file.
 */
@Component
public class ResumeTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(ResumeTextExtractor.class);

    // Normalization targets PDF-extraction noise a human reader never notices but that silently
    // breaks SkillExtractionService's case-insensitive substring matching.

    // "Post-\ngreSQL" -> "PostgreSQL" — the single most common cause of a visibly-present
    // skill silently failing a substring match: PDF text wraps at the hyphen, not the word.
    private static final Pattern LINE_WRAP_HYPHEN = Pattern.compile("([A-Za-z])-\n([a-z])");

    // Bullet glyphs PDFBox carries over literally (●, •, ▪, ○, ‣, ·) plus "*" when it's acting
    // as a list marker at the start of a line, not part of a word.
    private static final Pattern LEADING_BULLET = Pattern.compile("(?m)^[\s]*[•●▪○◦‣·*]\s*");

    private static final Pattern CARRIAGE_RETURN = Pattern.compile("\r\n?");
    private static final Pattern REPEATED_SPACES = Pattern.compile("[ \t]{2,}");
    private static final Pattern REPEATED_BLANK_LINES = Pattern.compile("\n{3,}");

    /** Returns extracted, normalized plain text, or null if extraction isn't possible for this file. */
    public String extract(byte[] content, String contentType) {
        try {
            return normalize(switch (contentType) {
                case "application/pdf" -> extractPdf(content);
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> extractDocx(content);
                case "application/msword" -> extractDoc(content);
                default -> null;
            });
        } catch (Exception e) {
            log.warn("Resume text extraction failed for content type {}: {}", contentType, e.getMessage());
            return null;
        }
    }

    private String extractPdf(byte[] content) throws IOException {
        try (PDDocument document = Loader.loadPDF(content)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String extractDocx(byte[] content) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(content));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractDoc(byte[] content) throws IOException {
        try (HWPFDocument document = new HWPFDocument(new ByteArrayInputStream(content));
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    static String normalize(String rawText) {
        if (rawText == null) {
            return null;
        }
        String text = CARRIAGE_RETURN.matcher(rawText).replaceAll("\n");
        text = LINE_WRAP_HYPHEN.matcher(text).replaceAll("$1$2");
        text = LEADING_BULLET.matcher(text).replaceAll("");
        text = REPEATED_SPACES.matcher(text).replaceAll(" ");
        text = REPEATED_BLANK_LINES.matcher(text).replaceAll("\n\n").strip();
        return text.isEmpty() ? null : text;
    }
}

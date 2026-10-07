package com.applyiq.resumes;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;

/**
 * Plain-text extraction for the three resume content types ResumeService
 * accepts, normalized (see ResumeTextNormalizer) to the same kind of clean
 * prose a pasted job description already is. This is what makes keyword
 * matching (SkillExtractionService) and the Claude match-score call possible
 * at all — without it, resumes.parsed_text stays null forever and there's no
 * resume content to analyze against. Failures (a scanned/image-only PDF with
 * no text layer, a corrupt file) are swallowed here and surfaced later as a
 * clear "couldn't extract text" error at analysis time (see ResumeMatchService)
 * rather than failing the upload — a resume with no extractable text is still
 * a resume worth keeping on file.
 */
@Component
public class ResumeTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(ResumeTextExtractor.class);

    /** Returns extracted plain text, or null if extraction isn't possible for this file. */
    public String extract(byte[] content, String contentType) {
        try {
            return switch (contentType) {
                case "application/pdf" -> extractPdf(content);
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> extractDocx(content);
                case "application/msword" -> extractDoc(content);
                default -> null;
            };
        } catch (Exception e) {
            log.warn("Resume text extraction failed for content type {}: {}", contentType, e.getMessage());
            return null;
        }
    }

    private String extractPdf(byte[] content) throws IOException {
        try (PDDocument document = Loader.loadPDF(content)) {
            String text = new PDFTextStripper().getText(document);
            return blankToNull(text);
        }
    }

    private String extractDocx(byte[] content) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(content));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return blankToNull(extractor.getText());
        }
    }

    private String extractDoc(byte[] content) throws IOException {
        try (org.apache.poi.hwpf.HWPFDocument document = new org.apache.poi.hwpf.HWPFDocument(new ByteArrayInputStream(content));
             WordExtractor extractor = new WordExtractor(document)) {
            return blankToNull(extractor.getText());
        }
    }

    private static String blankToNull(String text) {
        return ResumeTextNormalizer.normalize(text);
    }
}

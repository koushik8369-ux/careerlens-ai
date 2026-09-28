package com.careerlens;

import com.careerlens.exception.BadRequestException;
import com.careerlens.service.DocumentParserService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DocumentParserServiceTest {

    private final DocumentParserService service = new DocumentParserService();

    @Test
    void acceptsValidTextDocument() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.txt", "text/plain", "Backend Engineer\nJava".getBytes());

        assertEquals("Backend Engineer\nJava", service.extractText(file));
    }

    @Test
    void rejectsUnsupportedExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.png", "image/png", new byte[] {1, 2, 3});

        BadRequestException exception = assertThrows(BadRequestException.class, () -> service.extractText(file));

        assertEquals("Invalid file format. Only PDF, DOCX, DOC, and TXT files are supported.", exception.getMessage());
    }

    @Test
    void rejectsExtensionAndContentMismatch() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "plain text".getBytes());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> service.extractText(file));

        assertEquals("The uploaded file content does not match its file extension.", exception.getMessage());
    }

    @Test
    void rejectsMalformedSupportedDocumentWithoutParserDetails() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "%PDF-1.7\ninvalid".getBytes());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> service.extractText(file));

        assertEquals("The uploaded document could not be parsed.", exception.getMessage());
    }
}
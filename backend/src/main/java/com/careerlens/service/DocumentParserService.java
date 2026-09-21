package com.careerlens.service;

import com.careerlens.exception.BadRequestException;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;

@Service
public class DocumentParserService {

    private static final Logger log = LoggerFactory.getLogger(DocumentParserService.class);
    private final Tika tika = new Tika();
        private static final Map<String, String> SUPPORTED_TYPES = Map.of(
            ".pdf", "application/pdf",
            ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".doc", "application/msword",
            ".txt", "text/plain");

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty or missing.");
        }

        String fileName = file.getOriginalFilename();
        String extension = extensionOf(fileName);
        String expectedType = SUPPORTED_TYPES.get(extension);
        if (expectedType == null) {
            throw new BadRequestException("Invalid file format. Only PDF, DOCX, DOC, and TXT files are supported.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            String detectedType = tika.detect(inputStream, fileName);
            if (!expectedType.equals(detectedType)) {
                throw new BadRequestException("The uploaded file content does not match its file extension.");
            }
        } catch (IOException exception) {
            log.warn("Unable to inspect uploaded document", exception);
            throw new BadRequestException("The uploaded document could not be validated.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            String text = tika.parseToString(inputStream);
            if (text == null || text.trim().isEmpty()) {
                throw new BadRequestException("Could not extract any text from the provided document.");
            }
            return text.trim();
        } catch (IOException | TikaException e) {
            log.warn("Failed to parse uploaded document", e);
            throw new BadRequestException("The uploaded document could not be parsed.");
        }
    }

    private String extensionOf(String fileName) {
        if (fileName == null) {
            return "";
        }
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        int dot = lowerName.lastIndexOf('.');
        return dot < 0 ? "" : lowerName.substring(dot);
    }
}

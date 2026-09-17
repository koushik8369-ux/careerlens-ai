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

@Service
public class DocumentParserService {

    private static final Logger log = LoggerFactory.getLogger(DocumentParserService.class);
    private final Tika tika = new Tika();

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty or missing.");
        }

        String fileName = file.getOriginalFilename();
        if (fileName != null) {
            String lowerName = fileName.toLowerCase();
            if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx") && !lowerName.endsWith(".doc") && !lowerName.endsWith(".txt")) {
                throw new BadRequestException("Invalid file format. Only PDF, DOCX, DOC, and TXT files are supported.");
            }
        }

        try (InputStream inputStream = file.getInputStream()) {
            String text = tika.parseToString(inputStream);
            if (text == null || text.trim().isEmpty()) {
                throw new BadRequestException("Could not extract any text from the provided document.");
            }
            return text.trim();
        } catch (IOException | TikaException e) {
            log.error("Failed to parse document text: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to extract text from document: " + e.getMessage());
        }
    }
}

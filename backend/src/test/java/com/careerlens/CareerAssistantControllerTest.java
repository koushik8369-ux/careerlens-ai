package com.careerlens;

import com.careerlens.dto.LoginRequest;
import com.careerlens.dto.RegisterRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CareerAssistantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void resumeImprovementRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/career-assistant/resume-improvement"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedUserCanRequestResumeImprovementWithEmptyContext() throws Exception {
        String email = "resume-improvement-" + UUID.randomUUID() + "@example.com";
        String token = registerAndLogin(email);

        mockMvc.perform(post("/api/career-assistant/resume-improvement")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weakAreas", hasSize(4)))
                .andExpect(jsonPath("$.missingContent", hasSize(4)))
                .andExpect(jsonPath("$.strongerWordingSuggestions").isArray());
    }

    private String registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new RegisterRequest("Resume User", email, "password123", "password123"))))
                .andExpect(status().isCreated());

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(email, "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode body = objectMapper.readTree(response);
        return body.get("token").asText();
    }
}
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

        @Test
        void roadmapRequiresAuthentication() throws Exception {
                mockMvc.perform(post("/api/career-assistant/roadmap"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticatedUserCanRequestRoadmapWithMinimalContext() throws Exception {
                String email = "roadmap-" + UUID.randomUUID() + "@example.com";
                String token = registerAndLogin(email);

                mockMvc.perform(post("/api/career-assistant/roadmap")
                                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.stages", hasSize(3)))
                                .andExpect(jsonPath("$.stages[0].name").value("SHORT_TERM"))
                                .andExpect(jsonPath("$.stages[1].name").value("MEDIUM_TERM"))
                                .andExpect(jsonPath("$.stages[2].name").value("LONG_TERM"));
        }

        @Test
        void projectRecommendationsRequireAuthentication() throws Exception {
                mockMvc.perform(post("/api/career-assistant/projects"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticatedUserCanRequestProjectRecommendationsWithMinimalContext() throws Exception {
                String email = "projects-" + UUID.randomUUID() + "@example.com";
                String token = registerAndLogin(email);

                mockMvc.perform(post("/api/career-assistant/projects")
                                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.recommendations", hasSize(1)))
                                .andExpect(jsonPath("$.recommendations[0].title").isNotEmpty())
                                .andExpect(jsonPath("$.recommendations[0].skills").isArray());
        }

                @Test
                void interviewPreparationRequiresAuthentication() throws Exception {
                        mockMvc.perform(post("/api/career-assistant/interview-preparation"))
                                        .andExpect(status().isUnauthorized());
                }

                @Test
                void authenticatedUserCanRequestInterviewPreparationWithMinimalContext() throws Exception {
                        String email = "interview-" + UUID.randomUUID() + "@example.com";
                        String token = registerAndLogin(email);

                        mockMvc.perform(post("/api/career-assistant/interview-preparation")
                                                        .header("Authorization", "Bearer " + token))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.technicalTopics").isArray())
                                        .andExpect(jsonPath("$.technicalTopics").isNotEmpty())
                                        .andExpect(jsonPath("$.behavioralQuestions").isArray())
                                        .andExpect(jsonPath("$.projectTalkingPoints").isArray());
                }

                @Test
                void actionPlanRequiresAuthentication() throws Exception {
                        mockMvc.perform(post("/api/career-assistant/action-plan"))
                                        .andExpect(status().isUnauthorized());
                }

                @Test
                void authenticatedUserCanRequestActionPlanWithMinimalContext() throws Exception {
                        String email = "action-plan-" + UUID.randomUUID() + "@example.com";
                        String token = registerAndLogin(email);

                        mockMvc.perform(post("/api/career-assistant/action-plan")
                                                        .header("Authorization", "Bearer " + token))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.actions").isArray())
                                        .andExpect(jsonPath("$.actions").isNotEmpty());
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
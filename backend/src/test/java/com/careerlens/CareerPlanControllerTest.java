package com.careerlens;

import com.careerlens.dto.LoginRequest;
import com.careerlens.dto.RegisterRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.careerlens.repository.CareerPlanItemRepository;
import com.careerlens.repository.CareerPlanRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CareerPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

        @Autowired
        private CareerPlanItemRepository careerPlanItemRepository;

        @Autowired
        private CareerPlanRepository careerPlanRepository;

        @AfterEach
        void cleanUpCareerPlans() {
                careerPlanItemRepository.deleteAll();
                careerPlanRepository.deleteAll();
        }

    @Test
    void careerPlanEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/career-plans/current")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/career-plans/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/career-plans/1/items/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userCanReadOwnCurrentPlanButCannotReadOrUpdateAnotherUsersPlan() throws Exception {
        String firstToken = registerAndLogin("first-" + UUID.randomUUID() + "@example.com", "First");
        String secondToken = registerAndLogin("second-" + UUID.randomUUID() + "@example.com", "Second");

        String planBody = mockMvc.perform(post("/api/career-plans")
                        .header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.items.length()", notNullValue()))
                .andReturn().getResponse().getContentAsString();
        JsonNode plan = objectMapper.readTree(planBody);
        long planId = plan.get("id").asLong();
        long itemId = plan.get("items").get(0).get("id").asLong();

        mockMvc.perform(get("/api/career-plans/current")
                        .header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", org.hamcrest.Matchers.is((int) planId)));

        mockMvc.perform(get("/api/career-plans/" + planId)
                        .header("Authorization", "Bearer " + secondToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/career-plans/" + planId + "/items/" + itemId)
                        .header("Authorization", "Bearer " + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound());
    }

    private String registerAndLogin(String email, String fullName) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new RegisterRequest(fullName, email, "password123", "password123"))))
                .andExpect(status().isCreated());

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(email, "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
package com.careerlens;

import com.careerlens.dto.LoginRequest;
import com.careerlens.dto.RegisterRequest;
import com.careerlens.repository.UserProfileRepository;
import com.careerlens.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository profileRepository;

    @BeforeEach
    void cleanUp() {
        profileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void unauthenticatedProfileAndDashboardAreRejected() throws Exception {
        mockMvc.perform(get("/api/profile")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/dashboard")).andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedUserCanCreateRetrieveAndUpdateOwnProfile() throws Exception {
        String token = registerAndLogin("owner@example.com", "Owner");
        String profile = """
                {"education":"Computer Science","college":"Example College","graduationYear":2027,
                 "careerGoal":"Backend Engineer","bio":"Building secure systems","location":"Bengaluru",
                 "skills":["Java","SQL"]}
                """;

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", notNullValue()))
                .andExpect(jsonPath("$.email", is("owner@example.com")))
                .andExpect(jsonPath("$.skills[0]", is("Java")))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());

        mockMvc.perform(get("/api/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.careerGoal", is("Backend Engineer")))
                .andExpect(jsonPath("$.skills.length()", is(2)));

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillCount", is(2)))
                .andExpect(jsonPath("$.profileCompletionPercentage", is(100)))
                .andExpect(jsonPath("$.profileStatus", is("COMPLETE")));

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"skills\":[\"Java\"],\"careerGoal\":\"Platform Engineer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.careerGoal", is("Platform Engineer")))
                .andExpect(jsonPath("$.skills.length()", is(1)));
    }

    @Test
    void usersCannotAccessAnotherUsersProfile() throws Exception {
        String firstToken = registerAndLogin("first@example.com", "First");
        String secondToken = registerAndLogin("second@example.com", "Second");

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"careerGoal\":\"First Goal\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/profile")
                        .header("Authorization", "Bearer " + secondToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"careerGoal\":\"Second Goal\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("second@example.com")))
                .andExpect(jsonPath("$.careerGoal", is("Second Goal")));
    }

    @Test
    void invalidProfileDataIsRejected() throws Exception {
        String token = registerAndLogin("validation@example.com", "Validation");

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"graduationYear\":1800}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.graduationYear", notNullValue()));
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
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode body = objectMapper.readTree(response);
        return body.get("token").asText();
    }
}
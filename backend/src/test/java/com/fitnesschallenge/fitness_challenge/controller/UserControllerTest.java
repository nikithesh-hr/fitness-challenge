package com.fitnesschallenge.fitness_challenge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnesschallenge.fitness_challenge.dto.response.DashboardResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.UserRegistrationResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.UserSearchResponse;
import com.fitnesschallenge.fitness_challenge.exception.DuplicateUserException;
import com.fitnesschallenge.fitness_challenge.exception.GlobalExceptionHandler;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.service.ActivityService;
import com.fitnesschallenge.fitness_challenge.service.DashboardService;
import com.fitnesschallenge.fitness_challenge.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("UserController")
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private UserService userService;
    @MockBean private ActivityService activityService;
    @MockBean private DashboardService dashboardService;

    private static final UUID USER_ID = UUID.randomUUID();

    // ── POST /v1/users/register ───────────────────────────────────────────────

    @Nested
    @DisplayName("POST /v1/users/register")
    class RegisterTests {

        @Test
        @DisplayName("Valid body → 201 Created with userId")
        void validBody_returns201() throws Exception {
            UserRegistrationResponse response = UserRegistrationResponse.builder()
                    .userId(USER_ID).firstName("Jane").lastName("Smith").email("jane@example.com").build();

            when(userService.register(any())).thenReturn(response);

            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" }
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.userId").value(USER_ID.toString()))
                    .andExpect(jsonPath("$.firstName").value("Jane"));
        }

        @Test
        @DisplayName("Blank firstName → 400 with errors array")
        void blankFirstName_returns400() throws Exception {
            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    { "firstName": "", "lastName": "Smith", "email": "jane@example.com" }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors").isArray());
        }

        @Test
        @DisplayName("Blank lastName → 400 with errors array")
        void blankLastName_returns400() throws Exception {
            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    { "firstName": "Jane", "lastName": "", "email": "jane@example.com" }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors").isArray());
        }

        @Test
        @DisplayName("Invalid email → 400 with errors array")
        void invalidEmail_returns400() throws Exception {
            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    { "firstName": "Jane", "lastName": "Smith", "email": "notanemail" }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors").isArray());
        }

        @Test
        @DisplayName("firstName exceeds 100 characters → 400")
        void firstNameTooLong_returns400() throws Exception {
            String longName = "A".repeat(101);
            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    { "firstName": "%s", "lastName": "Smith", "email": "jane@example.com" }
                                    """.formatted(longName)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Missing required fields (empty body) → 400")
        void emptyBody_returns400() throws Exception {
            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors").isArray());
        }

        @Test
        @DisplayName("Duplicate name → 409 Conflict with message")
        void duplicateName_returns409() throws Exception {
            when(userService.register(any())).thenThrow(new DuplicateUserException("Jane", "Smith"));

            mockMvc.perform(post("/v1/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    { "firstName": "Jane", "lastName": "Smith", "email": "jane2@example.com" }
                                    """))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    // ── GET /v1/users/search ─────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /v1/users/search")
    class SearchUsersTests {

        @Test
        @DisplayName("With query param → 200 with results")
        void withQuery_returns200() throws Exception {
            UserSearchResponse u = UserSearchResponse.builder()
                    .userId(USER_ID).firstName("Jane").lastName("Smith").email("jane@example.com").build();
            when(userService.searchUsers("jane")).thenReturn(List.of(u));

            mockMvc.perform(get("/v1/users/search").param("q", "jane"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].firstName").value("Jane"));
        }

        @Test
        @DisplayName("Blank query → 200 (returns all)")
        void blankQuery_returns200() throws Exception {
            when(userService.searchUsers("")).thenReturn(List.of());

            mockMvc.perform(get("/v1/users/search").param("q", ""))
                    .andExpect(status().isOk());
        }
    }

    // ── GET /v1/users/{id}/dashboard ─────────────────────────────────────────

    @Nested
    @DisplayName("GET /v1/users/{id}/dashboard")
    class DashboardTests {

        @Test
        @DisplayName("Valid userId → 200 with dashboard data")
        void validUserId_returns200() throws Exception {
            DashboardResponse dashboard = DashboardResponse.builder()
                    .userId(USER_ID).fullName("Jane Smith")
                    .totalPoints(1000).totalActivities(5)
                    .sportBreakdown(Map.of("RUNNING", 1000L))
                    .weeklyVolume(List.of())
                    .build();
            when(dashboardService.getDashboard(USER_ID)).thenReturn(dashboard);

            mockMvc.perform(get("/v1/users/{id}/dashboard", USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fullName").value("Jane Smith"))
                    .andExpect(jsonPath("$.totalPoints").value(1000));
        }

        @Test
        @DisplayName("User not found → 404 with message")
        void userNotFound_returns404() throws Exception {
            when(dashboardService.getDashboard(USER_ID)).thenThrow(new UserNotFoundException(USER_ID));

            mockMvc.perform(get("/v1/users/{id}/dashboard", USER_ID))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    // ── DELETE /v1/users/{userId} ────────────────────────────────────────────

    @Nested
    @DisplayName("DELETE /v1/users/{userId}")
    class DeleteUserTests {

        @Test
        @DisplayName("Valid userId → 204 No Content")
        void validUserId_returns204() throws Exception {
            doNothing().when(userService).deleteUser(USER_ID);

            mockMvc.perform(delete("/v1/users/{id}", USER_ID))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("User not found → 404 with message")
        void userNotFound_returns404() throws Exception {
            doThrow(new UserNotFoundException(USER_ID)).when(userService).deleteUser(USER_ID);

            mockMvc.perform(delete("/v1/users/{id}", USER_ID))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Valid delete → response body is empty")
        void validDelete_hasNoBody() throws Exception {
            doNothing().when(userService).deleteUser(USER_ID);

            mockMvc.perform(delete("/v1/users/{id}", USER_ID))
                    .andExpect(status().isNoContent())
                    .andExpect(content().string(""));
        }
    }

    // ── GET /v1/users/{id}/activities ────────────────────────────────────────

    @Nested
    @DisplayName("GET /v1/users/{id}/activities")
    class ActivityHistoryTests {

        @Test
        @DisplayName("Valid userId → 200 with paginated result")
        void validUserId_returns200() throws Exception {
            when(activityService.getUserActivities(eq(USER_ID), any())).thenReturn(Page.empty());

            mockMvc.perform(get("/v1/users/{id}/activities", USER_ID))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("User not found → 404")
        void userNotFound_returns404() throws Exception {
            when(activityService.getUserActivities(eq(USER_ID), any()))
                    .thenThrow(new UserNotFoundException(USER_ID));

            mockMvc.perform(get("/v1/users/{id}/activities", USER_ID))
                    .andExpect(status().isNotFound());
        }
    }
}

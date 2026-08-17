package com.fitnesschallenge.fitness_challenge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnesschallenge.fitness_challenge.dto.response.ActivityResponse;
import com.fitnesschallenge.fitness_challenge.exception.ActivityNotFoundException;
import com.fitnesschallenge.fitness_challenge.exception.GlobalExceptionHandler;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.service.ActivityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ActivityController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("ActivityController")
class ActivityControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private ActivityService activityService;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID ACTIVITY_ID = UUID.randomUUID();
    private static final LocalDateTime NOW = LocalDateTime.now();

    private ActivityResponse runningResponse(int pts) {
        return ActivityResponse.builder()
                .activityId(ACTIVITY_ID).userId(USER_ID)
                .sport("RUNNING").pointsAwarded(pts)
                .recordedAt(NOW).extraFields(Collections.emptyMap())
                .build();
    }

    // ── Ingest success ────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /v1/activities — RUNNING valid → 201 with pointsAwarded")
    void runningValid_returns201() throws Exception {
        when(activityService.ingest(any(), any())).thenReturn(runningResponse(525));

        mockMvc.perform(post("/v1/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "%s",
                                  "sport": "RUNNING",
                                  "distanceKm": 5.25,
                                  "recordedAt": "2026-08-11T09:00:00"
                                }
                                """.formatted(USER_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pointsAwarded").value(525))
                .andExpect(jsonPath("$.activityId").value(ACTIVITY_ID.toString()));
    }

    // ── Validation failures ───────────────────────────────────────────────────

    @Nested
    @DisplayName("Validation failures → 400")
    class ValidationFailureTests {

        @Test
        @DisplayName("Missing userId → 400")
        void missingUserId_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "sport": "RUNNING",
                                      "distanceKm": 5.0,
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Unknown sport 'YOGA' → 400")
        void unknownSport_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "YOGA",
                                      "distanceKm": 5.0,
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("RUNNING without distanceKm → 400 (metric constraint)")
        void runningMissingDistance_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "RUNNING",
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("GYM without durationMinutes → 400")
        void gymMissingDuration_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "GYM",
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("DAILY_STEPS without stepCount → 400")
        void dailyStepsMissingStepCount_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "DAILY_STEPS",
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Metric mismatch — RUNNING with durationMinutes → 400")
        void metricMismatch_runningWithDuration_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "RUNNING",
                                      "durationMinutes": 30,
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("durationSeconds out of range (≥60) → 400")
        void durationSecondsOutOfRange_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "GYM",
                                      "durationMinutes": 30,
                                      "durationSeconds": 60,
                                      "recordedAt": "2026-08-11T09:00:00"
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Missing recordedAt → 400")
        void missingRecordedAt_returns400() throws Exception {
            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "userId": "%s",
                                      "sport": "RUNNING",
                                      "distanceKm": 5.0
                                    }
                                    """.formatted(USER_ID)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ── Service exceptions ────────────────────────────────────────────────────

    @Test
    @DisplayName("User not found → 404 with message envelope")
    void userNotFound_returns404() throws Exception {
        when(activityService.ingest(any(), any())).thenThrow(new UserNotFoundException(USER_ID));

        mockMvc.perform(post("/v1/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "%s",
                                  "sport": "RUNNING",
                                  "distanceKm": 5.0,
                                  "recordedAt": "2026-08-11T09:00:00"
                                }
                                """.formatted(USER_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    // ── Idempotency header ────────────────────────────────────────────────────

    @Nested
    @DisplayName("Idempotency-Key header")
    class IdempotencyHeaderTests {

        private static final String VALID_BODY = """
                {
                  "userId": "%s",
                  "sport": "RUNNING",
                  "distanceKm": 5.0,
                  "recordedAt": "2026-08-11T09:00:00"
                }
                """.formatted(USER_ID);

        @Test
        @DisplayName("Header present → service receives the parsed UUID")
        void headerPresent_serviceReceivesUUID() throws Exception {
            UUID key = UUID.randomUUID();
            when(activityService.ingest(any(), any())).thenReturn(runningResponse(500));

            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("Idempotency-Key", key.toString())
                            .content(VALID_BODY))
                    .andExpect(status().isCreated());

            ArgumentCaptor<UUID> keyCaptor = ArgumentCaptor.forClass(UUID.class);
            verify(activityService).ingest(any(), keyCaptor.capture());
            assertThat(keyCaptor.getValue()).isEqualTo(key);
        }

        @Test
        @DisplayName("Header absent → service receives null")
        void headerAbsent_serviceReceivesNull() throws Exception {
            when(activityService.ingest(any(), any())).thenReturn(runningResponse(500));

            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isCreated());

            ArgumentCaptor<UUID> keyCaptor = ArgumentCaptor.forClass(UUID.class);
            verify(activityService).ingest(any(), keyCaptor.capture());
            assertThat(keyCaptor.getValue()).isNull();
        }

        @Test
        @DisplayName("Duplicate key → returns 201 with cached response body")
        void duplicateKey_returns201WithCachedBody() throws Exception {
            UUID key = UUID.randomUUID();
            when(activityService.ingest(any(), any())).thenReturn(runningResponse(525));

            mockMvc.perform(post("/v1/activities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("Idempotency-Key", key.toString())
                            .content(VALID_BODY))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.activityId").value(ACTIVITY_ID.toString()))
                    .andExpect(jsonPath("$.pointsAwarded").value(525));
        }
    }

    // ── DELETE /v1/activities/{activityId} ────────────────────────────────────

    @Nested
    @DisplayName("DELETE /v1/activities/{activityId}")
    class DeleteActivityTests {

        @Test
        @DisplayName("Valid activityId → 204 No Content")
        void validActivityId_returns204() throws Exception {
            doNothing().when(activityService).deleteActivity(ACTIVITY_ID);

            mockMvc.perform(delete("/v1/activities/{id}", ACTIVITY_ID))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Activity not found → 404 with message")
        void activityNotFound_returns404() throws Exception {
            doThrow(new ActivityNotFoundException(ACTIVITY_ID))
                    .when(activityService).deleteActivity(ACTIVITY_ID);

            mockMvc.perform(delete("/v1/activities/{id}", ACTIVITY_ID))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Valid delete → response body is empty")
        void validDelete_hasNoBody() throws Exception {
            doNothing().when(activityService).deleteActivity(ACTIVITY_ID);

            mockMvc.perform(delete("/v1/activities/{id}", ACTIVITY_ID))
                    .andExpect(status().isNoContent())
                    .andExpect(content().string(""));
        }
    }
}

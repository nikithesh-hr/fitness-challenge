package com.fitnesschallenge.fitness_challenge.controller;

import com.fitnesschallenge.fitness_challenge.dto.response.LeaderboardEntry;
import com.fitnesschallenge.fitness_challenge.exception.GlobalExceptionHandler;
import com.fitnesschallenge.fitness_challenge.service.LeaderboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaderboardController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("LeaderboardController")
class LeaderboardControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private LeaderboardService leaderboardService;

    private Page<LeaderboardEntry> pageOf(LeaderboardEntry... entries) {
        List<LeaderboardEntry> list = List.of(entries);
        return new PageImpl<>(list, PageRequest.of(0, 10), list.size());
    }

    @Test
    @DisplayName("GET /v1/leaderboard — 200 with ranked entries in content array")
    void getLeaderboard_returns200WithEntries() throws Exception {
        when(leaderboardService.getLeaderboard(anyInt(), anyInt())).thenReturn(pageOf(
                LeaderboardEntry.builder()
                        .rank(1).userId(UUID.randomUUID()).fullName("Alice Brown").totalPoints(2000L).build(),
                LeaderboardEntry.builder()
                        .rank(2).userId(UUID.randomUUID()).fullName("Bob Jones").totalPoints(1500L).build()
        ));

        mockMvc.perform(get("/v1/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].rank").value(1))
                .andExpect(jsonPath("$.content[0].fullName").value("Alice Brown"))
                .andExpect(jsonPath("$.content[0].totalPoints").value(2000))
                .andExpect(jsonPath("$.content[1].rank").value(2))
                .andExpect(jsonPath("$.content[1].fullName").value("Bob Jones"));
    }

    @Test
    @DisplayName("GET /v1/leaderboard — empty → 200 with empty content array")
    void emptyLeaderboard_returns200WithEmptyArray() throws Exception {
        when(leaderboardService.getLeaderboard(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/v1/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    @DisplayName("GET /v1/leaderboard — entry contains rank, fullName, totalPoints, userId")
    void leaderboardEntry_containsAllRequiredFields() throws Exception {
        UUID userId = UUID.randomUUID();
        when(leaderboardService.getLeaderboard(anyInt(), anyInt())).thenReturn(pageOf(
                LeaderboardEntry.builder()
                        .rank(1).userId(userId).fullName("Jane Smith").totalPoints(999L).build()
        ));

        mockMvc.perform(get("/v1/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rank").value(1))
                .andExpect(jsonPath("$.content[0].fullName").value("Jane Smith"))
                .andExpect(jsonPath("$.content[0].totalPoints").value(999))
                .andExpect(jsonPath("$.content[0].userId").value(userId.toString()));
    }

    @Test
    @DisplayName("GET /v1/leaderboard — pagination metadata present")
    void leaderboard_containsPaginationMetadata() throws Exception {
        when(leaderboardService.getLeaderboard(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 25));

        mockMvc.perform(get("/v1/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(25))
                .andExpect(jsonPath("$.page.totalPages").value(3))
                .andExpect(jsonPath("$.page.size").value(10))
                .andExpect(jsonPath("$.page.number").value(0));
    }

    @Test
    @DisplayName("GET /v1/leaderboard?page=1&size=5 — custom params forwarded to service")
    void customPageParams_accepted() throws Exception {
        when(leaderboardService.getLeaderboard(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(1, 5), 0));

        mockMvc.perform(get("/v1/leaderboard").param("page", "1").param("size", "5"))
                .andExpect(status().isOk());
    }
}

package com.fitnesschallenge.fitness_challenge.controller;

import com.fitnesschallenge.fitness_challenge.dto.response.LeaderboardEntry;
import com.fitnesschallenge.fitness_challenge.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Global fitness leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    @Operation(summary = "Get global leaderboard ranked by total points (paginated)")
    public ResponseEntity<Page<LeaderboardEntry>> getLeaderboard(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(page, size));
    }
}

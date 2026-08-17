package com.fitnesschallenge.fitness_challenge.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LeaderboardEntry {

    private int rank;
    private UUID userId;
    private String fullName;
    private long totalPoints;
}

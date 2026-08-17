package com.fitnesschallenge.fitness_challenge.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class ActivityResponse {

    private UUID activityId;
    private UUID userId;
    private String sport;
    private BigDecimal distanceKm;
    private Integer durationMinutes;
    private Integer durationSeconds;
    private Integer stepCount;
    private int pointsAwarded;
    private String notes;
    private Map<String, Object> extraFields;
    private LocalDateTime recordedAt;
}

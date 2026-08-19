package com.fitnesschallenge.fitness_challenge.dto.request;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fitnesschallenge.fitness_challenge.validation.SportMetricConsistency;
import com.fitnesschallenge.fitness_challenge.validation.ValidSport;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@SportMetricConsistency
public class ActivityRequest {

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotBlank(message = "sport is required")
    @ValidSport
    private String sport;

    // Distance sports: RUNNING, WALKING, CYCLING — cap at 1000 km (human daily max, cycling-inclusive)
    @DecimalMin(value = "0.0", inclusive = false, message = "distanceKm must be greater than 0")
    @DecimalMax(value = "1000.0", message = "distanceKm must be at most 1000")
    @Digits(integer = 4, fraction = 3, message = "distanceKm must have at most 4 integer digits and 3 decimal places")
    @JsonDeserialize(using = DistanceKmDeserializer.class)
    private BigDecimal distanceKm;

    // Duration sports: GYM, SWIMMING — cap at 24 hours (human daily max)
    @Min(value = 0, message = "durationMinutes must be >= 0")
    @Max(value = 1440, message = "durationMinutes must be at most 1440 (24 hours)")
    private Integer durationMinutes;

    @Min(value = 0, message = "durationSeconds must be >= 0")
    @Max(value = 59, message = "durationSeconds must be <= 59")
    private Integer durationSeconds;

    // Steps sport: DAILY_STEPS — cap at 100,000 (extreme human daily total)
    @Positive(message = "stepCount must be a positive integer")
    @Max(value = 100_000, message = "stepCount must be at most 100000")
    private Integer stepCount;

    @Size(max = 500, message = "notes must not exceed 500 characters")
    private String notes;

    @NotNull(message = "recordedAt is required")
    private LocalDateTime recordedAt;

    private Map<String, Object> extraFields = new HashMap<>();
}

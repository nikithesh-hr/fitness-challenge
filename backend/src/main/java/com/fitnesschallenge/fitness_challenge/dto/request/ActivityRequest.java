package com.fitnesschallenge.fitness_challenge.dto.request;

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

    // Distance sports: RUNNING, WALKING, CYCLING
    @DecimalMin(value = "0.0", inclusive = false, message = "distanceKm must be greater than 0")
    @Digits(integer = 7, fraction = 3, message = "distanceKm must have at most 7 integer digits and 3 decimal places")
    private BigDecimal distanceKm;

    // Duration sports: GYM, SWIMMING
    @Min(value = 0, message = "durationMinutes must be >= 0")
    private Integer durationMinutes;

    @Min(value = 0, message = "durationSeconds must be >= 0")
    @Max(value = 59, message = "durationSeconds must be <= 59")
    private Integer durationSeconds;

    // Steps sport: DAILY_STEPS
    @Positive(message = "stepCount must be a positive integer")
    private Integer stepCount;

    @Size(max = 500, message = "notes must not exceed 500 characters")
    private String notes;

    @NotNull(message = "recordedAt is required")
    private LocalDateTime recordedAt;

    private Map<String, Object> extraFields = new HashMap<>();
}

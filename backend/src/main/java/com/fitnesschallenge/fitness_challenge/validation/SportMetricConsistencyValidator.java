package com.fitnesschallenge.fitness_challenge.validation;

import com.fitnesschallenge.fitness_challenge.dto.request.ActivityRequest;
import com.fitnesschallenge.fitness_challenge.enums.SportType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

public class SportMetricConsistencyValidator implements ConstraintValidator<SportMetricConsistency, ActivityRequest> {

    /** One logged gym/swim session cannot exceed a full day. */
    static final long MAX_DURATION_TOTAL_SECONDS = 24L * 60 * 60;
    static final BigDecimal MAX_DISTANCE_KM = new BigDecimal("1000");

    @Override
    public boolean isValid(ActivityRequest request, ConstraintValidatorContext context) {
        if (request == null || request.getSport() == null) return true;

        SportType sport;
        try {
            sport = SportType.valueOf(request.getSport().toUpperCase());
        } catch (IllegalArgumentException e) {
            return true; // @ValidSport already catches this
        }

        context.disableDefaultConstraintViolation();

        return switch (sport) {
            case RUNNING, WALKING, CYCLING -> validateDistanceSport(request, context);
            case GYM, SWIMMING -> validateDurationSport(request, context);
            case DAILY_STEPS -> validateStepsSport(request, context);
        };
    }

    private boolean validateDistanceSport(ActivityRequest request, ConstraintValidatorContext context) {
        boolean valid = true;
        if (request.getDistanceKm() == null || request.getDistanceKm().doubleValue() <= 0) {
            addViolation(context, "distanceKm", "distanceKm is required and must be > 0 for sport " + request.getSport());
            valid = false;
        } else if (request.getDistanceKm().compareTo(MAX_DISTANCE_KM) > 0) {
            addViolation(context, "distanceKm", "distanceKm must be at most 1000 for sport " + request.getSport());
            valid = false;
        }
        if (request.getDurationMinutes() != null || request.getDurationSeconds() != null) {
            addViolation(context, "durationMinutes", "durationMinutes/durationSeconds are not valid for sport " + request.getSport());
            valid = false;
        }
        if (request.getStepCount() != null) {
            addViolation(context, "stepCount", "stepCount is not valid for sport " + request.getSport());
            valid = false;
        }
        return valid;
    }

    private boolean validateDurationSport(ActivityRequest request, ConstraintValidatorContext context) {
        boolean valid = true;
        if (request.getDurationMinutes() == null || request.getDurationMinutes() < 0) {
            addViolation(context, "durationMinutes", "durationMinutes is required and must be >= 0 for sport " + request.getSport());
            valid = false;
        } else {
            int seconds = request.getDurationSeconds() == null ? 0 : request.getDurationSeconds();
            long totalSeconds = (long) request.getDurationMinutes() * 60 + seconds;
            if (totalSeconds > MAX_DURATION_TOTAL_SECONDS) {
                addViolation(context, "durationMinutes", "duration cannot exceed 24 hours for sport " + request.getSport());
                valid = false;
            }
        }
        if (request.getDistanceKm() != null) {
            addViolation(context, "distanceKm", "distanceKm is not valid for sport " + request.getSport());
            valid = false;
        }
        if (request.getStepCount() != null) {
            addViolation(context, "stepCount", "stepCount is not valid for sport " + request.getSport());
            valid = false;
        }
        return valid;
    }

    private boolean validateStepsSport(ActivityRequest request, ConstraintValidatorContext context) {
        boolean valid = true;
        if (request.getStepCount() == null || request.getStepCount() <= 0) {
            addViolation(context, "stepCount", "stepCount is required and must be > 0 for DAILY_STEPS");
            valid = false;
        }
        if (request.getDistanceKm() != null) {
            addViolation(context, "distanceKm", "distanceKm is not valid for DAILY_STEPS");
            valid = false;
        }
        if (request.getDurationMinutes() != null || request.getDurationSeconds() != null) {
            addViolation(context, "durationMinutes", "durationMinutes/durationSeconds are not valid for DAILY_STEPS");
            valid = false;
        }
        return valid;
    }

    private void addViolation(ConstraintValidatorContext context, String field, String message) {
        context.buildConstraintViolationWithTemplate(message)
                .addPropertyNode(field)
                .addConstraintViolation();
    }
}

package com.fitnesschallenge.fitness_challenge.util;

import com.fitnesschallenge.fitness_challenge.enums.SportType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ScoringEngine {

    /**
     * Calculates points for a distance-based sport (RUNNING, WALKING, CYCLING).
     * Points = floor(distanceKm * ratePerKm)
     */
    public int calculateDistancePoints(SportType sport, BigDecimal distanceKm) {
        int ratePerKm = switch (sport) {
            case RUNNING -> 100;
            case WALKING -> 50;
            case CYCLING -> 25;
            default -> throw new IllegalArgumentException("Not a distance sport: " + sport);
        };
        double rawPoints = distanceKm.doubleValue() * ratePerKm;
        return (int) Math.floor(rawPoints);
    }

    /**
     * Calculates points for a duration-based sport (GYM, SWIMMING).
     * Only fully completed minutes count — duration is floored to whole minutes first.
     * Points = floor(totalSeconds / 60) * ratePerMinute
     */
    public int calculateDurationPoints(SportType sport, int durationMinutes, int durationSeconds) {
        int ratePerMinute = switch (sport) {
            case SWIMMING -> 15;
            case GYM -> 5;
            default -> throw new IllegalArgumentException("Not a duration sport: " + sport);
        };
        int totalSeconds = (durationMinutes * 60) + durationSeconds;
        int wholeMinutes = totalSeconds / 60;
        return wholeMinutes * ratePerMinute;
    }

    /**
     * Calculates points for DAILY_STEPS.
     * Points are awarded only for fully completed blocks of 100 steps.
     * Points = floor(steps / 100)
     */
    public int calculateStepPoints(int stepCount) {
        return stepCount / 100;
    }
}

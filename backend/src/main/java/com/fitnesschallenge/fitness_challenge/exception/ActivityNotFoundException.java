package com.fitnesschallenge.fitness_challenge.exception;

import java.util.UUID;

public class ActivityNotFoundException extends RuntimeException {

    public ActivityNotFoundException(UUID activityId) {
        super("Activity not found with id: " + activityId);
    }
}

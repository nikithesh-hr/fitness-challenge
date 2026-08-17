package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.request.ActivityRequest;
import com.fitnesschallenge.fitness_challenge.dto.response.ActivityResponse;
import com.fitnesschallenge.fitness_challenge.entity.Activity;
import com.fitnesschallenge.fitness_challenge.entity.User;
import com.fitnesschallenge.fitness_challenge.enums.SportType;
import com.fitnesschallenge.fitness_challenge.exception.ActivityNotFoundException;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.repository.ActivityRepository;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import com.fitnesschallenge.fitness_challenge.util.ScoringEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final ScoringEngine scoringEngine;

    public record IngestResult(ActivityResponse response, boolean replay) {}

    @Transactional
    public IngestResult ingest(ActivityRequest request, UUID idempotencyKey) {
        if (idempotencyKey != null) {
            Optional<Activity> existing = activityRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                Activity a = existing.get();
                ActivityResponse response = toResponse(a,
                        a.getDurationSeconds() != null ? a.getDurationSeconds() / 60 : null,
                        a.getDurationSeconds() != null ? a.getDurationSeconds() % 60 : null);
                return new IngestResult(response, true);
            }
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new UserNotFoundException(request.getUserId()));

        SportType sport = SportType.valueOf(request.getSport().toUpperCase());
        int points = computePoints(sport, request);

        int durationSeconds = 0;
        if (request.getDurationMinutes() != null) {
            durationSeconds = (request.getDurationMinutes() * 60)
                    + (request.getDurationSeconds() != null ? request.getDurationSeconds() : 0);
        }

        Activity activity = Activity.builder()
                .user(user)
                .sport(sport)
                .distanceKm(request.getDistanceKm())
                .durationSeconds(request.getDurationMinutes() != null ? durationSeconds : null)
                .stepCount(request.getStepCount())
                .points(points)
                .notes(request.getNotes())
                .extraFields(request.getExtraFields() != null ? request.getExtraFields() : java.util.Collections.emptyMap())
                .recordedAt(request.getRecordedAt())
                .idempotencyKey(idempotencyKey)
                .build();

        Activity saved = activityRepository.save(activity);

        return new IngestResult(toResponse(saved, request.getDurationMinutes(), request.getDurationSeconds()), false);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getUserActivities(UUID userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }
        return activityRepository.findByUserIdOrderByRecordedAtDesc(userId, pageable)
                .map(a -> toResponse(a, null, null));
    }

    @Transactional
    public void deleteActivity(UUID activityId) {
        if (!activityRepository.existsById(activityId)) {
            throw new ActivityNotFoundException(activityId);
        }
        activityRepository.deleteById(activityId);
    }

    private int computePoints(SportType sport, ActivityRequest request) {
        return switch (sport) {
            case RUNNING, WALKING, CYCLING ->
                    scoringEngine.calculateDistancePoints(sport, request.getDistanceKm());
            case GYM, SWIMMING ->
                    scoringEngine.calculateDurationPoints(sport,
                            request.getDurationMinutes(),
                            request.getDurationSeconds() != null ? request.getDurationSeconds() : 0);
            case DAILY_STEPS ->
                    scoringEngine.calculateStepPoints(request.getStepCount());
        };
    }

    private ActivityResponse toResponse(Activity a, Integer durationMinutes, Integer durationSeconds) {
        Integer mins = durationMinutes;
        Integer secs = durationSeconds;
        if (a.getDurationSeconds() != null && durationMinutes == null) {
            mins = a.getDurationSeconds() / 60;
            secs = a.getDurationSeconds() % 60;
        }
        return ActivityResponse.builder()
                .activityId(a.getId())
                .userId(a.getUser().getId())
                .sport(a.getSport().name())
                .distanceKm(a.getDistanceKm())
                .durationMinutes(mins)
                .durationSeconds(secs)
                .stepCount(a.getStepCount())
                .pointsAwarded(a.getPoints())
                .notes(a.getNotes())
                .extraFields(a.getExtraFields())
                .recordedAt(a.getRecordedAt())
                .build();
    }
}

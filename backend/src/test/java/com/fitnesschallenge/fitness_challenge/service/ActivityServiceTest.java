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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityService")
class ActivityServiceTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private UserRepository userRepository;
    @Mock private ScoringEngine scoringEngine;
    @InjectMocks private ActivityService activityService;

    private final UUID USER_ID = UUID.randomUUID();
    private final UUID ACTIVITY_ID = UUID.randomUUID();
    private final LocalDateTime NOW = LocalDateTime.now();

    private User testUser() {
        return User.builder().id(USER_ID).firstName("Jane").lastName("Smith").email("jane@test.com").build();
    }

    private Activity savedActivity(SportType sport, int points) {
        return Activity.builder()
                .id(ACTIVITY_ID)
                .user(testUser())
                .sport(sport)
                .points(points)
                .extraFields(Collections.emptyMap())
                .recordedAt(NOW)
                .build();
    }

    private ActivityRequest baseRequest(String sport) {
        ActivityRequest req = new ActivityRequest();
        req.setUserId(USER_ID);
        req.setSport(sport);
        req.setRecordedAt(NOW);
        return req;
    }

    // ── ingest — user not found ──────────────────────────────────────────────

    @Test
    @DisplayName("ingest — user not found → throws UserNotFoundException")
    void ingest_userNotFound_throwsException() {
        ActivityRequest req = baseRequest("RUNNING");
        req.setDistanceKm(new BigDecimal("5.0"));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.ingest(req, null))
                .isInstanceOf(UserNotFoundException.class);

        verify(activityRepository, never()).save(any());
    }

    // ── ingest — distance sports ─────────────────────────────────────────────

    @Nested
    @DisplayName("ingest() — distance sports (RUNNING / WALKING / CYCLING)")
    class DistanceSportTests {

        @Test
        @DisplayName("RUNNING 5.25 km → calls calculateDistancePoints(RUNNING, 5.25), saves, returns 525 pts")
        void running_callsScoringAndSaves() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.25"));
            Activity saved = savedActivity(SportType.RUNNING, 525);
            saved.setDistanceKm(new BigDecimal("5.25"));

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDistancePoints(SportType.RUNNING, new BigDecimal("5.25"))).thenReturn(525);
            when(activityRepository.save(any())).thenReturn(saved);

            ActivityResponse response = activityService.ingest(req, null);

            verify(scoringEngine).calculateDistancePoints(SportType.RUNNING, new BigDecimal("5.25"));
            assertThat(response.getPointsAwarded()).isEqualTo(525);
            assertThat(response.getSport()).isEqualTo("RUNNING");
        }

        @Test
        @DisplayName("WALKING 1.55 km → calls calculateDistancePoints(WALKING, 1.55)")
        void walking_callsScoringEngine() {
            ActivityRequest req = baseRequest("WALKING");
            req.setDistanceKm(new BigDecimal("1.55"));
            Activity saved = savedActivity(SportType.WALKING, 77);
            saved.setDistanceKm(new BigDecimal("1.55"));

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDistancePoints(SportType.WALKING, new BigDecimal("1.55"))).thenReturn(77);
            when(activityRepository.save(any())).thenReturn(saved);

            ActivityResponse response = activityService.ingest(req, null);

            verify(scoringEngine).calculateDistancePoints(SportType.WALKING, new BigDecimal("1.55"));
            assertThat(response.getPointsAwarded()).isEqualTo(77);
        }

        @Test
        @DisplayName("CYCLING 3.7 km → calls calculateDistancePoints(CYCLING, 3.7)")
        void cycling_callsScoringEngine() {
            ActivityRequest req = baseRequest("CYCLING");
            req.setDistanceKm(new BigDecimal("3.7"));
            Activity saved = savedActivity(SportType.CYCLING, 92);
            saved.setDistanceKm(new BigDecimal("3.7"));

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDistancePoints(SportType.CYCLING, new BigDecimal("3.7"))).thenReturn(92);
            when(activityRepository.save(any())).thenReturn(saved);

            activityService.ingest(req, null);

            verify(scoringEngine).calculateDistancePoints(SportType.CYCLING, new BigDecimal("3.7"));
        }
    }

    // ── ingest — duration sports ─────────────────────────────────────────────

    @Nested
    @DisplayName("ingest() — duration sports (GYM / SWIMMING)")
    class DurationSportTests {

        @Test
        @DisplayName("GYM 45 min 50 sec → calls calculateDurationPoints(GYM, 45, 50)")
        void gym_callsScoringEngine() {
            ActivityRequest req = baseRequest("GYM");
            req.setDurationMinutes(45);
            req.setDurationSeconds(50);
            Activity saved = savedActivity(SportType.GYM, 225);
            saved.setDurationSeconds(45 * 60 + 50);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDurationPoints(SportType.GYM, 45, 50)).thenReturn(225);
            when(activityRepository.save(any())).thenReturn(saved);

            ActivityResponse response = activityService.ingest(req, null);

            verify(scoringEngine).calculateDurationPoints(SportType.GYM, 45, 50);
            assertThat(response.getPointsAwarded()).isEqualTo(225);
        }

        @Test
        @DisplayName("SWIMMING 30 min 0 sec → calls calculateDurationPoints(SWIMMING, 30, 0)")
        void swimming_callsScoringEngine() {
            ActivityRequest req = baseRequest("SWIMMING");
            req.setDurationMinutes(30);
            req.setDurationSeconds(0);
            Activity saved = savedActivity(SportType.SWIMMING, 450);
            saved.setDurationSeconds(30 * 60);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDurationPoints(SportType.SWIMMING, 30, 0)).thenReturn(450);
            when(activityRepository.save(any())).thenReturn(saved);

            activityService.ingest(req, null);

            verify(scoringEngine).calculateDurationPoints(SportType.SWIMMING, 30, 0);
        }

        @Test
        @DisplayName("durationSeconds null → defaults to 0 when calling ScoringEngine")
        void durationSecondsNull_defaultsToZero() {
            ActivityRequest req = baseRequest("GYM");
            req.setDurationMinutes(30);
            req.setDurationSeconds(null);
            Activity saved = savedActivity(SportType.GYM, 150);
            saved.setDurationSeconds(30 * 60);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDurationPoints(SportType.GYM, 30, 0)).thenReturn(150);
            when(activityRepository.save(any())).thenReturn(saved);

            activityService.ingest(req, null);

            verify(scoringEngine).calculateDurationPoints(SportType.GYM, 30, 0);
        }

        @Test
        @DisplayName("durationSeconds stored as combined total seconds in entity")
        void durationSeconds_storedAsCombinedTotalSeconds() {
            ActivityRequest req = baseRequest("SWIMMING");
            req.setDurationMinutes(1);
            req.setDurationSeconds(55);
            Activity saved = savedActivity(SportType.SWIMMING, 15);
            saved.setDurationSeconds(1 * 60 + 55); // 115

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDurationPoints(SportType.SWIMMING, 1, 55)).thenReturn(15);
            when(activityRepository.save(any())).thenReturn(saved);

            ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
            activityService.ingest(req, null);

            verify(activityRepository).save(captor.capture());
            assertThat(captor.getValue().getDurationSeconds()).isEqualTo(115);
        }
    }

    // ── ingest — step sport ──────────────────────────────────────────────────

    @Test
    @DisplayName("ingest — DAILY_STEPS 8450 → calls calculateStepPoints(8450)")
    void dailySteps_callsScoringEngine() {
        ActivityRequest req = baseRequest("DAILY_STEPS");
        req.setStepCount(8450);
        Activity saved = savedActivity(SportType.DAILY_STEPS, 84);
        saved.setStepCount(8450);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(scoringEngine.calculateStepPoints(8450)).thenReturn(84);
        when(activityRepository.save(any())).thenReturn(saved);

        ActivityResponse response = activityService.ingest(req, null);

        verify(scoringEngine).calculateStepPoints(8450);
        assertThat(response.getPointsAwarded()).isEqualTo(84);
        assertThat(response.getStepCount()).isEqualTo(8450);
    }

    // ── ingest — extraFields ─────────────────────────────────────────────────

    @Test
    @DisplayName("ingest — extraFields null → entity gets empty map")
    void extraFieldsNull_storedAsEmptyMap() {
        ActivityRequest req = baseRequest("RUNNING");
        req.setDistanceKm(new BigDecimal("5.0"));
        req.setExtraFields(null);
        Activity saved = savedActivity(SportType.RUNNING, 500);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(scoringEngine.calculateDistancePoints(any(), any())).thenReturn(500);
        when(activityRepository.save(any())).thenReturn(saved);

        ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
        activityService.ingest(req, null);

        verify(activityRepository).save(captor.capture());
        assertThat(captor.getValue().getExtraFields()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ingest — extraFields populated → stored and returned as-is")
    void extraFieldsPopulated_storedAndReturned() {
        ActivityRequest req = baseRequest("RUNNING");
        req.setDistanceKm(new BigDecimal("5.0"));
        req.setExtraFields(Map.of("heartRateBpm", 145, "weather", "sunny"));

        Activity saved = savedActivity(SportType.RUNNING, 500);
        saved.setDistanceKm(new BigDecimal("5.0"));
        saved.setExtraFields(Map.of("heartRateBpm", 145, "weather", "sunny"));

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(scoringEngine.calculateDistancePoints(any(), any())).thenReturn(500);
        when(activityRepository.save(any())).thenReturn(saved);

        ActivityResponse response = activityService.ingest(req, null);

        assertThat(response.getExtraFields()).containsEntry("heartRateBpm", 145);
        assertThat(response.getExtraFields()).containsEntry("weather", "sunny");
    }

    // ── ingest — response fields ─────────────────────────────────────────────

    @Test
    @DisplayName("ingest — response contains activityId, userId, sport, recordedAt")
    void ingest_responseFieldsCorrect() {
        ActivityRequest req = baseRequest("RUNNING");
        req.setDistanceKm(new BigDecimal("5.0"));

        Activity saved = savedActivity(SportType.RUNNING, 500);
        saved.setDistanceKm(new BigDecimal("5.0"));

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(scoringEngine.calculateDistancePoints(any(), any())).thenReturn(500);
        when(activityRepository.save(any())).thenReturn(saved);

        ActivityResponse response = activityService.ingest(req, null);

        assertThat(response.getActivityId()).isEqualTo(ACTIVITY_ID);
        assertThat(response.getUserId()).isEqualTo(USER_ID);
        assertThat(response.getSport()).isEqualTo("RUNNING");
        assertThat(response.getRecordedAt()).isEqualTo(NOW);
    }

    // ── deleteActivity ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteActivity()")
    class DeleteActivityTests {

        @Test
        @DisplayName("Activity not found → throws ActivityNotFoundException")
        void activityNotFound_throwsException() {
            when(activityRepository.existsById(ACTIVITY_ID)).thenReturn(false);

            assertThatThrownBy(() -> activityService.deleteActivity(ACTIVITY_ID))
                    .isInstanceOf(ActivityNotFoundException.class)
                    .hasMessageContaining(ACTIVITY_ID.toString());
        }

        @Test
        @DisplayName("Activity found → calls deleteById with correct id")
        void activityFound_callsDeleteById() {
            when(activityRepository.existsById(ACTIVITY_ID)).thenReturn(true);
            doNothing().when(activityRepository).deleteById(ACTIVITY_ID);

            activityService.deleteActivity(ACTIVITY_ID);

            verify(activityRepository).existsById(ACTIVITY_ID);
            verify(activityRepository).deleteById(ACTIVITY_ID);
        }

        @Test
        @DisplayName("Activity found → repository.save is never called")
        void activityFound_doesNotSave() {
            when(activityRepository.existsById(ACTIVITY_ID)).thenReturn(true);
            doNothing().when(activityRepository).deleteById(ACTIVITY_ID);

            activityService.deleteActivity(ACTIVITY_ID);

            verify(activityRepository, never()).save(any());
        }
    }

    // ── ingest — idempotency ─────────────────────────────────────────────────

    @Nested
    @DisplayName("ingest() — idempotency key")
    class IdempotencyTests {

        @Test
        @DisplayName("Known key → returns cached response without calling save")
        void knownKey_returnsCachedResponse_noSave() {
            UUID key = UUID.randomUUID();
            Activity existing = Activity.builder()
                    .id(ACTIVITY_ID)
                    .user(testUser())
                    .sport(SportType.RUNNING)
                    .distanceKm(new BigDecimal("5.25"))
                    .points(525)
                    .recordedAt(NOW)
                    .extraFields(Collections.emptyMap())
                    .idempotencyKey(key)
                    .build();

            when(activityRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existing));

            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.25"));

            ActivityResponse response = activityService.ingest(req, key);

            assertThat(response.getActivityId()).isEqualTo(ACTIVITY_ID);
            assertThat(response.getPointsAwarded()).isEqualTo(525);
            verify(activityRepository, never()).save(any());
            verify(userRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Known key → scoring engine is never called (no recompute)")
        void knownKey_scoringEngineNeverCalled() {
            UUID key = UUID.randomUUID();
            Activity existing = Activity.builder()
                    .id(ACTIVITY_ID).user(testUser())
                    .sport(SportType.RUNNING).points(525)
                    .recordedAt(NOW).extraFields(Collections.emptyMap())
                    .build();

            when(activityRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existing));

            activityService.ingest(baseRequest("RUNNING"), key);

            verifyNoInteractions(scoringEngine);
        }

        @Test
        @DisplayName("New key → activity saved with idempotency key stored on entity")
        void newKey_activitySavedWithKeyOnEntity() {
            UUID key = UUID.randomUUID();
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            Activity saved = savedActivity(SportType.RUNNING, 500);

            when(activityRepository.findByIdempotencyKey(key)).thenReturn(Optional.empty());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDistancePoints(any(), any())).thenReturn(500);
            when(activityRepository.save(any())).thenReturn(saved);

            ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
            activityService.ingest(req, key);

            verify(activityRepository).save(captor.capture());
            assertThat(captor.getValue().getIdempotencyKey()).isEqualTo(key);
        }

        @Test
        @DisplayName("Null key → findByIdempotencyKey is never called")
        void nullKey_skipsDuplicateCheck() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            Activity saved = savedActivity(SportType.RUNNING, 500);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDistancePoints(any(), any())).thenReturn(500);
            when(activityRepository.save(any())).thenReturn(saved);

            activityService.ingest(req, null);

            verify(activityRepository, never()).findByIdempotencyKey(any());
        }

        @Test
        @DisplayName("Null key → activity saved with null idempotency key")
        void nullKey_entitySavedWithNullKey() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            Activity saved = savedActivity(SportType.RUNNING, 500);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
            when(scoringEngine.calculateDistancePoints(any(), any())).thenReturn(500);
            when(activityRepository.save(any())).thenReturn(saved);

            ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
            activityService.ingest(req, null);

            verify(activityRepository).save(captor.capture());
            assertThat(captor.getValue().getIdempotencyKey()).isNull();
        }

        @Test
        @DisplayName("Known key with duration sport → minutes and seconds correctly re-derived from stored seconds")
        void knownKey_durationActivity_minutesSecondsRederived() {
            UUID key = UUID.randomUUID();
            Activity existing = Activity.builder()
                    .id(ACTIVITY_ID).user(testUser())
                    .sport(SportType.GYM)
                    .durationSeconds(45 * 60 + 50)   // 2750 stored as total seconds
                    .points(225)
                    .recordedAt(NOW).extraFields(Collections.emptyMap())
                    .build();

            when(activityRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existing));

            ActivityResponse response = activityService.ingest(baseRequest("GYM"), key);

            assertThat(response.getDurationMinutes()).isEqualTo(45);
            assertThat(response.getDurationSeconds()).isEqualTo(50);
        }
    }

    // ── getUserActivities ────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUserActivities()")
    class GetUserActivitiesTests {

        @Test
        @DisplayName("User not found → throws UserNotFoundException")
        void userNotFound_throwsException() {
            when(userRepository.existsById(USER_ID)).thenReturn(false);

            assertThatThrownBy(() -> activityService.getUserActivities(USER_ID, PageRequest.of(0, 20)))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("User found — returns mapped page of ActivityResponse")
        void userFound_returnsMappedPage() {
            Activity a1 = savedActivity(SportType.RUNNING, 500);
            a1.setDistanceKm(new BigDecimal("5.0"));
            Activity a2 = savedActivity(SportType.WALKING, 77);
            a2.setDistanceKm(new BigDecimal("1.55"));

            Page<Activity> page = new PageImpl<>(List.of(a1, a2));
            Pageable pageable = PageRequest.of(0, 20);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(activityRepository.findByUserIdOrderByRecordedAtDesc(USER_ID, pageable)).thenReturn(page);

            Page<ActivityResponse> result = activityService.getUserActivities(USER_ID, pageable);

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent().get(0).getSport()).isEqualTo("RUNNING");
            assertThat(result.getContent().get(1).getSport()).isEqualTo("WALKING");
        }
    }
}

package com.fitnesschallenge.fitness_challenge.validation;

import com.fitnesschallenge.fitness_challenge.dto.request.ActivityRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SportMetricConsistencyValidator")
class SportMetricConsistencyValidatorTest {

    private SportMetricConsistencyValidator validator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder.NodeBuilderCustomizableContext nodeBuilder;

    @BeforeEach
    void setUp() {
        validator = new SportMetricConsistencyValidator();
        lenient().doNothing().when(context).disableDefaultConstraintViolation();
        lenient().when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
        lenient().when(violationBuilder.addPropertyNode(anyString())).thenReturn(nodeBuilder);
        lenient().when(nodeBuilder.addConstraintViolation()).thenReturn(context);
    }

    private ActivityRequest baseRequest(String sport) {
        ActivityRequest req = new ActivityRequest();
        req.setSport(sport);
        req.setUserId(java.util.UUID.randomUUID());
        req.setRecordedAt(LocalDateTime.now());
        return req;
    }

    // ── Edge cases ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Null request → true (graceful skip)")
    void nullRequest_returnsTrue() {
        assertThat(validator.isValid(null, context)).isTrue();
    }

    @Test
    @DisplayName("Unknown sport \"YOGA\" → true (deferred to @ValidSport)")
    void unknownSport_returnsTrue() {
        ActivityRequest req = baseRequest("YOGA");
        assertThat(validator.isValid(req, context)).isTrue();
    }

    // ── Distance sports ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("RUNNING (distance sport)")
    class RunningTests {

        @Test
        @DisplayName("distanceKm provided → valid")
        void withDistanceKm_valid() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            assertThat(validator.isValid(req, context)).isTrue();
        }

        @Test
        @DisplayName("distanceKm null → invalid")
        void missingDistanceKm_invalid() {
            ActivityRequest req = baseRequest("RUNNING");
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("distanceKm zero → invalid")
        void zeroDistanceKm_invalid() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(BigDecimal.ZERO);
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("durationMinutes provided → invalid (metric mismatch)")
        void withDurationMinutes_invalid() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            req.setDurationMinutes(30);
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("stepCount provided → invalid (metric mismatch)")
        void withStepCount_invalid() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            req.setStepCount(1000);
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("all three metric fields → invalid (fully mixed)")
        void allThreeMetrics_invalid() {
            ActivityRequest req = baseRequest("RUNNING");
            req.setDistanceKm(new BigDecimal("5.0"));
            req.setDurationMinutes(30);
            req.setStepCount(1000);
            assertThat(validator.isValid(req, context)).isFalse();
        }
    }

    @Nested
    @DisplayName("WALKING (distance sport)")
    class WalkingTests {

        @Test
        @DisplayName("distanceKm provided → valid")
        void withDistanceKm_valid() {
            ActivityRequest req = baseRequest("WALKING");
            req.setDistanceKm(new BigDecimal("2.0"));
            assertThat(validator.isValid(req, context)).isTrue();
        }

        @Test
        @DisplayName("durationMinutes instead → invalid")
        void withDuration_invalid() {
            ActivityRequest req = baseRequest("WALKING");
            req.setDurationMinutes(20);
            assertThat(validator.isValid(req, context)).isFalse();
        }
    }

    @Nested
    @DisplayName("CYCLING (distance sport)")
    class CyclingTests {

        @Test
        @DisplayName("distanceKm provided → valid")
        void withDistanceKm_valid() {
            ActivityRequest req = baseRequest("CYCLING");
            req.setDistanceKm(new BigDecimal("10.0"));
            assertThat(validator.isValid(req, context)).isTrue();
        }

        @Test
        @DisplayName("distanceKm missing → invalid")
        void missingDistanceKm_invalid() {
            ActivityRequest req = baseRequest("CYCLING");
            assertThat(validator.isValid(req, context)).isFalse();
        }
    }

    // ── Duration sports ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("GYM (duration sport)")
    class GymTests {

        @Test
        @DisplayName("durationMinutes provided → valid")
        void withDurationMinutes_valid() {
            ActivityRequest req = baseRequest("GYM");
            req.setDurationMinutes(45);
            assertThat(validator.isValid(req, context)).isTrue();
        }

        @Test
        @DisplayName("durationMinutes null → invalid")
        void missingDurationMinutes_invalid() {
            ActivityRequest req = baseRequest("GYM");
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("distanceKm provided → invalid (mismatch)")
        void withDistanceKm_invalid() {
            ActivityRequest req = baseRequest("GYM");
            req.setDurationMinutes(45);
            req.setDistanceKm(new BigDecimal("5.0"));
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("stepCount provided → invalid (mismatch)")
        void withStepCount_invalid() {
            ActivityRequest req = baseRequest("GYM");
            req.setDurationMinutes(45);
            req.setStepCount(5000);
            assertThat(validator.isValid(req, context)).isFalse();
        }
    }

    @Nested
    @DisplayName("SWIMMING (duration sport)")
    class SwimmingTests {

        @Test
        @DisplayName("durationMinutes provided → valid")
        void withDurationMinutes_valid() {
            ActivityRequest req = baseRequest("SWIMMING");
            req.setDurationMinutes(30);
            assertThat(validator.isValid(req, context)).isTrue();
        }

        @Test
        @DisplayName("durationMinutes null → invalid")
        void missingDurationMinutes_invalid() {
            ActivityRequest req = baseRequest("SWIMMING");
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("distanceKm provided → invalid")
        void withDistanceKm_invalid() {
            ActivityRequest req = baseRequest("SWIMMING");
            req.setDurationMinutes(30);
            req.setDistanceKm(new BigDecimal("2.0"));
            assertThat(validator.isValid(req, context)).isFalse();
        }
    }

    // ── Step sport ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("DAILY_STEPS (step sport)")
    class DailyStepsTests {

        @Test
        @DisplayName("stepCount provided → valid")
        void withStepCount_valid() {
            ActivityRequest req = baseRequest("DAILY_STEPS");
            req.setStepCount(8000);
            assertThat(validator.isValid(req, context)).isTrue();
        }

        @Test
        @DisplayName("stepCount null → invalid")
        void missingStepCount_invalid() {
            ActivityRequest req = baseRequest("DAILY_STEPS");
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("stepCount zero → invalid")
        void zeroStepCount_invalid() {
            ActivityRequest req = baseRequest("DAILY_STEPS");
            req.setStepCount(0);
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("distanceKm provided → invalid (mismatch)")
        void withDistanceKm_invalid() {
            ActivityRequest req = baseRequest("DAILY_STEPS");
            req.setStepCount(8000);
            req.setDistanceKm(new BigDecimal("5.0"));
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("durationMinutes provided → invalid (mismatch)")
        void withDurationMinutes_invalid() {
            ActivityRequest req = baseRequest("DAILY_STEPS");
            req.setStepCount(8000);
            req.setDurationMinutes(30);
            assertThat(validator.isValid(req, context)).isFalse();
        }

        @Test
        @DisplayName("durationSeconds provided → invalid (mismatch)")
        void withDurationSeconds_invalid() {
            ActivityRequest req = baseRequest("DAILY_STEPS");
            req.setStepCount(8000);
            req.setDurationSeconds(30);
            assertThat(validator.isValid(req, context)).isFalse();
        }
    }
}

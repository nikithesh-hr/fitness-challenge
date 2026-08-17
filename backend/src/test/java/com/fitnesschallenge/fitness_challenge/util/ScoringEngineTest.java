package com.fitnesschallenge.fitness_challenge.util;

import com.fitnesschallenge.fitness_challenge.enums.SportType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ScoringEngine")
class ScoringEngineTest {

    private ScoringEngine scoringEngine;

    @BeforeEach
    void setUp() {
        scoringEngine = new ScoringEngine();
    }

    // ── Distance sports ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("Running — 100 pts/km, floored")
    class RunningTests {

        @Test
        @DisplayName("1.0 km → 100 pts")
        void running_exactOneKm() {
            int pts = scoringEngine.calculateDistancePoints(SportType.RUNNING, new BigDecimal("1.0"));
            assertThat(pts).isEqualTo(100);
        }

        @Test
        @DisplayName("5.25 km → 525 pts (floor 525.0)")
        void running_fractionalKm_noDecimal() {
            int pts = scoringEngine.calculateDistancePoints(SportType.RUNNING, new BigDecimal("5.25"));
            assertThat(pts).isEqualTo(525);
        }

        @Test
        @DisplayName("5.999 km → 599 pts (floor 599.9)")
        void running_fractionalKm_floorApplied() {
            int pts = scoringEngine.calculateDistancePoints(SportType.RUNNING, new BigDecimal("5.999"));
            assertThat(pts).isEqualTo(599);
        }

        @Test
        @DisplayName("0.001 km → 0 pts (floor 0.1)")
        void running_verySmallDistance_zeroPoints() {
            int pts = scoringEngine.calculateDistancePoints(SportType.RUNNING, new BigDecimal("0.001"));
            assertThat(pts).isEqualTo(0);
        }

        @Test
        @DisplayName("10.0 km → 1000 pts")
        void running_tenKm() {
            int pts = scoringEngine.calculateDistancePoints(SportType.RUNNING, new BigDecimal("10.0"));
            assertThat(pts).isEqualTo(1000);
        }
    }

    @Nested
    @DisplayName("Walking — 50 pts/km, floored")
    class WalkingTests {

        @Test
        @DisplayName("1.0 km → 50 pts")
        void walking_exactOneKm() {
            int pts = scoringEngine.calculateDistancePoints(SportType.WALKING, new BigDecimal("1.0"));
            assertThat(pts).isEqualTo(50);
        }

        @Test
        @DisplayName("1.55 km → 77 pts (PDF example: 77.5 floors to 77)")
        void walking_pdfExample_floorApplied() {
            int pts = scoringEngine.calculateDistancePoints(SportType.WALKING, new BigDecimal("1.55"));
            assertThat(pts).isEqualTo(77);
        }

        @Test
        @DisplayName("0.001 km → 0 pts")
        void walking_verySmallDistance_zeroPoints() {
            int pts = scoringEngine.calculateDistancePoints(SportType.WALKING, new BigDecimal("0.001"));
            assertThat(pts).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Cycling — 25 pts/km, floored")
    class CyclingTests {

        @Test
        @DisplayName("1.0 km → 25 pts")
        void cycling_exactOneKm() {
            int pts = scoringEngine.calculateDistancePoints(SportType.CYCLING, new BigDecimal("1.0"));
            assertThat(pts).isEqualTo(25);
        }

        @Test
        @DisplayName("3.7 km → 92 pts (floor 92.5)")
        void cycling_fractionalKm_floorApplied() {
            int pts = scoringEngine.calculateDistancePoints(SportType.CYCLING, new BigDecimal("3.7"));
            assertThat(pts).isEqualTo(92);
        }

        @Test
        @DisplayName("0.001 km → 0 pts")
        void cycling_verySmallDistance_zeroPoints() {
            int pts = scoringEngine.calculateDistancePoints(SportType.CYCLING, new BigDecimal("0.001"));
            assertThat(pts).isEqualTo(0);
        }
    }

    // ── Duration sports ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("Swimming — 15 pts/whole-minute, partial minutes discarded")
    class SwimmingTests {

        @Test
        @DisplayName("1 min 55 sec → 1 whole minute → 15 pts (PDF: sub-minute discarded)")
        void swimming_oneMinuteFiftyFive_onlyOneMinuteCounts() {
            int pts = scoringEngine.calculateDurationPoints(SportType.SWIMMING, 1, 55);
            assertThat(pts).isEqualTo(15);
        }

        @Test
        @DisplayName("45 min 50 sec → 45 whole minutes → 675 pts")
        void swimming_fortyFiveMinFifty_pdfExample() {
            int pts = scoringEngine.calculateDurationPoints(SportType.SWIMMING, 45, 50);
            assertThat(pts).isEqualTo(675);
        }

        @Test
        @DisplayName("0 min 0 sec → 0 pts")
        void swimming_zeroTime_zeroPoints() {
            int pts = scoringEngine.calculateDurationPoints(SportType.SWIMMING, 0, 0);
            assertThat(pts).isEqualTo(0);
        }

        @Test
        @DisplayName("0 min 59 sec → 0 pts (< 1 full minute)")
        void swimming_fiftyNineSecondsOnly_zeroPoints() {
            int pts = scoringEngine.calculateDurationPoints(SportType.SWIMMING, 0, 59);
            assertThat(pts).isEqualTo(0);
        }

        @Test
        @DisplayName("30 min 0 sec → 450 pts")
        void swimming_exactThirtyMinutes() {
            int pts = scoringEngine.calculateDurationPoints(SportType.SWIMMING, 30, 0);
            assertThat(pts).isEqualTo(450);
        }
    }

    @Nested
    @DisplayName("Gym — 5 pts/whole-minute, partial minutes discarded")
    class GymTests {

        @Test
        @DisplayName("45 min 50 sec → 45 whole minutes → 225 pts")
        void gym_fortyFiveMinFifty() {
            int pts = scoringEngine.calculateDurationPoints(SportType.GYM, 45, 50);
            assertThat(pts).isEqualTo(225);
        }

        @Test
        @DisplayName("0 min 59 sec → 0 pts (sub-minute)")
        void gym_fiftyNineSeconds_zeroPoints() {
            int pts = scoringEngine.calculateDurationPoints(SportType.GYM, 0, 59);
            assertThat(pts).isEqualTo(0);
        }

        @Test
        @DisplayName("60 min 0 sec → 300 pts")
        void gym_sixtyMinutes() {
            int pts = scoringEngine.calculateDurationPoints(SportType.GYM, 60, 0);
            assertThat(pts).isEqualTo(300);
        }

        @Test
        @DisplayName("1 min 0 sec → 5 pts")
        void gym_exactOneMinute() {
            int pts = scoringEngine.calculateDurationPoints(SportType.GYM, 1, 0);
            assertThat(pts).isEqualTo(5);
        }
    }

    // ── Step sport ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Daily Steps — 1 pt per 100 steps, partial blocks discarded")
    class DailyStepsTests {

        @Test
        @DisplayName("100 steps → 1 pt")
        void steps_exactOneBlock() {
            assertThat(scoringEngine.calculateStepPoints(100)).isEqualTo(1);
        }

        @Test
        @DisplayName("399 steps → 3 pts (PDF: floors to 300 steps = 3 blocks)")
        void steps_pdfExample_threeHundredFloor() {
            assertThat(scoringEngine.calculateStepPoints(399)).isEqualTo(3);
        }

        @Test
        @DisplayName("99 steps → 0 pts (< 1 full block)")
        void steps_subBlock_zeroPoints() {
            assertThat(scoringEngine.calculateStepPoints(99)).isEqualTo(0);
        }

        @Test
        @DisplayName("8450 steps → 84 pts")
        void steps_eightThousandFourFifty() {
            assertThat(scoringEngine.calculateStepPoints(8450)).isEqualTo(84);
        }

        @Test
        @DisplayName("1000 steps → 10 pts")
        void steps_oneThousandExact() {
            assertThat(scoringEngine.calculateStepPoints(1000)).isEqualTo(10);
        }

        @Test
        @DisplayName("1 step → 0 pts")
        void steps_singleStep_zeroPoints() {
            assertThat(scoringEngine.calculateStepPoints(1)).isEqualTo(0);
        }
    }
}

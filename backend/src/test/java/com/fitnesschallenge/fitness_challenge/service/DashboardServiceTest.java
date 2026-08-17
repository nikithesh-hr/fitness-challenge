package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.response.DashboardResponse;
import com.fitnesschallenge.fitness_challenge.entity.User;
import com.fitnesschallenge.fitness_challenge.enums.SportType;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.repository.ActivityRepository;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private DashboardService dashboardService;

    private final UUID USER_ID = UUID.randomUUID();

    private User testUser() {
        return User.builder().id(USER_ID).firstName("Jane").lastName("Smith").email("jane@test.com").build();
    }

    // ── Helper: sport breakdown projection ───────────────────────────────────

    private ActivityRepository.SportBreakdownProjection sportBreakdown(SportType sport, long pts) {
        return new ActivityRepository.SportBreakdownProjection() {
            @Override public SportType getSport()    { return sport; }
            @Override public Long getTotalPoints()   { return pts; }
        };
    }

    // ── Helper: weekly volume projection ────────────────────────────────────

    private ActivityRepository.WeeklyVolumeProjection weeklyVolume(Object week, long pts, long count) {
        return new ActivityRepository.WeeklyVolumeProjection() {
            @Override public Object getWeek()          { return week; }
            @Override public Long getTotalPoints()     { return pts; }
            @Override public Long getActivityCount()   { return count; }
        };
    }

    // ── User not found ───────────────────────────────────────────────────────

    @Test
    @DisplayName("User not found → throws UserNotFoundException")
    void userNotFound_throwsException() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dashboardService.getDashboard(USER_ID))
                .isInstanceOf(UserNotFoundException.class);
    }

    // ── Sport breakdown ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Sport breakdown — mapped to map keyed by sport name with correct totals")
    void sportBreakdown_mappedCorrectly() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(1700);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of(
                sportBreakdown(SportType.RUNNING, 1000L),
                sportBreakdown(SportType.CYCLING, 700L)
        ));
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getSportBreakdown()).containsEntry("RUNNING", 1000L);
        assertThat(response.getSportBreakdown()).containsEntry("CYCLING", 700L);
        assertThat(response.getSportBreakdown()).hasSize(2);
    }

    // ── Weekly volume — date formatting ──────────────────────────────────────

    @Test
    @DisplayName("Weekly volume — Timestamp input → formatted as YYYY-MM-DD")
    void weeklyVolume_timestampInput_formattedCorrectly() {
        LocalDateTime ldt = LocalDate.of(2026, 8, 4).atStartOfDay(); // Monday
        Timestamp ts = Timestamp.valueOf(ldt);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(340);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of());
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of(
                weeklyVolume(ts, 340L, 3L)
        ));

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getWeeklyVolume()).hasSize(1);
        assertThat(response.getWeeklyVolume().get(0).getWeek()).isEqualTo("2026-08-04");
    }

    @Test
    @DisplayName("Weekly volume — LocalDateTime input → formatted as YYYY-MM-DD")
    void weeklyVolume_localDateTimeInput_formattedCorrectly() {
        LocalDateTime ldt = LocalDate.of(2026, 8, 11).atStartOfDay();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(500);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of());
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of(
                weeklyVolume(ldt, 500L, 4L)
        ));

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getWeeklyVolume().get(0).getWeek()).isEqualTo("2026-08-11");
    }

    @Test
    @DisplayName("Weekly volume — String input (fallback) → formatted as YYYY-MM-DD")
    void weeklyVolume_stringInput_formattedCorrectly() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(200);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of());
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of(
                weeklyVolume("2026-08-18 00:00:00.0", 200L, 2L)
        ));

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getWeeklyVolume().get(0).getWeek()).isEqualTo("2026-08-18");
    }

    @Test
    @DisplayName("Weekly volume — null week → stored as empty string")
    void weeklyVolume_nullWeek_storedAsEmptyString() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(0);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of());
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of(
                weeklyVolume(null, 0L, 0L)
        ));

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getWeeklyVolume().get(0).getWeek()).isEmpty();
    }

    // ── Total activities ─────────────────────────────────────────────────────

    @Test
    @DisplayName("totalActivities = sum of activityCount across all weeks")
    void totalActivities_summedAcrossWeeks() {
        LocalDateTime w1 = LocalDate.of(2026, 8, 4).atStartOfDay();
        LocalDateTime w2 = LocalDate.of(2026, 8, 11).atStartOfDay();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(1000);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of());
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of(
                weeklyVolume(w1, 400L, 3L),
                weeklyVolume(w2, 600L, 5L)
        ));

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getTotalActivities()).isEqualTo(8);
    }

    // ── Full name ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("fullName = firstName + space + lastName")
    void fullName_concatenatedCorrectly() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser()));
        when(activityRepository.sumPointsByUserId(USER_ID)).thenReturn(0);
        when(activityRepository.findSportBreakdownByUserId(USER_ID)).thenReturn(List.of());
        when(activityRepository.findWeeklyVolumeByUserId(USER_ID)).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertThat(response.getFullName()).isEqualTo("Jane Smith");
    }
}

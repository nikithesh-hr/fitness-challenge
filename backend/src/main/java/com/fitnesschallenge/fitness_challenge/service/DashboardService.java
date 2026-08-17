package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.response.DashboardResponse;
import com.fitnesschallenge.fitness_challenge.entity.User;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.repository.ActivityRepository;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        int totalPoints = activityRepository.sumPointsByUserId(userId);

        Map<String, Long> sportBreakdown = activityRepository
                .findSportBreakdownByUserId(userId)
                .stream()
                .collect(Collectors.toMap(
                        p -> p.getSport().name(),
                        ActivityRepository.SportBreakdownProjection::getTotalPoints,
                        (a, b) -> a,
                        LinkedHashMap::new));

        List<DashboardResponse.WeeklyVolume> weeklyVolume = activityRepository
                .findWeeklyVolumeByUserId(userId)
                .stream()
                .map(p -> DashboardResponse.WeeklyVolume.builder()
                        .week(formatWeekDate(p.getWeek()))
                        .totalPoints(p.getTotalPoints())
                        .activityCount(p.getActivityCount())
                        .build())
                .sorted(Comparator.comparing(DashboardResponse.WeeklyVolume::getWeek))
                .collect(Collectors.toList());

        long totalActivities = weeklyVolume.stream().mapToLong(DashboardResponse.WeeklyVolume::getActivityCount).sum();

        return DashboardResponse.builder()
                .userId(user.getId())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .totalPoints(totalPoints)
                .totalActivities((int) totalActivities)
                .sportBreakdown(sportBreakdown)
                .weeklyVolume(weeklyVolume)
                .build();
    }

    /**
     * Converts whatever Hibernate returns from date_trunc into "YYYY-MM-DD"
     * (the Monday that starts the ISO week). Safe, timezone-free, easily
     * parsed by the frontend as a calendar date.
     */
    private String formatWeekDate(Object weekObj) {
        if (weekObj == null) return "";
        LocalDate weekStart;
        if (weekObj instanceof Timestamp ts) {
            weekStart = ts.toLocalDateTime().toLocalDate();
        } else if (weekObj instanceof LocalDateTime ldt) {
            weekStart = ldt.toLocalDate();
        } else {
            String raw = weekObj.toString();
            String datePart = raw.length() >= 10 ? raw.substring(0, 10) : raw;
            weekStart = LocalDate.parse(datePart);
        }
        return weekStart.toString(); // "YYYY-MM-DD"
    }
}

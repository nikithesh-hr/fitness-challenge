package com.fitnesschallenge.fitness_challenge.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class DashboardResponse {

    private UUID userId;
    private String fullName;
    private int totalPoints;
    private int totalActivities;

    /** Points grouped by sport name */
    private Map<String, Long> sportBreakdown;

    /** Points and activity count per week (ISO week start date as string) */
    private List<WeeklyVolume> weeklyVolume;

    @Data
    @Builder
    public static class WeeklyVolume {
        private String week;
        private long totalPoints;
        private long activityCount;
    }
}

package com.fitnesschallenge.fitness_challenge.repository;

import com.fitnesschallenge.fitness_challenge.entity.Activity;
import com.fitnesschallenge.fitness_challenge.enums.SportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    Page<Activity> findByUserIdOrderByRecordedAtDesc(UUID userId, Pageable pageable);

    void deleteByUserId(UUID userId);

    Optional<Activity> findByIdempotencyKey(UUID idempotencyKey);

    @Query("""
            SELECT a.sport AS sport, SUM(a.points) AS totalPoints
            FROM Activity a
            WHERE a.user.id = :userId
            GROUP BY a.sport
            """)
    List<SportBreakdownProjection> findSportBreakdownByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT FUNCTION('date_trunc', 'week', a.recordedAt) AS week,
                   SUM(a.points) AS totalPoints,
                   COUNT(a.id) AS activityCount
            FROM Activity a
            WHERE a.user.id = :userId
            GROUP BY FUNCTION('date_trunc', 'week', a.recordedAt)
            """)
    List<WeeklyVolumeProjection> findWeeklyVolumeByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(a.points), 0) FROM Activity a WHERE a.user.id = :userId")
    Integer sumPointsByUserId(@Param("userId") UUID userId);

    interface SportBreakdownProjection {
        SportType getSport();
        Long getTotalPoints();
    }

    interface WeeklyVolumeProjection {
        Object getWeek();
        Long getTotalPoints();
        Long getActivityCount();
    }
}

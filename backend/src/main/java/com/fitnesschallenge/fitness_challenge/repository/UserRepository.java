package com.fitnesschallenge.fitness_challenge.repository;

import com.fitnesschallenge.fitness_challenge.entity.User;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByFirstNameIgnoreCaseAndLastNameIgnoreCase(
            @Param("firstName") String firstName,
            @Param("lastName") String lastName);

    List<User> findAllByOrderByFirstNameAscLastNameAsc();

    // 4 most recently registered users — shown in picker before any search
    List<User> findTop4ByOrderByCreatedAtDesc();

    // Filtered search across firstName, lastName, email
    @Query("""
            SELECT u FROM User u
            WHERE lower(u.firstName) LIKE lower(concat('%', :q, '%'))
               OR lower(u.lastName)  LIKE lower(concat('%', :q, '%'))
               OR lower(u.email)     LIKE lower(concat('%', :q, '%'))
            ORDER BY u.firstName, u.lastName
            """)
    List<User> searchUsers(@Param("q") String query, Limit limit);

    // LEFT JOIN leaderboard — all users appear even with 0 activities
    @Query("""
            SELECT u.id AS userId,
                   CONCAT(u.firstName, ' ', u.lastName) AS fullName,
                   COALESCE(SUM(a.points), 0) AS totalPoints
            FROM User u
            LEFT JOIN Activity a ON a.user.id = u.id
            GROUP BY u.id, u.firstName, u.lastName
            ORDER BY COALESCE(SUM(a.points), 0) DESC
            """)
    List<LeaderboardProjection> findLeaderboard();

    interface LeaderboardProjection {
        UUID getUserId();
        String getFullName();
        Long getTotalPoints();
    }
}

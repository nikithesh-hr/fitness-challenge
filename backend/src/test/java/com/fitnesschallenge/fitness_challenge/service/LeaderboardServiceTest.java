package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.response.LeaderboardEntry;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaderboardService")
class LeaderboardServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private LeaderboardService leaderboardService;

    private UserRepository.LeaderboardProjection projection(String fullName, long totalPoints) {
        return new UserRepository.LeaderboardProjection() {
            @Override public UUID getUserId()      { return UUID.randomUUID(); }
            @Override public String getFullName()  { return fullName; }
            @Override public Long getTotalPoints() { return totalPoints; }
        };
    }

    @Test
    @DisplayName("Empty leaderboard — returns empty page")
    void emptyLeaderboard_returnsEmptyPage() {
        when(userRepository.findLeaderboard()).thenReturn(List.of());

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(0, 10);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
    }

    @Test
    @DisplayName("Single user — rank is 1")
    void singleUser_rankIsOne() {
        when(userRepository.findLeaderboard()).thenReturn(List.of(
                projection("Jane Smith", 1000L)
        ));

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRank()).isEqualTo(1);
        assertThat(result.getContent().get(0).getFullName()).isEqualTo("Jane Smith");
        assertThat(result.getContent().get(0).getTotalPoints()).isEqualTo(1000L);
    }

    @Test
    @DisplayName("Multiple users — ranks assigned sequentially starting at 1")
    void multipleUsers_ranksAreSequential() {
        when(userRepository.findLeaderboard()).thenReturn(List.of(
                projection("Alice Brown", 2000L),
                projection("Bob Jones",  1500L),
                projection("Carol White", 800L)
        ));

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(0, 10);

        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getContent().get(0).getRank()).isEqualTo(1);
        assertThat(result.getContent().get(1).getRank()).isEqualTo(2);
        assertThat(result.getContent().get(2).getRank()).isEqualTo(3);
    }

    @Test
    @DisplayName("Pagination — page 1 with size 2 returns correct slice with offset ranks")
    void pagination_page1Size2_returnsCorrectSlice() {
        when(userRepository.findLeaderboard()).thenReturn(List.of(
                projection("Alice", 3000L),
                projection("Bob",   2000L),
                projection("Carol", 1000L),
                projection("Dave",   500L)
        ));

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(1, 2);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getRank()).isEqualTo(3); // global rank preserved
        assertThat(result.getContent().get(0).getFullName()).isEqualTo("Carol");
        assertThat(result.getContent().get(1).getRank()).isEqualTo(4);
        assertThat(result.getTotalElements()).isEqualTo(4);
        assertThat(result.getTotalPages()).isEqualTo(2);
    }

    @Test
    @DisplayName("User with zero points — included with totalPoints = 0")
    void zeroPointsUser_includedInResult() {
        when(userRepository.findLeaderboard()).thenReturn(List.of(
                projection("Top User",  500L),
                projection("New User",    0L)
        ));

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(0, 10);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(1).getTotalPoints()).isEqualTo(0L);
        assertThat(result.getContent().get(1).getFullName()).isEqualTo("New User");
    }

    @Test
    @DisplayName("Rank always starts at 1 on page 0")
    void rankAlwaysStartsAtOne() {
        when(userRepository.findLeaderboard()).thenReturn(List.of(
                projection("Only User", 999L)
        ));

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(0, 10);

        assertThat(result.getContent().get(0).getRank()).isEqualTo(1);
    }

    @Test
    @DisplayName("Full name and userId are preserved from projection")
    void projectionFieldsPreserved() {
        UUID userId = UUID.randomUUID();
        UserRepository.LeaderboardProjection proj = new UserRepository.LeaderboardProjection() {
            @Override public UUID getUserId()      { return userId; }
            @Override public String getFullName()  { return "Jane Doe"; }
            @Override public Long getTotalPoints() { return 350L; }
        };

        when(userRepository.findLeaderboard()).thenReturn(List.of(proj));

        Page<LeaderboardEntry> result = leaderboardService.getLeaderboard(0, 10);

        assertThat(result.getContent().get(0).getUserId()).isEqualTo(userId);
        assertThat(result.getContent().get(0).getFullName()).isEqualTo("Jane Doe");
        assertThat(result.getContent().get(0).getTotalPoints()).isEqualTo(350L);
    }
}

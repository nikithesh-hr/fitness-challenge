package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.response.LeaderboardEntry;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<LeaderboardEntry> getLeaderboard(int page, int size) {
        List<UserRepository.LeaderboardProjection> projections = userRepository.findLeaderboard();

        // Assign global ranks across all users before slicing
        List<LeaderboardEntry> allEntries = new ArrayList<>(projections.size());
        int rank = 1;
        for (UserRepository.LeaderboardProjection p : projections) {
            allEntries.add(LeaderboardEntry.builder()
                    .rank(rank++)
                    .userId(p.getUserId())
                    .fullName(p.getFullName())
                    .totalPoints(p.getTotalPoints())
                    .build());
        }

        int total = allEntries.size();
        int from  = Math.min(page * size, total);
        int to    = Math.min(from + size, total);

        return new PageImpl<>(allEntries.subList(from, to), PageRequest.of(page, size), total);
    }
}

package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.request.UserRegistrationRequest;
import com.fitnesschallenge.fitness_challenge.dto.response.UserRegistrationResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.UserSearchResponse;
import com.fitnesschallenge.fitness_challenge.entity.User;
import com.fitnesschallenge.fitness_challenge.exception.DuplicateEmailException;
import com.fitnesschallenge.fitness_challenge.exception.DuplicateUserException;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.repository.ActivityRepository;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;

    @Transactional
    public UserRegistrationResponse register(UserRegistrationRequest request) {
        userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase(
                request.getFirstName(), request.getLastName())
                .ifPresent(existing -> {
                    throw new DuplicateUserException(request.getFirstName(), request.getLastName());
                });

        userRepository.findByEmailIgnoreCase(request.getEmail())
                .ifPresent(existing -> {
                    throw new DuplicateEmailException(request.getEmail());
                });

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .build();

        User saved = userRepository.save(user);

        return UserRegistrationResponse.builder()
                .userId(saved.getId())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .email(saved.getEmail())
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserSearchResponse> recentUsers() {
        return userRepository.findTop4ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toSearchResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSearchResponse> searchUsers(String query) {
        if (query == null || query.isBlank()) {
            return userRepository.findAllByOrderByFirstNameAscLastNameAsc()
                    .stream()
                    .map(this::toSearchResponse)
                    .collect(Collectors.toList());
        }
        return userRepository.searchUsers(query.trim(), Limit.of(10))
                .stream()
                .map(this::toSearchResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }
        activityRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    private UserSearchResponse toSearchResponse(User user) {
        return UserSearchResponse.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }
}

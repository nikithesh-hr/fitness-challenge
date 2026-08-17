package com.fitnesschallenge.fitness_challenge.controller;

import com.fitnesschallenge.fitness_challenge.dto.request.UserRegistrationRequest;
import com.fitnesschallenge.fitness_challenge.dto.response.ActivityResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.DashboardResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.UserRegistrationResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.UserSearchResponse;
import com.fitnesschallenge.fitness_challenge.service.ActivityService;
import com.fitnesschallenge.fitness_challenge.service.DashboardService;
import com.fitnesschallenge.fitness_challenge.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User registration and profile endpoints")
public class UserController {

    private final UserService userService;
    private final ActivityService activityService;
    private final DashboardService dashboardService;

    @GetMapping("/recent")
    @Operation(summary = "Get the 4 most recently registered users")
    public ResponseEntity<List<UserSearchResponse>> recentUsers() {
        return ResponseEntity.ok(userService.recentUsers());
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by first name, last name or email")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<UserRegistrationResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Delete a user and all their activities")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/dashboard")
    @Operation(summary = "Get personal dashboard for a user")
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable UUID userId) {
        return ResponseEntity.ok(dashboardService.getDashboard(userId));
    }

    @GetMapping("/{userId}/activities")
    @Operation(summary = "Get paginated activity history for a user")
    public ResponseEntity<Page<ActivityResponse>> getUserActivities(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(activityService.getUserActivities(userId, pageable));
    }
}

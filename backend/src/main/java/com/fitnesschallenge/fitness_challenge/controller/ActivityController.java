package com.fitnesschallenge.fitness_challenge.controller;

import com.fitnesschallenge.fitness_challenge.dto.request.ActivityRequest;
import com.fitnesschallenge.fitness_challenge.dto.response.ActivityResponse;
import com.fitnesschallenge.fitness_challenge.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/activities")
@RequiredArgsConstructor
@Tag(name = "Activities", description = "Fitness activity ingestion endpoint")
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    @Operation(summary = "Ingest a fitness activity and receive awarded points")
    public ResponseEntity<ActivityResponse> ingest(
            @Valid @RequestBody ActivityRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) java.util.UUID idempotencyKey) {
        ActivityService.IngestResult result = activityService.ingest(request, idempotencyKey);
        HttpStatus status = result.replay() ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(result.response());
    }

    @DeleteMapping("/{activityId}")
    @Operation(summary = "Delete a specific activity by its ID")
    public ResponseEntity<Void> delete(@PathVariable java.util.UUID activityId) {
        activityService.deleteActivity(activityId);
        return ResponseEntity.noContent().build();
    }
}

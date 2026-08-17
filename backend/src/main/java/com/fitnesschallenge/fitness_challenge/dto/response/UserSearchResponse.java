package com.fitnesschallenge.fitness_challenge.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserSearchResponse {

    private UUID userId;
    private String firstName;
    private String lastName;
    private String email;
}

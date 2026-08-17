package com.fitnesschallenge.fitness_challenge.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI fitnessOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Fitness Challenge API")
                        .description("REST API for the Fitness Challenge Application — tracks running, walking, cycling, gym, swimming, and daily steps with a unified points leaderboard.")
                        .version("1.0.0"));
    }
}

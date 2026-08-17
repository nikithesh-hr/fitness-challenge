package com.fitnesschallenge.fitness_challenge.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ValidSportValidator")
class ValidSportValidatorTest {

    private ValidSportValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ValidSportValidator();
    }

    @ParameterizedTest(name = "valid sport \"{0}\" → true")
    @ValueSource(strings = {"RUNNING", "WALKING", "CYCLING", "GYM", "SWIMMING", "DAILY_STEPS"})
    @DisplayName("All six known sports (uppercase) are valid")
    void allSixSports_uppercase_valid(String sport) {
        assertThat(validator.isValid(sport, null)).isTrue();
    }

    @ParameterizedTest(name = "valid sport lowercase \"{0}\" → true")
    @ValueSource(strings = {"running", "walking", "cycling", "gym", "swimming", "daily_steps"})
    @DisplayName("All six known sports (lowercase) are valid via toUpperCase")
    void allSixSports_lowercase_valid(String sport) {
        assertThat(validator.isValid(sport, null)).isTrue();
    }

    @Test
    @DisplayName("Mixed-case \"Swimming\" → true")
    void mixedCase_valid() {
        assertThat(validator.isValid("Swimming", null)).isTrue();
    }

    @Test
    @DisplayName("Unknown sport \"YOGA\" → false")
    void unknownSport_yoga_invalid() {
        assertThat(validator.isValid("YOGA", null)).isFalse();
    }

    @Test
    @DisplayName("Numeric string \"123\" → false")
    void numericString_invalid() {
        assertThat(validator.isValid("123", null)).isFalse();
    }

    @Test
    @DisplayName("Empty string → false")
    void emptyString_invalid() {
        assertThat(validator.isValid("", null)).isFalse();
    }

    @Test
    @DisplayName("Null → false")
    void null_invalid() {
        assertThat(validator.isValid(null, null)).isFalse();
    }

    @Test
    @DisplayName("Partial name \"RUN\" → false")
    void partialName_invalid() {
        assertThat(validator.isValid("RUN", null)).isFalse();
    }

    @Test
    @DisplayName("Whitespace \" \" → false")
    void whitespace_invalid() {
        assertThat(validator.isValid(" ", null)).isFalse();
    }
}

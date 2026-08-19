package com.fitnesschallenge.fitness_challenge.dto.request;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DistanceKmDeserializer")
class DistanceKmDeserializerTest {

    @Test
    @DisplayName("truncates extra decimals without rounding up")
    void truncatesExtraDecimals() {
        assertThat(DistanceKmDeserializer.normalize(new BigDecimal("5.2519")))
                .isEqualByComparingTo("5.251");
    }

    @Test
    @DisplayName("clamps values above 1000 km")
    void clampsOverMax() {
        assertThat(DistanceKmDeserializer.normalize(new BigDecimal("1000.001")))
                .isEqualByComparingTo("1000.000");
    }

    @Test
    @DisplayName("keeps a 3-decimal value unchanged")
    void keepsThreeDecimals() {
        assertThat(DistanceKmDeserializer.normalize(new BigDecimal("5.250")))
                .isEqualByComparingTo("5.250");
    }
}

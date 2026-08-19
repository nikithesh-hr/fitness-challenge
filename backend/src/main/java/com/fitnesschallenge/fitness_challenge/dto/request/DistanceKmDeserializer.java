package com.fitnesschallenge.fitness_challenge.dto.request;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Auto-corrects distance: at most 3 decimal places (truncated) and at most 1000 km.
 */
public class DistanceKmDeserializer extends JsonDeserializer<BigDecimal> {

    static final BigDecimal MAX = new BigDecimal("1000.000");
    static final int SCALE = 3;

    @Override
    public BigDecimal deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        BigDecimal value = p.getDecimalValue();
        return normalize(value);
    }

    static BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            return null;
        }
        BigDecimal scaled = value.setScale(SCALE, RoundingMode.DOWN);
        if (scaled.compareTo(MAX) > 0) {
            return MAX;
        }
        return scaled;
    }
}

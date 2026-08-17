package com.fitnesschallenge.fitness_challenge.validation;

import com.fitnesschallenge.fitness_challenge.enums.SportType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidSportValidator implements ConstraintValidator<ValidSport, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) return false;
        try {
            SportType.valueOf(value.toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}

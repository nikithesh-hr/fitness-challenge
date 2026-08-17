package com.fitnesschallenge.fitness_challenge.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidSportValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidSport {

    String message() default "must be one of: RUNNING, WALKING, CYCLING, GYM, SWIMMING, DAILY_STEPS";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

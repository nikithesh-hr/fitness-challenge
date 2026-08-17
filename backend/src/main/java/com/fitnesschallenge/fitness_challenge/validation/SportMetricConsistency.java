package com.fitnesschallenge.fitness_challenge.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = SportMetricConsistencyValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface SportMetricConsistency {

    String message() default "Metric fields do not match the specified sport type";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

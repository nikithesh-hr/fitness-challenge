package com.fitnesschallenge.fitness_challenge.exception;

public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String firstName, String lastName) {
        super("A user with the name '" + firstName + " " + lastName + "' is already registered.");
    }
}

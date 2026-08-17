package com.fitnesschallenge.fitness_challenge.exception;

public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email) {
        super("A user with the email '" + email + "' is already registered.");
    }
}

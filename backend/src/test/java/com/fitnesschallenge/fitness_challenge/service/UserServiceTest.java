package com.fitnesschallenge.fitness_challenge.service;

import com.fitnesschallenge.fitness_challenge.dto.request.UserRegistrationRequest;
import com.fitnesschallenge.fitness_challenge.dto.response.UserRegistrationResponse;
import com.fitnesschallenge.fitness_challenge.dto.response.UserSearchResponse;
import com.fitnesschallenge.fitness_challenge.entity.User;
import com.fitnesschallenge.fitness_challenge.exception.DuplicateUserException;
import com.fitnesschallenge.fitness_challenge.exception.UserNotFoundException;
import com.fitnesschallenge.fitness_challenge.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    // ── Helper builders ──────────────────────────────────────────────────────

    private User buildUser(String first, String last, String email) {
        return User.builder()
                .id(UUID.randomUUID())
                .firstName(first)
                .lastName(last)
                .email(email)
                .build();
    }

    private UserRegistrationRequest buildRequest(String first, String last, String email) {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setFirstName(first);
        req.setLastName(last);
        req.setEmail(email);
        return req;
    }

    // ── register ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("register()")
    class RegisterTests {

        @Test
        @DisplayName("New user — saves and returns response with userId")
        void newUser_savesAndReturnsResponse() {
            UserRegistrationRequest req = buildRequest("Jane", "Smith", "jane@example.com");
            User saved = buildUser("Jane", "Smith", "jane@example.com");

            when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("Jane", "Smith"))
                    .thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenReturn(saved);

            UserRegistrationResponse response = userService.register(req);

            assertThat(response.getUserId()).isEqualTo(saved.getId());
            assertThat(response.getFirstName()).isEqualTo("Jane");
            assertThat(response.getLastName()).isEqualTo("Smith");
            assertThat(response.getEmail()).isEqualTo("jane@example.com");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Duplicate name (exact case) — throws DuplicateUserException")
        void duplicateName_exactCase_throwsException() {
            UserRegistrationRequest req = buildRequest("John", "Doe", "john@example.com");
            User existing = buildUser("John", "Doe", "other@example.com");

            when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("John", "Doe"))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> userService.register(req))
                    .isInstanceOf(DuplicateUserException.class)
                    .hasMessageContaining("John Doe");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Duplicate name (different case) — throws DuplicateUserException")
        void duplicateName_differentCase_throwsException() {
            UserRegistrationRequest req = buildRequest("john", "doe", "john2@example.com");
            User existing = buildUser("John", "Doe", "john@example.com");

            when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("john", "doe"))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> userService.register(req))
                    .isInstanceOf(DuplicateUserException.class);

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Same first name, different last name — succeeds")
        void sameFirstDifferentLast_succeeds() {
            UserRegistrationRequest req = buildRequest("John", "Smith", "jsmith@example.com");
            User saved = buildUser("John", "Smith", "jsmith@example.com");

            when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("John", "Smith"))
                    .thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenReturn(saved);

            UserRegistrationResponse response = userService.register(req);

            assertThat(response).isNotNull();
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Saved entity fields match request")
        void savedEntityFieldsMatchRequest() {
            UserRegistrationRequest req = buildRequest("Alice", "Brown", "alice@example.com");
            User saved = buildUser("Alice", "Brown", "alice@example.com");

            when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("Alice", "Brown"))
                    .thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenReturn(saved);

            userService.register(req);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            User captured = captor.getValue();
            assertThat(captured.getFirstName()).isEqualTo("Alice");
            assertThat(captured.getLastName()).isEqualTo("Brown");
            assertThat(captured.getEmail()).isEqualTo("alice@example.com");
        }
    }

    // ── deleteUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteUser()")
    class DeleteUserTests {

        private final UUID DELETE_ID = UUID.randomUUID();

        @Test
        @DisplayName("User not found → throws UserNotFoundException")
        void userNotFound_throwsException() {
            when(userRepository.existsById(DELETE_ID)).thenReturn(false);

            assertThatThrownBy(() -> userService.deleteUser(DELETE_ID))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining(DELETE_ID.toString());
        }

        @Test
        @DisplayName("User found → calls deleteById with correct id")
        void userFound_callsDeleteById() {
            when(userRepository.existsById(DELETE_ID)).thenReturn(true);
            doNothing().when(userRepository).deleteById(DELETE_ID);

            userService.deleteUser(DELETE_ID);

            verify(userRepository).existsById(DELETE_ID);
            verify(userRepository).deleteById(DELETE_ID);
        }

        @Test
        @DisplayName("User found → repository.save is never called")
        void userFound_doesNotSave() {
            when(userRepository.existsById(DELETE_ID)).thenReturn(true);
            doNothing().when(userRepository).deleteById(DELETE_ID);

            userService.deleteUser(DELETE_ID);

            verify(userRepository, never()).save(any());
        }
    }

    // ── searchUsers ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("searchUsers()")
    class SearchUsersTests {

        @Test
        @DisplayName("Blank query → returns alphabetical list via findAllByOrder...")
        void blankQuery_returnsAlphabeticalList() {
            when(userRepository.findAllByOrderByFirstNameAscLastNameAsc()).thenReturn(List.of());

            userService.searchUsers("");

            verify(userRepository).findAllByOrderByFirstNameAscLastNameAsc();
            verify(userRepository, never()).searchUsers(anyString(), any());
        }

        @Test
        @DisplayName("Whitespace-only query → returns alphabetical list")
        void whitespaceOnlyQuery_returnsAlphabeticalList() {
            when(userRepository.findAllByOrderByFirstNameAscLastNameAsc()).thenReturn(List.of());

            userService.searchUsers("   ");

            verify(userRepository).findAllByOrderByFirstNameAscLastNameAsc();
            verify(userRepository, never()).searchUsers(anyString(), any());
        }

        @Test
        @DisplayName("Null query → returns alphabetical list")
        void nullQuery_returnsAlphabeticalList() {
            when(userRepository.findAllByOrderByFirstNameAscLastNameAsc()).thenReturn(List.of());

            userService.searchUsers(null);

            verify(userRepository).findAllByOrderByFirstNameAscLastNameAsc();
        }

        @Test
        @DisplayName("Non-blank query → calls repository.searchUsers with trimmed query")
        void nonBlankQuery_callsRepositorySearch() {
            User user = buildUser("Jane", "Smith", "jane@example.com");
            when(userRepository.searchUsers(eq("jane"), any(Limit.class))).thenReturn(List.of(user));

            List<UserSearchResponse> result = userService.searchUsers("jane");

            verify(userRepository).searchUsers(eq("jane"), any(Limit.class));
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFirstName()).isEqualTo("Jane");
        }

        @Test
        @DisplayName("Query with surrounding whitespace → trimmed before search")
        void queryWithWhitespace_trimmed() {
            when(userRepository.searchUsers(eq("jane"), any(Limit.class))).thenReturn(List.of());

            userService.searchUsers("  jane  ");

            verify(userRepository).searchUsers(eq("jane"), any(Limit.class));
        }
    }
}

package com.careerlens;

import com.careerlens.dto.LoginRequest;
import com.careerlens.dto.LoginResponse;
import com.careerlens.dto.RegisterRequest;
import com.careerlens.dto.UserResponse;
import com.careerlens.entity.Role;
import com.careerlens.entity.User;
import com.careerlens.exception.EmailAlreadyExistsException;
import com.careerlens.exception.InvalidCredentialsException;
import com.careerlens.exception.PasswordMismatchException;
import com.careerlens.repository.UserRepository;
import com.careerlens.security.JwtService;
import com.careerlens.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserServiceImpl userService;

    private RegisterRequest validRegisterRequest;
    private LoginRequest validLoginRequest;

    @BeforeEach
    void setUp() {
        validRegisterRequest = new RegisterRequest(
                "Test User",
                "test@example.com",
                "password123",
                "password123"
        );
        validLoginRequest = new LoginRequest(
                "test@example.com",
                "password123"
        );
    }

    @Test
    void register_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashedPasswordSample");

        User savedUser = new User("Test User", "test@example.com", "$2a$10$hashedPasswordSample", Role.USER);
        savedUser.setId(1L);
        savedUser.setCreatedAt(LocalDateTime.now());

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = userService.register(validRegisterRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Test User", response.getFullName());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(Role.USER, response.getRole());
        assertNotNull(response.getCreatedAt());

        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(passwordEncoder, times(1)).encode("password123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_PasswordMismatch_ThrowsPasswordMismatchException() {
        RegisterRequest mismatchRequest = new RegisterRequest(
                "Test User",
                "test@example.com",
                "password123",
                "differentPassword"
        );

        PasswordMismatchException exception = assertThrows(
                PasswordMismatchException.class,
                () -> userService.register(mismatchRequest)
        );

        assertEquals("Passwords do not match", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_EmailAlreadyExists_ThrowsEmailAlreadyExistsException() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        EmailAlreadyExistsException exception = assertThrows(
                EmailAlreadyExistsException.class,
                () -> userService.register(validRegisterRequest)
        );

        assertEquals("Email already registered", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void login_Success() {
        User existingUser = new User("Test User", "test@example.com", "$2a$10$hashedPasswordSample", Role.USER);
        existingUser.setId(1L);
        existingUser.setCreatedAt(LocalDateTime.now());

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPasswordSample")).thenReturn(true);
        when(jwtService.generateToken("test@example.com", "USER")).thenReturn("test-token");

        LoginResponse response = userService.login(validLoginRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Test User", response.getFullName());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(Role.USER, response.getRole());
        assertEquals("Login successful", response.getMessage());
        assertEquals("test-token", response.getToken());

        verify(userRepository, times(1)).findByEmail("test@example.com");
        verify(passwordEncoder, times(1)).matches("password123", "$2a$10$hashedPasswordSample");
    }

    @Test
    void login_UserNotFound_ThrowsInvalidCredentialsException() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> userService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_WrongPassword_ThrowsInvalidCredentialsException() {
        User existingUser = new User("Test User", "test@example.com", "$2a$10$hashedPasswordSample", Role.USER);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPasswordSample")).thenReturn(false);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> userService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
    }
}

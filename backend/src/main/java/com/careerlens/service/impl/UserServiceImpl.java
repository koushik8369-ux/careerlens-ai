package com.careerlens.service.impl;

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
import com.careerlens.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        // 1. Validate password and confirmPassword match
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Passwords do not match");
        }

        // 2. Check if email already exists
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email already registered");
        }

        // 3. Hash password using BCrypt
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 4. Create user with default role USER
        User user = new User(
                request.getFullName().trim(),
                normalizedEmail,
                encodedPassword,
                Role.USER
        );

        // 5. Save user to database
        User savedUser = userRepository.save(user);

        // 6. Return safe UserResponse
        return UserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 1. Normalize email
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        // 2. Find user by email
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // 3. Verify password using BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // 4. Return safe LoginResponse with user details and success message
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return LoginResponse.fromEntity(user, "Login successful", token);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(UserResponse::fromEntity)
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));
    }
}

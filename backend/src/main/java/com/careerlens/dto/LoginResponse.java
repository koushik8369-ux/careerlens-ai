package com.careerlens.dto;

import com.careerlens.entity.Role;
import com.careerlens.entity.User;

public class LoginResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private String message;
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(Long id, String fullName, String email, Role role) {
        this(id, fullName, email, role, "Login successful", null);
    }

    public LoginResponse(Long id, String fullName, String email, Role role, String message) {
        this(id, fullName, email, role, message, null);
    }

    public LoginResponse(Long id, String fullName, String email, Role role, String message, String token) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.message = message;
        this.token = token;
    }

    public static LoginResponse fromEntity(User user) {
        return fromEntity(user, "Login successful");
    }

    public static LoginResponse fromEntity(User user, String message) {
        return fromEntity(user, message, null);
    }

    public static LoginResponse fromEntity(User user, String message, String token) {
        if (user == null) {
            return null;
        }
        return new LoginResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                message,
                token
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}


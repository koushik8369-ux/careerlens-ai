package com.careerlens.service;

import com.careerlens.dto.LoginRequest;
import com.careerlens.dto.LoginResponse;
import com.careerlens.dto.RegisterRequest;
import com.careerlens.dto.UserResponse;

public interface UserService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    UserResponse getByEmail(String email);
}

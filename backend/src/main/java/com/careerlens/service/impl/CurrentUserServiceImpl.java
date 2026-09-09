package com.careerlens.service.impl;

import com.careerlens.entity.User;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.UserRepository;
import com.careerlens.service.CurrentUserService;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserServiceImpl implements CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getRequiredUser(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user was not found"));
    }
}

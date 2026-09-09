package com.careerlens.service.impl;

import com.careerlens.dto.UserProfileRequest;
import com.careerlens.dto.UserProfileResponse;
import com.careerlens.entity.User;
import com.careerlens.entity.UserProfile;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.UserProfileRepository;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.UserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository profileRepository;
    private final CurrentUserService currentUserService;

    public UserProfileServiceImpl(
            UserProfileRepository profileRepository,
            CurrentUserService currentUserService) {
        this.profileRepository = profileRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = currentUserService.getRequiredUser(email);
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
        return UserProfileResponse.fromEntity(profile);
    }

    @Override
    @Transactional
    public UserProfileResponse upsertProfile(String email, UserProfileRequest request) {
        User user = currentUserService.getRequiredUser(email);
        UserProfile profile = profileRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserProfile newProfile = new UserProfile();
            newProfile.setUser(user);
            return newProfile;
        });

        profile.setPhone(normalize(request.getPhone()));
        profile.setEducation(normalize(request.getEducation()));
        profile.setCollege(normalize(request.getCollege()));
        profile.setGraduationYear(request.getGraduationYear());
        profile.setCareerGoal(normalize(request.getCareerGoal()));
        profile.setBio(normalize(request.getBio()));
        profile.setLocation(normalize(request.getLocation()));
        profile.setSkills(normalizeSkills(request.getSkills()));

        return UserProfileResponse.fromEntity(profileRepository.save(profile));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private List<String> normalizeSkills(List<String> skills) {
        if (skills == null) {
            return List.of();
        }
        return skills.stream()
                .map(this::normalize)
                .filter(value -> value != null)
                .distinct()
                .toList();
    }
}

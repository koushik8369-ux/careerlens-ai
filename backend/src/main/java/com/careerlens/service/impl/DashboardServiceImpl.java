package com.careerlens.service.impl;

import com.careerlens.dto.DashboardResponse;
import com.careerlens.entity.User;
import com.careerlens.entity.UserProfile;
import com.careerlens.repository.UserProfileRepository;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.DashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardServiceImpl implements DashboardService {

    private static final int TOTAL_COMPLETION_FIELDS = 9;

    private final CurrentUserService currentUserService;
    private final UserProfileRepository profileRepository;

    public DashboardServiceImpl(
            CurrentUserService currentUserService,
            UserProfileRepository profileRepository) {
        this.currentUserService = currentUserService;
        this.profileRepository = profileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String email) {
        User user = currentUserService.getRequiredUser(email);
        UserProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        int completion = calculateCompletion(user, profile);
        int skillCount = profile == null ? 0 : profile.getSkills().size();

        return new DashboardResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                profile == null ? null : profile.getCareerGoal(),
                profile == null ? null : profile.getEducation(),
                completion,
                skillCount,
                completion == 100 ? "COMPLETE" : completion == 0 ? "NOT_STARTED" : "IN_PROGRESS");
    }

    public int calculateCompletion(User user, UserProfile profile) {
        if (profile == null) {
            return 0;
        }
        int completed = 0;
        completed += hasText(user.getFullName()) ? 1 : 0;
        completed += hasText(user.getEmail()) ? 1 : 0;
        completed += hasText(profile.getEducation()) ? 1 : 0;
        completed += hasText(profile.getCollege()) ? 1 : 0;
        completed += profile.getGraduationYear() != null ? 1 : 0;
        completed += hasText(profile.getCareerGoal()) ? 1 : 0;
        completed += profile.getSkills() != null && !profile.getSkills().isEmpty() ? 1 : 0;
        completed += hasText(profile.getBio()) ? 1 : 0;
        completed += hasText(profile.getLocation()) ? 1 : 0;
        return completed * 100 / TOTAL_COMPLETION_FIELDS;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

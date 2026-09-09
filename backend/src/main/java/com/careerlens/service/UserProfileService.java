package com.careerlens.service;

import com.careerlens.dto.UserProfileRequest;
import com.careerlens.dto.UserProfileResponse;

public interface UserProfileService {

    UserProfileResponse getProfile(String email);

    UserProfileResponse upsertProfile(String email, UserProfileRequest request);
}

package com.careerlens.service;

import com.careerlens.ai.context.UserCareerContext;

public interface CareerContextService {

    UserCareerContext buildForCurrentUser();
}

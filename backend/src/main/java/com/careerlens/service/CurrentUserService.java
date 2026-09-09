package com.careerlens.service;

import com.careerlens.entity.User;

public interface CurrentUserService {

    User getRequiredUser(String email);
}

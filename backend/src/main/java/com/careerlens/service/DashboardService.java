package com.careerlens.service;

import com.careerlens.dto.DashboardResponse;

public interface DashboardService {

    DashboardResponse getDashboard(String email);
}

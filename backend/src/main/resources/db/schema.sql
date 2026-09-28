CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    phone VARCHAR(255),
    education VARCHAR(255),
    college VARCHAR(255),
    graduation_year INT,
    career_goal VARCHAR(255),
    bio VARCHAR(2000),
    location VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_profiles_user_id (user_id),
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_profile_skills (
    profile_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (profile_id, skill_order),
    CONSTRAINT fk_user_profile_skills_profile
        FOREIGN KEY (profile_id) REFERENCES user_profiles (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analyses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(255),
    overall_score INT NOT NULL,
    target_role VARCHAR(255),
    match_score INT,
    raw_text LONGTEXT,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_resume_analyses_user
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analysis_skills (
    analysis_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (analysis_id, skill_order),
    CONSTRAINT fk_resume_analysis_skills_analysis
        FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analysis_education (
    analysis_id BIGINT NOT NULL,
    edu_order INT NOT NULL,
    education_item VARCHAR(500) NOT NULL,
    PRIMARY KEY (analysis_id, edu_order),
    CONSTRAINT fk_resume_analysis_education_analysis
        FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analysis_experience (
    analysis_id BIGINT NOT NULL,
    exp_order INT NOT NULL,
    experience_item VARCHAR(500) NOT NULL,
    PRIMARY KEY (analysis_id, exp_order),
    CONSTRAINT fk_resume_analysis_experience_analysis
        FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analysis_projects (
    analysis_id BIGINT NOT NULL,
    proj_order INT NOT NULL,
    project_item VARCHAR(500) NOT NULL,
    PRIMARY KEY (analysis_id, proj_order),
    CONSTRAINT fk_resume_analysis_projects_analysis
        FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analysis_missing_sections (
    analysis_id BIGINT NOT NULL,
    missing_order INT NOT NULL,
    missing_section VARCHAR(255) NOT NULL,
    PRIMARY KEY (analysis_id, missing_order),
    CONSTRAINT fk_resume_analysis_missing_sections_analysis
        FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resume_analysis_suggestions (
    analysis_id BIGINT NOT NULL,
    suggestion_order INT NOT NULL,
    suggestion VARCHAR(1000) NOT NULL,
    PRIMARY KEY (analysis_id, suggestion_order),
    CONSTRAINT fk_resume_analysis_suggestions_analysis
        FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intelligence_analyses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    raw_job_description LONGTEXT,
    overall_match_score INT NOT NULL,
    required_skill_match_percent INT,
    preferred_skill_match_percent INT,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_job_intelligence_analyses_user
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_required_skills (
    analysis_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (analysis_id, skill_order),
    CONSTRAINT fk_job_intel_required_skills_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_preferred_skills (
    analysis_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (analysis_id, skill_order),
    CONSTRAINT fk_job_intel_preferred_skills_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_matched_skills (
    analysis_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (analysis_id, skill_order),
    CONSTRAINT fk_job_intel_matched_skills_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_missing_skills (
    analysis_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (analysis_id, skill_order),
    CONSTRAINT fk_job_intel_missing_skills_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_skill_gaps (
    analysis_id BIGINT NOT NULL,
    gap_order INT NOT NULL,
    skill_gap_json VARCHAR(1000) NOT NULL,
    PRIMARY KEY (analysis_id, gap_order),
    CONSTRAINT fk_job_intel_skill_gaps_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_recommendations (
    analysis_id BIGINT NOT NULL,
    rec_order INT NOT NULL,
    recommendation_json VARCHAR(1000) NOT NULL,
    PRIMARY KEY (analysis_id, rec_order),
    CONSTRAINT fk_job_intel_recommendations_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_intel_questions (
    analysis_id BIGINT NOT NULL,
    q_order INT NOT NULL,
    question_json VARCHAR(1000) NOT NULL,
    PRIMARY KEY (analysis_id, q_order),
    CONSTRAINT fk_job_intel_questions_analysis
        FOREIGN KEY (analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_assistant_conversations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_career_assistant_conversations_user
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_assistant_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    provider VARCHAR(50),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_career_assistant_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES career_assistant_conversations (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    source_resume_analysis_id BIGINT,
    source_job_analysis_id BIGINT,
    career_goal VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_career_plans_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_career_plans_resume_analysis
        FOREIGN KEY (source_resume_analysis_id) REFERENCES resume_analyses (id),
    CONSTRAINT fk_career_plans_job_analysis
        FOREIGN KEY (source_job_analysis_id) REFERENCES job_intelligence_analyses (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_plan_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    career_plan_id BIGINT NOT NULL,
    category VARCHAR(20) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description VARCHAR(2000),
    priority VARCHAR(20) NOT NULL,
    completed BOOLEAN NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_career_plan_items_plan
        FOREIGN KEY (career_plan_id) REFERENCES career_plans (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_plan_item_skills (
    item_id BIGINT NOT NULL,
    skill_order INT NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (item_id, skill_order),
    CONSTRAINT fk_career_plan_item_skills_item
        FOREIGN KEY (item_id) REFERENCES career_plan_items (id)
) ENGINE=InnoDB;

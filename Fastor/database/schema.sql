CREATE DATABASE IF NOT EXISTS crm
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE crm;

CREATE TABLE IF NOT EXISTS employees (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employees_name_not_blank CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE TABLE IF NOT EXISTS enquiries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    course_interest VARCHAR(160) NOT NULL,
    phone VARCHAR(32),
    message TEXT,
    claimed_by BIGINT UNSIGNED,
    claimed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enquiries_name_not_blank CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT enquiries_course_not_blank CHECK (LENGTH(TRIM(course_interest)) > 0),
    CONSTRAINT enquiry_claim_state_consistent CHECK (
        (claimed_by IS NULL AND claimed_at IS NULL)
        OR (claimed_by IS NOT NULL AND claimed_at IS NOT NULL)
    ),
    CONSTRAINT enquiries_claimed_by_employee
        FOREIGN KEY (claimed_by) REFERENCES employees(id)
        ON DELETE RESTRICT,
    INDEX enquiries_public_created_idx (claimed_by, created_at DESC, id DESC),
    INDEX enquiries_claimed_by_created_idx (claimed_by, claimed_at DESC, id DESC)
);

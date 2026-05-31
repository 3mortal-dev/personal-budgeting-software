package com.example.personal_budget.dto.response.admin;

import com.example.personal_budget.entity.AuditLog;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AuditLogResponse {
    private final Long id;
    private final String adminName;
    private final String adminEmail;
    private final String action;
    private final Long targetUserId;
    private final String targetUserName;
    private final String targetUserEmail;
    private final String details;
    private final LocalDateTime createdAt;

    public AuditLogResponse(AuditLog log) {
        this.id = log.getId();
        this.adminName = log.getAdmin().getName();
        this.adminEmail = log.getAdmin().getEmail();
        this.action = log.getAction();
        this.targetUserId = log.getTargetUserId();
        this.targetUserName = log.getTargetUserName();
        this.targetUserEmail = log.getTargetUserEmail();
        this.details = log.getDetails();
        this.createdAt = log.getCreatedAt();
    }
}

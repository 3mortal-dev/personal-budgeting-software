package com.example.personal_budget.service;

import com.example.personal_budget.entity.AuditLog;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(User admin, String action, User targetUser, String details) {
        AuditLog log = AuditLog.builder()
                .admin(admin)
                .action(action)
                .targetUserId(targetUser != null ? targetUser.getId() : null)
                .targetUserName(targetUser != null ? targetUser.getName() : null)
                .targetUserEmail(targetUser != null ? targetUser.getEmail() : null)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}

package com.example.personal_budget.dto.request;

import java.time.LocalDate;

import com.example.personal_budget.enums.ReportFormat;

import lombok.Data;


@Data
public class ReportDownloadRequest {
    private Long userId;
    private ReportFormat format;
    private LocalDate startDate;
    private LocalDate endDate;

}

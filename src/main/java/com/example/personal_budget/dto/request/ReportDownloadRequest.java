package com.example.personal_budget.dto.request;

import com.example.personal_budget.enums.ReportFormat;
import lombok.Data;

import java.time.LocalDate;


@Data
public class ReportDownloadRequest {
    private ReportFormat format;
    private LocalDate startDate;
    private LocalDate endDate;
}

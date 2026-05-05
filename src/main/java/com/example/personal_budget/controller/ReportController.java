package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.response.MonthlyReportResponse;
import com.example.personal_budget.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/monthly")
    public ResponseEntity<List<MonthlyReportResponse>> getMonthlyReport(@RequestBody MonthlyReportRequest request) {
        List<MonthlyReportResponse> reports = reportService.getMonthlyReport(request);
        return ResponseEntity.ok(reports);
    }
}
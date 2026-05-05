package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.ReportDownloadRequest;
import com.example.personal_budget.dto.response.MonthlyReportResponse;
import com.example.personal_budget.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
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

    @PostMapping("/download")
    public ResponseEntity<Resource> downloadReport(@RequestBody ReportDownloadRequest request) {
        File reportFile = reportService.generateTransactionReport(request);
        
        Resource resource = new FileSystemResource(reportFile);
        String filename = reportFile.getName();
        
        MediaType mediaType = getMediaType(request.getFormat().toString());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(resource);
    }

    private MediaType getMediaType(String format) {
        return switch (format.toUpperCase()) {
            case "PDF" -> MediaType.APPLICATION_PDF;
            case "EXCEL" -> MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case "CSV" -> MediaType.valueOf("text/csv");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}
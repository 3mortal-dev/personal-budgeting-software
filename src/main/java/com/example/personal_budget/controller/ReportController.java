package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.ReportDownloadRequest;
import com.example.personal_budget.dto.response.MonthlyReportResponse;
import com.example.personal_budget.service.ReportService;
import com.example.personal_budget.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

@RestController
@RequiredArgsConstructor
@RequestMapping ("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    @PostMapping ("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport (@AuthenticationPrincipal UserDetails userDetails,
                                                                   @RequestBody MonthlyReportRequest request) {
        MonthlyReportResponse response = reportService.generateMonthlyReport(userService.getUserId(userDetails),
                                                                             request);
        return ResponseEntity.ok(response);
    }

    @PostMapping ("/download")
    public ResponseEntity<Resource> downloadReport (@RequestBody ReportDownloadRequest request) {
        File reportFile = reportService.generateTransactionReport(request);
        
        Resource resource = new FileSystemResource(reportFile);
        String filename = reportFile.getName();

        MediaType mediaType = getMediaType(request.getFormat().toString());

        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                                          "attachment; filename=\"" + filename + "\"").contentType(mediaType).body(
                resource);
    }

    private MediaType getMediaType (String format) {
        return switch (format.toUpperCase()) {
            case "PDF" -> MediaType.APPLICATION_PDF;
            case "EXCEL" -> MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case "CSV" -> MediaType.valueOf("text/csv");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}
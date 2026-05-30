package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.ReportDownloadRequest;
import com.example.personal_budget.dto.response.MonthlyReportResponse;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.CurrencyService;
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
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;
    private final CurrencyService currencyService;

    /**
     * Generates monthly report data for the authenticated user.
     *
     * @param request the report date range
     * @param userDetails the authenticated principal
     * @return the monthly report data
     */
    @PostMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @RequestBody MonthlyReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUser(userDetails);
        MonthlyReportResponse response = reportService.generateMonthlyReport(user.getId(), request);
        response.setCurrency(user.getCurrency());
        response.getMonthlyExpense().replaceAll((k, v) ->
                currencyService.convert(v, "USD", user.getCurrency()));
        response.getMonthlyIncome().replaceAll((k, v) ->
                currencyService.convert(v, "USD", user.getCurrency()));
        response.getExpenseByCategory().replaceAll((k, v) ->
                currencyService.convert(v, "USD", user.getCurrency()));
        return ResponseEntity.ok(response);
    }

    /**
     * Generates and downloads a transaction report file for the authenticated user.
     *
     * @param request the requested date range and export format
     * @param userDetails the authenticated principal
     * @return the generated file resource
     */
    @PostMapping("/download")
    public ResponseEntity<Resource> downloadReport(
            @RequestBody ReportDownloadRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        //        if (!trySetUserId(userDetails, request::setUserId)) {
        //            return ResponseEntity.badRequest().build();
        //        }

        File reportFile = reportService.generateTransactionReport(userService.getUserId(userDetails), request);

        Resource resource = new FileSystemResource(reportFile);
        String filename = reportFile.getName();

        MediaType mediaType = getMediaType(request.getFormat().toString());

        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                                          "attachment; filename=\"" + filename + "\"").contentType(mediaType).body(
                resource);
    }

    private boolean trySetUserId(
            UserDetails userDetails,
            java.util.function.Consumer<Long> setter) {
        if (userDetails == null) {
            return false;
        }
        long userId = userService.getUserId(userDetails);
        setter.accept(userId);
        return true;
    }

    // helper function
    private MediaType getMediaType(String format) {
        return switch (format.toUpperCase()) {
            case "PDF" -> MediaType.APPLICATION_PDF;
            case "EXCEL" -> MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case "CSV" -> MediaType.valueOf("text/csv");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}

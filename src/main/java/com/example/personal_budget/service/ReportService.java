package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.ReportDownloadRequest;
import com.example.personal_budget.dto.response.MonthlyReportResponse;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.util.ExporterFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {
    
    private final TransactionService transactionService;
    private final ExporterFactory exporterFactory;

    public ReportService(TransactionService transactionService, ExporterFactory exporterFactory) {
        this.transactionService = transactionService;
        this.exporterFactory = exporterFactory;
    }


    // 1. Generate monthly report for a user for visual represtantation    
    public MonthlyReportResponse generateMonthlyReport(MonthlyReportRequest request) {

        Map<Month, Double> expenseMap = transactionService.getMonthlyTotal(request.getUserId(), request, TransactionType.EXPENSE);

        Map<Month, Double> incomeMap = transactionService.getMonthlyTotal(request.getUserId(), request, TransactionType.INCOME);

        Map<String, Double> categoryExpenseMap = transactionService.getCategoryMap(request.getUserId(), request.getUserId(), TransactionType.EXPENSE);

        return new MonthlyReportResponse(expenseMap, incomeMap, categoryExpenseMap);
    }


    // 2. Generate a file with the all transaction when user request it (csv, excel, pdf) with a data range
    public File generateTransactionReport(ReportDownloadRequest request) {
        List<Transaction> transactions = transactionService.getTransactionsByDateRange(
                request.getUserId(), request.getStartDate(), request.getEndDate());

        String fileName = "transaction_report_" + System.currentTimeMillis();
        String fileExtension = getFileExtension(request.getFormat().toString());
        String filePath = fileName + fileExtension;

        try {
            return exporterFactory.getExporter(request.getFormat()).export(transactions, filePath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate report: " + e.getMessage(), e);
        }
    }

    private String getFileExtension(String format) {
        return switch (format.toUpperCase()) {
            case "PDF" -> ".pdf";
            case "EXCEL" -> ".xlsx";
            case "CSV" -> ".csv";
            default -> ".txt";
        };
    }

}
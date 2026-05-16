package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.ReportDownloadRequest;
import com.example.personal_budget.dto.response.MonthlyReportResponse;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.ReportFormat;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.util.ExporterFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.Month;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final TransactionService transactionService;
    private final ExporterFactory exporterFactory;

    public ReportService(TransactionService transactionService, ExporterFactory exporterFactory) {
        this.transactionService = transactionService;
        this.exporterFactory = exporterFactory;
    }


    /**
     * Generates monthly income, expense, and category breakdown data for reports.
     *
     * @param contextUserId the user id used as the data access context
     * @param request the report date range
     * @return the monthly report data used by the UI
     */
    public MonthlyReportResponse generateMonthlyReport (Long contextUserId, MonthlyReportRequest request) {

        Map<Month, Double> expenseMap = transactionService.getMonthlyTotal(contextUserId, request,
                                                                           TransactionType.EXPENSE);

        Map<Month, Double> incomeMap = transactionService.getMonthlyTotal(contextUserId, request,
                                                                          TransactionType.INCOME);

        Map<String, Double> categoryExpenseMap = transactionService.getCategoryMap(contextUserId,
                                                                                   TransactionType.EXPENSE);

        return new MonthlyReportResponse(expenseMap, incomeMap, categoryExpenseMap);
    }


    /**
     * Generates a downloadable transaction report file in the requested format.
     *
     * @param contextUserId the user id used as the data access context
     * @param request the requested date range and export format
     * @return the generated report file
     */
    public File generateTransactionReport (Long contextUserId, ReportDownloadRequest request) {
        List<Transaction> transactions = transactionService.getTransactionsByDateRange(contextUserId,
                                                                                       request.getStartDate(),
                                                                                       request.getEndDate());

        String fileName = "transaction_report_" + System.currentTimeMillis();
        String fileExtension = getFileExtension(request.getFormat());
        String filePath = fileName + fileExtension;

        try {
            return exporterFactory.getExporter(request.getFormat()).export(transactions, filePath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate report: " + e.getMessage(), e);
        }
    }

    private String getFileExtension (ReportFormat format) {
        return switch (format) {
            case PDF -> ".pdf";
            case EXCEL -> ".xlsx";
            case CSV -> ".csv";
        };
    }

}

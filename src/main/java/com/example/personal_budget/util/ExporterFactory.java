package com.example.personal_budget.util;

import com.example.personal_budget.enums.ReportFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ExporterFactory {

    @Autowired
    private PDFExporter pdfExporter;

    @Autowired
    private ExcelExporter excelExporter;

    @Autowired
    private CSVExporter csvExporter;

    public ReportExporter getExporter(ReportFormat format) {
        return switch (format) {
            case PDF -> pdfExporter;
            case EXCEL -> excelExporter;
            case CSV -> csvExporter;
            default -> throw new IllegalArgumentException("Unsupported format: " + format);
        };
    }
}
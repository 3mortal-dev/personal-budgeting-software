package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import com.example.personal_budget.enums.TransactionType;

import java.io.File;
import java.io.FileOutputStream;
import java.util.List;

@Component
public class ExcelExporter implements ReportExporter {

    private String getCategoryOrSource(Transaction transaction) {
        if (transaction.getType() == TransactionType.INCOME) {
            return transaction.getSource() != null
                    ? transaction.getSource()
                    : "N/A";
        }

        return transaction.getCategory() != null
                ? transaction.getCategory().getName()
                : "N/A";
    }

    @Override
    public File export(List<Transaction> transactions, String filePath) throws Exception {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Transactions");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"ID", "Amount", "Type", "Category / Source", "Date", "Description"};
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Add data rows
        int rowNum = 1;
        for (Transaction transaction : transactions) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(transaction.getId().toString());
            row.createCell(1).setCellValue(transaction.getAmount());
            row.createCell(2).setCellValue(transaction.getType().toString());
            row.createCell(3).setCellValue(getCategoryOrSource(transaction));
            row.createCell(4).setCellValue(transaction.getDate().toString());
            row.createCell(6).setCellValue(transaction.getDescription());
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // Write to file
        File file = new File(filePath);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            workbook.write(fos);
        }
        workbook.close();

        return file;
    }
}

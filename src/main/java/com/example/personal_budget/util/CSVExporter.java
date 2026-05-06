package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

@Component
public class CSVExporter implements ReportExporter {

    @Override
    public File export(List<Transaction> transactions, String filePath) throws Exception {
        File file = new File(filePath);
        
        try (FileWriter fw = new FileWriter(file);
             CSVPrinter csvPrinter = new CSVPrinter(fw, CSVFormat.DEFAULT
                     .withHeader("ID", "Amount", "Type", "Category ID", "Date", "Source", "Description"))) {

            for (Transaction transaction : transactions) {
                csvPrinter.printRecord(
                        transaction.getId(),
                        transaction.getAmount(),
                        transaction.getType(),
                        transaction.getCategory(),
                        transaction.getDate(),
                        transaction.getSource(),
                        transaction.getDescription()
                );
            }
            csvPrinter.flush();
        }

        return file;
    }
}
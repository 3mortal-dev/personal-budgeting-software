package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Component;
import com.example.personal_budget.enums.TransactionType;

import java.io.File;
import java.io.FileWriter;
import java.util.List;

@Component
public class CSVExporter implements ReportExporter {

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
        File file = new File(filePath);

        try (FileWriter fw = new FileWriter(file); CSVPrinter csvPrinter = new CSVPrinter(fw,
                CSVFormat.DEFAULT.withHeader(
                        "ID", "Amount",
                        "Type", "Category / Source",
                        "Date", "Description"))) {

            for (Transaction transaction : transactions) {
                csvPrinter.printRecord(
                        transaction.getId(),
                        transaction.getAmount(),
                        transaction.getType(),
                        getCategoryOrSource(transaction),
                        transaction.getDate(),
                        transaction.getDescription()
                );
            }
            csvPrinter.flush();
        }

        return file;
    }
}

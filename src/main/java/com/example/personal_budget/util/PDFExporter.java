package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;
import com.example.personal_budget.enums.TransactionType;

import java.io.File;
import java.io.FileOutputStream;
import java.util.List;

@Component
public class PDFExporter implements ReportExporter {

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
        Document document = new Document();
        File file = new File(filePath);
        PdfWriter.getInstance(document, new FileOutputStream(file));
        document.open();

        // Add title
        Paragraph title = new Paragraph("Transaction Report");
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph(" ")); // spacing

        // Create table with 7 columns: ID, Amount, Type, Category, Date, Source, Description
        Table table = new Table(7);
        table.setWidth(100);

        // Add headers
        table.addCell(new Cell(new Phrase("ID")));
        table.addCell(new Cell(new Phrase("Amount")));
        table.addCell(new Cell(new Phrase("Type")));
        table.addCell(new Cell(new Phrase("Category / Source")));
        table.addCell(new Cell(new Phrase("Date")));
        table.addCell(new Cell(new Phrase("Description")));

        // Add data rows
        for (Transaction transaction : transactions) {
            table.addCell(new Cell(new Phrase(transaction.getId().toString())));
            table.addCell(new Cell(new Phrase(String.valueOf(transaction.getAmount()))));
            table.addCell(new Cell(new Phrase(transaction.getType().toString())));
            table.addCell(new Cell(new Phrase(getCategoryOrSource(transaction))));
            table.addCell(new Cell(new Phrase(transaction.getDate().toString())));
            table.addCell(new Cell(new Phrase(transaction.getDescription())));
        }

        document.add(table);
        document.close();

        return file;
    }
}

package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

@Component
public class PDFExporter implements ReportExporter {

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
        table.addCell(new Cell(new Phrase("Category")));
        table.addCell(new Cell(new Phrase("Date")));
        table.addCell(new Cell(new Phrase("Source")));
        table.addCell(new Cell(new Phrase("Description")));

        // Add data rows
        for (Transaction transaction : transactions) {
            table.addCell(new Cell(new Phrase(transaction.getId().toString())));
            table.addCell(new Cell(new Phrase(String.valueOf(transaction.getAmount()))));
            table.addCell(new Cell(new Phrase(transaction.getType().toString())));
            table.addCell(new Cell(new Phrase(transaction.getCategoryID().toString())));
            table.addCell(new Cell(new Phrase(transaction.getDate().toString())));
            table.addCell(new Cell(new Phrase(transaction.getSource())));
            table.addCell(new Cell(new Phrase(transaction.getDescription())));
        }

        document.add(table);
        document.close();

        return file;
    }
}
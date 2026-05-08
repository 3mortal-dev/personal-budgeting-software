package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;
import com.example.personal_budget.enums.TransactionType;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;

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

    private PdfPCell createCell(String text, Font font) {
        return new PdfPCell(new Phrase(text != null ? text : "N/A", font));
    }

    @Override
    public File export(List<Transaction> transactions, String filePath) throws Exception {
        Document document = new Document();
        File file = new File(filePath);
        PdfWriter.getInstance(document, new FileOutputStream(file));
        document.open();

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        // Add title
        Paragraph title = new Paragraph("Transaction Report");
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph(" ")); // spacing

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 2f, 2f, 3f, 2f, 5f});

        // Add headers
        table.addCell(createCell("ID", headerFont));
        table.addCell(createCell("Amount", headerFont));
        table.addCell(createCell("Type", headerFont));
        table.addCell(createCell("Category / Source", headerFont));
        table.addCell(createCell("Date", headerFont));
        table.addCell(createCell("Description", headerFont));

        // Add data rows
        for (Transaction transaction : transactions) {
            table.addCell(createCell(transaction.getId().toString(), bodyFont));
            table.addCell(createCell(String.valueOf(transaction.getAmount()), bodyFont));
            table.addCell(createCell(transaction.getType().toString(), bodyFont));
            table.addCell(createCell(getCategoryOrSource(transaction), bodyFont));
            table.addCell(createCell(transaction.getDate().toString(), bodyFont));
            table.addCell(createCell(transaction.getDescription(), bodyFont));
        }

        document.add(table);
        document.close();

        return file;
    }
}

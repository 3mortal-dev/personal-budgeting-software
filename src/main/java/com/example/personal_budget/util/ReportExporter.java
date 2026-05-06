package com.example.personal_budget.util;

import com.example.personal_budget.entity.Transaction;

import java.io.File;
import java.util.List;



public interface ReportExporter {
    File export(List<Transaction> transactions, String filePath) throws Exception;
}
package com.example.personal_budget.controller;

import com.example.personal_budget.dto.CreateTransactionRequest;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

  private final TransactionService transactionService;

  public TransactionController(TransactionService transactionService) {
    this.transactionService = transactionService;
  }

  @PostMapping
  public ResponseEntity<Transaction> addTransaction(@Valid @RequestBody CreateTransactionRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.addTransaction(req));
  }
}
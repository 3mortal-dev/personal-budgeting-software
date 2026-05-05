package com.example.personal_budget.exception;

import java.math.BigInteger;

public class TransactionNotFoundException extends RuntimeException {
  public TransactionNotFoundException(BigInteger id) {
    super("Transaction with id " + id + " not found");
  }
}

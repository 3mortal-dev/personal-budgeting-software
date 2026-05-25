package com.example.personal_budget.service;

import com.example.personal_budget.entity.ExchangeRate;
import com.example.personal_budget.repository.ExchangeRateRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    private static final String FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD";
    private static final Map<String, Double> FALLBACK_RATES = Map.of(
            "EUR", 0.92,
            "EGP", 47.5
    );

    private final ExchangeRateRepository exchangeRateRepository;

    @PostConstruct
    public void initRates() {
        if (exchangeRateRepository.count() > 0) {
            return;
        }
        try {
            RestTemplate rest = new RestTemplate();
            FrankfurterResponse response = rest.getForObject(FRANKFURTER_URL, FrankfurterResponse.class);
            if (response != null && response.rates != null) {
                for (var entry : response.rates.entrySet()) {
                    saveRate("USD", entry.getKey(), entry.getValue());
                }
            }
        } catch (Exception e) {
            // API failed — fallback rates seeded below
        }
        // Always ensure fallback rates exist (e.g. EGP isn't in ECB/Frankfurter data)
        for (var entry : FALLBACK_RATES.entrySet()) {
            String fallbackTarget = entry.getKey();
            if (exchangeRateRepository.findByFromCurrencyAndToCurrency("USD", fallbackTarget).isEmpty()) {
                saveRate("USD", fallbackTarget, entry.getValue());
            }
        }
    }

    private void saveRate(String from, String to, double rate) {
        ExchangeRate er = ExchangeRate.builder()
                .fromCurrency(from)
                .toCurrency(to)
                .rate(rate)
                .updatedAt(LocalDateTime.now())
                .build();
        exchangeRateRepository.save(er);

        ExchangeRate inverse = ExchangeRate.builder()
                .fromCurrency(to)
                .toCurrency(from)
                .rate(1.0 / rate)
                .updatedAt(LocalDateTime.now())
                .build();
        exchangeRateRepository.save(inverse);
    }

    /**
     * Converts an amount from one currency to another.
     * Treats null/blank currencies as USD for backward compatibility.
     */
    public double convert(double amount, String fromCurrency, String toCurrency) {
        String from = (fromCurrency == null || fromCurrency.isBlank()) ? "USD" : fromCurrency.toUpperCase();
        String to = (toCurrency == null || toCurrency.isBlank()) ? "USD" : toCurrency.toUpperCase();
        if (from.equals(to)) {
            return amount;
        }
        double rate = getRate(from, to);
        return amount * rate;
    }

    /**
     * Retrieves the exchange rate between two currencies.
     * Supports direct lookups and cross-rate computation via USD.
     * Treats null/blank currencies as USD for backward compatibility.
     */
    public double getRate(String fromCurrency, String toCurrency) {
        String from = (fromCurrency == null || fromCurrency.isBlank()) ? "USD" : fromCurrency.toUpperCase();
        String to = (toCurrency == null || toCurrency.isBlank()) ? "USD" : toCurrency.toUpperCase();
        if (from.equals(to)) {
            return 1.0;
        }
        // Direct lookup
        var direct = exchangeRateRepository.findByFromCurrencyAndToCurrency(from, to);
        if (direct.isPresent()) {
            return direct.get().getRate();
        }
        // Defensive: seed any missing fallback rates (handles @PostConstruct partial failure)
        for (var entry : FALLBACK_RATES.entrySet()) {
            String fallbackTarget = entry.getKey();
            if (exchangeRateRepository.findByFromCurrencyAndToCurrency("USD", fallbackTarget).isEmpty()) {
                saveRate("USD", fallbackTarget, entry.getValue());
            }
        }
        // Retry direct lookup after seeding
        direct = exchangeRateRepository.findByFromCurrencyAndToCurrency(from, to);
        if (direct.isPresent()) {
            return direct.get().getRate();
        }
        // Cross-rate via USD: A→B = A→USD / B→USD
        double fromRate = "USD".equals(from) ? 1.0 : exchangeRateRepository
                .findByFromCurrencyAndToCurrency(from, "USD")
                .map(ExchangeRate::getRate)
                .orElse(1.0);
        double toRate = "USD".equals(to) ? 1.0 : exchangeRateRepository
                .findByFromCurrencyAndToCurrency(to, "USD")
                .map(ExchangeRate::getRate)
                .orElse(1.0);
        double crossRate = fromRate / toRate;
        saveRate(from, to, crossRate);
        return crossRate;
    }

    public boolean isMultiCurrencyUser(String userCurrency) {
        return userCurrency != null && !"USD".equalsIgnoreCase(userCurrency);
    }

    private static class FrankfurterResponse {
        public String base;
        public String date;
        public Map<String, Double> rates;
    }
}

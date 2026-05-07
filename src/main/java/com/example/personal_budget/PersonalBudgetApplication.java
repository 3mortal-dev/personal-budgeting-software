package com.example.personal_budget;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class PersonalBudgetApplication {

	public static void main(String[] args) {
		SpringApplication.run(PersonalBudgetApplication.class, args);
	}

}
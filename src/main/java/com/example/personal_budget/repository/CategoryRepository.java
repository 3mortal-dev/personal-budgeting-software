package com.example.personal_budget.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.personal_budget.enums.CategoryType;
import com.example.personal_budget.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserIdOrType(Long id, CategoryType type);

    List<Category> findByType(CategoryType type);

    List<Category> findByUserId(Long id);

    Optional<Category> findByIdAndUserId(Long id, Long userID);
}

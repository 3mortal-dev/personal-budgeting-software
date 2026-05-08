package com.example.personal_budget.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.personal_budget.entity.Category;
import com.example.personal_budget.enums.CategoryType;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserIdOrType(Long id, CategoryType type);

    List<Category> findByType(CategoryType type);

    List<Category> findByUserId(Long id);

    List<Category> findByUserIsNull();

    Optional<Category> findByIdAndUserId(Long id, Long userID);

    boolean existsByTypeAndNameIgnoreCase(CategoryType type, String name);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);
    @Query("""
		SELECT c FROM Category c
		WHERE c.id = :categoryId
		AND (
			c.user.id = :userId
			OR c.user IS NULL
		)
	""")
    Optional<Category> findAccessibleCategory(
            @Param("categoryId") Long categoryId,
            @Param("userId") Long userId
    );
}

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

    /**
     * Finds categories owned by a user or matching the supplied category type.
     *
     * @param id the owner user id
     * @param type the category type to include
     * @return matching categories
     */
    List<Category> findByUserIdOrType(Long id, CategoryType type);

    /**
     * Finds categories by type.
     *
     * @param type the category type
     * @return matching categories
     */
    List<Category> findByType(CategoryType type);

    /**
     * Finds custom categories owned by a user.
     *
     * @param id the owner user id
     * @return categories for the user
     */
    List<Category> findByUserId(Long id);

    /**
     * Finds global categories without an owning user.
     *
     * @return categories whose user is null
     */
    List<Category> findByUserIsNull();

    /**
     * Finds a category by id while enforcing user ownership.
     *
     * @param id the category id
     * @param userID the owner user id
     * @return the matching category when present
     */
    Optional<Category> findByIdAndUserId(Long id, Long userID);

    /**
     * Checks whether a category name exists for a type, ignoring case.
     *
     * @param type the category type
     * @param name the category name
     * @return {@code true} when a matching category exists
     */
    boolean existsByTypeAndNameIgnoreCase(CategoryType type, String name);

    /**
     * Checks whether a user already has a category name, ignoring case.
     *
     * @param userId the owner user id
     * @param name the category name
     * @return {@code true} when a matching category exists
     */
    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    /**
     * Finds a category accessible to a user, either owned by the user or global.
     *
     * @param categoryId the category id
     * @param userId the requesting user id
     * @return the accessible category when present
     */
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

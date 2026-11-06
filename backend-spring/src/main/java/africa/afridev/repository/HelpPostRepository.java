package africa.afridev.repository;

import africa.afridev.model.entity.HelpPostEntity;
import africa.afridev.model.enums.HelpPostStatus;
import africa.afridev.model.enums.HelpPostType;
import africa.afridev.model.enums.HelpPostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HelpPostRepository extends JpaRepository<HelpPostEntity, String> {

    /** Toutes les publications publiques, triées par date décroissante */
    Page<HelpPostEntity> findByVisibilityOrderByCreatedAtDesc(
            HelpPostVisibility visibility, Pageable pageable);

    /** Publications par auteur */
    Page<HelpPostEntity> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);

    /** Publications par statut */
    Page<HelpPostEntity> findByVisibilityAndStatusOrderByCreatedAtDesc(
            HelpPostVisibility visibility, HelpPostStatus status, Pageable pageable);

    /** Publications par type */
    Page<HelpPostEntity> findByVisibilityAndTypeOrderByCreatedAtDesc(
            HelpPostVisibility visibility, HelpPostType type, Pageable pageable);

    /** Recherche full-text sur titre + description */
    @Query("SELECT h FROM HelpPostEntity h WHERE h.visibility = :visibility " +
           "AND (LOWER(h.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(h.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY h.createdAt DESC")
    Page<HelpPostEntity> searchByQuery(
            @Param("visibility") HelpPostVisibility visibility,
            @Param("query") String query,
            Pageable pageable);

    /** Recherche combinée (type + statut + query) */
    @Query("SELECT h FROM HelpPostEntity h WHERE h.visibility = :visibility " +
           "AND (:type IS NULL OR h.type = :type) " +
           "AND (:status IS NULL OR h.status = :status) " +
           "AND (:query IS NULL OR LOWER(h.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(h.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY h.createdAt DESC")
    Page<HelpPostEntity> findWithFilters(
            @Param("visibility") HelpPostVisibility visibility,
            @Param("type") HelpPostType type,
            @Param("status") HelpPostStatus status,
            @Param("query") String query,
            Pageable pageable);

    /** Recherche par tag */
    @Query("SELECT h FROM HelpPostEntity h JOIN h.tags t WHERE h.visibility = :visibility " +
           "AND LOWER(t) = LOWER(:tag) ORDER BY h.createdAt DESC")
    Page<HelpPostEntity> findByTag(
            @Param("visibility") HelpPostVisibility visibility,
            @Param("tag") String tag,
            Pageable pageable);

    /** Nombre de publications ouvertes */
    long countByStatus(HelpPostStatus status);
}

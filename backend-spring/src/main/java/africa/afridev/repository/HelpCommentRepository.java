package africa.afridev.repository;

import africa.afridev.model.entity.HelpCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HelpCommentRepository extends JpaRepository<HelpCommentEntity, String> {

    /** Tous les commentaires d'une publication (niveau racine seulement) triés par date */
    List<HelpCommentEntity> findByHelpPostIdAndParentCommentIsNullOrderByCreatedAtAsc(String helpPostId);

    /** Sous-réponses d'un commentaire */
    List<HelpCommentEntity> findByParentCommentIdOrderByCreatedAtAsc(String parentCommentId);

    /** Nombre de commentaires par publication */
    long countByHelpPostId(String helpPostId);

    /** Vérifier si un commentaire est accepté dans un post */
    boolean existsByHelpPostIdAndIsAcceptedTrue(String helpPostId);
}

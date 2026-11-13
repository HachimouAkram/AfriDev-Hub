package africa.afridev.service;

import africa.afridev.dto.auth.AccountDeletionImpactDto;
import africa.afridev.dto.auth.DeleteAccountRequest;
import africa.afridev.model.entity.CompanyEntity;
import africa.afridev.model.entity.CompanyMemberEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.CompanyMemberStatus;
import africa.afridev.repository.CompanyMemberRepository;
import africa.afridev.repository.CompanyRepository;
import africa.afridev.repository.OpportunityRepository;
import africa.afridev.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAccountDeletionService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final OpportunityRepository opportunityRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public AccountDeletionImpactDto getDeletionImpact(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé: " + userEmail));

        Optional<CompanyEntity> ownedCompany = companyRepository.findByOwnerId(user.getId());
        if (ownedCompany.isPresent()) {
            CompanyEntity company = ownedCompany.get();
            int oppCount = (int) opportunityRepository.countByCompanyId(company.getId());
            int memberCount = (int) companyMemberRepository.countByCompanyIdAndStatus(company.getId(), CompanyMemberStatus.ACTIVE);

            return AccountDeletionImpactDto.builder()
                    .userEmail(user.getEmail())
                    .userRole(user.getRole().name())
                    .isCompanyOwner(true)
                    .companyId(company.getId())
                    .companyName(company.getName())
                    .companySlug(company.getSlug())
                    .publishedOpportunitiesCount(oppCount)
                    .teamMembersCount(memberCount)
                    .isCompanyMember(false)
                    .build();
        }

        List<CompanyMemberEntity> memberships = companyMemberRepository.findByUserIdAndStatus(user.getId(), CompanyMemberStatus.ACTIVE);
        if (!memberships.isEmpty()) {
            CompanyMemberEntity m = memberships.get(0);
            return AccountDeletionImpactDto.builder()
                    .userEmail(user.getEmail())
                    .userRole(user.getRole().name())
                    .isCompanyOwner(false)
                    .isCompanyMember(true)
                    .memberCompanyName(m.getCompany() != null ? m.getCompany().getName() : null)
                    .build();
        }

        return AccountDeletionImpactDto.builder()
                .userEmail(user.getEmail())
                .userRole(user.getRole().name())
                .isCompanyOwner(false)
                .isCompanyMember(false)
                .build();
    }

    @Transactional
    public void deleteAccount(String userEmail, DeleteAccountRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable: " + userEmail));

        String userId = user.getId();
        log.warn("Début de suppression définitive du compte utilisateur {} (ID: {})", userEmail, userId);

        // 1. Si l'utilisateur est propriétaire/fondateur d'une entreprise, supprimer toute l'entreprise et ses dépendances
        Optional<CompanyEntity> ownedCompany = companyRepository.findByOwnerId(userId);
        if (ownedCompany.isPresent()) {
            CompanyEntity company = ownedCompany.get();
            String cId = company.getId();
            log.warn("Suppression en cascade de l'entreprise associée {} (ID: {})", company.getName(), cId);

            // a. Candidatures aux offres de l'entreprise
            entityManager.createQuery("DELETE FROM ApplicationEntity a WHERE a.opportunity.id IN (SELECT o.id FROM OpportunityEntity o WHERE o.company.id = :cId)")
                    .setParameter("cId", cId)
                    .executeUpdate();

            // b. Offres d'emploi de l'entreprise
            entityManager.createQuery("DELETE FROM OpportunityEntity o WHERE o.company.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();

            // c. Logs et XP de l'entreprise
            entityManager.createQuery("DELETE FROM CompanyActivityLogEntity l WHERE l.company.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();

            entityManager.createQuery("DELETE FROM CompanyXpTransactionEntity x WHERE x.company.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();

            // d. Membres de l'entreprise
            entityManager.createQuery("DELETE FROM CompanyMemberEntity m WHERE m.company.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();

            // e. Dissocier les ressources et événements
            entityManager.createQuery("UPDATE ResourceEntity r SET r.company = null WHERE r.company.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();

            entityManager.createQuery("UPDATE TechEventEntity te SET te.company = null WHERE te.company.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();

            // f. Supprimer l'entreprise
            entityManager.createQuery("DELETE FROM CompanyEntity c WHERE c.id = :cId")
                    .setParameter("cId", cId)
                    .executeUpdate();
        }

        // 2. Nettoyage des affiliations d'entreprise où l'utilisateur était membre
        entityManager.createQuery("DELETE FROM CompanyMemberEntity m WHERE m.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM CompanyActivityLogEntity l WHERE l.actor.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 3. Candidatures envoyées par l'utilisateur
        entityManager.createQuery("DELETE FROM ApplicationEntity a WHERE a.applicant.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 4. Offres publiées directement par l'utilisateur (hors entreprise)
        entityManager.createQuery("DELETE FROM ApplicationEntity a WHERE a.opportunity.id IN (SELECT o.id FROM OpportunityEntity o WHERE o.publisher.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM OpportunityEntity o WHERE o.publisher.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 5. Projets (commentaires, tâches, membres, et projets créés)
        entityManager.createQuery("DELETE FROM ProjectCommentEntity c WHERE c.author.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ProjectTaskEntity t WHERE t.assignedTo.id = :uId OR t.createdBy.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ProjectMemberEntity pm WHERE pm.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // Dépendances des projets dont il est l'auteur
        entityManager.createQuery("DELETE FROM ProjectTaskEntity t WHERE t.project.id IN (SELECT p.id FROM ProjectEntity p WHERE p.author.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ProjectMemberEntity pm WHERE pm.project.id IN (SELECT p.id FROM ProjectEntity p WHERE p.author.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ProjectCommentEntity pc WHERE pc.project.id IN (SELECT p.id FROM ProjectEntity p WHERE p.author.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ProjectEntity p WHERE p.author.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 6. Événements et votes
        entityManager.createQuery("DELETE FROM EventVoteEntity ev WHERE ev.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM TechEventEntity te WHERE te.organizer.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 7. Ressources pédagogiques
        entityManager.createQuery("DELETE FROM UserResourceProgressEntity urp WHERE urp.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ResourceEntity r WHERE r.author.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 8. Groupes de communauté
        entityManager.createQuery("DELETE FROM GroupChatMessageEntity gcm WHERE gcm.sender.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GroupPostEntity gp WHERE gp.author.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GroupMembershipEntity gm WHERE gm.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // Si l'utilisateur est propriétaire d'un groupe communautaire
        entityManager.createQuery("DELETE FROM GroupChatMessageEntity gcm WHERE gcm.channel.id IN (SELECT gc.id FROM GroupChannelEntity gc WHERE gc.group.id IN (SELECT g.id FROM GroupEntity g WHERE g.owner.id = :uId))")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GroupChannelEntity gc WHERE gc.group.id IN (SELECT g.id FROM GroupEntity g WHERE g.owner.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GroupMembershipEntity gm WHERE gm.group.id IN (SELECT g.id FROM GroupEntity g WHERE g.owner.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GroupPostEntity gp WHERE gp.group.id IN (SELECT g.id FROM GroupEntity g WHERE g.owner.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GroupEntity g WHERE g.owner.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 9. Entraide Tech (Help Desk)
        entityManager.createQuery("DELETE FROM HelpCommentEntity hc WHERE hc.author.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("UPDATE HelpPostEntity hp SET hp.resolvedBy = null WHERE hp.resolvedBy.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM HelpCommentEntity hc WHERE hc.post.id IN (SELECT p.id FROM HelpPostEntity p WHERE p.author.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM HelpPostEntity hp WHERE hp.author.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 10. Évaluations, abonnements, collaborations et messages
        entityManager.createQuery("DELETE FROM EvaluationEntity ev WHERE ev.evaluator.id = :uId OR ev.evaluatee.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM FollowEntity f WHERE f.follower.id = :uId OR f.following.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM CollaborationEntity col WHERE col.initiator.id = :uId OR col.partner.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM MessageEntity m WHERE m.sender.id = :uId OR m.recipient.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM NotificationEntity n WHERE n.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 11. Logs, signalements, récompenses et XP
        entityManager.createQuery("DELETE FROM AuditLogEntity al WHERE al.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ReportEntity rep WHERE rep.reporter.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM RecognitionEntity rec WHERE rec.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM XpTransactionEntity xp WHERE xp.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM LoginSessionEntity ls WHERE ls.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 12. Portefeuille financier et paiements
        entityManager.createQuery("DELETE FROM PayoutAccountEntity pa WHERE pa.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM WithdrawalEntity wd WHERE wd.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM PaymentEntity pay WHERE pay.buyer.id = :uId OR pay.seller.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM WalletTransactionEntity wt WHERE wt.wallet.id IN (SELECT w.id FROM WalletEntity w WHERE w.user.id = :uId)")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM WalletEntity w WHERE w.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        // 13. Profil et Entité Utilisateur principale
        entityManager.createQuery("DELETE FROM ProfileEntity prof WHERE prof.user.id = :uId")
                .setParameter("uId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM UserEntity u WHERE u.id = :uId")
                .setParameter("uId", userId).executeUpdate();

        log.info("Suppression définitive réussie pour le compte {} (ID: {})", userEmail, userId);
    }
}

package africa.afridev.service;

import africa.afridev.model.entity.CompanyEntity;
import africa.afridev.model.entity.CompanyXpTransactionEntity;
import africa.afridev.model.enums.CompanyLevel;
import africa.afridev.model.enums.CompanyXpSourceType;
import africa.afridev.repository.CompanyRepository;
import africa.afridev.repository.CompanyXpTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyXpService {

    private final CompanyRepository companyRepository;
    private final CompanyXpTransactionRepository companyXpTransactionRepository;
    private final RedisCacheService redisCacheService;

    public static final long XP_PROFILE_COMPLETED = 50L;
    public static final long XP_OPPORTUNITY_PUBLISHED = 30L;
    public static final long XP_OPPORTUNITY_FILLED = 80L;
    public static final long XP_EVENT_PUBLISHED = 40L;
    public static final long XP_RESOURCE_PUBLISHED = 35L;
    public static final long XP_COMMUNITY_CREATED = 25L;
    public static final long XP_DEVELOPER_HIRED_VERIFIED = 100L;
    public static final long XP_REVIEW_POSITIVE = 20L;

    @Transactional
    public void awardXp(CompanyEntity company, long points, CompanyXpSourceType sourceType, String sourceId, String description) {
        if (company == null || points <= 0) return;

        // Anti-doublon pour les actions uniques
        if (sourceId != null && (
                sourceType == CompanyXpSourceType.PROFILE_COMPLETED ||
                sourceType == CompanyXpSourceType.OPPORTUNITY_PUBLISHED ||
                sourceType == CompanyXpSourceType.EVENT_PUBLISHED ||
                sourceType == CompanyXpSourceType.RESOURCE_PUBLISHED ||
                sourceType == CompanyXpSourceType.COMMUNITY_CREATED ||
                sourceType == CompanyXpSourceType.DEVELOPER_HIRED_VERIFIED)) {
            if (companyXpTransactionRepository.existsByCompanyIdAndSourceTypeAndSourceId(company.getId(), sourceType, sourceId)) {
                log.debug("XP Entreprise déjà attribué pour {} et sourceId {}", sourceType, sourceId);
                return;
            }
        }

        // Plafond anti-spam quotidien pour les vues de ressources
        if (sourceType == CompanyXpSourceType.RESOURCE_VIEWS) {
            LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
            long viewsToday = companyXpTransactionRepository.countByCompanyIdAndSourceTypeAndCreatedAtAfter(
                    company.getId(), sourceType, startOfDay);
            if (viewsToday >= 100) {
                return;
            }
        }

        CompanyXpTransactionEntity transaction = CompanyXpTransactionEntity.builder()
                .company(company)
                .points(points)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .description(description)
                .build();
        companyXpTransactionRepository.save(transaction);

        long currentXp = company.getCompanyXp() != null ? company.getCompanyXp() : 0L;
        long newXp = currentXp + points;
        company.setCompanyXp(newXp);

        CompanyLevel level = CompanyLevel.fromXp(newXp);
        company.setLevelNumber(level.getLevel());
        company.setCompanyLevel(level.getTitle());
        company.setBadge(level.getBadge());

        companyRepository.save(company);
        log.info("Attribué {} XP à l'entreprise {} (Total: {}, Niveau: {})", points, company.getName(), newXp, level.getTitle());
    }
}


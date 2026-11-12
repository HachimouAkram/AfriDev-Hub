package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.company.CompanyLeaderboardItemDto;
import africa.afridev.dto.company.CompanyLeaderboardResponse;
import africa.afridev.model.entity.CompanyEntity;
import africa.afridev.model.entity.CompanyMemberEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.CompanyMemberStatus;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.repository.CompanyMemberRepository;
import africa.afridev.repository.CompanyRepository;
import africa.afridev.repository.OpportunityRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping({"/leaderboard/companies", "/api/leaderboard/companies", "/api/v1/leaderboard/companies"})
@RequiredArgsConstructor
public class CompanyLeaderboardController {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<CompanyLeaderboardResponse>> getCompanyLeaderboard(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("companyXp").descending());
        Page<CompanyEntity> companyPage = companyRepository.searchCompanies(
                ContentStatus.PUBLISHED,
                country != null && !country.isBlank() ? country.trim() : null,
                sector != null && !sector.isBlank() ? sector.trim() : null,
                query != null && !query.isBlank() ? query.trim() : null,
                pageable);

        List<CompanyLeaderboardItemDto> items = new ArrayList<>();
        int rankOffset = page * size;
        int i = 1;
        for (CompanyEntity c : companyPage.getContent()) {
            items.add(mapToItem(c, rankOffset + i));
            i++;
        }

        // Identifier l'entreprise de l'utilisateur connecté s'il y en a une
        CompanyLeaderboardItemDto myCompanyDto = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            Optional<UserEntity> userOpt = userRepository.findByEmail(authentication.getName());
            if (userOpt.isPresent()) {
                UserEntity user = userOpt.get();
                Optional<CompanyEntity> owned = companyRepository.findByOwnerId(user.getId());
                CompanyEntity userCompany = owned.orElseGet(() ->
                        companyMemberRepository.findFirstByUserIdAndStatusOrderByCreatedAtAsc(user.getId(), CompanyMemberStatus.ACTIVE)
                                .map(CompanyMemberEntity::getCompany)
                                .orElse(null));

                if (userCompany != null) {
                    // Trouver le rang global de l'entreprise
                    long higherXpCount = companyRepository.findByStatusOrderByCompanyXpDesc(ContentStatus.PUBLISHED, Pageable.unpaged())
                            .getContent()
                            .stream()
                            .filter(c -> c.getCompanyXp() != null && c.getCompanyXp() > (userCompany.getCompanyXp() != null ? userCompany.getCompanyXp() : 0L))
                            .count();
                    int globalRank = (int) higherXpCount + 1;
                    myCompanyDto = mapToItem(userCompany, globalRank);
                }
            }
        }

        CompanyLeaderboardResponse response = CompanyLeaderboardResponse.builder()
                .topCompanies(items)
                .myCompany(myCompanyDto)
                .totalCompanies(companyPage.getTotalElements())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private CompanyLeaderboardItemDto mapToItem(CompanyEntity c, int rank) {
        long activeOps = opportunityRepository.countByCompanyIdAndStatus(c.getId(), ContentStatus.PUBLISHED);

        return CompanyLeaderboardItemDto.builder()
                .rank(rank)
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .logoUrl(c.getLogoUrl())
                .country(c.getCountry())
                .city(c.getCity())
                .sector(c.getSector())
                .companyXp(c.getCompanyXp() != null ? c.getCompanyXp() : 0L)
                .companyLevel(c.getCompanyLevel())
                .levelNumber(c.getLevelNumber())
                .badge(c.getBadge())
                .verified(c.getVerified())
                .activeOpportunitiesCount(activeOps)
                .build();
    }
}


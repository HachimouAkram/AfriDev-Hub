package africa.afridev.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsDto {
    // Utilisateurs & Talents
    private long totalUsers;
    private long totalProfiles;
    private long totalDevelopers;
    private long totalRecruiters;
    private long totalVerifiedUsers;

    // Entreprises & Recrutement
    private long totalCompanies;
    private long totalVerifiedCompanies;
    private long activeCompanies;

    // Offres d'emploi & Stages
    private long totalOpportunities;
    private long activeOpportunities;
    private long totalApplications;
    private Map<String, Long> opportunitiesByType;

    // Formations & Ressources partagées
    private long totalResources;
    private long totalTrainingsCompleted;

    // Communautés & Groupes
    private long totalGroups;
    private long totalGroupMembers;

    // Projets & Tech
    private long totalProjects;
    private long totalEvaluations;

    // Événements
    private long totalEvents;

    // Pays et écosystème
    private Map<String, Long> usersByCountry;
    private Map<String, Long> companiesByCountry;
    private Map<String, Long> ecosystemDistribution;
    private List<Map<String, Object>> topCountriesPerformance;
}

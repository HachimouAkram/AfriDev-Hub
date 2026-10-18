package africa.afridev.service;

import africa.afridev.dto.leaderboard.LeaderboardEntryDto;
import africa.afridev.dto.leaderboard.LeaderboardResponse;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.ProfileRepository;
import africa.afridev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RedisCacheService redisCacheService;

    @InjectMocks
    private LeaderboardService leaderboardService;

    private List<ProfileEntity> mockProfiles;

    @BeforeEach
    void setUp() {
        mockProfiles = new ArrayList<>();
        // Génère 30 profils avec des points XP décroissants (de 3000 XP à 100 XP)
        for (int i = 1; i <= 30; i++) {
            UserEntity user = UserEntity.builder()
                    .id("user-" + i)
                    .email("dev" + i + "@afridev.africa")
                    .build();

            ProfileEntity profile = ProfileEntity.builder()
                    .id("profile-" + i)
                    .user(user)
                    .fullName("Developer " + i)
                    .title("Fullstack Engineer " + i)
                    .country("Senegal")
                    .city("Dakar")
                    .xpPoints(3000L - (i * 90L)) // 2910, 2820, ..., 300
                    .levelNumber(3)
                    .levelTitle("Expert")
                    .build();

            mockProfiles.add(profile);
        }
    }

    @Test
    @DisplayName("Cas Public : Doit retourner exactement le Top 10 pour un visiteur")
    void testGetPublicLeaderboard_ReturnsTop10() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        LeaderboardResponse res = leaderboardService.getPublicLeaderboard();

        assertNotNull(res);
        assertFalse(res.getIsAuthenticated());
        assertEquals(30L, res.getTotalDevelopers());
        assertNull(res.getUserRank());
        assertEquals(10, res.getPublicTop10().size());
        assertEquals(5, res.getTop5().size());

        // Vérification des rangs du top 10 (1 à 10)
        for (int i = 0; i < 10; i++) {
            assertEquals((long) (i + 1), res.getPublicTop10().get(i).getRank());
        }
    }

    @Test
    @DisplayName("Cas Limite 1 : Développeur au Rang 1 (Top 1) - Aucun au-dessus et 5 en-dessous")
    void testGetLeaderboardForUser_Top1() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        LeaderboardResponse res = leaderboardService.getLeaderboardForUser("user-1");

        assertNotNull(res);
        assertTrue(res.getIsAuthenticated());
        assertEquals(1L, res.getUserRank());
        assertEquals(30L, res.getTotalDevelopers());

        // Voisinage : 0 au-dessus, lui (index 0), 5 en-dessous -> 6 profils au total
        List<LeaderboardEntryDto> neighborhood = res.getSurroundingNeighborhood();
        assertNotNull(neighborhood);
        assertEquals(6, neighborhood.size());

        LeaderboardEntryDto first = neighborhood.get(0);
        assertEquals(1L, first.getRank());
        assertTrue(first.getIsCurrentUser());
        assertEquals(0L, first.getPointsToNextRank()); // Pas de développeur au-dessus

        // Le 2e du voisinage est au rang 2
        assertEquals(2L, neighborhood.get(1).getRank());
        assertFalse(neighborhood.get(1).getIsCurrentUser());
    }

    @Test
    @DisplayName("Cas Limite 2 : Développeur dans le Top 5 (Rang 3) - 2 au-dessus et 5 en-dessous")
    void testGetLeaderboardForUser_Top5_Rank3() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        LeaderboardResponse res = leaderboardService.getLeaderboardForUser("user-3");

        assertNotNull(res);
        assertEquals(3L, res.getUserRank());

        // Index 2 (Rang 3). startIndex = max(0, 2 - 5) = 0. endIndex = 2 + 6 = 8.
        // Voisinage : rangs 1, 2, [3], 4, 5, 6, 7, 8 (8 profils au total)
        List<LeaderboardEntryDto> neighborhood = res.getSurroundingNeighborhood();
        assertEquals(8, neighborhood.size());

        assertEquals(1L, neighborhood.get(0).getRank());
        assertEquals(2L, neighborhood.get(1).getRank());

        LeaderboardEntryDto rank3 = neighborhood.get(2);
        assertEquals(3L, rank3.getRank());
        assertTrue(rank3.getIsCurrentUser());
        assertTrue(rank3.getPointsToNextRank() > 0); // Doit rattraper le rang 2
    }

    @Test
    @DisplayName("Cas Nominal : Développeur au milieu (Rang 20) - Exactement 11 profils (5 au-dessus, lui, 5 en-dessous)")
    void testGetLeaderboardForUser_MiddleUser_Rank20() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        LeaderboardResponse res = leaderboardService.getLeaderboardForUser("user-20");

        assertNotNull(res);
        assertEquals(20L, res.getUserRank());

        // Index 19. startIndex = 14 (Rang 15). endIndex = 25 (Rang 25).
        // Voisinage : rangs 15, 16, 17, 18, 19, [20], 21, 22, 23, 24, 25 (Exactement 11 profils !)
        List<LeaderboardEntryDto> neighborhood = res.getSurroundingNeighborhood();
        assertEquals(11, neighborhood.size());

        // Rangs au-dessus
        assertEquals(15L, neighborhood.get(0).getRank());
        assertEquals(19L, neighborhood.get(4).getRank());

        // L'utilisateur au milieu
        LeaderboardEntryDto me = neighborhood.get(5);
        assertEquals(20L, me.getRank());
        assertTrue(me.getIsCurrentUser());
        assertTrue(me.getPointsToNextRank() > 0);

        // Rangs en-dessous
        assertEquals(21L, neighborhood.get(6).getRank());
        assertEquals(25L, neighborhood.get(10).getRank());
    }

    @Test
    @DisplayName("Cas Limite 3 : Développeur en bas de tableau (Dernier rang, 30 sur 30) - 5 au-dessus et 0 en-dessous")
    void testGetLeaderboardForUser_BottomUser_LastRank() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        LeaderboardResponse res = leaderboardService.getLeaderboardForUser("user-30");

        assertNotNull(res);
        assertEquals(30L, res.getUserRank());

        // Index 29. startIndex = 24 (Rang 25). endIndex = 30 (Rang 30).
        // Voisinage : rangs 25, 26, 27, 28, 29, [30] -> 6 profils
        List<LeaderboardEntryDto> neighborhood = res.getSurroundingNeighborhood();
        assertEquals(6, neighborhood.size());

        LeaderboardEntryDto last = neighborhood.get(5);
        assertEquals(30L, last.getRank());
        assertTrue(last.getIsCurrentUser());
    }

    @Test
    @DisplayName("Recherche : Doit centrer la vue sur le profil trouvé avec les 11 voisins")
    void testSearchLeaderboard_Found() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        // Recherche "Developer 18" (qui est au rang 18)
        LeaderboardResponse res = leaderboardService.searchLeaderboard("Developer 18", "user-1");

        assertNotNull(res);
        assertEquals(18L, res.getUserRank());
        assertNotNull(res.getTargetDeveloper());
        assertEquals("Developer 18", res.getTargetDeveloper().getFullName());

        // Doit avoir 11 développeurs dans le voisinage centré sur Developer 18
        assertEquals(11, res.getSurroundingNeighborhood().size());
        assertEquals(18L, res.getSurroundingNeighborhood().get(5).getRank());
    }

    @Test
    @DisplayName("Recherche : Recherche introuvable renvoie le Top 5 sans crash")
    void testSearchLeaderboard_NotFound() {
        when(profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc()).thenReturn(mockProfiles);

        LeaderboardResponse res = leaderboardService.searchLeaderboard("UtilisateurInexistant999", "user-1");

        assertNotNull(res);
        assertNull(res.getUserRank());
        assertEquals(5, res.getTop5().size());
        assertEquals(0, res.getSurroundingNeighborhood().size());
    }
}

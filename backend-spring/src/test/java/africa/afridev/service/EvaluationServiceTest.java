package africa.afridev.service;

import africa.afridev.dto.evaluation.EvaluationCreateRequest;
import africa.afridev.model.entity.CollaborationEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.CollaborationRepository;
import africa.afridev.repository.EvaluationRepository;
import africa.afridev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceTest {

    @Mock
    private CollaborationRepository collaborationRepository;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private EvaluationService evaluationService;

    private UserEntity evaluator;
    private UserEntity evaluatee;
    private CollaborationEntity unverifiedCollab;

    @BeforeEach
    void setUp() {
        evaluator = UserEntity.builder().id("evaluator-1").email("evaluator@afridev.africa").build();
        evaluatee = UserEntity.builder().id("evaluatee-2").email("evaluatee@afridev.africa").build();

        unverifiedCollab = CollaborationEntity.builder()
                .id("collab-1")
                .initiator(evaluator)
                .partner(evaluatee)
                .verified(false) // Non vérifiée
                .build();
    }

    @Test
    void testSubmitEvaluation_UnverifiedCollaboration_SecurityCheckThrowsException() {
        EvaluationCreateRequest request = new EvaluationCreateRequest();
        request.setEvaluateeId("evaluatee-2");
        request.setCollaborationId("collab-1");
        request.setCodeQuality(5);
        request.setCollaborationRating(5);
        request.setTechnicalDepth(4);
        request.setReliability(5);

        when(userRepository.findByEmail("evaluator@afridev.africa")).thenReturn(Optional.of(evaluator));
        when(userRepository.findById("evaluatee-2")).thenReturn(Optional.of(evaluatee));
        when(collaborationRepository.findById("collab-1")).thenReturn(Optional.of(unverifiedCollab));

        // RÈGLE DE SÉCURITÉ CRITIQUE : Doit lever IllegalStateException
        assertThrows(IllegalStateException.class, () -> evaluationService.submitEvaluation("evaluator@afridev.africa", request));
    }
}

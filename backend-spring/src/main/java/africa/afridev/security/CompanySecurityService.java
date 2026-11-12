package africa.afridev.security;

import africa.afridev.model.entity.CompanyEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.CompanyMemberStatus;
import africa.afridev.repository.CompanyMemberRepository;
import africa.afridev.repository.CompanyRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("companySecurityService")
@RequiredArgsConstructor
public class CompanySecurityService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final UserRepository userRepository;

    public boolean isOwner(String companyId, String userEmail) {
        if (companyId == null || userEmail == null) return false;
        Optional<CompanyEntity> companyOpt = companyRepository.findById(companyId);
        if (companyOpt.isEmpty()) return false;
        CompanyEntity company = companyOpt.get();
        return company.getOwner() != null && userEmail.equalsIgnoreCase(company.getOwner().getEmail());
    }

    public boolean isMember(String companyId, String userEmail) {
        if (companyId == null || userEmail == null) return false;
        if (isOwner(companyId, userEmail)) return true;

        Optional<UserEntity> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) return false;

        return companyMemberRepository.existsByCompanyIdAndUserIdAndStatus(
                companyId,
                userOpt.get().getId(),
                CompanyMemberStatus.ACTIVE);
    }
}


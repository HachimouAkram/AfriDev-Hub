package africa.afridev.security;

import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity userEntity = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec l'email: " + email));

        boolean isActive = userEntity.getStatus() == africa.afridev.model.enums.UserStatus.ACTIVE;
        boolean isNotLocked = userEntity.getStatus() != africa.afridev.model.enums.UserStatus.BANNED 
                           && userEntity.getStatus() != africa.afridev.model.enums.UserStatus.SUSPENDED;

        return new User(
                userEntity.getEmail(),
                userEntity.getPasswordHash() != null ? userEntity.getPasswordHash() : "",
                isActive,
                true,
                true,
                isNotLocked,
                List.of(new SimpleGrantedAuthority("ROLE_" + userEntity.getRole().name()))
        );
    }
}

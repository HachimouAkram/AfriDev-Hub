package africa.afridev.service;

import africa.afridev.dto.notification.NotificationDto;
import africa.afridev.model.entity.NotificationEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.NotificationRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToNotificationDto)
                .toList();
    }

    @Transactional
    public void markAsRead(String userEmail, String notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification introuvable."));

        if (!notification.getUser().getEmail().equals(userEmail)) {
            throw new IllegalStateException("Accès non autorisé.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        List<NotificationEntity> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createNotification(UserEntity user, String type, String title, String body, String link) {
        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    private NotificationDto mapToNotificationDto(NotificationEntity n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .link(n.getLink())
                .read(n.getRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

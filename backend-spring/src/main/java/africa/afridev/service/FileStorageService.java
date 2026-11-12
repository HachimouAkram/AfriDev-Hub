package africa.afridev.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Cloudinary cloudinary;
    private final Path uploadLocation;
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = List.of("png", "jpg", "jpeg", "webp");
    private static final List<String> ALLOWED_PDF_EXTENSIONS = List.of("pdf");
    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = List.of("mp4", "webm", "mov", "m4v");
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final long MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final long MAX_VIDEO_SIZE = 50L * 1024 * 1024; // 50 MB

    public FileStorageService(Cloudinary cloudinary, @Value("${file.upload-dir:uploads}") String uploadDir) {
        this.cloudinary = cloudinary;
        this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            log.warn("Impossible de créer le répertoire local de stockage: {}", e.getMessage());
        }
    }

    public String storeImage(MultipartFile file) {
        return storeToCloudinaryOrLocal(file, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE, "L'image doit être au format PNG, JPG, JPEG ou WEBP et ne pas dépasser 5 Mo.", "afridev/images", "image");
    }

    public String storePdf(MultipartFile file) {
        return storeToCloudinaryOrLocal(file, ALLOWED_PDF_EXTENSIONS, MAX_PDF_SIZE, "Le document doit être au format PDF et ne pas dépasser 10 Mo.", "afridev/documents", "raw");
    }

    public String storeVideo(MultipartFile file) {
        return storeToCloudinaryOrLocal(file, ALLOWED_VIDEO_EXTENSIONS, MAX_VIDEO_SIZE, "La vidéo doit être au format MP4, WEBM, MOV ou M4V et ne pas dépasser 50 Mo.", "afridev/videos", "video");
    }

    private String storeToCloudinaryOrLocal(MultipartFile file, List<String> allowedExtensions, long maxSize, String errorMessage, String folder, String resourceType) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide non autorisé.");
        }

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(errorMessage);
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String fileExtension = getFileExtension(originalFilename).toLowerCase();

        if (!allowedExtensions.contains(fileExtension)) {
            throw new IllegalArgumentException(errorMessage);
        }

        // 1. Essai d'upload sécurisé vers Cloudinary
        try {
            if (cloudinary != null) {
                java.util.Map<String, Object> uploadParams = new java.util.HashMap<>();
                uploadParams.put("folder", folder);
                uploadParams.put("resource_type", resourceType);

                if ("raw".equals(resourceType)) {
                    // Pour les documents PDF raw, conserver l'extension .pdf dans le public_id
                    String rawId = "doc_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16) + "." + fileExtension;
                    uploadParams.put("public_id", rawId);
                    uploadParams.put("use_filename", false);
                    uploadParams.put("unique_filename", false);
                } else {
                    uploadParams.put("use_filename", true);
                    uploadParams.put("unique_filename", true);
                }

                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null && !secureUrl.isBlank()) {
                    log.info("[CLOUDINARY] Fichier uploadé avec succès : {}", secureUrl);
                    return secureUrl;
                }
            }
        } catch (Exception e) {
            log.error("[CLOUDINARY] Erreur lors de l'upload vers Cloudinary, fallback local : {}", e.getMessage());
        }

        // 2. Fallback stockage disque local en cas de problème réseau
        String newFilename = UUID.randomUUID().toString() + "." + fileExtension;
        Path targetLocation = this.uploadLocation.resolve(newFilename);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/files/" + newFilename;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier.", e);
        }
    }

    public Resource loadFileAsResource(String filename) {
        try {
            Path filePath = this.uploadLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Fichier non trouvé : " + filename);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Chemin de fichier invalide : " + filename, e);
        }
    }

    private String getFileExtension(String filename) {
        int lastIndexOfDot = filename.lastIndexOf('.');
        if (lastIndexOfDot == -1) {
            return "";
        }
        return filename.substring(lastIndexOfDot + 1);
    }
}

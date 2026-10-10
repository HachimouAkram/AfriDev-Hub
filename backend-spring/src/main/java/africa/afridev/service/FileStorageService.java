package africa.afridev.service;

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
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadLocation;
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = List.of("png", "jpg", "jpeg", "webp");
    private static final List<String> ALLOWED_PDF_EXTENSIONS = List.of("pdf");
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final long MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage des fichiers.", e);
        }
    }

    public String storeImage(MultipartFile file) {
        return storeFile(file, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE, "L'image doit être au format PNG, JPG, JPEG ou WEBP et ne pas dépasser 5 Mo.");
    }

    public String storePdf(MultipartFile file) {
        return storeFile(file, ALLOWED_PDF_EXTENSIONS, MAX_PDF_SIZE, "Le document doit être au format PDF et ne pas dépasser 10 Mo.");
    }

    private String storeFile(MultipartFile file, List<String> allowedExtensions, long maxSize, String errorMessage) {
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

        // Sanitization & Security against directory traversal attacks
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

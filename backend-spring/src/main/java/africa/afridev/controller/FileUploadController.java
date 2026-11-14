package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeImage(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", fileUrl)));
    }

    @PostMapping("/pdf")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPdf(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storePdf(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", fileUrl)));
    }

    @PostMapping("/video")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeVideo(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", fileUrl)));
    }

    @PostMapping("/archive")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadArchive(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeArchive(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", fileUrl)));
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        Resource resource = fileStorageService.loadFileAsResource(filename);
        String contentType = null;
        try {
            contentType = Files.probeContentType(Paths.get(resource.getFile().getAbsolutePath()));
        } catch (IOException ignored) {}

        if (contentType == null) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) {
                contentType = "video/mp4";
            } else if (lower.endsWith(".webm")) {
                contentType = "video/webm";
            } else if (lower.endsWith(".mov")) {
                contentType = "video/quicktime";
            } else if (lower.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else {
                contentType = "application/octet-stream";
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    /**
     * Endpoint proxy pour prévisualiser un document PDF en ligne dans le navigateur
     * sans déclencher de téléchargement forcé de fichier brut (problème raw Cloudinary).
     */
    @GetMapping("/view-pdf")
    public ResponseEntity<byte[]> viewPdf(@RequestParam(value = "url", required = false) String targetUrl) {
        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String decodedUrl = targetUrl.trim();
        try {
            // Décodage au cas où l'URL a été encodée plusieurs fois (ex: %3A%2F%2F)
            if (decodedUrl.contains("%3A") || decodedUrl.contains("%2F")) {
                decodedUrl = java.net.URLDecoder.decode(decodedUrl, java.nio.charset.StandardCharsets.UTF_8);
            }

            byte[] pdfBytes;

            if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
                // Téléchargement depuis Cloudinary ou serveur distant
                java.net.URI uri = java.net.URI.create(decodedUrl);
                java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                        .followRedirects(java.net.http.HttpClient.Redirect.ALWAYS)
                        .connectTimeout(java.time.Duration.ofSeconds(12))
                        .build();

                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                        .uri(uri)
                        .timeout(java.time.Duration.ofSeconds(25))
                        .GET()
                        .build();

                java.net.http.HttpResponse<byte[]> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    pdfBytes = response.body();
                } else {
                    return ResponseEntity.status(response.statusCode()).build();
                }
            } else {
                // Stockage local
                String filename = decodedUrl;
                if (filename.startsWith("/api/v1/uploads/files/")) {
                    filename = filename.replace("/api/v1/uploads/files/", "");
                } else if (filename.startsWith("/uploads/files/")) {
                    filename = filename.replace("/uploads/files/", "");
                } else if (filename.contains("/")) {
                    filename = filename.substring(filename.lastIndexOf('/') + 1);
                }
                Resource resource = fileStorageService.loadFileAsResource(filename);
                pdfBytes = resource.getInputStream().readAllBytes();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"document.pdf\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header("X-Frame-Options", "SAMEORIGIN")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

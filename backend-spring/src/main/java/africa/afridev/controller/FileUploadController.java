package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
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
}

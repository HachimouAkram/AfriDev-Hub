package africa.afridev.security;

import jakarta.servlet.http.HttpServletRequest;

public class DeviceParserUtil {

    public record DeviceInfo(String deviceType, String deviceName, String browser, String operatingSystem, String ipAddress) {}

    public static DeviceInfo parse(HttpServletRequest request) {
        String userAgent = request != null ? request.getHeader("User-Agent") : "";
        String ipAddress = extractClientIp(request);

        if (userAgent == null || userAgent.isBlank()) {
            return new DeviceInfo("DESKTOP", "Navigateur Web", "Inconnu", "Inconnu", ipAddress);
        }

        String lowerUa = userAgent.toLowerCase();

        // 1. Device Type
        String deviceType = "DESKTOP";
        if (lowerUa.contains("ipad") || lowerUa.contains("tablet") || (lowerUa.contains("android") && !lowerUa.contains("mobile"))) {
            deviceType = "TABLET";
        } else if (lowerUa.contains("mobile") || lowerUa.contains("iphone") || lowerUa.contains("ipod") || lowerUa.contains("android")) {
            deviceType = "MOBILE";
        }

        // 2. Operating System
        String os = "Inconnu";
        if (lowerUa.contains("windows nt 10.0")) os = "Windows 10/11";
        else if (lowerUa.contains("windows")) os = "Windows";
        else if (lowerUa.contains("iphone") || lowerUa.contains("ipad") || lowerUa.contains("ios")) os = "iOS";
        else if (lowerUa.contains("android")) os = "Android";
        else if (lowerUa.contains("macintosh") || lowerUa.contains("mac os x")) os = "macOS";
        else if (lowerUa.contains("linux")) os = "Linux";

        // 3. Browser
        String browser = "Inconnu";
        if (lowerUa.contains("edg/")) browser = "Microsoft Edge";
        else if (lowerUa.contains("chrome") && !lowerUa.contains("edg/")) browser = "Google Chrome";
        else if (lowerUa.contains("safari") && !lowerUa.contains("chrome")) browser = "Apple Safari";
        else if (lowerUa.contains("firefox")) browser = "Mozilla Firefox";
        else if (lowerUa.contains("opera") || lowerUa.contains("opr/")) browser = "Opera";

        // 4. Device Name
        String deviceName;
        if ("MOBILE".equals(deviceType)) {
            if (lowerUa.contains("iphone")) {
                deviceName = browser + " sur iPhone";
            } else if (lowerUa.contains("samsung")) {
                deviceName = browser + " sur Samsung";
            } else {
                deviceName = browser + " sur Téléphone " + os;
            }
        } else if ("TABLET".equals(deviceType)) {
            deviceName = browser + " sur Tablette (" + os + ")";
        } else {
            deviceName = browser + " sur " + os;
        }

        return new DeviceInfo(deviceType, deviceName, browser, os, ipAddress);
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";

        String[] headers = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "X-Real-IP"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }

        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "127.0.0.1";
    }
}

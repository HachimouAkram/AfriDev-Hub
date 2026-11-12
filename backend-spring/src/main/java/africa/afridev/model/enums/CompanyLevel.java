package africa.afridev.model.enums;

import lombok.Getter;

@Getter
public enum CompanyLevel {
    STARTUP(1, "Startup", 0L, 499L, "🌱"),
    RECONNUE(2, "Reconnue", 500L, 1999L, "🏢"),
    CERTIFIEE(3, "Certifiée", 2000L, 4999L, "✅"),
    PARTENAIRE(4, "Partenaire", 5000L, 9999L, "🤝"),
    ELITE_AFRIQUE(5, "Élite Afrique", 10000L, Long.MAX_VALUE, "👑");

    private final int level;
    private final String title;
    private final long minXp;
    private final long maxXp;
    private final String badge;

    CompanyLevel(int level, String title, long minXp, long maxXp, String badge) {
        this.level = level;
        this.title = title;
        this.minXp = minXp;
        this.maxXp = maxXp;
        this.badge = badge;
    }

    public static CompanyLevel fromXp(long xp) {
        if (xp < 500L) return STARTUP;
        if (xp < 2000L) return RECONNUE;
        if (xp < 5000L) return CERTIFIEE;
        if (xp < 10000L) return PARTENAIRE;
        return ELITE_AFRIQUE;
    }
}


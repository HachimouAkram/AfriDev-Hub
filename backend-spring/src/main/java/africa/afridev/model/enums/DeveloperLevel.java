package africa.afridev.model.enums;

import lombok.Getter;

@Getter
public enum DeveloperLevel {
    JUNIOR(1, "Junior", 0L, 499L, "🟢"),
    SENIOR(2, "Senior", 500L, 1999L, "🔵"),
    EXPERT(3, "Expert", 2000L, 3999L, "🟣"),
    TECH(4, "Tech", 4000L, 6999L, "🟠"),
    LEADER(5, "Leader", 7000L, Long.MAX_VALUE, "👑");

    private final int level;
    private final String title;
    private final long minXp;
    private final long maxXp;
    private final String badge;

    DeveloperLevel(int level, String title, long minXp, long maxXp, String badge) {
        this.level = level;
        this.title = title;
        this.minXp = minXp;
        this.maxXp = maxXp;
        this.badge = badge;
    }

    public static DeveloperLevel fromXp(long xp) {
        if (xp < 500L) return JUNIOR;
        if (xp < 2000L) return SENIOR;
        if (xp < 4000L) return EXPERT;
        if (xp < 7000L) return TECH;
        return LEADER;
    }
}

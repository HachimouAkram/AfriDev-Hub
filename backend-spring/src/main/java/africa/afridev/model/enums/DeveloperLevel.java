package africa.afridev.model.enums;

import lombok.Getter;

@Getter
public enum DeveloperLevel {
    JUNIOR(1, "Junior", 0L, 250L, "🟢"),
    SENIOR(2, "Senior", 251L, 750L, "🔵"),
    EXPERT(3, "Expert", 751L, 1800L, "🟣"),
    TECH(4, "Tech", 1801L, 3500L, "🟠"),
    LEADER(5, "Leader", 3501L, Long.MAX_VALUE, "👑");

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
        if (xp <= 250L) return JUNIOR;
        if (xp <= 750L) return SENIOR;
        if (xp <= 1800L) return EXPERT;
        if (xp <= 3500L) return TECH;
        return LEADER;
    }
}

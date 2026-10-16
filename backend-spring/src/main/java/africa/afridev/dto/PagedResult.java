package africa.afridev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * Encapsuleur sérialisable pour les résultats paginés, compatible avec Jackson et Redis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResult<T> implements Serializable {

    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean isLast;
    private boolean isFirst;

    public static <T> PagedResult<T> from(Page<T> page) {
        if (page == null) {
            return PagedResult.<T>builder()
                    .content(Collections.emptyList())
                    .pageNumber(0)
                    .pageSize(20)
                    .totalElements(0)
                    .totalPages(0)
                    .isLast(true)
                    .isFirst(true)
                    .build();
        }
        return PagedResult.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .isFirst(page.isFirst())
                .build();
    }

    public Page<T> toPage() {
        return new PageImpl<>(
                content != null ? content : Collections.emptyList(),
                PageRequest.of(Math.max(0, pageNumber), Math.max(1, pageSize)),
                totalElements
        );
    }
}

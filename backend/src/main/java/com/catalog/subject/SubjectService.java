package com.catalog.subject;

import com.catalog.common.ConflictException;
import com.catalog.common.NotFoundException;
import com.catalog.common.SlugUtils;
import com.catalog.subject.dto.SubjectRequest;
import com.catalog.subject.dto.SubjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.apache.logging.log4j.util.Strings.trimToNull;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectService {
    private final SubjectRepository repository;

    public List<SubjectResponse> findAll() {
        Map<UUID, Long> counts = repository.countPersonsBySubject().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> ((Number) row[1]).longValue()));

        return repository.findAll(Sort.by("name")).stream()
                .map(s -> toResponse(s, counts.getOrDefault(s.getId(), 0L)))
                .toList();
    }

    @Transactional
    public SubjectResponse create(SubjectRequest r) {
        String slug = resolveSlug(r.slug(), r.name());

        if (repository.existsByNameIgnoreCase(r.name().trim())) {
            throw new ConflictException("Предмет с таким названием уже есть");
        }
        if (repository.existsBySlug(slug)) {
            throw new ConflictException("Предмет с таким кодом уже есть: " + slug);
        }

        Subject subject = new Subject(r.name().trim(), slug);
        subject.setDescription(trimToNull(r.description()));
        return toResponse(repository.save(subject), 0L);
    }

    @Transactional
    public SubjectResponse update(UUID id, SubjectRequest r) {
        Subject subject = getOrThrow(id);
        String slug = resolveSlug(r.slug(), r.name());

        if (repository.existsByNameIgnoreCaseAndIdNot(r.name().trim(), id)) {
            throw new ConflictException("Предмет с таким названием уже есть");
        }
        if (repository.existsBySlugAndIdNot(slug, id)) {
            throw new ConflictException("Предмет с таким кодом уже есть: " + slug);
        }

        subject.setName(r.name().trim());
        subject.setSlug(slug);
        subject.setDescription(trimToNull(r.description()));
        return toResponse(subject, repository.countPersons(id));
    }

    @Transactional
    public void delete(UUID id, boolean force) {
        Subject subject = getOrThrow(id);
        long count = repository.countPersons(id);

        if (count > 0 && !force) {
            throw new ConflictException(
                    "С этим предметом связано учителей: " + count
                            + ". Повторите с параметром force=true, чтобы удалить.");
        }
        if (count > 0) {
            repository.detachFromPersons(id);
        }
        repository.delete(subject);
    }

    private Subject getOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Предмет не найден: " + id));
    }

    private String resolveSlug(String slug, String name) {
        return (slug != null && !slug.isBlank())
                ? slug.trim().toLowerCase()
                : SlugUtils.from(name);
    }

    private SubjectResponse toResponse(Subject s, long personCount) {
        return new SubjectResponse(
                s.getId(),
                s.getName(),
                s.getSlug(),
                s.getDescription(),
                personCount);
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
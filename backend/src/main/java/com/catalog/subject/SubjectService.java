package com.catalog.subject;

import com.catalog.subject.dto.SubjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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
                .map(s -> new SubjectResponse(
                        s.getId(),
                        s.getName(),
                        s.getSlug(),
                        s.getDescription(),
                        counts.getOrDefault(s.getId(), 0L)))
                .toList();
    }
}
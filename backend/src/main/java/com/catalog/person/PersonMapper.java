package com.catalog.person;

import com.catalog.person.dto.PersonDetailResponse;
import com.catalog.person.dto.PersonResponse;
import com.catalog.storage.PhotoUrlResolver;
import com.catalog.subject.Subject;
import com.catalog.subject.dto.SubjectRef;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class PersonMapper {

    private final PhotoUrlResolver photoUrlResolver;

    public PersonResponse toResponse(Person p) {
        return new PersonResponse(
                p.getId(),
                p.getFirstName(),
                p.getLastName(),
                p.getMiddleName(),
                fullName(p),
                p.getBirthYear(),
                p.getDeathYear(),
                p.getWorkStartYear(),
                p.getWorkEndYear(),
                photoUrlResolver.resolve(p.getPhotoKey()),
                p.isVerified(),
                subjectRefs(p));
    }

    public PersonDetailResponse toDetail(Person p) {
        return new PersonDetailResponse(
                p.getId(),
                p.getFirstName(),
                p.getLastName(),
                p.getMiddleName(),
                fullName(p),
                p.getBirthYear(),
                p.getDeathYear(),
                p.getWorkStartYear(),
                p.getWorkEndYear(),
                photoUrlResolver.resolve(p.getPhotoKey()),
                p.getDescription(),
                p.isVerified(),
                subjectRefs(p),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    private String fullName(Person p) {
        return Stream.of(p.getLastName(), p.getFirstName(), p.getMiddleName())
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .collect(Collectors.joining(" "));
    }

    private List<SubjectRef> subjectRefs(Person p) {
        return p.getSubjects().stream()
                .sorted(Comparator.comparing(Subject::getName))
                .map(s -> new SubjectRef(s.getId(), s.getName(), s.getSlug()))
                .toList();
    }
}
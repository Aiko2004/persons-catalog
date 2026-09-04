package com.catalog.person.dto;

import com.catalog.subject.dto.SubjectRef;

import java.util.List;
import java.util.UUID;

public record PersonResponse(
        UUID id,
        String firstName,
        String lastName,
        String middleName,
        String fullName,
        Integer birthYear,
        Integer deathYear,
        Integer workStartYear,
        Integer workEndYear,
        String photoUrl,
        boolean verified,
        List<SubjectRef> subjects
) {}
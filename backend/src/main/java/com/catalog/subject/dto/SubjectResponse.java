package com.catalog.subject.dto;

import java.util.UUID;

public record SubjectResponse(
        UUID id,
        String name,
        String slug,
        String description,
        long personCount
) {}
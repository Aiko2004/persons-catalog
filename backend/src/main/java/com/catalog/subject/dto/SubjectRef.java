package com.catalog.subject.dto;

import java.util.UUID;

public record SubjectRef(UUID id, String name, String slug) {}
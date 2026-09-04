package com.catalog.subject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubjectRequest(

        @NotBlank(message = "Название обязательно")
        @Size(max = 150)
        String name,

        @Size(max = 150)
        String slug,

        String description
) {}
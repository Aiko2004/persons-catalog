package com.catalog.person.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.catalog.person.validation.ValidYears;

import java.util.Set;
import java.util.UUID;

@ValidYears
public record PersonRequest(

        @NotBlank(message = "Имя обязательно")
        @Size(max = 100)
        String firstName,

        @NotBlank(message = "Фамилия обязательна")
        @Size(max = 100)
        String lastName,

        @Size(max = 100)
        String middleName,

        Integer birthYear,
        Integer deathYear,
        Integer workStartYear,
        Integer workEndYear,

        String description,
        Boolean verified,

        Set<UUID> subjectIds
) {}
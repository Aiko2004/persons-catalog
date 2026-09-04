package com.catalog.person.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BulkImportRequest(

        @NotEmpty(message = "Список пуст")
        @Size(max = 500, message = "Не более 500 записей за раз")
        @Valid
        List<PersonRequest> persons
) {}
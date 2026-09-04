package com.catalog.person.dto;

import java.util.List;
import java.util.UUID;

public record BulkImportResponse(
        int created,
        List<UUID> ids
) {}
package com.catalog.person;

import jakarta.validation.Valid;
import com.catalog.common.PageResponse;
import com.catalog.person.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService service;

    @GetMapping
    public PageResponse<PersonResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<UUID> subject,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastName") String sort,
            @RequestParam(defaultValue = "asc") String direction) {

        return service.search(search, subject, verified, page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public PersonDetailResponse get(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PersonDetailResponse create(@Valid @RequestBody PersonRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PersonDetailResponse update(@PathVariable UUID id,
                                       @Valid @RequestBody PersonRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
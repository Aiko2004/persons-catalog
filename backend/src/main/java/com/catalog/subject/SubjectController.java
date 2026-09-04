package com.catalog.subject;

import com.catalog.subject.dto.SubjectRequest;
import com.catalog.subject.dto.SubjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {
    private final SubjectService service;

    @GetMapping
    public List<SubjectResponse> list() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubjectResponse create(@Valid @RequestBody SubjectRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public SubjectResponse update(@PathVariable UUID id,
                                  @Valid @RequestBody SubjectRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @RequestParam(defaultValue = "false") boolean force) {
        service.delete(id, force);
    }
}

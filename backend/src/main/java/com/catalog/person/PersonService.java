package com.catalog.person;

import com.catalog.common.NotFoundException;
import com.catalog.common.PageResponse;
import com.catalog.person.dto.*;
import com.catalog.storage.PhotoStorage;
import com.catalog.subject.Subject;
import com.catalog.subject.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonService {

    private final PersonRepository personRepository;
    private final SubjectRepository subjectRepository;
    private final PersonMapper mapper;
    private final PhotoStorage photoStorage;

    public PageResponse<PersonResponse> search(String query,
                                               Collection<UUID> subjectIds,
                                               Boolean verified,
                                               int page, int size,
                                               String sort, String direction) {

        Specification<Person> spec = Specification.allOf(
                PersonSpecifications.search(query),
                PersonSpecifications.hasAnySubject(subjectIds),
                PersonSpecifications.verified(verified));

        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                PersonSort.of(sort, direction));

        Page<Person> result = personRepository.findAll(spec, pageable);

        List<PersonResponse> content = result.getContent().stream()
                .map(mapper::toResponse)
                .toList();

        return PageResponse.of(result, content);
    }

    public PersonDetailResponse findById(UUID id) {
        return mapper.toDetail(getOrThrow(id));
    }

    @Transactional
    public PersonDetailResponse create(PersonRequest request) {
        Person person = new Person();
        apply(person, request);
        return mapper.toDetail(personRepository.save(person));
    }

    @Transactional
    public PersonDetailResponse update(UUID id, PersonRequest request) {
        Person person = getOrThrow(id);
        apply(person, request);
        return mapper.toDetail(person);
    }

    @Transactional
    public void delete(UUID id) {
        Person person = getOrThrow(id);
        personRepository.delete(person);
        this.deletePhoto(person.getId());
    }

    @Transactional
    public PersonDetailResponse uploadPhoto(UUID id, MultipartFile file) {
        Person person = getOrThrow(id);
        String oldKey = person.getPhotoKey();

        String newKey = photoStorage.store(file, id.toString());
        person.setPhotoKey(newKey);

        if (oldKey != null) {
            photoStorage.delete(oldKey);
        }
        return mapper.toDetail(person);
    }

    @Transactional
    public void deletePhoto(UUID id) {
        Person person = getOrThrow(id);
        String key = person.getPhotoKey();
        person.setPhotoKey(null);
        photoStorage.delete(key);
    }

    private void apply(Person person, PersonRequest r) {
        person.setFirstName(r.firstName().trim());
        person.setLastName(r.lastName().trim());
        person.setMiddleName(trimToNull(r.middleName()));
        person.setBirthYear(r.birthYear());
        person.setDeathYear(r.deathYear());
        person.setWorkStartYear(r.workStartYear());
        person.setWorkEndYear(r.workEndYear());
        person.setDescription(trimToNull(r.description()));

        if (r.verified() != null) {
            person.setVerified(r.verified());
        }

        person.replaceSubjects(resolveSubjects(r.subjectIds()));
    }

    private Set<Subject> resolveSubjects(Set<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        List<Subject> found = subjectRepository.findAllByIdIn(ids);
        if (found.size() != ids.size()) {
            Set<UUID> foundIds = found.stream().map(Subject::getId).collect(java.util.stream.Collectors.toSet());
            Set<UUID> missing = new HashSet<>(ids);
            missing.removeAll(foundIds);
            throw new NotFoundException("Предмет не найден: " + missing);
        }
        return new LinkedHashSet<>(found);
    }

    private Person getOrThrow(UUID id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Учитель не найден: " + id));
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
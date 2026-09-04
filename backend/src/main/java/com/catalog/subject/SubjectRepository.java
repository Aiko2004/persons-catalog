package com.catalog.subject;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findBySlug(String slug);

    List<Subject> findAllByIdIn(Collection<UUID> ids);

    boolean existsByNameIgnoreCase(String name);

    @Query(value = "select subject_id, count(*) from person_subjects group by subject_id",
            nativeQuery = true)
    List<Object[]> countPersonsBySubject();
}
package com.catalog.subject;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    Optional<Subject> findBySlug(String slug);

    List<Subject> findAllByIdIn(Collection<UUID> ids);

    boolean existsByNameIgnoreCase(String name);

    @Query(value = "select subject_id, count(*) from person_subjects group by subject_id",
            nativeQuery = true)
    List<Object[]> countPersonsBySubject();

    @Query(value = "select count(*) from person_subjects where subject_id = :id",
            nativeQuery = true)
    long countPersons(@Param("id") UUID id);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
    boolean existsBySlugAndIdNot(String slug, UUID id);

    @Modifying
    @Query(value = "delete from person_subjects where subject_id = :id", nativeQuery = true)
    void detachFromPersons(@Param("id") UUID id);

    boolean existsBySlug(String slug);
}
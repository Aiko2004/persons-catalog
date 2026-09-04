package com.catalog.person;

import jakarta.persistence.criteria.*;
import com.catalog.subject.Subject;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.UUID;

public final class PersonSpecifications {

    private PersonSpecifications() {}

    public static Specification<Person> search(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        String pattern = "%" + query.trim().toLowerCase() + "%";

        return (root, cq, cb) -> {
            Expression<String> fullName = cb.lower(cb.concat(cb.concat(cb.concat(cb.concat(
                                    root.get("lastName"), " "),
                            root.get("firstName")), " "),
                    cb.coalesce(root.get("middleName"), "")));

            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(cb.coalesce(root.get("middleName"), "")), pattern),
                    cb.like(fullName, pattern));
        };
    }

    public static Specification<Person> hasAnySubject(Collection<UUID> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return null;
        }
        return (root, cq, cb) -> {
            if (Long.class != cq.getResultType() && cq.getResultType() != long.class) {
                root.fetch("subjects", JoinType.LEFT);
            }
            cq.distinct(true);
            Join<Person, Subject> join = root.join("subjects", JoinType.INNER);
            return join.get("id").in(subjectIds);
        };
    }

    public static Specification<Person> verified(Boolean verified) {
        if (verified == null) {
            return null;
        }
        return (root, cq, cb) -> cb.equal(root.get("verified"), verified);
    }
}
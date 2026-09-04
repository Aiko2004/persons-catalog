package com.catalog.person;

import org.springframework.data.domain.Sort;

import java.util.Map;

public final class PersonSort {

    private static final Map<String, String[]> ALLOWED = Map.of(
            "lastName",       new String[]{"lastName", "firstName", "middleName"},
            "firstName",      new String[]{"firstName", "lastName"},
            "birthYear",      new String[]{"birthYear"},
            "deathYear",      new String[]{"deathYear"},
            "workStartYear",  new String[]{"workStartYear"},
            "workEndYear",    new String[]{"workEndYear"},
            "createdAt",      new String[]{"createdAt"}
    );

    private PersonSort() {}

    public static Sort of(String sort, String direction) {
        String[] fields = ALLOWED.getOrDefault(sort, ALLOWED.get("lastName"));
        Sort.Direction dir = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort result = Sort.unsorted();
        for (String field : fields) {
            Sort.Order order = new Sort.Order(dir, field).nullsLast();
            result = result.and(Sort.by(order));
        }
        return result;
    }
}
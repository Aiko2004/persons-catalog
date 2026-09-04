package com.catalog.person.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import com.catalog.person.dto.PersonRequest;

import java.time.Year;

public class ValidYearsValidator implements ConstraintValidator<ValidYears, PersonRequest> {

    private static final int MIN_YEAR = 1900;

    @Override
    public boolean isValid(PersonRequest r, ConstraintValidatorContext ctx) {
        if (r == null) {
            return true;
        }

        int currentYear = Year.now().getValue();
        boolean valid = true;
        ctx.disableDefaultConstraintViolation();

        valid &= checkRange(r.birthYear(), "birthYear", currentYear, ctx);
        valid &= checkRange(r.deathYear(), "deathYear", currentYear, ctx);
        valid &= checkRange(r.workStartYear(), "workStartYear", currentYear, ctx);
        valid &= checkRange(r.workEndYear(), "workEndYear", currentYear, ctx);

        if (r.birthYear() != null && r.deathYear() != null
                && r.deathYear() < r.birthYear()) {
            reject(ctx, "deathYear", "Год смерти не может быть раньше года рождения");
            valid = false;
        }

        if (r.workStartYear() != null && r.workEndYear() != null
                && r.workEndYear() < r.workStartYear()) {
            reject(ctx, "workEndYear", "Год окончания работы не может быть раньше года начала");
            valid = false;
        }

        if (r.birthYear() != null && r.workStartYear() != null
                && r.workStartYear() < r.birthYear()) {
            reject(ctx, "workStartYear", "Год начала работы не может быть раньше года рождения");
            valid = false;
        }

        return valid;
    }

    private boolean checkRange(Integer year, String field, int currentYear,
                               ConstraintValidatorContext ctx) {
        if (year == null) {
            return true;
        }
        if (year < MIN_YEAR || year > currentYear) {
            reject(ctx, field, "Год должен быть между " + MIN_YEAR + " и " + currentYear);
            return false;
        }
        return true;
    }

    private void reject(ConstraintValidatorContext ctx, String field, String message) {
        ctx.buildConstraintViolationWithTemplate(message)
                .addPropertyNode(field)
                .addConstraintViolation();
    }
}
package com.catalog.person.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidYearsValidator.class)
@Target({ElementType.TYPE, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidYears {

    String message() default "Некорректные годы";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
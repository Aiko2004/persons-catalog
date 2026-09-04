package com.catalog.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PhotoUrlResolver {

    private final String baseUrl;

    public PhotoUrlResolver(@Value("${app.storage.base-url:}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String resolve(String photoKey) {
        if (photoKey == null || photoKey.isBlank()) {
            return null;
        }
        return baseUrl.isBlank() ? photoKey : baseUrl + "/" + photoKey;
    }
}
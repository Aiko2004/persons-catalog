package com.catalog.storage;

import org.springframework.web.multipart.MultipartFile;

public interface PhotoStorage {
    String store(MultipartFile file, String personId);
    void delete(String key);
}

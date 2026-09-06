package com.catalog.storage;
import com.catalog.common.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Set;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "supabase")
public class SupabasePhotoStorage implements PhotoStorage {

    private static final Logger log = LoggerFactory.getLogger(SupabasePhotoStorage.class);
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_SIZE = 5 * 1024 * 1024;
    private static final int MAX_WIDTH = 600;
    private static final int MAX_HEIGHT = 800;

    private final S3Client s3;
    private final String bucket;

    public SupabasePhotoStorage(
            @Value("${app.storage.s3.endpoint}") String endpoint,
            @Value("${app.storage.s3.region}") String region,
            @Value("${app.storage.s3.access-key}") String accessKey,
            @Value("${app.storage.s3.secret-key}") String secretKey,
            @Value("${app.storage.s3.bucket}") String bucket) {

        this.bucket = bucket;
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .forcePathStyle(true)
                .build();
    }

    @Override
    public String store(MultipartFile file, String personId) {
        validate(file);

        String key = "persons/" + personId + "/" + UUID.randomUUID() + ".jpg";
        byte[] optimized = optimize(file);

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType("image/jpeg")
                        .build(),
                RequestBody.fromBytes(optimized));

        return key;
    }

    @Override
    public void delete(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        try {
            log.info("Deleting from S3: bucket={}, key={}", bucket, key);
            s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            log.info("S3 delete OK: {}", key);
        } catch (Exception e) {
            log.warn("S3 delete failed for key '{}': {} — {}", key, e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private byte[] optimize(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            BufferedImage original = ImageIO.read(in);
            if (original == null) {
                throw new BadRequestException("Файл не является изображением");
            }

            BufferedImage resized = resize(original);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(resized, "jpg", out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new IllegalStateException("Не удалось обработать изображение", e);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Файл не выбран");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("Файл больше 5 МБ");
        }
        if (!ALLOWED.contains(file.getContentType())) {
            throw new BadRequestException("Допустимы только JPG, PNG и WebP");
        }
    }

    private BufferedImage resize(BufferedImage src) {
        int w = src.getWidth();
        int h = src.getHeight();

        if (w <= MAX_WIDTH && h <= MAX_HEIGHT) {
            return toRgb(src);
        }

        double scale = Math.min((double) MAX_WIDTH / w, (double) MAX_HEIGHT / h);
        int newW = (int) Math.round(w * scale);
        int newH = (int) Math.round(h * scale);

        BufferedImage result = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        var g = result.createGraphics();
        g.drawImage(src.getScaledInstance(newW, newH, java.awt.Image.SCALE_SMOOTH), 0, 0, null);
        g.dispose();
        return result;
    }

    private BufferedImage toRgb(BufferedImage src) {
        if (src.getType() == BufferedImage.TYPE_INT_RGB) {
            return src;
        }
        BufferedImage rgb = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
        var g = rgb.createGraphics();
        g.drawImage(src, 0, 0, java.awt.Color.WHITE, null);
        g.dispose();
        return rgb;
    }
}
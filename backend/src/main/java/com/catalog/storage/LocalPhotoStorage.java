package com.catalog.storage;

import com.catalog.common.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalPhotoStorage implements PhotoStorage {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/jpg", "image/webp");
    private static final long MAX_SIZE = 5 * 1024 * 1024;
    private static final int MAX_WIDTH = 600;
    private static final int MAX_HEIGHT = 800;

    private final Path root;

    public LocalPhotoStorage(@Value("${app.storage.path:./uploads}") String path) throws IOException {
        this.root = Paths.get(path).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @Override
    public String store(MultipartFile file, String personId) {
        validate(file);

        String key = "persons/" + personId + "/" + UUID.randomUUID() + ".jpg";
        Path target = root.resolve(key).normalize();

        if (!target.startsWith(root)) {
            throw new BadRequestException("Некорректный путь файла");
        }

        try (InputStream in = file.getInputStream()) {
            BufferedImage original = ImageIO.read(in);
            if (original == null) {
                throw new BadRequestException("Файл не является изображением");
            }

            BufferedImage resized = resize(original);
            Files.createDirectories(target.getParent());
            ImageIO.write(resized, "jpg", target.toFile());

            return key;
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось сохранить файл", e);
        }
    }

    @Override
    public void delete(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        try {
            Path target = root.resolve(key).normalize();
            if (target.startsWith(root)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException e) {
            // файл мог быть удалён раньше — не критично
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

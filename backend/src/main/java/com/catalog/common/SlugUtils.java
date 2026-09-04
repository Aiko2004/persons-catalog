package com.catalog.common;

import java.util.Map;

public final class SlugUtils {

    private static final Map<Character, String> TRANSLIT = Map.ofEntries(
            Map.entry('а', "a"), Map.entry('ә', "a"), Map.entry('б', "b"),
            Map.entry('в', "v"), Map.entry('г', "g"), Map.entry('ғ', "g"),
            Map.entry('д', "d"), Map.entry('е', "e"), Map.entry('ж', "zh"),
            Map.entry('з', "z"), Map.entry('и', "i"), Map.entry('й', "i"),
            Map.entry('к', "k"), Map.entry('қ', "q"), Map.entry('л', "l"),
            Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('ң', "n"),
            Map.entry('о', "o"), Map.entry('ө', "o"), Map.entry('п', "p"),
            Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"),
            Map.entry('у', "u"), Map.entry('ұ', "u"), Map.entry('ү', "u"),
            Map.entry('ф', "f"), Map.entry('х', "h"), Map.entry('һ', "h"),
            Map.entry('ц', "c"), Map.entry('ч', "ch"), Map.entry('ш', "sh"),
            Map.entry('щ', "sch"), Map.entry('ы', "y"), Map.entry('і', "i"),
            Map.entry('э', "e"), Map.entry('ю', "yu"), Map.entry('я', "ya"),
            Map.entry('ъ', ""), Map.entry('ь', "")
    );

    private SlugUtils() {}

    public static String from(String text) {
        String lower = text.trim().toLowerCase();
        StringBuilder sb = new StringBuilder();

        for (char c : lower.toCharArray()) {
            String replacement = TRANSLIT.get(c);
            if (replacement != null) {
                sb.append(replacement);
            } else if (Character.isLetterOrDigit(c)) {
                sb.append(c);
            } else {
                sb.append('-');
            }
        }

        return sb.toString()
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
    }
}
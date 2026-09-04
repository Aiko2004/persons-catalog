CREATE TABLE subjects (
                          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          name        VARCHAR(150) NOT NULL,
                          slug        VARCHAR(150) NOT NULL,
                          description TEXT,
                          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                          CONSTRAINT uq_subjects_name UNIQUE (name),
                          CONSTRAINT uq_subjects_slug UNIQUE (slug)
);

CREATE TABLE persons (
                         id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         first_name       VARCHAR(100) NOT NULL,
                         last_name        VARCHAR(100) NOT NULL,
                         middle_name      VARCHAR(100),
                         birth_year       INTEGER,
                         death_year       INTEGER,
                         work_start_year  INTEGER,
                         work_end_year    INTEGER,
                         photo_key        TEXT,
                         description      TEXT,
                         verified         BOOLEAN NOT NULL DEFAULT false,
                         created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
                         updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

                         CONSTRAINT chk_birth_year CHECK (birth_year IS NULL OR birth_year BETWEEN 1900 AND EXTRACT(YEAR FROM now())),
                         CONSTRAINT chk_death_year CHECK (death_year IS NULL OR death_year BETWEEN 1900 AND EXTRACT(YEAR FROM now())),
                         CONSTRAINT chk_work_start  CHECK (work_start_year IS NULL OR work_start_year BETWEEN 1900 AND EXTRACT(YEAR FROM now())),
                         CONSTRAINT chk_work_end    CHECK (work_end_year IS NULL OR work_end_year BETWEEN 1900 AND EXTRACT(YEAR FROM now())),
                         CONSTRAINT chk_years_order CHECK (birth_year IS NULL OR death_year IS NULL OR death_year >= birth_year),
                         CONSTRAINT chk_work_order  CHECK (work_start_year IS NULL OR work_end_year IS NULL OR work_end_year >= work_start_year)
);

CREATE TABLE person_subjects (
                                 person_id  UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
                                 subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
                                 PRIMARY KEY (person_id, subject_id)
);

CREATE INDEX idx_person_subjects_subject ON person_subjects(subject_id);
CREATE INDEX idx_persons_sort_name ON persons(last_name, first_name, middle_name);
CREATE INDEX idx_persons_work_start ON persons(work_start_year);
CREATE INDEX idx_persons_verified ON persons(verified) WHERE verified = false;
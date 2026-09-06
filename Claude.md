# Мұғалімдер каталогы

Мектеп мұғалімдерінің архиві. Мектеп ~80-100 жыл жұмыс істеп келеді,
каталогта бұрын жұмыс істеген мұғалімдер туралы мәлімет сақталады.

## Стек

- Backend: Java 21, Spring Boot 4.1.1, Spring Data JPA, PostgreSQL 16, Flyway
- Frontend: Angular (standalone components), TypeScript, RxJS
- Backend: http://localhost:8080, frontend dev: http://localhost:4200
- PostgreSQL: localhost:5433 (Docker)

## Тіл / Язык

**Интерфейс тілі — тек қазақша.** Барлық жазулар, батырмалар, қателік
хабарламалары, placeholder мәтіндері — қазақ тілінде. Ағылшын немесе орыс
мәтінін интерфейске жазуға болмайды.

Код ішінде (айнымалы аттары, компонент аттары, коммит хабарламалары) —
ағылшынша, әдеттегідей.

Локаль: `kk-KZ`. Күн форматы: `dd.MM.yyyy`.

## Домен

- **Person** — мұғалім. Міндетті өрістер: аты (firstName), тегі (lastName).
  Қалғаны бос болуы мүмкін.
- **Subject** — пән (математика, тарих, қазақ тілі...). Директор мен оқу
  ісінің меңгерушісі де сол анықтамалықта.
- Person ↔ Subject: many-to-many. Бір мұғалім бірнеше пән бере алады.

## Отображение ережелері

**ФИО реті:** тегі → аты → әкесінің аты. Мысалы: «Сейітова Гүлнара Серікқызы».
Backend дайын `fullName` жібереді — оны қолдану керек, өзің жинама.

**Жұмыс жылдары** (workStartYear / workEndYear):
- екеуі де бар: `1978 — 2003`
- тек басы: `1985 — қазірге дейін`
- тек соңы: `— 2003`
- екеуі де жоқ: көрсетпеу

**Өмір жылдары** (birthYear / deathYear) — сол логика.

**Бос өрістер** «NULL», «Не указано», «—» деп көрсетілмейді. Өріс жоқ болса,
ол жай ғана көрсетілмейді. Тек аты-жөні толтырылған карточка да ұқыпты
көрінуі керек.

**Фото жоқ болса** — placeholder (мұғалім силуэті немесе аты-жөнінің бас
әріптері).

## API контракт

Base URL: `/api`

### Persons

GET /api/persons
params: search, subject (бірнеше рет қайталануы мүмкін), verified,
page (0-ден), size (default 20), sort, direction (asc|desc)
sort мәндері: lastName, firstName, birthYear, deathYear,
workStartYear, workEndYear, createdAt
→ { content: PersonResponse[], page, size, totalElements, totalPages }

GET    /api/persons/{id}        → PersonDetailResponse
POST   /api/persons             → 201, PersonDetailResponse
PUT    /api/persons/{id}        → PersonDetailResponse
DELETE /api/persons/{id}        → 204
POST   /api/persons/bulk        → 201, { created, ids }
POST   /api/persons/{id}/photo  → multipart, өріс аты «file»
DELETE /api/persons/{id}/photo  → 204

### Subjects

GET    /api/subjects            → SubjectResponse[] (пагинация жоқ)
POST   /api/subjects            → 201
PUT    /api/subjects/{id}
DELETE /api/subjects/{id}?force=true|false

Пәнді өшіргенде, оған мұғалімдер байланысты болса — 409 қайтады.
Хабарламада мұғалімдер саны көрсетіледі. Растағаннан кейін `force=true`.

### Типтер

PersonResponse: id, firstName, lastName, middleName, fullName,
birthYear, deathYear, workStartYear, workEndYear,
photoUrl, verified, subjects: SubjectRef[]

PersonDetailResponse: PersonResponse + description, createdAt, updatedAt

PersonRequest: firstName*, lastName*, middleName, birthYear, deathYear,
workStartYear, workEndYear, description, verified, subjectIds: UUID[]
(photoUrl жоқ — фото бөлек эндпоинт арқылы жүктеледі)

SubjectResponse: id, name, slug, description, personCount
SubjectRef: id, name, slug

### Қателіктер

Барлық қателік бірдей форматта:
{ timestamp, status, error, message, fields: [{ field, message }] }

400 — валидация (fields толтырылады, өріс аты бойынша форманы белгілеу керек)
404 — табылмады
409 — конфликт (дубль, байланысы бар пәнді өшіру)

## Маршруттар

/                    — каталог (іздеу, фильтр, сорттау, пагинация)
/persons/:id         — мұғалім беті
/persons/new         — қосу
/persons/:id/edit    — өңдеу
/subjects            — пәндер анықтамалығы

## Күйлер (UI states)

Әр тізім үшін төртеуі де қажет:
- Loading: «Жүктелуде...»
- Empty: «Мұғалімдер әзірге жоқ.»
- Search empty: «Сұрауыңыз бойынша ешнәрсе табылмады.»
- Error: «Деректерді жүктеу мүмкін болмады.» + «Қайталау» батырмасы

Сақтағаннан кейін: «Мұғалім сәтті сақталды.»

Өшіру — әрқашан растаумен:
«Мұғалімді өшіру керек пе? / [аты-жөні] / Бұл әрекетті қайтару мүмкін емес.»
[Болдырмау] [Өшіру]

## Техникалық талаптар

- Standalone компоненттер, NgModule қолданбау
- Responsive: мобильді, планшет, десктоп
- Іздеу мен фильтрлер URL query params-та сақталуы керек
  (беттi жаңартқанда күй жоғалмауы үшін)
- CORS: dev режимде proxy.conf.json арқылы (`/api` → localhost:8080)
- localStorage/sessionStorage — қолдануға болады (артефакт емес, нақты қосымша)

## Жоспар

Бір-бірден, әр қадамнан кейін тексеріп, коммит жасау:

1. Angular жобасын құру, proxy.conf, API сервистері мен типтер
2. Каталог беті — карточкалар, іздеу, фильтр, сорттау, пагинация
3. Мұғалім беті
4. Қосу/өңдеу формасы (валидациямен)
5. Фото жүктеу
6. Пәндер анықтамалығы

Бір рет бәрін генерациялаудың қажеті жоқ. Бір вертикаль — бір коммит.

## Деплой (Render)

Бэкенд деплоится на Render через Docker (backend/Dockerfile).
Render автоматически выставляет `PORT`; приложение читает его через `${PORT:-8080}` в CMD.

### Переменные окружения — точные имена

| Переменная              | Обязательная | Дефолт (локально)                  | Описание                                     |
|-------------------------|:---:|------------------------------------|----------------------------------------------|
| `DATABASE_URL`          | ✓   | `jdbc:postgresql://localhost:5433/persons` | JDBC URL, для Supabase добавить `?sslmode=require` |
| `DATABASE_USERNAME`     | ✓   | `persons`                          | Для Supabase Session pooler: `postgres.<ref>` |
| `DATABASE_PASSWORD`     | ✓   | `persons`                          | Пароль БД                                    |
| `APP_STORAGE_TYPE`      | ✓   | `local`                            | `supabase` на проде                          |
| `APP_STORAGE_BASE_URL`  | ✓   | `http://localhost:8080/uploads`    | Публичный URL bucket: `https://<ref>.supabase.co/storage/v1/object/public/photos` |
| `SUPABASE_S3_ENDPOINT`  | ✓*  | —                                  | `https://<ref>.storage.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_REGION`    |     | `auto`                             | Регион проекта, напр. `eu-central-1`        |
| `SUPABASE_S3_ACCESS_KEY`| ✓*  | —                                  | S3 Access Key из Supabase Storage            |
| `SUPABASE_S3_SECRET_KEY`| ✓*  | —                                  | S3 Secret Key                                |
| `SUPABASE_S3_BUCKET`    |     | `photos`                           | Имя bucket                                   |
| `APP_CORS_ALLOWED_ORIGINS` |  | `http://localhost:4200`            | URL фронтенда, через запятую если несколько  |

*Обязательны только при `APP_STORAGE_TYPE=supabase`.

### Supabase: подключение к БД
- Использовать **Session pooler**, порт **5432** (не Transaction pooler на 6543).
- Host: `aws-0-<region>.pooler.supabase.com`
- Username: `postgres.<project-ref>`

## Деплой (Vercel) — фронтенд

Фронтенд деплоится на Vercel из директории `frontend/`.

### Настройка Vercel

`vercel.json` уже содержит:
- `buildCommand`: `node scripts/set-env.js && ng build --configuration=production`
- `outputDirectory`: `dist/frontend/browser`
- `rewrites`: все пути → `index.html` (Angular router)

### Переменные окружения

| Переменная | Обязательная | Описание |
|------------|:---:|----------|
| `API_URL`  | ✓   | Полный URL бэкенда на Render, напр. `https://persons-catalog.onrender.com` |

**Как работает**: перед сборкой `scripts/set-env.js` записывает `API_URL` в `src/environments/environment.prod.ts`. Angular в production-конфиге подключает этот файл вместо `environment.ts`.

### Локальная разработка

`environment.ts` → `apiUrl: ''` → запросы идут через `proxy.conf.json` → `localhost:8080`.
Файл `environment.prod.ts` в разработке не используется.

## Ескертулер

- Backend `photoUrl` дайын күйінде жібереді, фронт storage туралы білмейді
- `verified` — мәліметтің тексерілгенін білдіреді (сканерден кейін анасы
  тексереді). Формада checkbox, карточкада белгі.
- Деректер қазақша, соның ішінде іздеу де. Іздеу регистрге тәуелсіз.
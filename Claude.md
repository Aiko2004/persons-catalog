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

## Ескертулер

- Backend `photoUrl` дайын күйінде жібереді, фронт storage туралы білмейді
- `verified` — мәліметтің тексерілгенін білдіреді (сканерден кейін анасы
  тексереді). Формада checkbox, карточкада белгі.
- Деректер қазақша, соның ішінде іздеу де. Іздеу регистрге тәуелсіз.
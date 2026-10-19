# Ithraa B2C — Backend Agent Instructions

## Scope and project context

These instructions apply to `backend/`. Read them together with the Laravel Boost guidelines below. This project-specific workflow complements the generated framework guidance; keep it outside the Boost block when updating that guidance.

- Backend: Laravel API, PHP, Eloquent, MySQL, and PHPUnit. Confirm installed versions in `composer.lock` / `composer show` before using version-specific APIs.
- Frontend: a separate React application in `../frontend/`. Return JSON; do not introduce Blade pages or Inertia for application features.
- Use the existing Laravel directories and conventions. Inspect related controllers, models, routes, tests, and configuration before changing them.
- Read `../packagesrequirments.md` before implementing domain features. User-approved requirements take precedence; unresolved questions are not approved functionality.
- The system serves the IT staff of a Hajj company. Pilgrims are records, not login accounts. Keep `users` and `pilgrims` independent; do not inherit one from the other.
- Date of birth belongs to pilgrims, not users. Store a birth date rather than a changing age.
- Pilgrims belong to blocks whose members share travel arrangements. Do not add individual booking overrides or block transfers in the current scope.
- Bookings are entered from external sources. Real-time tracking, payments, package management, room allocation, and external integrations must not be inferred from the itinerary scope.
- Do not assume passport numbers are globally unique. Nationality representation and passport issuing-country rules must be resolved before choosing a uniqueness constraint.
- An approved diagram is a design input, not evidence that its migration or endpoint already exists. Inspect the code and database migration history.

## Feature Implementation — Required Workflow

Follow this sequence for each requested backend feature. Scale the work to the feature: a simple CRUD operation does not require every optional architectural component. Implement the authorized scope without repeatedly asking for approval of routine technical choices.

### 1. Establish the behavior and acceptance criteria

- Identify who performs the operation, the inputs, expected results, and domain rules.
- Cover creation, viewing, updating, and deletion only when those operations are requested or necessary for the agreed feature.
- Identify required fields, optional fields, duplicates, missing records, and invalid input.
- Check existing functionality and open requirements before inventing behavior.
- Ask only about unresolved business decisions that materially affect correctness; continue independent work while waiting. Record unresolved product questions in `../packagesrequirments.md` when appropriate.
- Define a small set of observable acceptance criteria that will become tests.

**Output:** a clear description of the feature and its success/failure cases.

### 2. Design the data and API contract

- Review existing tables, relationships, constraints, and migrations. Reuse existing entities where appropriate.
- Decide field types, nullability, defaults, foreign keys, indexes, and uniqueness from confirmed rules. Store passport numbers and similar identifiers as strings to preserve leading zeros.
- Define deletion behavior explicitly for related records. Do not cascade-delete itinerary or identity records without an approved business reason.
- Define the HTTP method, route, request fields, response fields, status codes, and authorization requirement before writing the controller.
- For lists, define pagination and explicitly allowed filters/sorts; cap page size. Use eager loading when related data is returned.
- Follow the existing route convention in `routes/api.php`. Do not add an API version prefix or change existing URLs incidentally.
- Use Laravel's normal JSON validation errors (422), missing-resource responses (404), and authentication/authorization responses (401/403). Use 201 for creation and 204 for deletion when returning no body; follow established project response conventions if present.
- Decide how dates and times are represented. Birth dates are dates without time zones; travel timestamps need an explicit, consistent time-zone contract.

**Output:** an agreed data shape and an API contract the frontend can use.

### 3. Implement database changes and models

- Generate files with Artisan using supported options and `--no-interaction`.
- Add a migration for changes to an existing deployed schema; do not rewrite migration history that other environments may have applied.
- Define database constraints as well as request validation where the rule must hold for all writes.
- Implement Eloquent relationships, casts, and explicit mass-assignment rules. Never pass all request input directly into model creation/update.
- Create useful factories for testing; add synthetic seed data only when needed. Never seed real passport details or private production data.
- Keep migrations narrowly scoped. Review both `up()` and `down()`; describe any data-loss implications of rollback.
- Run migrations against a dedicated test/development database only. Never use `migrate:fresh` or destructive rollback against an existing populated database as a routine setup step.

**Output:** a schema and models that enforce the approved relationships and data rules.

### 4. Implement validation and access control

- Use dedicated Form Request classes for nontrivial create/update validation. Separate create and update rules when they differ.
- Use only validated fields. For partial updates, distinguish omitted values from explicit `null` and keep required data intact.
- Validate referenced records, lengths, dates, enum values, and uniqueness consistently with database constraints.
- Apply authentication middleware and policies/gates using the project's actual authentication setup. Route model binding does not provide authorization.
- If authentication is not implemented yet, identify the prerequisite rather than silently exposing sensitive pilgrim endpoints or introducing an unapproved authentication package.
- Do not accept ownership, privileged flags, or other server-controlled fields from arbitrary client input.

**Output:** invalid or unauthorized requests cannot perform the operation.

### 5. Implement the use case and HTTP endpoint

- Keep controllers focused on receiving validated input, authorizing, invoking the operation, and returning a response.
- Simple CRUD may use Eloquent directly in the controller. Extract an Action or Service only for substantial domain logic, reuse, or coordination of multiple writes; follow existing placement conventions.
- Do not introduce repositories, interfaces, DTO layers, or generic base controllers solely for a simple feature.
- Use a database transaction when multiple writes must succeed or fail together. Use constraints and locking where concurrent requests could break a confirmed business rule.
- Use Eloquent API Resources to explicitly select response fields. Never expose password hashes, tokens, or unrelated sensitive fields by serializing entire models.
- Register only the required routes and inspect their middleware and names.
- Let Laravel handle standard exceptions; do not convert all failures into HTTP 200 or catch and hide unexpected exceptions.
- Do not call external providers inside a database transaction. Introduce queued work only when the feature actually requires background processing and the queue setup exists.

**Output:** a working endpoint with predictable responses and correct side effects.

### 6. Write behavior-focused tests

- Prefer PHPUnit feature tests for HTTP endpoints and database behavior. Use unit tests for isolated domain calculations or rules where useful.
- Use factories and the project's test database/reset conventions. Confirm tests cannot target a development or production database before running destructive test setup.
- Cover the successful path, required/invalid fields, missing records, authentication/authorization when applicable, and important uniqueness or relationship rules.
- Test partial updates and deletion behavior when implemented. Test pagination/filtering and response field exposure when relevant.
- For multi-write operations, verify failure leaves no partial data. Mock external services; tests must not send real bookings, emails, or provider requests.
- Use MySQL verification for MySQL-specific behavior; do not treat an SQLite-only pass as proof of MySQL constraint compatibility.
- Avoid tests that merely repeat implementation details. Assert observable API results and database effects.

**Output:** tests demonstrating the acceptance criteria and meaningful failure cases.

### 7. Verify the implementation and frontend contract

- Run the narrowest relevant tests, for example `php artisan test --compact tests/Feature/ExampleTest.php`. Broaden coverage when shared code changes justify it.
- After PHP edits, run the Pint command specified in the framework guidelines below.
- Inspect affected routes with `php artisan route:list --path=api` and review the final diff for unrelated changes and sensitive data.
- Validate migrations in an isolated database when schema changes are included. Report when MySQL or other required services are unavailable rather than claiming verification.
- Check that frontend request/response expectations match the API contract. Change frontend code only when the requested feature includes integration.
- Update existing setup/API documentation when behavior changes require it; create new documentation only when requested.

**Output:** verified behavior, a reviewed diff, and an accurate statement of any remaining limitations.

### 8. Report completion

- Briefly describe what the user can now do, schema/API changes, tests run and their results, and any required migration or configuration steps.
- Separate completed work from unresolved requirements or unverified infrastructure.
- Do not claim deployment, migration execution, or frontend integration unless actually performed and verified.
- Commit, push, or deploy only when authorized for the current work.

## Typical feature files

Create only the files the feature needs, following existing sibling conventions.

| Area | Typical location | Responsibility |
| --- | --- | --- |
| Schema | `database/migrations/` | Tables, constraints, and indexes |
| Model | `app/Models/` | Relationships, casts, and persistence rules |
| Test data | `database/factories/`, `database/seeders/` | Synthetic test/development records |
| Validation | `app/Http/Requests/` | Create/update input rules |
| Authorization | `app/Policies/` | Permissions for resource operations |
| Controller | `app/Http/Controllers/` | HTTP coordination |
| Response | `app/Http/Resources/` | Explicit JSON fields and collections |
| Routing | `routes/api.php` | Endpoints and middleware |
| Tests | `tests/Feature/`, `tests/Unit/` | Observable behavior and isolated rules |

For a typical CRUD feature, the implementation order is **migration → model/factory → Form Requests and policy → controller/resource/routes → tests → verification**. Define acceptance criteria and the API contract first; write regression tests before fixing an existing bug when practical.

---

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.4. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This project uses PHPUnit. Create tests with `php artisan make:test --phpunit {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/phpunit` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

</laravel-boost-guidelines>

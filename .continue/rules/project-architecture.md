# Doc Dictionary Project Architecture

## Technology

- Next.js App Router
- TypeScript
- Prisma ORM
- Supabase PostgreSQL
- TanStack Query and TanStack Form
- Chrome Extension using Manifest V3
- Tailwind CSS

## Architectural style

The project follows Clean Architecture and Domain-Driven Design.

Main layers:

1. Presentation
   - Next.js pages
   - React components
   - API route handlers
   - Controllers

2. Domain
   - Entities
   - Repository interfaces
   - Use cases
   - Domain parameters and validators

3. Data
   - Prisma repository implementations
   - DTO mappers
   - API clients

4. Infrastructure / Bootstrap
   - Prisma configuration
   - HTTP boundary
   - Endpoint provider
   - Environment configuration

## Request flow

Frontend component
→ feature API function
→ EndpointProvider
→ HttpBoundary
→ Next.js API route
→ controller or use case
→ repository interface
→ Prisma repository
→ Supabase PostgreSQL

Do not bypass these layers unless explicitly requested.

## Domain models

### User

- User is synchronized from Supabase Auth.
- User creation is handled by PrismaAuthUserRepository.syncUser().
- A User has zero or one UserSetting relation.

### UserSetting

- UserSetting is a one-to-one dependent entity of User.
- UserSetting.userId is both its primary key and a foreign key to User.id.
- allowGlobalVocabulary defaults to false.
- Existing setting values must never be reset during login or user synchronization.

### Vocabulary behavior

When allowGlobalVocabulary is true:
- Fetch all vocabularies belonging to the authenticated user.
- Match those vocabulary words against the current document content.

When allowGlobalVocabulary is false:
- Fetch only vocabulary associated with the current docId or matching sourceUrl.

## Coding rules

- Inspect existing repository interfaces and use cases before modifying implementations.
- Do not access Prisma directly from client components.
- Do not put domain business logic inside React components.
- Preserve the existing HTTP response structure.
- Prefer repository and use-case changes over duplicated query logic.
- Use transactions or nested Prisma writes when multiple related records must be created atomically.
- Never reset allowGlobalVocabulary to false for an existing user.
- Follow existing filenames, imports, aliases, and folder conventions.
- Before editing, identify all affected files and explain the proposed data flow.
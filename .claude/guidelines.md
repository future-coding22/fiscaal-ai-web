# Development Guidelines

## Always Do
- Read existing code before modifying
- Follow established patterns in the codebase
- Use components from `src/components/ui/` when available
- Reference `docs/design-system.md` for styling
- Add error handling to all async operations
- Write meaningful commit messages
- Ask before making architectural changes

## Never Do
- Bypass authentication checks
- Remove error handling
- Ignore TypeScript errors
- Skip writing tests
- Use `any` type in TypeScript
- Hardcode values that should be configurable
- Leave TODO comments without creating issues

## Testing Requirements
- Unit tests for utilities and helpers
- Component tests for UI components
- Integration tests for API endpoints
- E2E tests for critical user flows

## Security Checklist
- Validate all user inputs
- Sanitize data before database operations
- Use parameterized queries (no string concatenation)
- Implement proper authentication checks
- Never log sensitive information
- Use environment variables for secrets

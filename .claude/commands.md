# Allowed Commands and Permissions

##  ALLOWED Operations

### Code Modifications
- Create new files in `src/` directory
- Modify existing components
- Add tests in `__tests__/` or `*.test.js` files
- Update documentation in `docs/`
- Modify configuration files (package.json, tailwind.config.js)

### Git Operations
- Create feature branches (naming: `feature/*`, `bugfix/*`, `hotfix/*`)
- Commit changes with descriptive messages
- Push to remote (but NOT to `main` or `production` branches)
- Create pull requests

### GitHub Operations
- Create issues
- Comment on issues and PRs
- Update issue labels
- Link commits to issues

### File Reading
- Read any file in the repository
- Analyze code structure
- Review dependencies

##  FORBIDDEN Operations

### Critical Restrictions
- **NEVER** push directly to `main` or `production` branches
- **NEVER** delete the `.git` directory
- **NEVER** modify `.env` or `.env.production` files
- **NEVER** commit sensitive data (API keys, passwords, tokens)
- **NEVER** force push (`git push -f`)
- **NEVER** delete database migration files
- **NEVER** modify package-lock.json or yarn.lock manually

### Protected Directories
- Do NOT modify files in `/config/production/`
- Do NOT delete files in `/migrations/`
- Do NOT edit `/scripts/deploy.sh` without explicit permission

### External Operations
- Do NOT make external API calls without confirmation
- Do NOT install packages without asking first
- Do NOT modify CI/CD workflows (`.github/workflows/`)

##  REQUIRES CONFIRMATION

These operations need explicit approval before execution:

- Installing new npm packages
- Updating major dependencies
- Modifying database schemas
- Changing authentication logic
- Updating security-related code
- Refactoring core business logic
- Modifying API endpoints
- Changing routing configuration

## Branch Naming Rules

- Feature: `feature/short-description`
- Bug fix: `bugfix/issue-number-description`
- Hotfix: `hotfix/critical-issue`
- Experiment: `experiment/description`

## Commit Message Format
```
type(scope): brief description

- Detailed change 1
- Detailed change 2

Closes #issue-number
```

Types: feat, fix, docs, style, refactor, test, chore

## Code Standards

- Use TypeScript for new files
- Add PropTypes or TypeScript types
- Write tests for new features
- Update documentation when changing APIs
- Follow ESLint rules (no warnings allowed)

## Before Making Changes

1. Read the relevant issue or PR
2. Understand the existing code structure
3. Ask for clarification if requirements are unclear
4. Confirm the approach before large changes

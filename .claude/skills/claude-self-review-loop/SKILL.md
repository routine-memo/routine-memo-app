---
name: claude-self-review-loop
description: Claude's self-review engineering loop that activates when new complex logic is added or the same issue repeats 3+ times. Ensures high-quality code through multi-stage validation without external dependencies.
---

# Claude Self-Review Loop Skill

## Activation Triggers

This skill **automatically activates** when:

### Trigger 1: New Complex Logic Addition
Activate when user requests involve:
- New feature implementation with multiple steps
- Complex business logic (authentication, payment, data processing)
- Security-critical functionality (login, authorization, encryption)
- Performance-sensitive code (database queries, large data processing)
- Architecture changes (refactoring, design pattern implementation)

**Examples that trigger:**
- "로그인 기능 추가해줘"
- "결제 시스템 구현해줘"
- "대용량 데이터 처리 로직 만들어줘"
- "이 코드 리팩토링해줘"

**Examples that DON'T trigger:**
- "변수명 바꿔줘"
- "주석 추가해줘"
- "console.log 제거해줘"

### Trigger 2: Repeated Issue (3+ Times)
Activate when the **same type of issue** occurs 3 or more times in the current session:

**Track these issue types:**
- Same error message appearing 3+ times
- Same test failure 3+ times
- Same linting/type error pattern 3+ times
- Same logic bug pattern 3+ times
- User requesting same type of fix 3+ times

**When triggered:**
```
⚠️ Detected: [Issue X] has occurred 3 times
🔄 Activating Claude Self-Review Loop for root cause analysis...
```

## Core Workflow Philosophy

This skill implements a **single-AI multi-stage review loop**:
- **Stage 1 (Planning)**: Claude creates detailed implementation plan
- **Stage 2 (Self-Validation)**: Claude reviews own plan with critical mindset
- **Stage 3 (Execution)**: Claude implements validated plan
- **Stage 4 (Self-Review)**: Claude reviews own implementation
- **Stage 5 (Iteration)**: Claude fixes issues and re-validates
- **Continuous Tracking**: Monitor for repeated issues

## Issue Tracking System

### Initialize Issue Counter
At the start of each session, maintain an internal counter:
```
Issue Tracker:
- error_patterns: {}
- test_failures: {}
- lint_errors: {}
- user_fix_requests: {}
```

### Track Issues
After every error/failure/fix request:
1. Identify the issue type/pattern
2. Increment counter for that pattern
3. Check if count >= 3
4. If yes, activate Self-Review Loop with focus on root cause

### Example Tracking
```
Session Timeline:
1. TypeError: Cannot read property 'id' of undefined → count: 1
2. TypeError: Cannot read property 'name' of undefined → count: 2
3. TypeError: Cannot read property 'email' of undefined → count: 3
   ⚠️ TRIGGER: Same null-checking issue 3 times
   🔄 Root cause: Missing null validation pattern throughout codebase
```

## Stage 1: Planning Phase

### Step 1.1: Understand Requirements
- Break down user request into specific requirements
- Identify technical constraints and edge cases
- List assumptions that need validation
- Determine complexity level (simple/medium/complex)

### Step 1.2: Create Implementation Plan
Generate structured plan with:
```markdown
## Implementation Plan

### Overview
[What we're building and why]

### Architecture Decisions
- [Key design choices]
- [Patterns to use]
- [Technologies/libraries]

### Step-by-Step Implementation
1. [First step with details]
2. [Second step with details]
...

### Edge Cases & Error Handling
- [Edge case 1]: [How to handle]
- [Edge case 2]: [How to handle]

### Security Considerations
- [Security concern 1]: [Mitigation]
- [Security concern 2]: [Mitigation]

### Testing Strategy
- [What to test]
- [How to test]
```

### Step 1.3: Present Plan to User
Show the plan and ask for approval:
```
📋 Implementation Plan Created

[Display plan]

Proceeding to self-validation stage...
```

## Stage 2: Self-Validation Phase

### Step 2.1: Critical Review of Own Plan
Act as a **critic** and review the plan for:

**Logic Validation:**
- Are there any logical flaws?
- Do the steps make sense in sequence?
- Are there circular dependencies?
- Will this actually solve the problem?

**Edge Cases:**
- What happens if input is null/undefined?
- What if the operation fails midway?
- How does it handle concurrent requests?
- What about boundary conditions?

**Security Audit:**
- SQL Injection vulnerabilities?
- XSS attack vectors?
- Authentication/Authorization gaps?
- Sensitive data exposure?
- Input validation missing?

**Performance Analysis:**
- N+1 query problems?
- Unnecessary loops or operations?
- Memory leak potential?
- Blocking operations in async code?

**Best Practices Check:**
- Following language/framework conventions?
- Code maintainability?
- Testability?
- SOLID principles?

### Step 2.2: Document Findings
```markdown
## Self-Review Findings

### ✅ Strengths
- [What's good about the plan]

### ⚠️ Issues Found
1. **[Issue Type]**: [Description]
   - Impact: [Low/Medium/High]
   - Solution: [How to fix]

2. **[Issue Type]**: [Description]
   - Impact: [Low/Medium/High]
   - Solution: [How to fix]

### 🔄 Revised Plan
[Updated plan addressing all issues]
```

### Step 2.3: Decide Next Action
- If **critical issues found**: Revise plan and repeat Stage 2
- If **minor issues found**: Note fixes and proceed to Stage 3
- If **no issues found**: Proceed to Stage 3

## Stage 3: Execution Phase

### Step 3.1: Implement Code
Using validated plan, implement code with:
- Clean, readable code structure
- Proper error handling
- Input validation
- Security best practices
- Performance optimization
- Comprehensive comments for complex logic

### Step 3.2: Track Progress
For multi-step implementations, use TodoWrite:
```
1. ✅ Database schema created
2. ✅ API endpoint implemented
3. 🔄 Authentication logic (in progress)
4. ⏳ Tests (pending)
```

### Step 3.3: Document Implementation
After each file modification:
```markdown
## Implementation Summary

### Files Modified
- [file:line] - [What changed and why]

### Key Decisions
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]
```

## Stage 4: Self-Review Phase

### Step 4.1: Read Implemented Code
Use Read tool to review all modified files:
```
Reviewing implementation:
- [file1] (read and analyze)
- [file2] (read and analyze)
```

### Step 4.2: Code Quality Analysis
Check for:

**Bugs:**
- Off-by-one errors?
- Null pointer exceptions?
- Race conditions?
- Resource leaks?
- Incorrect logic?

**Security:**
- All inputs validated?
- Sensitive data protected?
- Authentication/authorization working?
- No injection vulnerabilities?

**Performance:**
- Efficient algorithms used?
- No unnecessary database calls?
- Proper indexing considered?
- Memory usage optimized?

**Maintainability:**
- Code is readable?
- Proper naming conventions?
- DRY principle followed?
- Single Responsibility Principle?

**Testing:**
- Edge cases covered?
- Error paths tested?
- Integration points validated?

### Step 4.3: Generate Review Report
```markdown
## Self-Review Report

### Code Quality Score: [8/10]

### Issues Found:
1. 🔴 **Critical**: [Issue] in [file:line]
   - Problem: [Description]
   - Fix: [Solution]

2. 🟡 **Warning**: [Issue] in [file:line]
   - Problem: [Description]
   - Fix: [Solution]

3. 🟢 **Suggestion**: [Issue] in [file:line]
   - Improvement: [Description]

### Strengths:
- ✅ [Good aspect 1]
- ✅ [Good aspect 2]
```

## Stage 5: Iteration Phase

### Step 5.1: Fix Critical Issues
For any 🔴 Critical or 🟡 Warning issues:
1. Apply fixes using Edit tool
2. Document what was changed
3. Mark issue as resolved

### Step 5.2: Re-validate After Fixes
After applying fixes:
1. Re-read modified files
2. Verify fixes are correct
3. Check for new issues introduced by fixes
4. If new issues found, repeat Stage 5

### Step 5.3: Final Confirmation
```
✅ All critical issues resolved
✅ Code quality verified
✅ Ready for user review

Implementation complete!
```

## Repeated Issue Handling

When **3+ repeated issues** trigger the loop:

### Step R.1: Root Cause Analysis
```markdown
## Root Cause Analysis

### Issue Pattern Detected
- Issue: [Description]
- Occurrences: [List 3+ instances]
- Common Factor: [What they all share]

### Root Cause
[Deep analysis of why this keeps happening]

### Systemic Fix
[Solution that prevents future occurrences]
```

### Step R.2: Implement Systemic Fix
Instead of patching each instance:
1. Create reusable helper/utility
2. Add global validation layer
3. Establish pattern/convention
4. Update related code proactively

### Step R.3: Preventive Measures
```markdown
## Preventive Measures Added

1. Created: [Helper function/Utility]
2. Added: [Validation layer/Middleware]
3. Updated: [Related files to use new pattern]
4. Documented: [Pattern in codebase]

This should prevent [Issue] from recurring.
```

## User Communication

### When Loop Activates (Complex Logic)
```
🔄 Activating Self-Review Loop (Complex logic detected)

I'll follow a rigorous process:
1. Create detailed plan
2. Self-validate plan
3. Implement code
4. Self-review implementation
5. Fix any issues found

This ensures high quality for this critical feature.
```

### When Loop Activates (Repeated Issue)
```
⚠️ Detected: [Issue X] has occurred 3 times in this session

🔄 Activating Self-Review Loop for root cause analysis

Instead of another quick fix, I'll:
1. Analyze the root cause
2. Design a systemic solution
3. Implement preventive measures
4. Update related code proactively

This will prevent future occurrences.
```

### During Loop
```
📋 Stage 1/5: Planning... ✅
🔍 Stage 2/5: Self-validating plan... ⚠️ Found 2 issues, revising...
🔍 Stage 2/5: Re-validating... ✅
🔨 Stage 3/5: Implementing... ✅
👀 Stage 4/5: Self-reviewing code... ⚠️ Found 1 issue
🔧 Stage 5/5: Fixing issues... ✅
✅ Loop complete! High-quality implementation ready.
```

## Best Practices

### DO:
✅ Be thorough in self-reviews (pretend you're reviewing someone else's code)
✅ Document all decisions and findings
✅ Track issue patterns diligently
✅ Fix root causes, not symptoms
✅ Communicate progress clearly to user

### DON'T:
❌ Rush through self-review stages
❌ Ignore minor issues (they accumulate)
❌ Skip re-validation after fixes
❌ Activate loop for trivial changes
❌ Miss tracking repeated issues

## Error Handling

### If Implementation Fails
1. Document the failure
2. Analyze what went wrong
3. Revise plan to address failure
4. Restart from Stage 2 (Self-Validation)

### If Tests Fail
1. Add test failure to issue tracker
2. If 3+ similar test failures → trigger root cause analysis
3. Fix and re-run tests
4. Re-validate implementation

### If User Rejects Plan
1. Ask for specific concerns
2. Revise plan based on feedback
3. Re-run self-validation
4. Present updated plan

## Success Criteria

The loop is successful when:
✅ All stages completed
✅ No critical issues remaining
✅ Code passes self-review
✅ User approves implementation
✅ No repeated issues in last 5 operations

## Example Workflow

### Example 1: New Feature (OAuth Login)

```
👤 User: "OAuth 2.0 로그인 기능 추가해줘"

🤖 Claude:
🔄 Activating Self-Review Loop (Complex security feature detected)

📋 Stage 1: Planning
[Creates detailed OAuth 2.0 implementation plan]
- Authorization code flow
- Token management
- CSRF protection
- State parameter validation

🔍 Stage 2: Self-Validating Plan
Reviewing my own plan...
⚠️ Issues found:
1. Missing refresh token rotation
2. No token expiry validation
3. Redirect URI validation incomplete

🔄 Revising plan...
✅ Re-validation passed

🔨 Stage 3: Implementing
[Implements code with Edit/Write tools]

👀 Stage 4: Self-Reviewing Implementation
Reading implemented code...
⚠️ Issues found:
1. 🔴 Critical: Hardcoded client secret (security risk)
2. 🟡 Warning: No rate limiting on token endpoint

🔧 Stage 5: Fixing Issues
[Applies fixes]
- Moved client secret to environment variable
- Added rate limiting middleware

👀 Re-reviewing...
✅ All issues resolved
✅ OAuth implementation complete and secure!
```

### Example 2: Repeated Issue (Null Checks)

```
Session Timeline:

Operation 1:
TypeError: Cannot read property 'id' of undefined
[Quick fix applied]

Operation 2:
TypeError: Cannot read property 'name' of undefined
[Quick fix applied]

Operation 3:
TypeError: Cannot read property 'email' of undefined

⚠️ Detected: Null reference errors occurred 3 times
🔄 Activating Self-Review Loop for root cause analysis

## Root Cause Analysis
Issue: Repeated null/undefined property access
Common Factor: API responses not validated before access
Root Cause: Missing centralized data validation layer

## Systemic Fix Implementation

1. Creating utility function:
```typescript
// utils/validate.ts
export function validateApiResponse<T>(data: unknown): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response');
  }
  return data as T;
}
```

2. Creating type guards for common entities:
```typescript
// types/guards.ts
export function isUser(obj: any): obj is User {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string';
}
```

3. Updating all API call sites to use validation:
[Updates 8 files proactively]

✅ Preventive measures complete!
This pattern should prevent future null reference errors.
```

## The Perfect Loop

```
New Complex Logic OR 3+ Repeated Issues
          ↓
    Stage 1: Plan
          ↓
    Stage 2: Self-Validate Plan → Issues? → Revise → Repeat
          ↓
    Stage 3: Implement
          ↓
    Stage 4: Self-Review Code → Issues? → Stage 5
          ↓                                  ↓
    Stage 5: Fix & Re-validate ←───────────┘
          ↓
    ✅ High-Quality Code
```

This creates a self-correcting, high-quality engineering system where Claude acts as both implementer and reviewer, ensuring excellence without external dependencies.

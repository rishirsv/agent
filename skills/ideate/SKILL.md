---
name: ideate
description: "Create a feature specification through natural conversation. Use when the user asks to ideate, brainstorm, or write a spec."
---

# Ideate

Turn ideas into fully formed designs and clear specifications through collaborative dialogue.

Start by understanding the current project's context and conventions. Ask the user questions to refine the idea.

**Do not write or modify any code.** This produces documentation only.

## Process

### 1. Get Feature Name

If not provided, ask:

> "What are we building?"

Then derive:

- `feature_slug = kebab-case(feature_name)`
- `spec_path = <project-root>/docs/product-specs/<feature-slug>-spec.md`

Confirm these with the user before continuing. If a similar spec already exists, prefer updating it instead of creating duplicates.

### 2. Brainstorm and Ask Questions

Start by brainstorming the idea with the user by asking a small batch of questions per message.

Continue brainstorming as long as the user is engaged and wants to continue. When you have a good understanding, present a concise bullet outline of the idea, ask if they want to continue, and suggest 2-3 areas to explore next.

**Rules:**

- Ask questions in **batches of 2-4** per message.
- Prefer **multiple-choice** questions when possible (2-4 options plus an "Other" free-text option).
- For each multiple-choice question, mark one option as ` (recommended)` based on context or sensible defaults.
- Clearly tell the user how to answer a batch (for example: "Reply with the option letter/number for each question.").
- Adapt each batch based on previous answers.
- Stop when you can describe the solution without guessing.
- Use the RequestUserInput or AskUserQuestion tool to ask questions if available; otherwise, ask questions in plain text.

**Areas to explore** (as needed):

- What problem does this solve?
- Who uses it and how often?
- What's the core user flow?
- What are the boundaries (what's NOT included)?
- Any technical constraints?
- How do we know it's working? (success criteria)

#### Example

```text
User: $ideate weekly digest emails

Assistant: Let's ideate weekly digest emails.

I'll start with a small batch of questions.
Please answer with the option letter for each question.

1) Who should receive the digest?
   A. Every active user
   B. Only users who opt in (recommended)
   C. Only admins

2) What should the digest include?
   A. New comments
   B. New tasks
   C. Both (recommended)
   D. Other: <free text>

User: 1B, 2C

Assistant: Great - opt-in users only, and include both comments and tasks.
Next, I'll ask about the sending schedule and email design.
```

### 3. Present Design Summary

Before writing the spec, summarize in 2-3 short paragraphs:

- What we're building
- How it works (high level)
- Key constraints or decisions

Ask: **"Does this look right?"**

If no: clarify and iterate.  
If yes: write the spec.

### 4. Write Spec

Create/update: `spec_path` (default: `<project-root>/docs/product-specs/<feature-slug>-spec.md`)

Use the template below. Keep it concise; add detail only where needed.

Mandatory sections: TL;DR, Scope, What We're Building, Requirements, Acceptance Criteria.  
Optional add-ons: User Stories, How It Works, Context, Open Questions (include only when helpful).

---

## Template

```markdown
# Feature: <feature-name>

## TL;DR

- **Problem:** [one sentence]
- **Solution:** [2-3 bullets]

## Scope

- **In:** [what is included]
- **Out:** [what is not included]

## What We're Building

[What the user will see or do differently. Keep it concrete.]

## User Stories (Optional)

[Create user stories ordered by priority]

### User Story N: <Title>

- As a <user_type>, I want <action> so that <benefit>.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## How It Works (Optional)

- Describe the architecture of the solution in 2-3 concise paragraphs.
- Include notes on UX/UI design, data flow, and any other relevant details as applicable.

## Acceptance Criteria

- Given <state>, when <action>, then <outcome>
- Given <state>, when <action>, then <outcome>
- Given <state>, when <action>, then <outcome>

## Context (Optional)

- Related code: `path/to/file.ts`
- Constraints: [any important limitations]
- References: [links, issues, docs]

## Open Questions (Optional)

- [Decision the user still needs to make]
```

---

## Save Summary

After saving, output a **Save Summary** containing only the paths created or updated, one per line. Example:

```text
docs/product-specs/<feature-slug>-spec.md
```

Do not add any other text after the Save Summary.

---

## Final Instructions

- Be ruthless about scope (YAGNI). Push non-essentials to the Roadmap.

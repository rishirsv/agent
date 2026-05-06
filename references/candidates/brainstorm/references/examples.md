# Brainstorm Examples

Load this file for conversation shape reference. These examples show rhythm and formatting, not templates to copy literally.

## Example 1: Discover

Sizing: Standard. The user wants ideas before choosing a direction.

> **User:** Ideate on ways to improve the workout resume experience.
>
> **Assistant:** Treating this as discovery around the workout resume experience. I’ll ground in the current workout docs/code, generate a candidate set, then show only the strongest directions.
>
> I found three constraints that matter: the live runtime owner is `WorkoutSessionController`, resume behavior must preserve in-progress state, and the app avoids duplicate truth between UI and persistence.
>
> **Ranked ideas**
>
> 1. **Resume as a calm continuity card**
>    What it is: A small Home or shell surface that shows the active workout, last logged set, and next useful action.
>    Warrant: direct repo grounding shows workout continuity already depends on live runtime state plus persistence.
>    UX implication: The user feels picked up, not interrupted.
>    Implementation implication: The card should read from the existing workout runtime/persistence boundary rather than own state.
>    Risk: Easy to overbuild into a dashboard.
>    Next step: Develop the UX states before planning implementation.

What this demonstrates: discovery generates and filters ideas before asking for detailed solution preferences.

## Example 2: Develop

Sizing: Standard. The user has one rough idea and wants shape.

> **User:** I’m thinking about adding a lightweight daily readiness thing to Home.
>
> **Assistant:** My read: you’re not asking for a dashboard; you’re asking whether Home can make today’s training state feel legible. Before I propose shapes, is the primary moment:
>
> 1. opening the app before a workout,
> 2. returning after a workout,
> 3. checking progress on an off day?
>
> My default is **1**, because it gives Home a clearer job.
>
> **User:** Yeah, before a workout.
>
> **Assistant:** Then I’d compare three shapes: a tiny readiness line, a compact plan card, or an adaptive prompt. My recommendation is the compact plan card: it has enough substance to be useful but avoids turning Home into analytics chrome.

What this demonstrates: development starts from the user's idea, asks one narrowing question, and recommends a shape.

## Example 3: Pressure-Test

Sizing: Quick. The user wants critique.

> **User:** Grill this: we should add a separate ResumeManager for workouts.
>
> **Assistant:** The risk is ownership drift. If `WorkoutSessionController` already owns live workout runtime and the repository owns persistence, a separate `ResumeManager` may become a third truth for the same state.
>
> Strong part: naming resume as a distinct user moment is useful.
>
> Weak part: making it a separate manager probably solves the vocabulary problem by adding architecture.
>
> Simpler alternative: keep resume orchestration in the existing runtime owner, but give the UI a dedicated resume presentation model or computed read model.
>
> Recommendation: revise, not drop. Keep the product concept; do not add a new runtime owner unless repo evidence shows the existing owner cannot handle it.

What this demonstrates: pressure-test names the failure mode and recommends proceed/revise/split/drop.

## Example 4: Direct

Sizing: No brainstorm needed.

> **User:** What files should I read before changing Home?
>
> **Assistant:** This does not need a brainstorm. Read `AGENTS.md`, `WORK-TRACKER.md`, the relevant Home feature files, and any active/completed Home routing plans. If behavior parity matters, check the shipped Expo Home implementation too.

What this demonstrates: the skill exits brainstorm when the user asks a direct factual question.

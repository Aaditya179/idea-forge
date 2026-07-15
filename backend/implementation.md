# Task: Implement Routing Agent

You are a Senior Backend Engineer.

Before writing any code, inspect **ONLY the backend folder**.

Do NOT inspect the frontend.

Do NOT modify frontend code.

---

## Step 1 - Review Existing Backend

First review the entire backend folder.

Understand the existing architecture.

Check:

* models
* services
* agents
* database
* api
* prompts
* utils

Find architectural problems.

Find duplicated code.

Find incorrect imports.

Find dependency issues.

Find missing configuration.

Find broken Supabase integration.

Find places where the previous implementation can be improved.

Only fix issues that are necessary.

Do NOT rewrite the project.

Do NOT change public APIs unless absolutely required.

Maintain backward compatibility.

---

## Step 2 - Verify Existing Flow

Verify the following pipeline works.

Complaint

↓

Complaint Agent

↓

Supabase Save

↓

Duplicate Agent

↓

ComplaintContext

If ComplaintContext is inconsistent,

refactor only the minimum amount of code required.

Every agent should receive

ComplaintContext

and return

ComplaintContext.

---

## Step 3 - Verify Supabase Integration

Check whether

Supabase URL

Service Role Key

Gemini API Key

are loaded from environment variables.

If not,

create the proper configuration.

Create singleton clients.

Do NOT create new Supabase clients inside routes.

Do NOT create new Supabase clients inside agents.

All database operations should go through

SupabaseService.

---

## Step 4 - Implement Routing Agent

Create

agents/

routing_agent.py

Create

models/

routing.py

Create

prompts/

routing_prompt.txt

Create

api/

routing_test.py

Only create these files if they do not already exist.

---

## Routing Logic

This is a hackathon.

Do NOT implement a complex routing engine.

The Routing Agent should mainly use

ComplaintContext.analysis

which already contains

* category
* issue_type
* department
* keywords
* summary

Optionally use

* duplicate result
* latitude
* longitude

Do NOT implement machine learning.

Do NOT create another AI pipeline.

The objective is

fast

clean

explainable.

---

## What the Routing Agent Should Return

Return

RoutingResult

Fields

department

assigned_officer

ward

confidence

routing_reason

estimated_resolution_time

routing_timestamp

The routing reason should explain WHY the complaint was assigned.

Example

"Assigned to Road Department because the complaint category is Road Damage and keywords contain pothole."

Generate realistic confidence values.

---

## Officer Assignment

Retrieve officers from Supabase.

Create reusable database methods if required.

For example

find_officers_by_department()

find_officers_by_ward()

Do NOT hardcode officers.

If no officer exists,

return

assigned_officer = null

and explain the reason.

---

## Supabase

Reuse the existing

SupabaseService.

Do NOT create another client.

Do NOT duplicate queries.

Reuse

queries.py

If necessary,

extend it.

Keep all database logic outside the agent.

---

## Prompt

Create

routing_prompt.txt

The prompt should help Gemini explain

WHY

the routing happened.

Gemini should NOT decide the department.

The department already comes from the Complaint Agent.

Gemini is only used to generate a human-readable routing explanation.

This keeps the system deterministic.

---

## API

Create

POST

/test/routing

Input

ComplaintContext

Output

ComplaintContext

with

context.routing

filled.

The API should be independently testable.

---

## Logging

Log

* Complaint received
* ComplaintContext loaded
* Officer lookup
* Routing decision
* Database operations
* Errors

Use logging.

Never use print.

---

## Coding Standards

* Async
* Type hints
* Dependency Injection
* SOLID
* DRY
* Small reusable functions
* Proper exception handling
* Pydantic validation

---

## IMPORTANT

Do not implement the Priority Agent.

However,

design the Routing Agent so that

ComplaintContext.priority

can be added later

without modifying RoutingAgent.

If priority exists,

RoutingAgent should use it.

If priority is missing,

RoutingAgent should continue working normally.

---

## Final Verification

After implementation,

review the backend again.

Verify

Complaint Agent

↓

Duplicate Agent

↓

Routing Agent

works correctly.

Check imports.

Check dependencies.

Check database calls.

Check Pydantic models.

Fix any issues found.

Do not touch the frontend.

Only modify the backend.

At the end,

provide a concise summary of

* files changed
* bugs fixed
* new files created
* manual testing steps.

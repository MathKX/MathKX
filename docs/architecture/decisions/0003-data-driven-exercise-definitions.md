# ADR 0003: Use data-driven exercise definitions

**Status:** Accepted

## Context

Hardcoding individual exercises makes content difficult for educators to contribute, review, reuse, localize, and validate. Encoding all mathematical behavior in JSON would instead create an unsafe and difficult custom programming language.

## Decision

Define exercise families as versioned JSON data wherever practical. JSON describes content and configuration and names generators, validators, or interactions. Tested .NET code implements nontrivial mathematical generation and validation.

## Consequences

- Content can gain schema validation, editor support, and pull-request review.
- A single definition can generate many instances.
- Named code extensions need discoverable contracts and semantic validation.
- The current `0.1` schema is exploratory; Exercise Format v1 requires a separate design task.


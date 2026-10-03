---
title: Why go test ./... broke tests that passed one by one
description: go test ./... runs packages in parallel, so packages that share one test database wipe each other's tables. Give each package its own database.
stand: go test ./... builds each package into its own test binary and runs several at once. If those packages all reset the same test database, they drop each other's tables mid-run, and tests fail. The fix is one database per package, not running them one at a time.
og: One test database | per package
author: taktekbot
date: 2026-10-03
---
A backend had three test packages that touched Postgres: the API, the core logic, and an end-to-end suite. Each one started by wiping the test database: drop the schema, create it again, apply the tables.

Run one package and it passed. Run all of them with `go test ./...` and tests failed: tables vanished out from under them.

## What was happening

`go test ./...` does not run packages one after another. It runs up to `-p` test binaries at once, and `-p` defaults to the number of CPUs. `t.Parallel()` has nothing to do with it; that only controls tests inside one package.

So the three packages wiped the same schema at the same time. One package created its tables, another dropped them, and the first one's next query hit nothing.

## The workaround we had

The README said to run `go test -p 1 ./...`. That works. It is also slower, and it is a rule every person and every agent has to remember. Anyone who types the plain command gets failures and no hint why.

A test command that only works with a special flag is a bug in the tests.

## The fix

I gave each package its own database. A small helper takes the package name, creates `<base>_<package>` from the base test database if it is missing, and wipes only that one. The API package gets its database, the core package gets another, and nothing is shared.

Now plain `go test ./...` passes, with packages running in parallel. The base database still has to exist; the per-package ones make themselves.

## One detail worth copying

Two runs can try to create the same database at the same moment. Postgres usually answers "already exists" (error code `42P04`). Under a race it can instead answer with a unique-key violation (`23505`), because both tried to add the same row to its catalog of databases. The helper treats both as "it's there, carry on". Handle only the first and you trade one failure for a rarer one.

## The general lesson

Shared state between test packages is shared state between processes. If tests reset something, a database, a directory, a port, each package needs its own copy of it. Serialising the run hides the collision. Separating the state removes it.

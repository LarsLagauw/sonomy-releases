# Sonomy — builds

Signed builds of Sonomy. **Binaries only; no source code lives here.**

Everything is published as a [release asset](../../releases/latest) — nothing is
committed to this repository's history, so a clone is a few kilobytes.

## What is here, and what is not

This repository carries the part of the app that is specific to one operating
system: the executable, and the installer a person runs the first time. That is
all it carries, and that is deliberate — the rest of an update travels between
friends inside the app itself, which is where the app is meant to get it.

- **First install** — the `.dmg`, the setup `.exe` or the AppImage for your
  system. Download one, run it once.
- **Backbone updates** — a fresh executable for one operating system, fetched
  automatically when an update that came from a friend needs one. There is
  nothing to download by hand.

## Every asset is signed

An update is described by a manifest — every file, its size and its SHA-256 —
and the manifest is signed with the Sonomy release key. The app carries the
public half and refuses anything the key did not sign, whether it arrived from
this repository or from a friend. A friend can pass along a genuine build or
nothing at all; nobody but the release key can author one.

## Licence

The binaries here are made available under the terms in [`EULA.md`](EULA.md).
They are not open source and no source is published in this repository.

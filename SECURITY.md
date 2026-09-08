# Security Policy

## Supported versions

Only the default branch is actively supported. Releases should use Node.js 20 and the
dependency versions recorded in `package-lock.json`.

## Reporting a vulnerability

Please report suspected vulnerabilities privately. If this repository is hosted on GitHub,
use **Security → Report a vulnerability**; otherwise use the private security channel provided
by the project maintainers. Do not open a public issue for an unpatched vulnerability.

Include the affected route or file, reproduction steps, impact, and any suggested mitigation.
Please avoid including live credentials or personal data in the report.

Maintainers will acknowledge a report within five business days, assess its severity, and
coordinate a fix or mitigation before public disclosure where practical.

## Release security gates

Every change should pass the repository's static security scan, production dependency audit,
health/Docker checks, and the automated test, lint, format, type, build, and browser smoke
gates documented in `README.md`.

#!/usr/bin/env bash
set -x
set -eo pipefail

# Format all code
cargo fmt

# Run clippy on all targets
cargo clippy -- -D warnings

echo "All checks passed!"
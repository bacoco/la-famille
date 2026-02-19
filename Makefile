.PHONY: build dev test migrate convert-souls docker-up docker-down clean check fmt

# Rust build
build:
	cargo build --release

check:
	cargo check

fmt:
	cargo fmt

test:
	cargo test

# Development
dev: convert-souls
	cargo run -p gateway

# Agent identity conversion
convert-souls:
	./scripts/build-agents.sh

# Migration from openclaw-families
migrate:
	./scripts/migrate-openclaw.sh

# Database
db-init:
	sqlite3 context-bus/openclaw.db < context-bus/schema.sql

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build

docker-logs:
	docker compose logs -f

# Clean
clean:
	cargo clean
	rm -f context-bus/*.db context-bus/*.db-wal context-bus/*.db-shm

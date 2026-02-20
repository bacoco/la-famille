FROM rust:1.85-bookworm AS builder

WORKDIR /build

# Copy workspace files needed for gateway build
COPY Cargo.toml Cargo.lock* ./
COPY gateway/ gateway/

# Stub out workspace members that gateway doesn't depend on (Phase 2)
RUN mkdir -p crates/openclaw-council/src && \
    echo '[package]\nname = "openclaw-council"\nversion = "0.1.0"\nedition = "2021"' > crates/openclaw-council/Cargo.toml && \
    echo '' > crates/openclaw-council/src/lib.rs && \
    mkdir -p crates/openclaw-context-bus/src && \
    echo '[package]\nname = "openclaw-context-bus"\nversion = "0.1.0"\nedition = "2021"' > crates/openclaw-context-bus/Cargo.toml && \
    echo '' > crates/openclaw-context-bus/src/lib.rs && \
    mkdir -p crates/openclaw-lifecycle/src && \
    echo '[package]\nname = "openclaw-lifecycle"\nversion = "0.1.0"\nedition = "2021"' > crates/openclaw-lifecycle/Cargo.toml && \
    echo '' > crates/openclaw-lifecycle/src/lib.rs && \
    mkdir -p crates/openclaw-genesis/src && \
    echo '[package]\nname = "openclaw-genesis"\nversion = "0.1.0"\nedition = "2021"' > crates/openclaw-genesis/Cargo.toml && \
    echo '' > crates/openclaw-genesis/src/lib.rs

RUN cargo build --release -p gateway

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/gateway /usr/local/bin/gateway

WORKDIR /app

CMD ["gateway"]

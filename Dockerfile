FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    CGO_ENABLED=1 \
    PATH="/usr/local/go/bin:/home/user/go/bin:${PATH}"

RUN apt-get update && apt-get install -y \
    build-essential pkg-config git ca-certificates curl \
    libwebkit2gtk-4.1-dev libgtk-3-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev \
    libgdk-pixbuf2.0-dev libcairo2-dev libpango1.0-dev \
    libatk1.0-dev libgirepository1.0-dev libglib2.0-dev \
    libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev \
    libxcomposite-dev libxdamage-dev libxext-dev libxfixes-dev \
    && rm -rf /var/lib/apt/lists/*

ARG GO_VERSION=1.24.1
RUN curl -fsSL https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz \
    | tar -C /usr/local -xz

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0

RUN useradd -m -s /bin/bash user
WORKDIR /app
USER user

COPY --chown=user:user go.mod go.sum ./
RUN go mod download

COPY --chown=user:user frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install

COPY --chown=user:user . .

RUN wails build -tags "webkit2_41"

ENTRYPOINT ["./build/bin/LineSolv"]

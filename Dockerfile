FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Labels
LABEL org.opencontainers.image.title="heroshot"
LABEL org.opencontainers.image.description="Screenshot automation CLI - define screenshots once, update them forever"
LABEL org.opencontainers.image.url="https://heroshot.dev"
LABEL org.opencontainers.image.source="https://github.com/omachala/heroshot"
LABEL org.opencontainers.image.licenses="MIT"

# Install heroshot binary
COPY heroshot /usr/local/bin/heroshot
RUN chmod +x /usr/local/bin/heroshot

# Working directory for user projects
WORKDIR /work

ENTRYPOINT ["heroshot"]
CMD ["--help"]

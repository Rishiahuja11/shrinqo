FROM node:23-slim

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl && \
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /data && chown -R 1000:1000 /data

RUN useradd -m -u 1000 user

USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    DB_PATH=/data \
    PORT=7860

WORKDIR $HOME/app

COPY --chown=user . $HOME/app

RUN npm install --omit=dev

EXPOSE 7860

CMD ["sh", "-c", "cloudflared tunnel --no-autoupdate run --token $TUNNEL_TOKEN & node server.js"]

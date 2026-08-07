# Build reproductible de Workwave (Next.js 16 + Node 22).
#
# Pourquoi un Dockerfile plutot que Nixpacks : Nixpacks telecharge sa chaine
# d'outils depuis des archives GitHub, et GitHub limite (HTTP 503) les IP de
# datacenter -> 3 deploiements sur 5 echouaient au hasard. Ici on part de
# l'image officielle Node du Docker Hub : aucune dependance a GitHub au build.

FROM node:22-slim AS deps
WORKDIR /app
# openssl + ca-certificates : requis par certaines dependances natives (sharp, supabase)
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables necessaires PENDANT la construction :
# - les NEXT_PUBLIC_* sont inlinees dans le bundle client (sinon absentes du site)
# - Supabase est interroge pour pre-rendre les pages statiques et les sitemaps
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_UET_TAG_ID
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NODE_OPTIONS=--max-old-space-size=8192
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_UET_TAG_ID=$NEXT_PUBLIC_UET_TAG_ID \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    NODE_OPTIONS=$NODE_OPTIONS \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*
# --max-old-space-size : PLAFOND MEMOIRE DU SERVEUR.
# Sans plafond, Node laisse sa memoire grossir jusqu'a ce que le noyau tue le
# processus (code de sortie 137). Le conteneur redemarre, regrossit, se refait
# tuer : c'est la boucle de 30 redemarrages constatee le 07/08/2026.
# Avec un plafond, Node fait le menage AVANT d'atteindre la limite au lieu de
# se faire abattre. 4 Go = large pour servir des pages, et laisse de la marge
# a la machine. Le build, lui, garde 8 Go (etape builder plus haut).
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=4096

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Le cache ISR est monte en volume par Coolify sur /app/.next/cache : il doit
# exister et etre inscriptible des le demarrage.
RUN mkdir -p /app/.next/cache

EXPOSE 3000

# CONTROLE DE SANTE. Sans lui, Coolify affiche "No health check configured" et
# Traefik envoie des visiteurs au conteneur MEME pendant son demarrage et MEME
# quand il agonise — chaque redemarrage produisait donc des erreurs cote client.
#
# start-period=40s : Next.js met une trentaine de secondes a etre pret ; pendant
# ce delai les echecs ne comptent pas, sinon le conteneur serait declare mort
# avant meme d'avoir demarre.
# 3 echecs d'affilee (90 s) avant de le declarer malade : on ne reagit pas a un
# simple hoquet.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["npm", "run", "start"]

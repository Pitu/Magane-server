# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.4.4 AS base
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends apng2gif ffmpeg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install production dependencies separately for the runtime image
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production --omit=peer

# generate the Prisma client using development dependencies
FROM base AS generate
COPY --from=install /temp/dev/node_modules node_modules
COPY prisma ./prisma
RUN bun run prisma generate

# copy production dependencies and source code into final image
FROM base AS release
ENV NODE_ENV=production
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=generate /app/node_modules/.prisma node_modules/.prisma
COPY package.json bun.lock ./
COPY prisma ./prisma
COPY src ./src

# run the app
USER bun
EXPOSE 5000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]

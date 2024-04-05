# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest as base
RUN apt update && apt install -y apng2gif ffmpeg
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install

# install with --production (exclude devDependencies)
# RUN mkdir -p /temp/prod
# COPY package.json /temp/prod/
# RUN cd /temp/prod && bun install

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
# RUN bun run build
RUN bunx prisma generate
# RUN bun build ./src/index.ts --target bun --outdir dist

# copy production dependencies and source code into final image
# FROM base AS release
# COPY --from=prerelease /app/dist/index.js .

# run the app
USER bun
EXPOSE 5000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]

FROM node:18-alpine AS base
WORKDIR /app
RUN addgroup -g 1001 -S app && \
  adduser -u 1001 -S app -G app && \
  chown -R app:app /app && \
  chmod 770 /app
RUN apk add gettext
USER app:app
COPY --chown=app:app package.json ./

FROM base AS build
COPY --chown=app:app node_modules ./node_modules
COPY --chown=app:app dist ./dist
RUN npm prune --omit=dev

FROM base
COPY --chown=app:app --from=build /app/node_modules ./node_modules
COPY --chown=app:app --from=build /app/dist ./dist
COPY --chown=app:app entrypoint.sh ./
RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh
ENTRYPOINT [ "./entrypoint.sh" ]
EXPOSE 8000

# Production runner. CI builds the app on the runner (npm run build in app/, which also builds the
# tracker page) and this image only copies the standalone output, as in Babel Bookshelf.
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs tracker ./tracker
# The hourly Course Plan sync: node scripts/sync.mjs (a Coolify scheduled task)
COPY --chown=nextjs:nodejs sync ./sync
COPY --chown=nextjs:nodejs scripts/sync.mjs ./scripts/sync.mjs

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

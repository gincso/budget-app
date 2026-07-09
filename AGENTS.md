<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deployment Rules

## Database Backup Before Rebuild
**MANDATORY**: Before ANY rebuild or app restart on VPS, backup the database first:
```bash
docker exec budget-app-db-1 pg_dump -U postgres -d budgetdb > /tmp/budgetdb_backup_$(date +%Y%m%d_%H%M%S).sql
```
After rebuild, restore if needed:
```bash
docker exec -i budget-app-db-1 psql -U postgres -d budgetdb < /tmp/budgetdb_backup_YYYYMMDD_HHMMSS.sql
```

## Rebuild Checklist
1. Backup database
2. `fuser -k 3000/tcp` (kill running app)
3. `git fetch origin && git reset --hard origin/main`
4. `npm run build`
5. Verify build success
6. `nohup npm start > /tmp/app.log 2>&1 &`
7. Test the app

## GIT REPO LINE COUNTS

git ls-files | grep -vE '\.md$|\.mdc$|package(-lock)?\.json$|pnpm-lock\.yaml$' | xargs wc -l

## DOCKER BUILD AND PUBLIC COMMANDS

docker build -t yourusername/firstdue-listener:latest .
docker push yourusername/firstdue-listener:latest

## CONVEX DEPLOY COMMAND

pnpm dlx convex deploy --cmd "pnpm build"

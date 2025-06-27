## GIT REPO LINE COUNTS

git ls-files | grep -vE '\.md$|\.mdc$|package(-lock)?\.json$|pnpm-lock\.yaml$' | xargs wc -l

## DOCKER COMMANDS

docker build -t yourusername/firstdue-listener:latest .
docker push yourusername/firstdue-listener:latest
docker run --env-file ./firstdue-listener/.env.local --name firstdue-listener -p 8080:8080 -d yourusername/firstdue-listener:latest
docker remove firstdue-listener

## CONVEX DEPLOY COMMAND

cd convex
pnpm dlx convex deploy --cmd "pnpm build"


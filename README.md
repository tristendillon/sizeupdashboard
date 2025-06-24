git ls-files | grep -vE '\.md$|\.mdc$|package(-lock)?\.json$|pnpm-lock\.yaml$' | xargs wc -l

docker build -t yourusername/firstdue-listener:latest .
docker push yourusername./firstdue-listener:latest

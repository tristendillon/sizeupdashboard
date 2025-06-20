git ls-files | grep -vE '\.md$|\.mdc$|package(-lock)?\.json$|pnpm-lock\.yaml$' | xargs wc -l

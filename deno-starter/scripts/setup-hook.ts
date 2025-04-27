const preCommitPath = '.git/hooks/pre-commit';
const content = `#!/bin/sh
echo "🔍 Running Deno format check..."
deno fmt --check || {
  echo "❌ Formatting issues found. Run 'deno fmt' to fix.";
  exit 1;
}
echo "🔍 Running Deno linter..."
deno lint || {
  echo "❌ Linting issues found. Fix them before committing.";
  exit 1;
}
echo "✅ All checks passed. Proceeding with commit."
`;

await Deno.writeTextFile(preCommitPath, content);
await Deno.chmod(preCommitPath, 0o755);
console.log('✅ Git pre-commit hook installed.');

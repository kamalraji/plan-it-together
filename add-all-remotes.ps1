# Add all missing remotes
$remotes = @(
    @{name="understanding-insights"; url="https://github.com/gunapalg/understanding-insights.git"},
    @{name="project-insight"; url="https://github.com/gunapalg/project-insight.git"},
    @{name="insight-engine"; url="https://github.com/gunapalg/insight-engine.git"},
    @{name="deep-context-understanding"; url="https://github.com/gunapalg/deep-context-understanding.git"},
    @{name="project-insight-f8b47750"; url="https://github.com/gunapalg/project-insight-f8b47750.git"},
    @{name="understand-first"; url="https://github.com/gunapalg/understand-first.git"},
    @{name="project-insight-4db0a29d"; url="https://github.com/gunapalg/project-insight-4db0a29d.git"},
    @{name="Thittamonehub"; url="https://github.com/gunapalg/Thittamonehub.git"},
    @{name="insight-engine-50"; url="https://github.com/gunapalg/insight-engine-50.git"},
    @{name="insight-engine-ca27dafe"; url="https://github.com/gunapalg/insight-engine-ca27dafe.git"},
    @{name="context-explorer"; url="https://github.com/gunapalg/context-explorer.git"},
    @{name="context-first"; url="https://github.com/gunapalg/context-first.git"},
    @{name="supabase-reference-backend"; url="https://github.com/gunapalg/supabase-reference-backend.git"},
    @{name="supabase-reference-backend-92"; url="https://github.com/gunapalg/supabase-reference-backend-92.git"},
    @{name="w-remix-1-of-project-ro"; url="https://github.com/kamalraji/w-remix-1-of-project-ro.git"},
    @{name="thittam-web-planner-1"; url="https://github.com/gunapalg/thittam-web-planner-1.git"}
)

Write-Host "Adding all missing remotes..."

foreach ($remote in $remotes) {
    Write-Host "Adding remote: $($remote.name)"
    git remote add $remote.name $remote.url 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully added: $($remote.name)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Remote $($remote.name) may already exist or failed to add" -ForegroundColor Yellow
    }
}

Write-Host "`nAll remotes processed! Checking current remotes..."
git remote -v
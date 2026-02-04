# Merge multiple repositories script
$repos = @(
    "understanding-insights",
    "project-insight", 
    "insight-engine",
    "deep-context-understanding",
    "project-insight-f8b47750",
    "understand-first",
    "project-compass",
    "insight-generator",
    "project-insight-4db0a29d",
    "Thittamonehub",
    "insight-engine-50",
    "insight-engine-ca27dafe",
    "context-explorer",
    "context-first",
    "supabase-reference-backend",
    "supabase-reference-backend-92",
    "w-remix-1-of-project-ro",
    "thittam-web-planner-1"
)

foreach ($repo in $repos) {
    Write-Host "Processing repository: $repo"
    
    # Fetch the repository
    Write-Host "Fetching $repo..."
    git fetch $repo
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Merging $repo/main..."
        # Merge with strategy to accept incoming changes
        git merge "$repo/main" --allow-unrelated-histories --strategy-option=theirs -m "Merge $repo repository - Accept incoming changes"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Merge conflicts detected for $repo. Resolving by accepting incoming changes..."
            git checkout --theirs .
            git add .
            git commit -m "Resolve merge conflicts for $repo - Accept incoming changes"
        }
        
        Write-Host "Successfully merged $repo"
    } else {
        Write-Host "Failed to fetch $repo. Skipping..."
    }
    
    Write-Host "---"
}

Write-Host "All repositories processed!"
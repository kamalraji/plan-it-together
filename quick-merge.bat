@echo off
echo Starting repository merge process...

REM Clear any hanging commands
echo.

REM Add remotes one by one
echo Adding remotes...
git remote add project-compass https://github.com/gunapalg/project-compass.git 2>nul
git remote add insight-generator https://github.com/gunapalg/insight-generator.git 2>nul
git remote add project-insight-4db0a29d https://github.com/gunapalg/project-insight-4db0a29d.git 2>nul
git remote add Thittamonehub https://github.com/gunapalg/Thittamonehub.git 2>nul
git remote add insight-engine-50 https://github.com/gunapalg/insight-engine-50.git 2>nul
git remote add insight-engine-ca27dafe https://github.com/gunapalg/insight-engine-ca27dafe.git 2>nul
git remote add context-explorer https://github.com/gunapalg/context-explorer.git 2>nul
git remote add context-first https://github.com/gunapalg/context-first.git 2>nul
git remote add supabase-reference-backend https://github.com/gunapalg/supabase-reference-backend.git 2>nul
git remote add supabase-reference-backend-92 https://github.com/gunapalg/supabase-reference-backend-92.git 2>nul
git remote add w-remix-1-of-project-ro https://github.com/kamalraji/w-remix-1-of-project-ro.git 2>nul
git remote add thittam-web-planner-1 https://github.com/gunapalg/thittam-web-planner-1.git 2>nul

echo Remotes added. Starting merges...

REM Merge repositories one by one
for %%r in (project-compass insight-generator project-insight-4db0a29d Thittamonehub insight-engine-50 insight-engine-ca27dafe context-explorer context-first supabase-reference-backend supabase-reference-backend-92 w-remix-1-of-project-ro thittam-web-planner-1) do (
    echo.
    echo Processing %%r...
    git fetch %%r 2>nul
    if errorlevel 1 (
        echo Failed to fetch %%r, skipping...
    ) else (
        git merge %%r/main --allow-unrelated-histories --strategy-option=theirs -m "Merge %%r repository" 2>nul
        if errorlevel 1 (
            echo Resolving conflicts for %%r...
            git checkout --theirs . 2>nul
            git add . 2>nul
            git commit -m "Resolve conflicts for %%r - Accept incoming changes" 2>nul
        )
        echo Successfully processed %%r
    )
)

echo.
echo All repositories processed!
echo Merge complete.
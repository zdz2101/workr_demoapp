# CI job 2 (consume): restore the bundle produced by an earlier job and keep
# working — without recomputing. The workflow's actions/download-artifact step
# places the bundle where WORKR_INCOMING_DIR points.
# Run locally:  Rscript scripts/ci_consume.R   (after ci_produce.R)

library(workr)

incoming      <- Sys.getenv("WORKR_INCOMING_DIR", "artifact-in")
artifact_name <- "workr-demo-data"

# Restore via the built-in "github_artifact" LoadData provider. We supply an
# `artifact_fetcher` so it reads the already-downloaded bundle directly instead
# of calling the GitHub API (no token needed inside the same workflow run).
restore_wf <- list(
  meta  = list(Type = "Restore", ID = "peek"),
  steps = list(
    list(name = "identity", output = "restored", params = list(x = "Analysis_Summary"))
  )
)

result <- RunWorkflow(
  lWorkflow = restore_wf,
  lData     = list(),
  lConfig   = list(
    LoadData = "github_artifact",
    github_artifact = list(
      artifact_name   = artifact_name,
      download_dir    = incoming,
      run_id          = "local",   # explicit -> skip API run-id resolution
      artifact_fetcher = function(repo, run_id, artifact_name, download_dir, ...) {
        file.path(download_dir, artifact_name)
      }
    )
  )
)

cat("\nRestored Analysis_Summary from the artifact bundle:\n")
print(result)

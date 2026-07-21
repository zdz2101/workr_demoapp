# CI job 1 (produce): run the pipeline and write a github_artifact bundle.
# The bundle is uploaded by the workflow's actions/upload-artifact step.
# Run locally:  Rscript scripts/ci_produce.R

library(workr)

bundle_root   <- Sys.getenv("WORKR_ARTIFACT_DIR", "artifact-out")
artifact_name <- "workr-demo-data"

# 1. Compute the pipeline results.
results <- RunProject(strPath = "workflows", bRecursive = TRUE)

# 2. Persist the analysis-phase outputs using the built-in "github_artifact"
#    SaveData provider. It writes <path>/<artifact_name>/{payload,manifest.yaml}.
snapshot_wf <- list(
  meta  = list(Type = "Snapshot", ID = "analysis"),
  steps = list(
    list(name = "identity", output = "ok", params = list(x = "Analysis_Summary"))
  )
)

RunWorkflow(
  lWorkflow = snapshot_wf,
  lData     = results[["02_analyze"]],   # Analysis_Prepared / _Summary / _Flagged
  lConfig   = list(
    SaveData = "github_artifact",
    github_artifact = list(path = bundle_root, artifact_name = artifact_name)
  )
)

cat("\nBundle contents under ", bundle_root, ":\n", sep = "")
print(list.files(bundle_root, recursive = TRUE))

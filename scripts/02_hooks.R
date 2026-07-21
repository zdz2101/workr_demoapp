# 02 — Load/save hooks: decouple storage from workflow logic (new in 1.1.0)
# Run from the repository root:  Rscript scripts/02_hooks.R

library(workr)
source("R/hooks.R")   # registers the "local_files" load & save providers

lConfig <- list(
  SaveData     = "local_files",   # referenced by name
  LoadData     = "local_files",
  artifact_dir = "_artifacts"
)

# --- Run 1: compute + SAVE ---------------------------------------------------
# Each workflow result is written to _artifacts/<Type>_<ID>.rds by the save hook.
cat("=== Run 1: execute pipeline and save artifacts ===\n")
RunProject(
  strPath   = "workflows",
  bRecursive = TRUE,
  lConfig   = lConfig
)

cat("\nArtifacts written:\n")
print(list.files("_artifacts", pattern = "\\.rds$"))

# --- Run 2: RESTORE without recomputing --------------------------------------
# The load hook merges saved artifacts into lData. A downstream workflow can
# pick up where a previous run left off — the same mechanism the built-in
# GitHub Actions artifact providers use to pass data between CI runs.
cat("\n=== Run 2: restore a saved artifact via the load hook ===\n")
restore_wf <- list(
  meta  = list(Type = "Restore", ID = "peek"),
  steps = list(
    list(name = "identity", output = "restored", params = list(x = "Analysis_Summary"))
  )
)

restored <- RunWorkflow(
  lWorkflow = restore_wf,
  lData     = list(),
  lConfig   = list(LoadData = "local_files", artifact_dir = "_artifacts")
)
print(restored)

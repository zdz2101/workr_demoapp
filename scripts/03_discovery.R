# 03 — Workflow discovery: active/inactive, priority, filtering, exact match
# Run from the repository root:  Rscript scripts/03_discovery.R

library(workr)

phase <- "workflows/02_analyze"

cat("=== All workflow names found in the phase ===\n")
print(as.character(ListWorkflowNames(strPath = phase)))

cat("\n=== Active only (default), sorted by meta$Priority ===\n")
# experimental_zscore has Active: false, so it is excluded here.
active <- MakeWorkflowList(strPath = phase, strPackage = NULL)
print(vapply(active, function(w) w$meta$ID, character(1)))

cat("\n=== Include inactive workflows (bActiveOnly = FALSE) ===\n")
all_wf <- MakeWorkflowList(strPath = phase, strPackage = NULL, bActiveOnly = FALSE)
print(vapply(all_wf, function(w) w$meta$ID, character(1)))

cat("\n=== Filter by a meta field (Type = 'Analysis') ===\n")
analysis_only <- MakeWorkflowList(strPath = phase, strPackage = NULL, Type = "Analysis")
print(vapply(analysis_only, function(w) w$meta$ID, character(1)))

cat("\n=== Exact-name match (bExact = TRUE) ===\n")
# ListWorkflowNames() returns an I()-wrapped (AsIs) vector so that passing it
# straight back into MakeWorkflowList() matches names exactly. Here we ask for
# just the first one, explicitly.
nm <- as.character(ListWorkflowNames(strPath = phase))
one <- MakeWorkflowList(strNames = nm[1], strPath = phase, strPackage = NULL, bExact = TRUE)
print(vapply(one, function(w) w$meta$ID, character(1)))

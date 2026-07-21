# 01 — RunProject(): orchestrate a multi-phase pipeline (new in workr 1.1.0)
# Run from the repository root:  Rscript scripts/01_run_project.R

library(workr)

# workflows/ has three phase subfolders (01_ingest, 02_analyze, 03_report).
# Each phase is run in order with RunWorkflows(); outputs carry forward to the
# next phase. The 03_report phase additionally has a _config.yaml that narrows
# what it receives. The experimental_zscore workflow (Active: false) is skipped.
results <- RunProject(
  strPath = "workflows",
  bRecursive = TRUE
)

cat("\n=== Phases run ===\n")
print(names(results))          # results is keyed by phase, then by <Type>_<ID>

cat("\n=== Full structure ===\n")
str(results, max.level = 2)

cat("\n=== Group summary (02_analyze -> Analysis_Summary) ===\n")
print(results[["02_analyze"]][["Analysis_Summary"]])

cat("\n=== Outlier flags (02_analyze -> Analysis_Flagged) ===\n")
print(results[["02_analyze"]][["Analysis_Flagged"]])

cat("\n=== Assembled report object (03_report -> Report_StudyReport) ===\n")
str(results[["03_report"]][["Report_StudyReport"]], max.level = 1)

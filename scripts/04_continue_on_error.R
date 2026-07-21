# 04 — bContinueOnError: record failures and keep going (new in 1.1.0)
# Run from the repository root:  Rscript scripts/04_continue_on_error.R

library(workr)

# demo_continue_on_error/ has two phases: 01_ok (healthy) and 02_broken (a
# workflow that calls a function which does not exist). We seed the raw data
# directly via lData so the demo is self-contained.
lData <- list(Raw_Growth = datasets::ToothGrowth)

cat("=== Default (fail-fast) would abort on the broken workflow. ===\n")
cat("=== With bContinueOnError = TRUE, the run completes and reports it: ===\n\n")

results <- RunProject(
  strPath          = "demo_continue_on_error",
  lData            = lData,
  bRecursive       = TRUE,
  bContinueOnError = TRUE
)

# With bContinueOnError = TRUE, RunWorkflows()/RunProject() return a summary
# that includes which workflows succeeded and which failed.
cat("\n=== Run summary ===\n")
str(results, max.level = 2)

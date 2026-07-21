# Regenerate app/data.js from live workr runs.
# Run from the repository root:  Rscript tools/export_demo_data.R
# Requires workr (>= 1.1.0) and jsonlite.
suppressMessages({library(workr); library(jsonlite)})
`%||%` <- function(a, b) if (is.null(a)) b else a
read_txt <- function(p) paste(readLines(p), collapse = "\n")

tbl <- function(df, n = NULL) {
  if (!is.null(n)) df <- utils::head(df, n)
  cols <- lapply(df, function(col) {
    if (is.numeric(col)) format(col, trim = TRUE, drop0trailing = TRUE) else as.character(col)
  })
  rows <- lapply(seq_len(nrow(df)), function(i) as.list(vapply(cols, `[[`, character(1), i)))
  list(columns = as.list(names(df)), rows = rows)
}
steps_of <- function(path) {
  wf <- yaml::read_yaml(path)
  lapply(wf$steps, function(s) list(name = s$name, output = s$output %||% ""))
}

res <- suppressMessages(RunProject("workflows", bRecursive = TRUE))

wf_entry <- function(file, resultdf, n = NULL) {
  wf <- yaml::read_yaml(file)
  list(id = paste(wf$meta$Type, wf$meta$ID, sep = "_"), type = wf$meta$Type,
       desc = wf$meta$Description %||% "", yaml = read_txt(file),
       steps = steps_of(file), nrow = nrow(resultdf), preview = tbl(resultdf, n))
}

pipeline <- list(phases = list(
  list(id = "01_ingest", title = "Ingest", color = "#60a5fa", workflows = list(
    wf_entry("workflows/01_ingest/Growth.yaml", res[["01_ingest"]]$Raw_Growth, 6))),
  list(id = "02_analyze", title = "Analyze", color = "#a78bfa", workflows = list(
    wf_entry("workflows/02_analyze/Prepared.yaml", res[["02_analyze"]]$Analysis_Prepared, 6),
    wf_entry("workflows/02_analyze/Summary.yaml",  res[["02_analyze"]]$Analysis_Summary),
    wf_entry("workflows/02_analyze/Flagged.yaml",  res[["02_analyze"]]$Analysis_Flagged))),
  list(id = "03_report", title = "Report", color = "#34d399", workflows = list(
    list(id = "Report_StudyReport", type = "Report", desc = "Assemble outputs into one report object",
         yaml = read_txt("workflows/03_report/StudyReport.yaml"),
         steps = steps_of("workflows/03_report/StudyReport.yaml"),
         nrow = length(res[["03_report"]]$Report_StudyReport),
         preview = tbl(res[["02_analyze"]]$Analysis_Summary))))
))

ids <- function(wfs) unname(vapply(wfs, function(w) w$meta$ID, character(1)))
phase <- "workflows/02_analyze"
discovery <- list(
  activeSorted = ids(suppressMessages(MakeWorkflowList(strPath = phase, strPackage = NULL))),
  withInactive = ids(suppressMessages(MakeWorkflowList(strPath = phase, strPackage = NULL, bActiveOnly = FALSE)))
)

coe_run <- suppressMessages(RunProject("demo_continue_on_error",
  lData = list(Raw_Growth = datasets::ToothGrowth), bRecursive = TRUE, bContinueOnError = TRUE))
continueOnError <- list(
  workflows = list(
    list(id = "Analysis_OkMetric", phase = "01_ok",
         steps = steps_of("demo_continue_on_error/01_ok/OkMetric.yaml"), status = "completed",
         preview = tbl(data.frame(group_id = c("OJ", "VC"), n = c(30L, 30L)))),
    list(id = "Analysis_BrokenMetric", phase = "02_broken",
         steps = steps_of("demo_continue_on_error/02_broken/BrokenMetric.yaml"),
         status = "error", error = "Function 'this_function_does_not_exist' not found.")),
  status = tbl(coe_run$status), failures = tbl(coe_run$failures))

out <- list(meta = list(dataset = "datasets::ToothGrowth",
                        workrVersion = as.character(packageVersion("workr"))),
            pipeline = pipeline, discovery = discovery, continueOnError = continueOnError)
js <- paste0("window.DEMO = ", toJSON(out, auto_unbox = TRUE, pretty = TRUE, null = "null"), ";\n")
writeLines(js, "app/data.js")
cat("wrote app/data.js\n")

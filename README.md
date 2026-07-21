# workr_demoapp

A small, runnable project that demonstrates the features added in
[**{workr}** 1.1.0](https://github.com/Gilead-BioStats/workr) — multi-phase
project orchestration, load/save hooks, workflow discovery, and
continue-on-error — using only base-R data (`datasets::ToothGrowth`) and SQL
steps, so it clones and runs anywhere.

> {workr} models a data pipeline as an ordered list of function calls described
> in YAML. This repo shows how 1.1.0 turns a folder of those workflows into a
> real, scheduled, restartable production run.

## 🎬 Live demo app

**→ [zeloszhu.com/workr_demoapp](https://zeloszhu.com/workr_demoapp/)**

An interactive, browser-only walkthrough (in [`app/`](app/)): press **Run all**
to watch the pipeline execute — cards go grey → running → done and the real
output tables stream into an `lData` panel — plus a discovery toggle and a
continue-on-error demo. The tables are genuine workr output, pre-computed by
[`tools/export_demo_data.R`](tools/export_demo_data.R) into
[`app/data.js`](app/data.js); the page itself needs no server or R at runtime.
Published to GitHub Pages by [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Quick start

```r
# from the repository root
source("setup.R")                 # installs workr from GitHub
```

```sh
Rscript scripts/01_run_project.R        # multi-phase pipeline
Rscript scripts/02_hooks.R              # save + restore via hooks
Rscript scripts/03_discovery.R          # active/inactive, priority, filter, exact
Rscript scripts/04_continue_on_error.R  # record failures, keep going
```

## The pipeline

`workflows/` is a project split into phases (each subfolder is one phase, run in
alphabetical order). Data flows RAW → prepared → summarized → flagged → report:

```
workflows/
├── 01_ingest/                 load datasets::ToothGrowth
│   └── Growth.yaml
├── 02_analyze/                prepare → summarize → flag (SQL via workr::RunQuery)
│   ├── Prepared.yaml
│   ├── Summary.yaml
│   ├── Flagged.yaml
│   └── ZScore.yaml            Active: false  → skipped by default
└── 03_report/
    ├── _config.yaml           narrows what this phase receives
    └── StudyReport.yaml       assembles the outputs into one object
```

## What each 1.1.0 feature looks like

### 1. `RunProject()` — multi-phase orchestration
One call runs every phase in order, carrying each phase's outputs forward:

```r
workr::RunProject(strPath = "workflows", bRecursive = TRUE)
```

Phase order comes from the folder names (`01_`, `02_`, `03_`). See
[`scripts/01_run_project.R`](scripts/01_run_project.R).

### 2. Phase `_config.yaml` — shape what a phase receives
By default all upstream outputs carry forward. `workflows/03_report/_config.yaml`
restricts the reporting phase to just the analysis-phase results:

```yaml
input:
  from_phases: [02_analyze]
```

### 3. Load/save hooks — decouple storage from logic
Workflows say *what* to compute; `lConfig` hooks say *where* data lives.
[`R/hooks.R`](R/hooks.R) registers a `"local_files"` provider pair that persists
each result to `_artifacts/*.rds` and restores it later — the same mechanism the
built-in GitHub Actions artifact providers use to pass data between CI runs.

```r
workr::register_save_provider("local_files", function(lWorkflow, lConfig) { ... })
workr::register_load_provider("local_files", function(lWorkflow, lConfig, lData) { ... })

workr::RunProject("workflows", lConfig = list(SaveData = "local_files"))
```

See [`scripts/02_hooks.R`](scripts/02_hooks.R).

### 4. Workflow discovery — active/inactive, priority, filter, exact match
`MakeWorkflowList()` finds workflows, sorts them by `meta$Priority`, skips
`Active: false` ones, and can filter by any `meta` field:

```r
workr::MakeWorkflowList(strPath = "workflows/02_analyze")                 # active, priority-sorted
workr::MakeWorkflowList(strPath = "workflows/02_analyze", bActiveOnly = FALSE)  # include WIP
workr::MakeWorkflowList(strPath = "workflows/02_analyze", Type = "Analysis")    # filter by meta
```

See [`scripts/03_discovery.R`](scripts/03_discovery.R).

### 5. `bContinueOnError` — record failures, keep running
`demo_continue_on_error/` contains one healthy workflow and one that calls a
missing function. Fail-fast (the default) would abort; `bContinueOnError = TRUE`
completes the run and reports what failed:

```r
workr::RunProject("demo_continue_on_error", lData = list(Raw_Growth = datasets::ToothGrowth),
                  bContinueOnError = TRUE)
```

See [`scripts/04_continue_on_error.R`](scripts/04_continue_on_error.R).

### 6. GitHub Actions artifact providers — pass data between CI runs
workr ships built-in `"github_artifact"` load/save providers. The
[`artifact-roundtrip`](.github/workflows/artifact-roundtrip.yml) workflow shows
the round-trip: a **produce** job runs the pipeline and saves a bundle
(`SaveData = "github_artifact"`), uploads it with `actions/upload-artifact`, and
a **consume** job downloads it and restores it (`LoadData = "github_artifact"`)
without recomputing. See [`scripts/ci_produce.R`](scripts/ci_produce.R) and
[`scripts/ci_consume.R`](scripts/ci_consume.R); both run locally too:

```sh
WORKR_ARTIFACT_DIR=artifact-out Rscript scripts/ci_produce.R
# (CI uploads/downloads here; locally, copy artifact-out/* to artifact-in/*)
WORKR_INCOMING_DIR=artifact-in  Rscript scripts/ci_consume.R
```

## Notes

- Everything uses `workr::RunQuery()` (SQL over data frames) rather than
  non-standard-evaluation verbs, so the workflows stay copy-paste portable.
- Not affiliated with the official
  [`workr` demo app](https://jwildfire.shinyapps.io/workr-demoapp/); this is a
  personal companion project focused on the 1.1.0 feature set.

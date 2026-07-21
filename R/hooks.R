# Load/save hooks (new in workr 1.1.0)
# --------------------------------------
# A workflow describes *what* to run; hooks describe *where* data comes from
# and goes to. Here we register a simple pair of providers that persist each
# workflow result to local .rds files and restore them later. Swap these for
# the built-in GitHub Actions artifact providers (or the "gsm.datasim"
# provider) without changing a single workflow.

# --- SaveData provider -------------------------------------------------------
# A SaveData provider must accept `lWorkflow` and `lConfig`. It runs after the
# workflow's steps finish and can read `lWorkflow$lResult` and `lWorkflow$lData`.
workr::register_save_provider(
  "local_files",
  function(lWorkflow, lConfig) {
    dir <- if (!is.null(lConfig$artifact_dir)) lConfig$artifact_dir else "_artifacts"
    if (!dir.exists(dir)) dir.create(dir, recursive = TRUE)
    id <- paste(lWorkflow$meta$Type, lWorkflow$meta$ID, sep = "_")
    saveRDS(lWorkflow$lResult, file.path(dir, paste0(id, ".rds")))
    message("  [save] ", id, ".rds")
    invisible(NULL)
  }
)

# --- LoadData provider -------------------------------------------------------
# A LoadData provider must accept `lWorkflow`, `lConfig`, and `lData`, and
# returns the data list the workflow should run against. Here we merge any
# previously saved artifacts into the incoming data.
workr::register_load_provider(
  "local_files",
  function(lWorkflow, lConfig, lData) {
    dir <- if (!is.null(lConfig$artifact_dir)) lConfig$artifact_dir else "_artifacts"
    files <- list.files(dir, pattern = "\\.rds$", full.names = TRUE)
    restored <- lapply(files, readRDS)
    names(restored) <- sub("\\.rds$", "", basename(files))
    utils::modifyList(as.list(lData), restored)
  }
)

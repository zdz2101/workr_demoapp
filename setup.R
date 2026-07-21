# One-time setup: install workr (>= 1.1.0) and its runtime dependencies.
# workr is not on CRAN; install it from GitHub.

if (!requireNamespace("pak", quietly = TRUE)) install.packages("pak")

pak::pak("Gilead-BioStats/workr")

# RunQuery() executes SQL via DuckDB/DBI; these come in as workr dependencies,
# but you can install them explicitly if needed:
# pak::pak(c("DBI", "duckdb"))

cat("Done. workr version: ", as.character(utils::packageVersion("workr")), "\n", sep = "")

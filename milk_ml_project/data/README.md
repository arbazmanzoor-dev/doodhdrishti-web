# Data location

The source CSV is kept in the workspace at `../archive/milk_combined_full_dataset.csv`;
it is not copied into this project. The training script uses that file by default.
Pass `--data-path` to use a different local copy.

The separate `../archive (1)/milknew.csv` dataset is not used: it has a different
schema and target, and 976 of its 1,059 rows are exact duplicates.

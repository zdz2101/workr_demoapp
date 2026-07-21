window.DEMO = {
  "meta": {
    "dataset": "datasets::ToothGrowth",
    "workrVersion": "1.1.0"
  },
  "pipeline": {
    "phases": [
      {
        "id": "01_ingest",
        "title": "Ingest",
        "color": "#60a5fa",
        "workflows": [
          {
            "id": "Raw_Growth",
            "type": "Raw",
            "desc": "Load the raw tooth-growth data (base R ToothGrowth)",
            "yaml": "meta:\n  # The workflow result carries forward keyed by <Type>_<ID>, so this phase's\n  # output is available downstream as `Raw_Growth`.\n  Type: Raw\n  ID: Growth\n  Description: Load the raw tooth-growth data (base R ToothGrowth)\n  Priority: 1\nsteps:\n  # `get(\"ToothGrowth\")` returns the built-in datasets::ToothGrowth data.frame\n  # (supp = treatment, dose = level, len = response), exactly like the\n  # hello_cars example loads `cars`.\n  - name: get\n    output: Raw_Growth\n    params:\n      x: \"ToothGrowth\"",
            "steps": [
              {
                "name": "get",
                "output": "Raw_Growth"
              }
            ],
            "nrow": 60,
            "preview": {
              "columns": [
                "len",
                "supp",
                "dose"
              ],
              "rows": [
                {
                  "len": "4.2",
                  "supp": "VC",
                  "dose": "0.5"
                },
                {
                  "len": "11.5",
                  "supp": "VC",
                  "dose": "0.5"
                },
                {
                  "len": "7.3",
                  "supp": "VC",
                  "dose": "0.5"
                },
                {
                  "len": "5.8",
                  "supp": "VC",
                  "dose": "0.5"
                },
                {
                  "len": "6.4",
                  "supp": "VC",
                  "dose": "0.5"
                },
                {
                  "len": "10",
                  "supp": "VC",
                  "dose": "0.5"
                }
              ]
            }
          }
        ]
      },
      {
        "id": "02_analyze",
        "title": "Analyze",
        "color": "#a78bfa",
        "workflows": [
          {
            "id": "Analysis_Prepared",
            "type": "Analysis",
            "desc": "Standardize raw columns into analysis-ready names",
            "yaml": "meta:\n  Type: Analysis\n  ID: Prepared           # -> carried forward as `Analysis_Prepared`\n  Description: Standardize raw columns into analysis-ready names\n  Priority: 1\nsteps:\n  # workr::RunQuery runs SQL (DuckDB) over a data.frame; reference the table\n  # literally as `df`. Its `df` param resolves to lData$Raw_Growth (phase 1).\n  - name: workr::RunQuery\n    output: Analysis_Prepared\n    params:\n      df: Raw_Growth\n      strQuery: >\n        SELECT\n          supp AS group_id,\n          dose AS dose,\n          len  AS value\n        FROM df",
            "steps": [
              {
                "name": "workr::RunQuery",
                "output": "Analysis_Prepared"
              }
            ],
            "nrow": 60,
            "preview": {
              "columns": [
                "group_id",
                "dose",
                "value"
              ],
              "rows": [
                {
                  "group_id": "VC",
                  "dose": "0.5",
                  "value": "4.2"
                },
                {
                  "group_id": "VC",
                  "dose": "0.5",
                  "value": "11.5"
                },
                {
                  "group_id": "VC",
                  "dose": "0.5",
                  "value": "7.3"
                },
                {
                  "group_id": "VC",
                  "dose": "0.5",
                  "value": "5.8"
                },
                {
                  "group_id": "VC",
                  "dose": "0.5",
                  "value": "6.4"
                },
                {
                  "group_id": "VC",
                  "dose": "0.5",
                  "value": "10"
                }
              ]
            }
          },
          {
            "id": "Analysis_Summary",
            "type": "Analysis",
            "desc": "Summarize the measure by treatment group",
            "yaml": "meta:\n  Type: Analysis\n  ID: Summary            # -> carried forward as `Analysis_Summary`\n  Description: Summarize the measure by treatment group\n  Priority: 2\nsteps:\n  - name: workr::RunQuery\n    output: Analysis_Summary\n    params:\n      df: Analysis_Prepared\n      strQuery: >\n        SELECT\n          group_id,\n          COUNT(*)              AS n_obs,\n          ROUND(AVG(value), 1)  AS mean_value,\n          ROUND(MAX(value), 1)  AS max_value\n        FROM df\n        GROUP BY group_id\n        ORDER BY group_id",
            "steps": [
              {
                "name": "workr::RunQuery",
                "output": "Analysis_Summary"
              }
            ],
            "nrow": 2,
            "preview": {
              "columns": [
                "group_id",
                "n_obs",
                "mean_value",
                "max_value"
              ],
              "rows": [
                {
                  "group_id": "OJ",
                  "n_obs": "30",
                  "mean_value": "20.7",
                  "max_value": "30.9"
                },
                {
                  "group_id": "VC",
                  "n_obs": "30",
                  "mean_value": "17",
                  "max_value": "33.9"
                }
              ]
            }
          },
          {
            "id": "Analysis_Flagged",
            "type": "Analysis",
            "desc": "Flag groups whose mean exceeds the overall mean",
            "yaml": "meta:\n  Type: Analysis\n  ID: Flagged            # -> carried forward as `Analysis_Flagged`\n  Description: Flag groups whose mean exceeds the overall mean\n  Priority: 3\nsteps:\n  - name: workr::RunQuery\n    output: Analysis_Flagged\n    params:\n      df: Analysis_Summary\n      strQuery: >\n        SELECT\n          group_id,\n          mean_value,\n          CASE\n            WHEN mean_value > (SELECT AVG(mean_value) FROM df) THEN 'HIGH'\n            ELSE 'OK'\n          END AS flag\n        FROM df\n        ORDER BY mean_value DESC",
            "steps": [
              {
                "name": "workr::RunQuery",
                "output": "Analysis_Flagged"
              }
            ],
            "nrow": 2,
            "preview": {
              "columns": [
                "group_id",
                "mean_value",
                "flag"
              ],
              "rows": [
                {
                  "group_id": "OJ",
                  "mean_value": "20.7",
                  "flag": "HIGH"
                },
                {
                  "group_id": "VC",
                  "mean_value": "17",
                  "flag": "OK"
                }
              ]
            }
          }
        ]
      },
      {
        "id": "03_report",
        "title": "Report",
        "color": "#34d399",
        "workflows": [
          {
            "id": "Report_StudyReport",
            "type": "Report",
            "desc": "Assemble outputs into one report object",
            "yaml": "meta:\n  Type: Report\n  ID: StudyReport         # -> carried forward as `Report_StudyReport`\n  Description: Assemble the analysis outputs into a single report object\n  Priority: 1\nsteps:\n  # `list` is just a function call like any other step; here it bundles the\n  # upstream outputs into one named list ready to hand to a renderer.\n  - name: list\n    output: lReport\n    params:\n      summary_by_group: Analysis_Summary\n      outlier_flags: Analysis_Flagged",
            "steps": [
              {
                "name": "list",
                "output": "lReport"
              }
            ],
            "nrow": 2,
            "preview": {
              "columns": [
                "group_id",
                "n_obs",
                "mean_value",
                "max_value"
              ],
              "rows": [
                {
                  "group_id": "OJ",
                  "n_obs": "30",
                  "mean_value": "20.7",
                  "max_value": "30.9"
                },
                {
                  "group_id": "VC",
                  "n_obs": "30",
                  "mean_value": "17",
                  "max_value": "33.9"
                }
              ]
            }
          }
        ]
      }
    ]
  },
  "discovery": {
    "activeSorted": ["Prepared", "Summary", "Flagged"],
    "withInactive": ["Prepared", "Summary", "Flagged", "ZScore"]
  },
  "continueOnError": {
    "workflows": [
      {
        "id": "Analysis_OkMetric",
        "phase": "01_ok",
        "steps": [
          {
            "name": "workr::RunQuery",
            "output": "Analysis_Ok"
          }
        ],
        "status": "completed",
        "preview": {
          "columns": [
            "group_id",
            "n"
          ],
          "rows": [
            {
              "group_id": "OJ",
              "n": "30"
            },
            {
              "group_id": "VC",
              "n": "30"
            }
          ]
        }
      },
      {
        "id": "Analysis_BrokenMetric",
        "phase": "02_broken",
        "steps": [
          {
            "name": "this_function_does_not_exist",
            "output": "Analysis_Broken"
          }
        ],
        "status": "error",
        "error": "Function 'this_function_does_not_exist' not found."
      }
    ],
    "status": {
      "columns": [
        "phase",
        "workflow",
        "status",
        "message"
      ],
      "rows": [
        {
          "phase": "01_ok",
          "workflow": "Analysis_OkMetric",
          "status": "success",
          "message": null
        },
        {
          "phase": "02_broken",
          "workflow": "Analysis_BrokenMetric",
          "status": "error",
          "message": "Function 'this_function_does_not_exist' not found."
        }
      ]
    },
    "failures": {
      "columns": [
        "phase",
        "workflow",
        "status",
        "message"
      ],
      "rows": [
        {
          "phase": "02_broken",
          "workflow": "Analysis_BrokenMetric",
          "status": "error",
          "message": "Function 'this_function_does_not_exist' not found."
        }
      ]
    }
  }
};


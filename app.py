from __future__ import annotations

import ast
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

try:
    import webview
except ImportError as exc:
    raise SystemExit(
        "pywebview is required. Install it with: pip install -r requirements.txt"
    ) from exc


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"
MARKDOWN_DIR = BASE_DIR / "Job Application Markdowns"


FIELDS = (
    "Company",
    "JobTitle",
    "Location",
    "Denied",
    "Interviewed",
    "Offered",
    "DateUpdated",
    "PreviousFollowup",
    "DescriptionFile",
)


def _blank_application() -> dict[str, str]:
    return {field: "" for field in FIELDS}


def _read_applications() -> list[dict[str, str]]:
    if not DATA_FILE.exists():
        return []

    raw = DATA_FILE.read_text(encoding="utf-8").strip()
    if not raw:
        return []

    if raw.startswith("data"):
        _, _, value = raw.partition("=")
        value = value.strip().rstrip(";")
        raw_json = ast.literal_eval(value)
    else:
        raw_json = raw

    loaded = json.loads(raw_json)
    if not isinstance(loaded, list):
        raise ValueError("data.json must contain a list of applications.")

    applications: list[dict[str, str]] = []
    for item in loaded:
        if not isinstance(item, dict):
            continue
        normalized = _blank_application()
        for field in FIELDS:
            normalized[field] = str(item.get(field, ""))
        applications.append(normalized)
    return applications


def _write_applications(applications: list[dict[str, str]]) -> None:
    clean_rows = []
    for app in applications:
        clean = _blank_application()
        for field in FIELDS:
            clean[field] = str(app.get(field, "")).strip()
        clean_rows.append(clean)

    payload = json.dumps(clean_rows, indent=4)
    DATA_FILE.write_text(f"data = {json.dumps(payload)};\n", encoding="utf-8")


def _open_path(path: Path) -> None:
    if sys.platform == "darwin":
        subprocess.Popen(["open", str(path)])
    elif sys.platform.startswith("win"):
        subprocess.Popen(["cmd", "/c", "start", "", str(path)])
    else:
        subprocess.Popen(["xdg-open", str(path)])


def _safe_description_name(filename: str) -> str:
    stem = Path(filename or "").stem.strip()
    return re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-")


class Api:
    def get_applications(self) -> dict[str, Any]:
        applications = _read_applications()
        return {
            "applications": [
                {"_index": index, **application}
                for index, application in enumerate(applications)
            ]
        }

    def save_application(self, application: dict[str, Any]) -> dict[str, Any]:
        applications = _read_applications()
        index = application.get("_index")

        clean = _blank_application()
        for field in FIELDS:
            clean[field] = str(application.get(field, "")).strip()

        if index in (None, "", -1):
            applications.append(clean)
        else:
            index = int(index)
            if index < 0 or index >= len(applications):
                raise IndexError("Application index is out of range.")
            applications[index] = clean

        _write_applications(applications)
        return self.get_applications()

    def delete_application(self, index: int) -> dict[str, Any]:
        applications = _read_applications()
        index = int(index)
        if index < 0 or index >= len(applications):
            raise IndexError("Application index is out of range.")

        applications.pop(index)
        _write_applications(applications)
        return self.get_applications()

    def save_description(self, filename: str, content: str) -> dict[str, Any]:
        safe_name = _safe_description_name(filename)
        if not safe_name:
            return {"saved": False, "message": "Add a description file name first."}

        MARKDOWN_DIR.mkdir(exist_ok=True)
        (MARKDOWN_DIR / f"{safe_name}.md").write_text(content or "", encoding="utf-8")
        return {"saved": True, "filename": safe_name}

    def get_description(self, filename: str) -> dict[str, Any]:
        safe_name = _safe_description_name(filename)
        if not safe_name:
            return {"content": ""}

        description_path = MARKDOWN_DIR / f"{safe_name}.md"
        if not description_path.exists():
            return {"content": ""}
        return {"content": description_path.read_text(encoding="utf-8")}

    def open_description(self, filename: str) -> dict[str, Any]:
        safe_name = _safe_description_name(filename)
        if not safe_name:
            return {"opened": False}

        description_path = MARKDOWN_DIR / f"{safe_name}.md"
        if not description_path.exists():
            description_path.write_text("", encoding="utf-8")
        _open_path(description_path)
        return {"opened": True}


if __name__ == "__main__":
    window = webview.create_window(
        "Job Application Tracker",
        (BASE_DIR / "index.html").as_uri(),
        js_api=Api(),
        width=1280,
        height=860,
        min_size=(980, 680),
    )
    webview.start(debug=False)

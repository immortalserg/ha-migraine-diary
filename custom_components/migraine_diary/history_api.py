"""Authenticated read-only HTTP endpoints for diary history and CSV export."""
from __future__ import annotations

import csv
import io

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .storage import DiaryStore


class MigraineHistoryView(HomeAssistantView):
    """Expose bounded diary history to authenticated Home Assistant clients."""

    url = "/api/migraine_diary/history"
    name = "api:migraine_diary:history"
    requires_auth = True

    def __init__(self, store: DiaryStore) -> None:
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        params = request.rel_url.query
        profile_id = params.get("profile_id", "patient")
        if params.get("format") == "episodes":
            try:
                limit = int(params.get("limit", "1000"))
                episodes = await self._store.list_episodes(profile_id, limit=limit)
            except (ValueError, TypeError) as err:
                return web.json_response({"error": str(err)}, status=400)
            return web.json_response({"episodes": episodes}, headers={"Cache-Control": "no-store"})
        try:
            limit = int(params.get("limit", "200"))
            records = await self._store.list_history(
                profile_id, limit=limit,
                start=params.get("start"), end=params.get("end"),
            )
        except (ValueError, TypeError) as err:
            return web.json_response({"error": str(err)}, status=400)
        if params.get("format") == "csv":
            output = io.StringIO()
            columns = [
                "date", "event", "level", "zones", "symptoms",
                "medication", "food", "quantity", "notes", "dose", "unit", "episode_id", "id",
            ]
            writer = csv.DictWriter(
                output, fieldnames=columns, extrasaction="ignore", delimiter=";"
            )
            writer.writeheader()
            writer.writerows(records)
            return web.Response(
                body=("\ufeff" + output.getvalue()).encode("utf-8"),
                content_type="text/csv",
                headers={
                    "Content-Disposition": 'attachment; filename="migraine-diary.csv"',
                    "Cache-Control": "no-store",
                },
            )
        return web.json_response(
            {"records": records},
            headers={"Cache-Control": "no-store"},
        )

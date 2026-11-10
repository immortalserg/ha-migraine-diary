"""Regression tests for local SQLite storage; run with python -m unittest discover -s tests -v."""
import asyncio
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

STORAGE = Path(__file__).resolve().parents[1] / "custom_components" / "migraine_diary" / "storage.py"
spec = importlib.util.spec_from_file_location("migraine_diary_storage", STORAGE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
DiaryStore = module.DiaryStore


class DiaryStoreTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Path(self.temp.name) / "diary.db"
        self.store = DiaryStore(self.db)
        await self.store.initialize()
        await self.store.create_profile("Patient", "patient")

    async def asyncTearDown(self):
        self.temp.cleanup()

    async def test_episode_lifecycle(self):
        episode = await self.store.start_episode("patient", started_at="2026-11-10T10:00:00+01:00")
        self.assertEqual((await self.store.get_active_episode("patient"))["id"], episode)
        await self.store.record_event("patient", "pain", {"intensity": 7, "zones": [1, 3]}, episode_id=episode)
        await self.store.record_event("patient", "medication", {"name": "Example", "dose": 10, "unit": "mg"}, episode_id=episode)
        await self.store.end_episode(episode, ended_at="2026-11-10T12:00:00+01:00")
        self.assertIsNone(await self.store.get_active_episode("patient"))
        episodes = await self.store.list_episodes("patient")
        self.assertEqual(episodes[0]["started_at"], "2026-11-10T09:00:00+00:00")
        self.assertEqual(episodes[0]["ended_at"], "2026-11-10T11:00:00+00:00")
        with sqlite3.connect(self.db) as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM events").fetchone()[0], 2)

    async def test_prevent_duplicate_active_episode(self):
        await self.store.start_episode("patient")
        with self.assertRaises(sqlite3.IntegrityError):
            await self.store.start_episode("patient")

    async def test_end_before_start_rejected(self):
        episode = await self.store.start_episode("patient", started_at="2026-11-10T12:00:00+00:00")
        with self.assertRaises(ValueError):
            await self.store.end_episode(episode, ended_at="2026-11-10T11:00:00+00:00")

    async def test_profile_isolation(self):
        await self.store.create_profile("Other", "other")
        episode = await self.store.start_episode("patient")
        with self.assertRaises(ValueError):
            await self.store.record_event("other", "medication", {"name": "Example"}, episode_id=episode)

    async def test_pain_validation(self):
        for payload in ({"intensity": 0, "zones": [1]}, {"intensity": 10, "zones": [1]}, {"intensity": 5, "zones": [20]}, {"intensity": True, "zones": [1]}):
            with self.assertRaises(ValueError):
                await self.store.record_event("patient", "pain", payload)

    async def test_timezone_required(self):
        with self.assertRaises(ValueError):
            await self.store.start_episode("patient", started_at="2026-11-10T12:00:00")

    async def test_persistence_after_reopen(self):
        episode = await self.store.start_episode("patient")
        reopened = DiaryStore(self.db)
        await reopened.initialize()
        self.assertEqual((await reopened.get_active_episode("patient"))["id"], episode)

    async def test_premonition_without_episode(self):
        await self.store.record_event("patient", "premonition", {"symptoms": ["fatigue"]})
        with sqlite3.connect(self.db) as conn:
            self.assertIsNone(conn.execute("SELECT episode_id FROM events").fetchone()[0])


if __name__ == "__main__":
    unittest.main()

import importlib.util
import json
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

spec = importlib.util.spec_from_file_location("organic_preview", Path(__file__).resolve().parents[1] / "server.py")
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class PreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = preview.ThreadingHTTPServer(("127.0.0.1", 0), preview.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def request(self, path, data=None, origin=None, headers=None):
        h = dict(headers or {})
        if data is not None:
            h["Content-Type"] = "application/json"
            h["Origin"] = origin or self.base
        req = Request(self.base + path, data=None if data is None else json.dumps(data).encode(), headers=h)
        try:
            with urlopen(req, timeout=4) as response:
                return response.status, response.read(), response.headers
        except HTTPError as error:
            try:
                return error.code, error.read(), error.headers
            finally:
                error.close()

    def test_health_and_static(self):
        status, raw, headers = self.request("/health")
        self.assertEqual(status, 200)
        self.assertTrue(json.loads(raw)["ok"])
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(self.request("/")[0], 200)

    def test_only_allowlisted_files_are_served(self):
        for path in ["/.env", "/server.py", "/README.md", "/../AGENTS.md", "/tests/test_server.py"]:
            self.assertEqual(self.request(path)[0], 404)

    def test_course_and_textbook_sources_are_explicitly_allowlisted(self):
        for path in ["/academy.html", "/academy.js", "/spotlight-demo.js", "/reaction-3d.js", "/reaction-3d-view.js", "/concept-visuals.js", "/pk-state.js", "/course-content.js", "/reason-workbench.js", "/source/367", "/source/367.jpg"]:
            self.assertEqual(self.request(path)[0], 200, path)
        for path in ["/source/1", "/source/../../AGENTS.md", "/source/367.jpg/other", "/Organic_Chemistry.md"]:
            self.assertEqual(self.request(path)[0], 404, path)

    def test_cross_origin_ai_and_dns_rebinding_are_rejected(self):
        self.assertEqual(self.request("/api/hint", {"level": "sn2", "context": {}}, origin="https://example.org")[0], 403)
        self.assertEqual(self.request("/health", headers={"Host": "example.org"})[0], 403)

    def test_context_validation(self):
        for payload in [{}, {"level": "unknown", "context": {}}, {"level": "sn2", "context": []}]:
            self.assertEqual(self.request("/api/hint", payload)[0], 400)

    def test_unavailable_model_is_explicit(self):
        with patch.object(preview, "model_status", return_value={"available": False, "message": "未連接"}):
            self.assertEqual(self.request("/api/hint", {"level": "sn2", "context": {}})[0], 503)

    def test_successful_live_response_and_timeout_recovery(self):
        with patch.object(preview, "model_status", return_value={"available": True, "model": "test-local"}):
            with patch.object(preview, "request_ollama", side_effect=TimeoutError("timeout")):
                self.assertEqual(self.request("/api/hint", {"level": "sn2", "context": {}})[0], 502)
            with patch.object(preview, "request_ollama", return_value={"message": {"content": "請比較離去基的兩側。"}}):
                status, raw, _ = self.request("/api/hint", {"level": "sn2", "context": {}})
                self.assertEqual(status, 200)
                self.assertEqual(json.loads(raw)["mode"], "live")
                self.assertEqual(json.loads(raw)["text"], "請比較離去基的兩側。")

    def test_ai_flow_hint_cannot_insert_unapproved_chemistry(self):
        payload = {"level": "e2", "context": {"electronFlow": {"diagnosis": ["第 1 支箭頭來源需修正。"], "arrows": []}}}
        with patch.object(preview, "model_status", return_value={"available": True, "model": "test-local"}):
            with patch.object(preview, "request_ollama", return_value={"message": {"content": '{"focus_index":0,"style":"observe","extra":"E2 鹼攻擊碳"}'}}):
                status, raw, _ = self.request("/api/hint", payload)
                self.assertEqual(status, 200)
                self.assertNotIn("鹼攻擊碳", json.loads(raw)["text"])
                self.assertTrue(json.loads(raw)["grounded"])
            with patch.object(preview, "request_ollama", return_value={"message": {"content": '{"focus_index":999,"style":"invent"}'}}):
                self.assertEqual(self.request("/api/hint", payload)[0], 502)


if __name__ == "__main__":
    unittest.main()
